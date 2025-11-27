// src/hooks/useTasks.js - POPRAWIONA WERSJA (Z CIĄGNIKAMI)
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
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './useAuth';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fields, setFields] = useState([]);
  const [machines, setMachines] = useState([]);
  const [tractors, setTractors] = useState([]); // NOWE: ciągniki i kombajny
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

  const addTask = async (taskData) => {
    if (!user || !db) throw new Error('Użytkownik nie jest zalogowany lub baza nie jest dostępna');

    try {
      const taskWithMetadata = {
        ...taskData,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        status: taskData.status || 'pending'
      };

      if (taskWithMetadata.dueDate) {
        taskWithMetadata.dueDate = Timestamp.fromDate(new Date(taskWithMetadata.dueDate));
      }

      taskWithMetadata.fieldId = taskWithMetadata.fieldId || null;
      taskWithMetadata.tractorId = taskWithMetadata.tractorId || null; // NOWE
      taskWithMetadata.machineId = taskWithMetadata.machineId || null;
      taskWithMetadata.materialId = taskWithMetadata.materialId || null;

      const docRef = await addDoc(collection(db, 'tasks'), taskWithMetadata);
      
      const newTask = {
        id: docRef.id,
        ...taskWithMetadata
      };
      
      setTasks(prev => [...prev, newTask]);
      
      return docRef.id;
    } catch (err) {
      setError('Błąd podczas dodawania zadania: ' + err.message);
      console.error('Error adding task:', err);
      throw err;
    }
  };

  const updateTask = async (taskId, updates) => {
    if (!db) throw new Error('Baza danych nie jest dostępna');

    try {
      const processedUpdates = { ...updates };
      if (processedUpdates.dueDate) {
        processedUpdates.dueDate = Timestamp.fromDate(new Date(processedUpdates.dueDate));
      }
      
      if (processedUpdates.status === 'completed' && !updates.completedAt) {
        processedUpdates.completedAt = Timestamp.now();
      }

      processedUpdates.fieldId = processedUpdates.fieldId || null;
      processedUpdates.tractorId = processedUpdates.tractorId || null; // NOWE
      processedUpdates.machineId = processedUpdates.machineId || null;
      processedUpdates.materialId = processedUpdates.materialId || null;

      await updateDoc(doc(db, 'tasks', taskId), processedUpdates);
      
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, ...processedUpdates }
          : task
      ));
      
    } catch (err) {
      setError('Błąd podczas aktualizacji zadania: ' + err.message);
      console.error('Error updating task:', err);
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    if (!db) throw new Error('Baza danych nie jest dostępna');

    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      setError('Błąd podczas usuwania zadania: ' + err.message);
      console.error('Error deleting task:', err);
      throw err;
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
    }
  }, [user]);

  return {
    tasks,
    loading,
    error,
    fields,
    tractors, // NOWE
    machines,
    warehouseItems,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    addComment,
    getTasksByReference,
    clearError,
    TASK_TYPES,
    TASK_STATUS,
    PRIORITIES
  };
};