import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './useAuth';
import { addTaskLog } from '../services/tasksHistoryService';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fields, setFields] = useState([]);
  const [machines, setMachines] = useState([]);
  const [tractors, setTractors] = useState([]);
  const [warehouseItems, setWarehouseItems] = useState([]);
  const { user } = useAuth();

  if (!db) {
    console.error('Firestore db is not initialized');
    setError('Błąd konfiguracji bazy danych');
  }

  const TASK_TYPES = [
    { value: 'sowing', label: 'Siew/Zasiew' },
    { value: 'harvest', label: 'Zbiór' },
    { value: 'fertilization', label: 'Nawożenie' },
    { value: 'spraying', label: 'Oprysk' },
    { value: 'feeding', label: 'Karmienie' },
    { value: 'veterinary', label: 'Weterynaria' },
    { value: 'maintenance', label: 'Naprawa/Konserwacja' },
    { value: 'inspection', label: 'Przegląd' },
    { value: 'purchase', label: 'Zakup' },
    { value: 'other', label: 'Inne' }
  ];

  const TASK_STATUS = [
    { value: 'pending', label: 'Do zrobienia' },
    { value: 'in_progress', label: 'W trakcie' },
    { value: 'completed', label: 'Zakończone' },
    { value: 'cancelled', label: 'Anulowane' }
  ];

  const PRIORITIES = [
    { value: 'low', label: 'Niski' },
    { value: 'normal', label: 'Normalny' },
    { value: 'high', label: 'Wysoki' },
    { value: 'critical', label: 'Krytyczny' }
  ];

  const translateStatus = (status) => {
    const found = TASK_STATUS.find(s => s.value === status);
    return found ? found.label : status;
  };

  // Pobierz wszystkie dane powiązane - POPRAWIONE: Z CIĄGNIKAMI
  const fetchRelatedData = async () => {
    if (!user || !db) {
      return;
    }

    try {

      // Pobierz pola
      try {
        const fieldsQuery = query(collection(db, 'fields'));
        const fieldsSnapshot = await getDocs(fieldsQuery);
        const fieldsData = fieldsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFields(fieldsData);
      } catch (err) {
        console.warn('Brak kolekcji fields:', err);
        setFields([]);
      }

      // Pobierz wszystkie maszyny z garażu
      try {
        const machinesQuery = query(collection(db, 'garage'));
        const machinesSnapshot = await getDocs(machinesQuery);
        const allMachines = machinesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Filtruj ciągniki i kombajny
        const tractorsData = allMachines.filter(machine => {
          const category = machine.category?.toLowerCase() || '';
          const type = machine.type?.toLowerCase() || '';
          const name = machine.name?.toLowerCase() || '';
          const model = machine.model?.toLowerCase() || '';

          return category.includes('ciągnik') ||
            category.includes('tractor') ||
            category.includes('kombajn') ||
            category.includes('combine') ||
            type.includes('ciągnik') ||
            type.includes('tractor') ||
            type.includes('kombajn') ||
            type.includes('combine') ||
            name.includes('ciągnik') ||
            name.includes('tractor') ||
            name.includes('kombajn') ||
            name.includes('combine') ||
            model.includes('ciągnik') ||
            model.includes('tractor') ||
            model.includes('kombajn') ||
            model.includes('combine');
        });

        // Pozostałe maszyny (bez ciągników i kombajnów)
        const otherMachines = allMachines.filter(machine =>
          !tractorsData.some(tractor => tractor.id === machine.id)
        );

        setTractors(tractorsData);
        setMachines(otherMachines);

      } catch (err) {
        console.warn('Brak kolekcji garage:', err);
        setTractors([]);
        setMachines([]);
      }

      // Pobierz tylko produkty z kategorii "Nasiona i Nawozy"
      try {
        const warehouseQuery = query(
          collection(db, 'warehouse'),
          where('category', '==', 'nawozy')
        );
        const warehouseSnapshot = await getDocs(warehouseQuery);
        const warehouseData = warehouseSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setWarehouseItems(warehouseData);
      } catch (err) {
        console.warn('Brak kolekcji warehouse lub kategorii "nawozy":', err);
        setWarehouseItems([]);
      }

    } catch (err) {
      console.error('Error fetching related data:', err);
      setError('Błąd podczas pobierania danych powiązanych: ' + err.message);
    }
  };

  // Reszta funkcji pozostaje bez zmian
  const fetchTasks = async (filters = {}) => {
    if (!user || !db) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(collection(db, 'tasks'), orderBy('dueDate', 'asc'));
      const querySnapshot = await getDocs(q);
      let tasksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (filters.status && filters.status !== '') {
        tasksData = tasksData.filter(task => task.status === filters.status);
      }

      if (filters.type && filters.type !== '') {
        tasksData = tasksData.filter(task => task.type === filters.type);
      }

      if (filters.priority && filters.priority !== '') {
        tasksData = tasksData.filter(task => task.priority === filters.priority);
      }

      if (filters.assignedTo && filters.assignedTo !== '') {
        tasksData = tasksData.filter(task =>
          task.assignedTo && task.assignedTo.toLowerCase().includes(filters.assignedTo.toLowerCase())
        );
      }

      if (filters.dateRange && filters.dateRange !== '') {
        tasksData = filterTasksByDateRange(tasksData, filters.dateRange);
      }

      setTasks(tasksData);

    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Błąd podczas pobierania zadań: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterTasksByDateRange = (tasks, dateRange) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return tasks.filter(task => {
      if (!task.dueDate) return false;

      try {
        let taskDate;
        if (task.dueDate && task.dueDate.toDate) {
          taskDate = task.dueDate.toDate();
        } else if (task.dueDate && task.dueDate.seconds) {
          taskDate = new Date(task.dueDate.seconds * 1000);
        } else {
          taskDate = new Date(task.dueDate);
        }

        taskDate = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());

        switch (dateRange) {
          case 'today':
            return taskDate.getTime() === today.getTime();
          case 'tomorrow':
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            return taskDate.getTime() === tomorrow.getTime();
          case 'this_week':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            return taskDate >= startOfWeek && taskDate < endOfWeek;
          case 'next_week':
            const startOfNextWeek = new Date(today);
            startOfNextWeek.setDate(today.getDate() + (7 - today.getDay()));
            const endOfNextWeek = new Date(startOfNextWeek);
            endOfNextWeek.setDate(startOfNextWeek.getDate() + 7);
            return taskDate >= startOfNextWeek && taskDate < endOfNextWeek;
          case 'overdue':
            return taskDate < today && task.status !== 'completed';
          default:
            return true;
        }
      } catch (error) {
        console.error('Error processing task date:', error, task);
        return false;
      }
    });
  };


  // NOWA FUNKCJA: Aktualizuj stan magazynu przy użyciu produktów
  const updateWarehouseStock = async (materials, operation = 'use', taskId = null, taskTitle = null, rollback = false) => {
    if (!materials || materials.length === 0) return;

    const updates = [];

    try {
      for (const material of materials) {
        if (!material.productId || !material.quantity || parseFloat(material.quantity) <= 0) {
          continue;
        }

        const productRef = doc(db, 'warehouse', material.productId);
        const productDoc = await getDoc(productRef);

        if (!productDoc.exists()) {
          console.warn(`Produkt ${material.productId} nie istnieje w magazynie`);
          continue;
        }

        const product = productDoc.data();
        const currentQuantity = parseFloat(product.quantity || 0);
        const requestedQuantity = parseFloat(material.quantity);

        // Sprawdź czy wystarczająca ilość (tylko przy użyciu)
        if (operation === 'use' && requestedQuantity > currentQuantity && !rollback) {
          throw new Error(`Niewystarczająca ilość produktu "${product.name}". Dostępne: ${currentQuantity} ${product.unit}, Wymagane: ${requestedQuantity} ${material.unit || product.unit}`);
        }

        // Oblicz nową ilość
        let newQuantity;
        if (rollback) {
          // Przywracanie stanu (np. przy usuwaniu zadania)
          newQuantity = operation === 'use'
            ? currentQuantity + requestedQuantity  // Dodaj z powrotem
            : currentQuantity - requestedQuantity; // Odejmij z powrotem
        } else {
          // Normalna operacja
          newQuantity = operation === 'use'
            ? currentQuantity - requestedQuantity  // Odejmij przy użyciu
            : currentQuantity + requestedQuantity; // Dodaj przy zwrocie
        }

        // Sprawdź czy nie ujemna ilość
        if (newQuantity < 0) {
          throw new Error(`Nieprawidłowa ilość produktu "${product.name}". Wynik: ${newQuantity}`);
        }

        // Przygotuj aktualizację
        updates.push({
          productRef,
          productName: product.name,
          newQuantity,
          previousQuantity: currentQuantity,
          quantityChange: rollback ? requestedQuantity : -requestedQuantity,
          operation: rollback ? 'add' : 'delete', // 'add' przy zwrocie, 'delete' przy użyciu
          taskId,
          unit: product.unit || '' // Dodajemy jednostkę
        });
      }

      // Wykonaj wszystkie aktualizacje
      for (const update of updates) {
        await updateDoc(update.productRef, {
          quantity: update.newQuantity,
          lastUpdate: Timestamp.now(),
          lastOperation: update.operation,
          lastTaskId: taskId
        });

        // Dodaj wpis do historii magazynu
        await addDoc(collection(db, 'warehouseHistory'), {
          productId: update.productRef.id,
          productName: update.productName,
          operation: update.operation,
          quantity: Math.abs(update.quantityChange),
          previousQuantity: update.previousQuantity,
          newQuantity: update.newQuantity,
          timestamp: Timestamp.now(),
          source: 'task',
          taskId: taskId,
          userId: user?.uid,
          unit: update.unit,
          description: rollback
            ? `Zwrot z zadania: ${taskTitle || taskId || 'zadanie'}`
            : `Zużycie z zadania: ${taskTitle || taskId || 'nowe zadanie'}`
        });
      }

      console.log(`Zaktualizowano ${updates.length} produktów w magazynie`);
      return updates;

    } catch (err) {
      console.error('Błąd podczas aktualizacji magazynu:', err);
      throw err;
    }
  };

  // ZMODYFIKOWANA FUNKCJA addTask: teraz aktualizuje magazyn
  const addTask = async (taskData) => {
    if (!user || !db) throw new Error('Użytkownik nie jest zalogowany lub baza nie jest dostępna');

    try {
      // Przygotuj dane zadania
      const taskWithMetadata = {
        ...taskData,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        status: taskData.status || 'pending',
        materialsUsed: taskData.materials || []
      };

      // Konwertuj datę
      if (taskWithMetadata.dueDate) {
        taskWithMetadata.dueDate = Timestamp.fromDate(new Date(taskWithMetadata.dueDate));
      }

      // Oczyść pola
      taskWithMetadata.fieldId = taskWithMetadata.fieldId || null;
      taskWithMetadata.tractorId = taskWithMetadata.tractorId || null;
      taskWithMetadata.machineId = taskWithMetadata.machineId || null;
      taskWithMetadata.materialId = taskWithMetadata.materialId || null;

      // KROK 1: Zaktualizuj magazyn (ta funkcja sama doda historię)
      if (taskWithMetadata.materialsUsed.length > 0) {
        // Należy użyć operation='use', bo chcemy POBRAĆ z magazynu
        // Wcześniej było null, co powodowało dodawanie zamiast odejmowania
        await updateWarehouseStock(taskWithMetadata.materialsUsed, 'use', null, taskWithMetadata.title, false);
      }

      // KROK 2: Dodaj zadanie
      const docRef = await addDoc(collection(db, 'tasks'), taskWithMetadata);
      const newTaskId = docRef.id;

      // Aktualizuj stan lokalny
      const newTask = {
        id: newTaskId,
        ...taskWithMetadata
      };

      setTasks(prev => [...prev, newTask]);

      // Logowanie historii (async, nie blokujemy)
      addTaskLog(newTaskId, 'create', 'Utworzono nowe zadanie', taskWithMetadata.title);

      return newTaskId;

    } catch (err) {
      setError('Błąd podczas dodawania zadania: ' + err.message);
      console.error('Error adding task:', err);
      throw err;
    }
  };

  // ZMODYFIKOWANA FUNKCJA updateTask: obsługa zmiany materiałów i statusu
  const updateTask = async (taskId, updates) => {
    if (!db) throw new Error('Baza danych nie jest dostępna');

    try {
      // Pobierz aktualne zadanie
      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);
      const oldTask = taskDoc.exists() ? taskDoc.data() : null;

      if (!oldTask) {
        throw new Error('Zadanie nie istnieje');
      }

      const processedUpdates = { ...updates };
      if (processedUpdates.dueDate) {
        processedUpdates.dueDate = Timestamp.fromDate(new Date(processedUpdates.dueDate));
      }

      if (processedUpdates.status === 'completed' && !updates.completedAt) {
        processedUpdates.completedAt = Timestamp.now();
      }

      processedUpdates.fieldId = processedUpdates.fieldId || oldTask.fieldId || null;
      processedUpdates.tractorId = processedUpdates.tractorId || oldTask.tractorId || null;
      processedUpdates.machineId = processedUpdates.machineId || oldTask.machineId || null;
      processedUpdates.materialId = processedUpdates.materialId || oldTask.materialId || null;

      // Obsługa materiałów i statusów
      const oldMaterials = oldTask.materialsUsed || [];
      // Jeśli updates nie zawiera materials, użyj starych (fix dla częściowych aktualizacji)
      const newMaterials = processedUpdates.materials !== undefined ? (processedUpdates.materials || []) : oldMaterials;

      const oldStatus = oldTask.status || 'pending';
      const newStatus = processedUpdates.status || oldStatus;

      // Scenariusz 1: Anulowanie zadania (dowolny -> cancelled)
      if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
        // Przywróć materiały (jeśli były użyte)
        if (oldMaterials.length > 0) {
          await updateWarehouseStock(oldMaterials, 'use', taskId, oldTask.title, true); // rollback = true
        }
        // Save new materials logic is handled by updateDoc below, but we don't deduct new items if cancelled
      }
      // Scenariusz 2: Przywrócenie zadania (cancelled -> dowolny inny)
      else if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
        // Pobierz materiały (te które mają być w zadaniu)
        if (newMaterials.length > 0) {
          await updateWarehouseStock(newMaterials, 'use', taskId, oldTask.title, false); // rollback = false (deduct)
        }
      }
      // Scenariusz 3: Zadanie aktywne (nie anulowane), zmiana materiałów
      else if (newStatus !== 'cancelled') {
        if (JSON.stringify(oldMaterials) !== JSON.stringify(newMaterials)) {
          // 1. Przywróć stare
          if (oldMaterials.length > 0) {
            await updateWarehouseStock(oldMaterials, 'use', taskId, oldTask.title, true);
          }
          // 2. Pobierz nowe
          if (newMaterials.length > 0) {
            await updateWarehouseStock(newMaterials, 'use', taskId, oldTask.title, false);
          }
        }
      }

      // Zawsze aktualizuj listę materiałów w obiekcie updates (jeśli została zmieniona)
      if (JSON.stringify(oldMaterials) !== JSON.stringify(newMaterials)) {
        processedUpdates.materialsUsed = newMaterials;
      }
      // Usuń pole 'materials' z updates jeśli istnieje, bo używamy 'materialsUsed' w bazie
      delete processedUpdates.materials;

      // KROK 2: Aktualizuj zadanie
      await updateDoc(taskRef, processedUpdates);

      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, ...processedUpdates, materialsUsed: newMaterials }
          : task
      ));

      // Logowanie historii
      if (newStatus !== oldStatus) {
        addTaskLog(taskId, 'status_change', `Zmiana statusu z "${translateStatus(oldStatus)}" na "${translateStatus(newStatus)}"`, oldTask.title);
      } else {
        addTaskLog(taskId, 'update', 'Zaktualizowano dane zadania', oldTask.title);
      }

    } catch (err) {
      setError('Błąd podczas aktualizacji zadania: ' + err.message);
      console.error('Error updating task:', err);
      throw err;
    }
  };

  // ZMODYFIKOWANA FUNKCJA deleteTask: przywróć materiały do magazynu
  const deleteTask = async (taskId) => {
    if (!db) throw new Error('Baza danych nie jest dostępna');

    try {
      // Pobierz zadanie aby sprawdzić użyte materiały
      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await getDoc(taskRef);

      if (taskDoc.exists()) {
        const task = taskDoc.data();

        // Przywróć materiały do magazynu TYLKO jeśli zadanie NIE było anulowane
        // (bo anulowane zadania już zwróciły materiały przy zmianie statusu)
        if (task.status !== 'cancelled' && task.materialsUsed && task.materialsUsed.length > 0) {
          await updateWarehouseStock(task.materialsUsed, 'use', taskId, task.title, true); // rollback = true
        }
      }

      // Logowanie historii przed usunięciem
      await addTaskLog(taskId, 'delete', `Usunięto zadanie`, task.title);

      // Usuń zadanie
      await deleteDoc(taskRef);
      setTasks(prev => prev.filter(task => task.id !== taskId));

    } catch (err) {
      setError('Błąd podczas usuwania zadania: ' + err.message);
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  // NOWA FUNKCJA: Pobierz aktualne dane magazynu (do sprawdzenia dostępności)
  const refreshWarehouseItems = async () => {
    try {
      const warehouseQuery = query(
        collection(db, 'warehouse'),
        where('category', '==', 'nawozy')
      );
      const warehouseSnapshot = await getDocs(warehouseQuery);
      const warehouseData = warehouseSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWarehouseItems(warehouseData);
      return warehouseData;
    } catch (err) {
      console.warn('Brak kolekcji warehouse lub kategorii "nawozy":', err);
      setWarehouseItems([]);
      return [];
    }
  };

  const addComment = async (taskId, commentText, images = []) => {
    if (!user || !db) throw new Error('Użytkownik nie jest zalogowany lub baza nie jest dostępna');

    try {
      const comment = {
        userId: user.uid,
        text: commentText,
        images: images,
        timestamp: Timestamp.now()
      };

      const taskRef = doc(db, 'tasks', taskId);
      const currentTask = tasks.find(t => t.id === taskId);
      const updatedComments = [...(currentTask?.comments || []), comment];

      await updateDoc(taskRef, {
        comments: updatedComments
      });

      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, comments: updatedComments }
          : task
      ));

    } catch (err) {
      setError('Błąd podczas dodawania komentarza: ' + err.message);
      console.error('Error adding comment:', err);
      throw err;
    }
  };

  const getTasksByReference = (referenceType, referenceId) => {
    return tasks.filter(task => task[referenceType] === referenceId);
  };

  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    if (user && db) {
      fetchTasks();
      fetchRelatedData();
      refreshWarehouseItems(); // Odśwież dane magazynu
    }
  }, [user]);

  return {
    tasks,
    loading,
    error,
    fields,
    tractors,
    machines,
    warehouseItems,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    addComment,
    getTasksByReference,
    clearError,
    refreshWarehouseItems, // Eksportuj nową funkcję
    TASK_TYPES,
    TASK_STATUS,
    PRIORITIES
  };
};