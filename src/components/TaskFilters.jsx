// src/components/TaskFilters.jsx
import React, { useState } from 'react';
import CustomSelect from './CustomSelect';
import './TaskFilters.css';

const TaskFilters = ({ onFilterChange, TASK_TYPES, TASK_STATUS, PRIORITIES }) => {
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: '',
    assignedTo: '',
    dateRange: ''
  });

  const DATE_RANGE_OPTIONS = [
    { value: '', label: 'Wszystkie daty' },
    { value: 'today', label: 'Dzisiaj' },
    { value: 'tomorrow', label: 'Jutro' },
    { value: 'this_week', label: 'Ten tydzień' },
    { value: 'next_week', label: 'Następny tydzień' },
    { value: 'overdue', label: 'Przeterminowane' }
  ];

  const handleFilterChange = (name, value) => {
    const newFilters = {
      ...filters,
      [name]: value
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      status: '',
      type: '',
      priority: '',
      assignedTo: '',
      dateRange: ''
    };
    
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="task-filters">
      <div className="filters-header">
        <h3>Filtry</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="clear-filters-btn">
            Wyczyść filtry
          </button>
        )}
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label>Status</label>
          <CustomSelect
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            options={[{ value: '', label: 'Wszystkie statusy' }, ...TASK_STATUS]}
          />
        </div>

        <div className="filter-group">
          <label>Typ zadania</label>
          <CustomSelect
            value={filters.type}
            onChange={(value) => handleFilterChange('type', value)}
            options={[{ value: '', label: 'Wszystkie typy' }, ...TASK_TYPES]}
          />
        </div>

        <div className="filter-group">
          <label>Priorytet</label>
          <CustomSelect
            value={filters.priority}
            onChange={(value) => handleFilterChange('priority', value)}
            options={[{ value: '', label: 'Wszystkie priorytety' }, ...PRIORITIES]}
          />
        </div>

        <div className="filter-group">
          <label>Wykonawca</label>
          <input
            type="text"
            value={filters.assignedTo}
            onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
            placeholder="Filtruj po wykonawcy..."
          />
        </div>

        <div className="filter-group">
          <label>Zakres dat</label>
          <CustomSelect
            value={filters.dateRange}
            onChange={(value) => handleFilterChange('dateRange', value)}
            options={DATE_RANGE_OPTIONS}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="active-filters">
          <span>Aktywne filtry:</span>
          {filters.status && (
            <span className="active-filter-tag">
              Status: {TASK_STATUS.find(s => s.value === filters.status)?.label}
            </span>
          )}
          {filters.type && (
            <span className="active-filter-tag">
              Typ: {TASK_TYPES.find(t => t.value === filters.type)?.label}
            </span>
          )}
          {filters.priority && (
            <span className="active-filter-tag">
              Priorytet: {PRIORITIES.find(p => p.value === filters.priority)?.label}
            </span>
          )}
          {filters.assignedTo && (
            <span className="active-filter-tag">
              Wykonawca: {filters.assignedTo}
            </span>
          )}
          {filters.dateRange && (
            <span className="active-filter-tag">
              Data: {DATE_RANGE_OPTIONS.find(d => d.value === filters.dateRange)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskFilters;