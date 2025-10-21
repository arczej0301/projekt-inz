// components/pages/ProductModal.jsx
import { useState, useEffect, useRef } from 'react'
import './ProductModal.css'

function ProductModal({ product, category, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit: 'kg',
    price: 0,
    minStock: 0,
    category: category
  })

  const [isUnitSelectOpen, setIsUnitSelectOpen] = useState(false)
  const unitSelectRef = useRef(null)

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

  // Zamknij dropdown gdy kliknięto poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (unitSelectRef.current && !unitSelectRef.current.contains(event.target)) {
        setIsUnitSelectOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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

  const handleUnitSelect = (unitValue) => {
    setFormData(prev => ({
      ...prev,
      unit: unitValue
    }))
    setIsUnitSelectOpen(false)
  }

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

  const getUnitLabel = (value) => {
    const unit = units.find(u => u.value === value)
    return unit ? unit.label : 'Wybierz jednostkę'
  }

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
            <label>Kategoria</label>
            <input
              type="text"
              value={category}
              disabled
              className="disabled-input"
            />
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