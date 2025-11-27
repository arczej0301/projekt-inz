// src/components/TaskFilters.jsx - CAŁKOWICIE POPRAWIONA WERSJA
import React, { useState, useEffect } from 'react';
import './TaskFilters.css';

const TaskFilters = ({ onFilterChange, currentFilters, TASK_TYPES, TASK_STATUS, PRIORITIES }) => {
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: '',
    assignedTo: '',
    dateRange: ''
  });

  // Synchronizuj z props od rodzica
  useEffect(() => {
    if (currentFilters) {
      setFilters(currentFilters);
    }
  }, [currentFilters]);

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

  const removeFilter = (filterName) => {
    console.log('Removing filter:', filterName);
    console.log('Current filters before:', filters);
    
    const newFilters = {
      ...filters,
      [filterName]: ''
    };
    
    console.log('New filters after:', newFilters);
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const getFilterLabel = (filterName, value) => {
    switch (filterName) {
      case 'status':
        return TASK_STATUS.find(s => s.value === value)?.label;
      case 'type':
        return TASK_TYPES.find(t => t.value === value)?.label;
      case 'priority':
        return PRIORITIES.find(p => p.value === value)?.label;
      case 'dateRange':
        return DATE_RANGE_OPTIONS.find(d => d.value === value)?.label;
      case 'assignedTo':
        return value;
      default:
        return value;
    }
  };

  const getFilterDisplayName = (filterName) => {
    switch (filterName) {
      case 'status': return 'Status';
      case 'type': return 'Typ';
      case 'priority': return 'Priorytet';
      case 'assignedTo': return 'Wykonawca';
      case 'dateRange': return 'Data';
      default: return filterName;
    }
  };

  // Debug - pokaż aktualne filtry
  console.log('Current filters in component:', filters);

  return (
    <div className="task-filters">
      <div className="filters-header">
        <h3>Filtry</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="clear-filters-btn">
            Wyczyść wszystkie filtry
          </button>
        )}
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Wszystkie statusy</option>
            {TASK_STATUS.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Typ zadania</label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">Wszystkie typy</option>
            {TASK_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Priorytet</label>
          <select
            value={filters.priority || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="">Wszystkie priorytety</option>
            {PRIORITIES.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Wykonawca</label>
          <input
            type="text"
            value={filters.assignedTo || ''}
            onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
            placeholder="Filtruj po wykonawcy..."
          />
        </div>

        <div className="filter-group">
          <label>Zakres dat</label>
          <select
            value={filters.dateRange || ''}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          >
            {DATE_RANGE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="active-filters">
          <span>Aktywne filtry:</span>
          {Object.entries(filters)
            .filter(([key, value]) => value && value !== '')
            .map(([key, value]) => (
              <span 
                key={key} 
                className="active-filter-tag"
                onClick={() => removeFilter(key)}
                title={`Kliknij aby usunąć filtr: ${getFilterDisplayName(key)}`}
              >
                {getFilterDisplayName(key)}: {getFilterLabel(key, value)}
                <span className="remove-filter-x"> ×</span>
              </span>
            ))}
        </div>
      )}
    </div>
  );
};

export default TaskFilters;