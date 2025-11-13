// src/hooks/useTasks.js - ZASTĄP CAŁY PLIK TYM KODEM
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
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './useAuth';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Custom lists dla selectów
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

  // Pobierz wszystkie zadania i filtruj po stronie klienta
  const fetchTasks = async (filters = {}) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Pobierz WSZYSTKIE zadania (bez filtrów Firestore)
      const q = query(collection(db, 'tasks'), orderBy('dueDate', 'asc'));
      const querySnapshot = await getDocs(q);
      let tasksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('All tasks loaded from Firestore:', tasksData.length);

      // FILTROWANIE PO STRONIE KLIENTA
      if (filters.status && filters.status !== '') {
        tasksData = tasksData.filter(task => task.status === filters.status);
        console.log(`Filtered by status "${filters.status}": ${tasksData.length} tasks`);
      }
      
      if (filters.type && filters.type !== '') {
        tasksData = tasksData.filter(task => task.type === filters.type);
        console.log(`Filtered by type "${filters.type}": ${tasksData.length} tasks`);
      }
      
      if (filters.priority && filters.priority !== '') {
        tasksData = tasksData.filter(task => task.priority === filters.priority);
        console.log(`Filtered by priority "${filters.priority}": ${tasksData.length} tasks`);
      }
      
      if (filters.assignedTo && filters.assignedTo !== '') {
        tasksData = tasksData.filter(task => 
          task.assignedTo && task.assignedTo.toLowerCase().includes(filters.assignedTo.toLowerCase())
        );
        console.log(`Filtered by assignedTo "${filters.assignedTo}": ${tasksData.length} tasks`);
      }

      // Filtrowanie zakresów dat
      if (filters.dateRange && filters.dateRange !== '') {
        tasksData = filterTasksByDateRange(tasksData, filters.dateRange);
        console.log(`Filtered by dateRange "${filters.dateRange}": ${tasksData.length} tasks`);
      }

      setTasks(tasksData);
      
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Błąd podczas pobierania zadań: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Funkcja pomocnicza do filtrowania po zakresach dat
  const filterTasksByDateRange = (tasks, dateRange) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      
      try {
        // Konwersja Firestore Timestamp na Date
        let taskDate;
        if (task.dueDate && task.dueDate.toDate) {
          taskDate = task.dueDate.toDate();
        } else if (task.dueDate && task.dueDate.seconds) {
          taskDate = new Date(task.dueDate.seconds * 1000);
        } else {
          taskDate = new Date(task.dueDate);
        }

        // Normalizuj czas - ustaw na początek dnia
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

  // Dodaj nowe zadanie
  const addTask = async (taskData) => {
    if (!user) throw new Error('Użytkownik nie jest zalogowany');

    try {
      const taskWithMetadata = {
        ...taskData,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        status: taskData.status || 'pending'
      };

      // Konwersja daty na Timestamp
      if (taskWithMetadata.dueDate) {
        taskWithMetadata.dueDate = Timestamp.fromDate(new Date(taskWithMetadata.dueDate));
      }

      const docRef = await addDoc(collection(db, 'tasks'), taskWithMetadata);
      
      // Natychmiastowe odświeżenie listy zadań
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

  // Aktualizuj zadanie
  const updateTask = async (taskId, updates) => {
    try {
      // Konwersja dat na Timestamp jeśli istnieją
      const processedUpdates = { ...updates };
      if (processedUpdates.dueDate) {
        processedUpdates.dueDate = Timestamp.fromDate(new Date(processedUpdates.dueDate));
      }
      
      if (processedUpdates.status === 'completed' && !updates.completedAt) {
        processedUpdates.completedAt = Timestamp.now();
      }

      await updateDoc(doc(db, 'tasks', taskId), processedUpdates);
      
      // Natychmiastowa aktualizacja w stanie
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

  // Usuń zadanie
  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      
      // Natychmiastowe usunięcie ze stanu
      setTasks(prev => prev.filter(task => task.id !== taskId));
      
    } catch (err) {
      setError('Błąd podczas usuwania zadania: ' + err.message);
      console.error('Error deleting task:', err);
      throw err;
    }
  };

  // Dodaj komentarz do zadania
  const addComment = async (taskId, commentText, images = []) => {
    if (!user) throw new Error('Użytkownik nie jest zalogowany');

    try {
      const comment = {
        userId: user.uid,
        text: commentText,
        images: images,
        timestamp: Timestamp.now()
      };

      const taskRef = doc(db, 'tasks', taskId);
      
      // Pobierz aktualne komentarze
      const currentTask = tasks.find(t => t.id === taskId);
      const updatedComments = [...(currentTask?.comments || []), comment];
      
      await updateDoc(taskRef, {
        comments: updatedComments
      });

      // Natychmiastowa aktualizacja w stanie
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

  // Pobierz zadania powiązane z konkretnym elementem (polem, zwierzęciem, maszyną)
  const getTasksByReference = (referenceType, referenceId) => {
    return tasks.filter(task => task[referenceType] === referenceId);
  };

  // Reset error
  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  return {
    tasks,
    loading,
    error,
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