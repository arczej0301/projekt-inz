// src/components/TaskList.jsx
import React from 'react';
import './TaskList.css';

const TaskList = ({ tasks, onEditTask }) => {
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
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('pl-PL');
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
      {tasks.map(task => (
        <div key={task.id} className="task-card" onClick={() => onEditTask(task)}>
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
                <strong>Typ:</strong> {task.type || 'Nie określono'}
              </span>
              <span className="info-item">
                <strong>Termin:</strong> {formatDate(task.dueDate)}
              </span>
              {task.assignedTo && (
                <span className="info-item">
                  <strong>Wykonawca:</strong> {task.assignedTo}
                </span>
              )}
            </div>

            <div className="task-references">
              {task.fieldId && (
                <span className="reference-tag field-tag">Pole</span>
              )}
              {task.animalId && (
                <span className="reference-tag animal-tag">Zwierzęta</span>
              )}
              {task.machineId && (
                <span className="reference-tag machine-tag">Maszyna</span>
              )}
              {task.materialId && (
                <span className="reference-tag material-tag">Materiał</span>
              )}
            </div>
          </div>

          {task.comments && task.comments.length > 0 && (
            <div className="task-comments-preview">
              <span>{task.comments.length} komentarzy</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default TaskList;