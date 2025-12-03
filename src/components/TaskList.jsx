// src/components/TaskList.jsx - BEZ MOŻLIWOŚCI KLIKNIĘCIA ZAKOŃCZONYCH ZADAŃ
import React from 'react';
import { useTasks } from '../hooks/useTasks';
import './TaskList.css';

const TaskList = ({ tasks, onEditTask, TASK_TYPES }) => {
  const { fields, tractors, machines, warehouseItems } = useTasks();

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'in_progress': return 'status-in-progress';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'normal': return 'priority-normal';
      default: return 'priority-low';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Brak terminu';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('pl-PL');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Błędna data';
    }
  };

  const getReferenceName = (id, collection) => {
    if (!id) return null;
    const item = collection.find(item => item.id === id);
    
    if (!item) return null;
    
    if (collection === tractors || collection === machines) {
      return item.name || item.model || item.brand || `Maszyna ${item.id}`;
    }
    
    if (collection === fields) {
      return item.name || `Pole ${item.id}`;
    }
    
    if (collection === warehouseItems) {
      return item.name || `Produkt ${item.id}`;
    }
    
    return null;
  };

  const getTaskTypeLabel = (typeValue) => {
    if (!typeValue) return 'Nie określono';
    const type = TASK_TYPES.find(t => t.value === typeValue);
    return type ? type.label : 'Nieznany typ';
  };

 const handleTaskClick = (task) => {
  // Tylko aktywne zadania można edytować (nie zakończone i nie anulowane)
  if (task.status !== 'completed' && task.status !== 'cancelled') {
    onEditTask(task);
  }
};

  if (tasks.length === 0) {
    return (
      <div className="no-tasks">
        <p>Brak zadań do wyświetlenia</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map(task => {
        const isCompleted = task.status === 'completed';
        
        return (
          <div 
            key={task.id} 
            className={`task-card ${isCompleted ? 'task-completed' : ''}`}
            onClick={() => handleTaskClick(task)}
          >
            <div className="task-header">
              <h3 className="task-title">{task.title}</h3>
              <div className="task-meta">
                <span className={`status-badge ${getStatusClass(task.status)}`}>
                  {task.status === 'pending' && 'Do zrobienia'}
                  {task.status === 'in_progress' && 'W trakcie'}
                  {task.status === 'completed' && 'Zakończone'}
                  {task.status === 'cancelled' && 'Anulowane'}
                </span>
                <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                  {task.priority === 'low' && 'Niski'}
                  {task.priority === 'normal' && 'Normalny'}
                  {task.priority === 'high' && 'Wysoki'}
                  {task.priority === 'critical' && 'Krytyczny'}
                </span>
              </div>
            </div>

            {task.description && (
              <p className="task-description">{task.description}</p>
            )}

            <div className="task-details">
              <div className="task-info">
                <span className="info-item">
                  <strong>Typ:</strong> {getTaskTypeLabel(task.type)}
                </span>
                <span className="info-item">
                  <strong>Termin:</strong> {formatDate(task.dueDate)}
                </span>
                {task.assignedTo && (
                  <span className="info-item">
                    <strong>Wykonawca:</strong> {task.assignedTo}
                  </span>
                )}
                {isCompleted && task.completedAt && (
                  <span className="info-item">
                    <strong>Zakończono:</strong> {formatDate(task.completedAt)}
                    {task.completedAt && (
                      <span className="days-ago">
                        ({Math.floor((new Date() - (task.completedAt?.toDate ? task.completedAt.toDate() : new Date(task.completedAt))) / (1000 * 60 * 60 * 24))} dni temu)
                      </span>
                    )}
                  </span>
                )}
              </div>

              <div className="task-references">
                {task.fieldId && (
                  <span className="reference-tag field-tag" title={getReferenceName(task.fieldId, fields)}>
                    Pole: {getReferenceName(task.fieldId, fields) || 'Nieznane'}
                  </span>
                )}
                {task.tractorId && (
                  <span className="reference-tag tractor-tag" title={getReferenceName(task.tractorId, tractors)}>
                    Ciągnik: {getReferenceName(task.tractorId, tractors) || 'Nieznany'}
                  </span>
                )}
                {task.machineId && (
                  <span className="reference-tag machine-tag" title={getReferenceName(task.machineId, machines)}>
                    Maszyna: {getReferenceName(task.machineId, machines) || 'Nieznana'}
                  </span>
                )}
                {task.materialId && (
                  <span className="reference-tag material-tag" title={getReferenceName(task.materialId, warehouseItems)}>
                    Nasiona/Nawozy: {getReferenceName(task.materialId, warehouseItems) || 'Nieznany'}
                  </span>
                )}
              </div>
            </div>

            {task.comments && task.comments.length > 0 && (
              <div className="task-comments-preview">
                <span>{task.comments.length} komentarzy</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TaskList;