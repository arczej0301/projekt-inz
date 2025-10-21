// src/components/CustomSelect.jsx
import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Wybierz...", 
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClickOutside = (event) => {
    if (selectRef.current && !selectRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div 
      ref={selectRef}
      className={`custom-select ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''} ${className}`}
    >
      <div 
        className="select-selected"
        onClick={handleToggle}
      >
        {selectedOption ? selectedOption.label : placeholder}
        <span className="select-arrow">▼</span>
      </div>
      
      {isOpen && (
        <div className="select-options">
          {options.map(option => (
            <div
              key={option.value}
              className={`select-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;