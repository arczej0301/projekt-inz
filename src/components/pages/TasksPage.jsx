// src/pages/TasksPage.jsx - ZASTĄP CAŁY PLIK
import React, { useState, useEffect, useRef } from 'react'; 
import { useTasks } from '../../hooks/useTasks';
import TaskList from '../../components/TaskList';
import TaskModal from '../../components/TaskModal';
import TaskFilters from '../../components/TaskFilters';
import TaskCalendar from '../../components/TaskCalendar';
import './TasksPage.css';

const TasksPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeView, setActiveView] = useState('list');
  const [filters, setFilters] = useState({});
  const filterTimeoutRef = useRef(null);
  
  const { 
    tasks, 
    loading, 
    error, 
    fetchTasks,
    clearError,
    TASK_TYPES,
    TASK_STATUS,
    PRIORITIES 
  } = useTasks();

  // Auto-ukrywanie błędów po 5 sekundach
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleAddTask = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
    // Opcjonalnie: odśwież listę dla pewności
    fetchTasks(filters);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    
    // Debouncing - unikaj zbyt wielu zapytań
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    
    filterTimeoutRef.current = setTimeout(() => {
      fetchTasks(newFilters);
    }, 500);
  };

  const handleClearError = () => {
    clearError();
  };

  if (loading && tasks.length === 0) {
    return <div className="loading">Ładowanie zadań...</div>;
  }

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <h1>Zadania</h1>
        <div className="tasks-actions">
          <div className="view-toggle">
            <button 
              className={activeView === 'list' ? 'active' : ''}
              onClick={() => setActiveView('list')}
            >
              Lista
            </button>
            <button 
              className={activeView === 'calendar' ? 'active' : ''}
              onClick={() => setActiveView('calendar')}
            >
              Kalendarz
            </button>
          </div>
          <button className="btn-primary" onClick={handleAddTask}>
            + Nowe Zadanie
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={handleClearError} className="error-close">×</button>
        </div>
      )}

      <TaskFilters 
        onFilterChange={handleFilterChange}
        TASK_TYPES={TASK_TYPES}
        TASK_STATUS={TASK_STATUS}
        PRIORITIES={PRIORITIES}
      />

      <div className="tasks-content">
        {activeView === 'list' ? (
          <TaskList 
            tasks={tasks}
            onEditTask={handleEditTask}
            TASK_TYPES={TASK_TYPES}
          />
        ) : (
          <TaskCalendar 
            tasks={tasks}
            onEditTask={handleEditTask}
          />
        )}
      </div>

      {showModal && (
        <TaskModal
          task={editingTask}
          onClose={handleCloseModal}
          TASK_TYPES={TASK_TYPES}
          TASK_STATUS={TASK_STATUS}
          PRIORITIES={PRIORITIES}
        />
      )}
    </div>
  );
};

export default TasksPage;