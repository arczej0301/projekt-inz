// components/CustomSelect/CustomSelect.jsx
import React, { useState, useRef, useEffect } from 'react'
import './CustomSelect.css'

const CustomSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = "Wybierz...",
  disabled = false,
  searchable = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const selectRef = useRef(null)
  const searchInputRef = useRef(null)

  
  // Filtruj opcje jeśli włączone wyszukiwanie
  const filteredOptions = searchable 
    ? options.filter(option => {
        const searchLower = searchTerm.toLowerCase()
        return (
          option.label.toLowerCase().includes(searchLower) ||
          (option.value && option.value.toString().toLowerCase().includes(searchLower))
        )
      })
    : options

  // Znajdź aktualnie wybraną opcję
  const selectedOption = options.find(opt => opt.value === value)

  // Zamknij dropdown gdy kliknięto poza komponentem
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus na wyszukiwarkę gdy otwarty
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen, searchable])

  // Obsługa klawiatury
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSearchTerm('')
          setHighlightedIndex(-1)
          break
        case 'Tab':
          setIsOpen(false)
          setSearchTerm('')
          setHighlightedIndex(-1)
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, highlightedIndex, filteredOptions])

  const handleSelect = (option) => {
    if (onChange) {
      onChange(option.value)
    }
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      setSearchTerm('')
      setHighlightedIndex(-1)
    }
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setHighlightedIndex(0) // Reset to first item when searching
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && filteredOptions.length > 0) {
      e.preventDefault()
      if (highlightedIndex >= 0) {
        handleSelect(filteredOptions[highlightedIndex])
      } else {
        handleSelect(filteredOptions[0])
      }
    }
  }

  return (
    <div 
      ref={selectRef}
      className={`custom-select ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
    >
      <div 
        className={`select-header ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}
      >
        <div className="selected-value">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="option-icon">{selectedOption.icon}</span>}
              <span className="option-label">{selectedOption.label}</span>
            </>
          ) : (
            <span className="placeholder">{placeholder}</span>
          )}
        </div>
        <span className="select-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="select-dropdown">
          {searchable && (
            <div className="search-container">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Szukaj..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="search-input"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          <div className="options-list">
            {filteredOptions.length === 0 ? (
              <div className="no-options">
                {searchTerm ? 'Brak wyników' : 'Brak opcji do wyboru'}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  className={`option-item ${
                    value === option.value ? 'selected' : ''
                  } ${
                    index === highlightedIndex ? 'highlighted' : ''
                  }`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option.icon && <span className="option-icon">{option.icon}</span>}
                  <span className="option-label">{option.label}</span>
                  {option.description && (
                    <span className="option-description">{option.description}</span>
                  )}
                  {value === option.value && (
                    <span className="check-mark">✓</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomSelect