// src/pages/TasksPage.jsx
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
  const [filterLoading, setFilterLoading] = useState(false);

  const {
    tasks,
    loading,
    error,
    fetchTasks,
    deleteTask,
    clearError,
    TASK_TYPES,
    TASK_STATUS,
    PRIORITIES
  } = useTasks();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  useEffect(() => {
    const checkAndRemoveOldTasks = () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      tasks.forEach(task => {
        if (task.status === 'completed' && task.completedAt) {
          const completionDate = task.completedAt?.toDate ? task.completedAt.toDate() : new Date(task.completedAt);

          if (completionDate < thirtyDaysAgo) {
            console.log(`Automatyczne usuwanie starego zadania: ${task.title}`);
            deleteTask(task.id);
          }
        }
      });
    };

    const interval = setInterval(checkAndRemoveOldTasks, 60000);
    checkAndRemoveOldTasks();

    return () => clearInterval(interval);
  }, [tasks, deleteTask]);

  const handleAddTask = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const handleEditTask = (task) => {
    if (task.status === 'completed') {
      alert('Nie można edytować zadań zakończonych.');
      return;
    }

    setEditingTask(task);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
    fetchTasks(filters);
  };

  const handleFilterChange = async (newFilters) => {
  setFilters(newFilters);
  setFilterLoading(true);
  
  try {
    await fetchTasks(newFilters);
  } catch (error) {
    console.error('Błąd podczas filtrowania:', error);
  } finally {
    setFilterLoading(false);
  }
};

  const handleClearError = () => {
    clearError();
  };

  const activeTasks = tasks.filter(task => task.status !== 'completed');
  const completedTasks = tasks.filter(task => task.status === 'completed');

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
            Nowe Zadanie
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={handleClearError} className="error-close">×</button>
        </div>
      )}

      {filterLoading && (
  <div className="loading-filter">
    <div className="loading-spinner"></div>
    <span>Filtrowanie zadań...</span>
  </div>
)}

      <TaskFilters
  onFilterChange={handleFilterChange}
  currentFilters={filters}
  TASK_TYPES={TASK_TYPES}
  TASK_STATUS={TASK_STATUS}
  PRIORITIES={PRIORITIES}
/>

      <div className="tasks-content">
        {activeView === 'list' ? (
          <div className="tasks-list-view">
            {activeTasks.length > 0 && (
              <div className="tasks-section">
                <div className="tasks-section-header">
                  <h3>Aktywne zadania ({activeTasks.length})</h3>
                  <span className="section-subtitle">Możesz edytować te zadania</span>
                </div>
                <TaskList
                  tasks={activeTasks}
                  onEditTask={handleEditTask}
                  TASK_TYPES={TASK_TYPES}
                />
              </div>
            )}

            {completedTasks.length > 0 && (
              <div className="tasks-section completed-section">
                <div className="tasks-section-divider">
                  <span className="divider-line"></span>
                  <span className="divider-text">
                    Zakończone ({completedTasks.length})
                  </span>
                  <span className="divider-line"></span>
                </div>

                <div className="tasks-info-banner">
                  <div className="info-icon">ℹ️</div>
                  <div className="info-content">
                    <strong>Informacja:</strong> Zadania zakończone nie mogą być edytowane i są automatycznie usuwane po 30 dniach.
                  </div>
                </div>

                <TaskList
                  tasks={completedTasks}
                  onEditTask={handleEditTask}
                  TASK_TYPES={TASK_TYPES}
                />
              </div>
            )}

            {tasks.length === 0 && !loading && (
              <div className="no-tasks-message">
                <p>📝 Brak zadań do wyświetlenia</p>
              </div>
            )}
          </div>
        ) : (
          <TaskCalendar
            tasks={tasks}
            onEditTask={handleEditTask}
          />
        )}
      </div>

      {filterLoading && (
        <div className="loading-filter">
          <div className="loading-spinner"></div>
          <span>Filtrowanie zadań...</span>
        </div>
      )}
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