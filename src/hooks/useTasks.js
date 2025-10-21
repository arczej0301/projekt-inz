// src/hooks/useTasks.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
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

  // Pobierz wszystkie zadania
  const fetchTasks = async (filters = {}) => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let q = query(collection(db, 'tasks'), orderBy('dueDate', 'asc'));
      
      // Filtrowanie
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters.priority) {
        q = query(q, where('priority', '==', filters.priority));
      }
      if (filters.assignedTo) {
        q = query(q, where('assignedTo', '==', filters.assignedTo));
      }

      const querySnapshot = await getDocs(q);
      const tasksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTasks(tasksData);
    } catch (err) {
      setError('Błąd podczas pobierania zadań: ' + err.message);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dodaj nowe zadanie
  const addTask = async (taskData) => {
    if (!user) throw new Error('Użytkownik nie jest zalogowany');

    try {
      const taskWithMetadata = {
        ...taskData,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        status: 'pending'
      };

      // Konwersja dat na Timestamp
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