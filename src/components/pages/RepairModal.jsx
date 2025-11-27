// components/pages/RepairModal.jsx
import { useState } from 'react'
import './GarageModals.css'

function RepairModal({ machine, onSave, onClose }) {
  const [formData, setFormData] = useState({
    description: '',
    cost: 0,
    status: 'do_naprawy',
    date: new Date().toISOString().split('T')[0],
    parts: '',
    mechanic: ''
  })

  const statusOptions = [
    { value: 'sprawna', label: 'Sprawna' },
    { value: 'do_naprawy', label: 'Do naprawy' },
    { value: 'zepsuta', label: 'Zepsuta' }
  ]

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Dodaj naprawę - {machine.name}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="repair-form">
          <div className="form-group">
            <label>Opis naprawy *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              required
              placeholder="Opisz co zostało zrobione/wymienione..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Koszt naprawy (zł) *</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Data naprawy *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status po naprawie *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Mechanik</label>
              <input
                type="text"
                name="mechanic"
                value={formData.mechanic}
                onChange={handleChange}
                placeholder="Imię i nazwisko mechanika"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Wymienione części</label>
            <textarea
              name="parts"
              value={formData.parts}
              onChange={handleChange}
              rows="2"
              placeholder="Lista wymienionych części..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="btn-primary">
              Dodaj naprawę
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RepairModal