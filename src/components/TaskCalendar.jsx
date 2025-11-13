// src/components/TaskCalendar.jsx
import React, { useState } from 'react';
import './TaskCalendar.css';

const TaskCalendar = ({ tasks, onEditTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getTasksForDay = (day) => {
  return tasks.filter(task => {
    if (!task.dueDate) return false;
    
    try {
      let taskDate;
      
      // Firestore Timestamp
      if (task.dueDate && typeof task.dueDate.toDate === 'function') {
        taskDate = task.dueDate.toDate();
      } 
      // Firestore object with seconds
      else if (task.dueDate && typeof task.dueDate === 'object' && task.dueDate.seconds !== undefined) {
        taskDate = new Date(task.dueDate.seconds * 1000);
      }
      // Date string
      else if (typeof task.dueDate === 'string') {
        taskDate = new Date(task.dueDate);
      }
      // Date object
      else if (task.dueDate instanceof Date) {
        taskDate = task.dueDate;
      }
      // Unknown format
      else {
        console.warn('Unknown date format for task:', task.id, task.dueDate);
        return false;
      }

      // Validate date
      if (isNaN(taskDate.getTime())) {
        console.warn('Invalid date for task:', task.id, task.dueDate);
        return false;
      }

      // Normalize dates to beginning of day for accurate comparison
      const taskDay = taskDate.getDate();
      const taskMonth = taskDate.getMonth();
      const taskYear = taskDate.getFullYear();
      
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      return taskDay === day && taskMonth === currentMonth && taskYear === currentYear;
      
    } catch (error) {
      console.error('Error processing task date for task:', task.id, error);
      return false;
    }
  });
};

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const today = new Date();

  const isToday = (day) => {
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const normalizedCurrentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  
  return normalizedToday.getTime() === normalizedCurrentDay.getTime();
};

  const renderCalendarDays = () => {
    const days = [];
    
    // Puste komórki na początek miesiąca
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Dni miesiąca
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTasks = getTasksForDay(day);
      
      days.push(
        <div 
          key={day} 
          className={`calendar-day ${isToday(day) ? 'today' : ''}`}
        >
          <div className="day-number">{day}</div>
          <div className="day-tasks">
            {dayTasks.slice(0, 3).map(task => (
              <div 
                key={task.id}
                className={`task-calendar-item ${task.priority} ${task.status}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTask(task);
                }}
                title={task.title}
              >
                <span className="task-calendar-title">{task.title}</span>
                {task.priority === 'critical' && <span className="priority-indicator">!</span>}
              </div>
            ))}
            {dayTasks.length > 3 && (
              <div className="more-tasks">+{dayTasks.length - 3} więcej</div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="task-calendar">
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button onClick={() => navigateMonth(-1)} className="nav-button">
            ‹
          </button>
          <h2>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={() => navigateMonth(1)} className="nav-button">
            ›
          </button>
        </div>
        <button onClick={goToToday} className="today-button">
          Dzisiaj
        </button>
      </div>

      <div className="calendar-grid">
        {/* Nagłówki dni */}
        {dayNames.map(dayName => (
          <div key={dayName} className="calendar-day-header">
            {dayName}
          </div>
        ))}
        
        {/* Dni kalendarza */}
        {renderCalendarDays()}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color today"></div>
          <span>Dzisiejszy dzień</span>
        </div>
        <div className="legend-item">
          <div className="legend-color critical"></div>
          <span>Krytyczny priorytet</span>
        </div>
        <div className="legend-item">
          <div className="legend-color completed"></div>
          <span>Zakończone</span>
        </div>
      </div>
    </div>
  );
};

export default TaskCalendar;