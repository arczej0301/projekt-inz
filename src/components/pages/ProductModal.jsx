// components/pages/ProductModal.jsx
<<<<<<< HEAD
import { useState, useEffect, useRef } from 'react'
import './ProductModal.css'

function ProductModal({ product, category, categories, onCategoryChange, onSave, onClose }) {
=======
import { useState, useEffect } from 'react'
import './ProductModal.css'

function ProductModal({ product, category, onSave, onClose }) {
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit: 'kg',
    price: 0,
    minStock: 0,
    category: category
  })

<<<<<<< HEAD
  const [isUnitSelectOpen, setIsUnitSelectOpen] = useState(false)
  const [isCategorySelectOpen, setIsCategorySelectOpen] = useState(false)
  const unitSelectRef = useRef(null)
  const categorySelectRef = useRef(null)

=======
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        quantity: product.quantity || 0,
        unit: product.unit || 'kg',
        price: product.price || 0,
        minStock: product.minStock || 0,
        category: product.category || category
      })
    }
  }, [product, category])

<<<<<<< HEAD
  // Zamknij dropdowny gdy kliknięto poza nimi
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (unitSelectRef.current && !unitSelectRef.current.contains(event.target)) {
        setIsUnitSelectOpen(false)
      }
      if (categorySelectRef.current && !categorySelectRef.current.contains(event.target)) {
        setIsCategorySelectOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

=======
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

<<<<<<< HEAD
  const handleUnitSelect = (unitValue) => {
    setFormData(prev => ({
      ...prev,
      unit: unitValue
    }))
    setIsUnitSelectOpen(false)
  }

  const handleCategorySelect = (categoryId) => {
    onCategoryChange(categoryId)
    setFormData(prev => ({
      ...prev,
      category: categoryId
    }))
    setIsCategorySelectOpen(false)
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? `${category.icon} ${category.name}` : 'Wybierz kategorię'
  }

=======
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
  const units = [
    { value: 'kg', label: 'Kilogramy (kg)' },
    { value: 'g', label: 'Gramy (g)' },
    { value: 'l', label: 'Litry (l)' },
    { value: 'ml', label: 'Mililitry (ml)' },
    { value: 'szt', label: 'Sztuki (szt)' },
    { value: 'opak', label: 'Opakowania (opak)' },
    { value: 'rolka', label: 'Rolki (rolka)' },
    { value: 'paleta', label: 'Palety (paleta)' }
  ]

<<<<<<< HEAD
  const getUnitLabel = (value) => {
    const unit = units.find(u => u.value === value)
    return unit ? unit.label : 'Wybierz jednostkę'
  }

=======
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product ? 'Edytuj produkt' : 'Dodaj nowy produkt'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-group">
            <label>Nazwa produktu *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ilość *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Jednostka *</label>
<<<<<<< HEAD
              <div className="custom-select" ref={unitSelectRef}>
                <div 
                  className={`select-header ${formData.unit ? 'has-value' : ''}`}
                  onClick={() => setIsUnitSelectOpen(!isUnitSelectOpen)}
                >
                  <span className="select-value">{getUnitLabel(formData.unit)}</span>
                  <span className={`select-arrow ${isUnitSelectOpen ? 'open' : ''}`}>
                    ▼
                  </span>
                </div>
                
                {isUnitSelectOpen && (
                  <div className="select-dropdown">
                    {units.map(unit => (
                      <div
                        key={unit.value}
                        className={`select-option ${formData.unit === unit.value ? 'selected' : ''}`}
                        onClick={() => handleUnitSelect(unit.value)}
                      >
                        {unit.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
=======
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
              >
                {units.map(unit => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cena (zł)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Minimalny stan *</label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-group">
<<<<<<< HEAD
            <label>Kategoria *</label>
            <div className="custom-select" ref={categorySelectRef}>
              <div 
                className={`select-header ${category ? 'has-value' : ''}`}
                onClick={() => setIsCategorySelectOpen(!isCategorySelectOpen)}
              >
                <span className="select-value">{getCategoryName(category)}</span>
                <span className={`select-arrow ${isCategorySelectOpen ? 'open' : ''}`}>
                  ▼
                </span>
              </div>
              
              {isCategorySelectOpen && (
                <div className="select-dropdown">
                  {categories.map(cat => (
                    <div
                      key={cat.id}
                      className={`select-option ${category === cat.id ? 'selected' : ''}`}
                      onClick={() => handleCategorySelect(cat.id)}
                    >
                      <span style={{ marginRight: '8px' }}>{cat.icon}</span>
                      {cat.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
=======
            <label>Kategoria</label>
            <input
              type="text"
              value={category}
              disabled
              className="disabled-input"
            />
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="btn-primary">
              {product ? 'Zapisz zmiany' : 'Dodaj produkt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductModal