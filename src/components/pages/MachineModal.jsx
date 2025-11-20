// components/pages/MachineModal.jsx
import { useState, useEffect } from 'react'
import './GarageModals.css'

function MachineModal({ machine, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    type: 'ciągnik',
    year: new Date().getFullYear(),
    registration: '',
    status: 'sprawna',
    lastService: '',
    notes: '',
    imageUrl: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const machineTypes = [
    'ciągnik',
    'kombajn',
    'przyczepa',
    'opryskiwacz',
    'siewnik',
    'pług',
    'brona',
    'wał',
    'prasa',
    'ładowacz',
    'inny'
  ]

  const statusOptions = [
    { value: 'sprawna', label: 'Sprawna' },
    { value: 'do_naprawy', label: 'Do naprawy' },
    { value: 'zepsuta', label: 'Zepsuta' }
  ]

  useEffect(() => {
    if (machine) {
      setFormData({
        name: machine.name || '',
        brand: machine.brand || '',
        type: machine.type || 'ciągnik',
        year: machine.year || new Date().getFullYear(),
        registration: machine.registration || '',
        status: machine.status || 'sprawna',
        lastService: machine.lastService || '',
        notes: machine.notes || '',
        imageUrl: machine.imageUrl || ''
      })
      setImagePreview(machine.imageUrl || '')
    }
  }, [machine])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData, imageFile)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData(prev => ({ ...prev, imageUrl: '' }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{machine ? 'Edytuj maszynę' : 'Dodaj nową maszynę'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="machine-form">
          <div className="form-section">
            <h4>Zdjęcie maszyny</h4>
            <div className="image-upload">
              {imagePreview ? (
                <div className="image-preview">
                  <img src={imagePreview} alt="Podgląd" />
                  <button type="button" className="remove-image" onClick={removeImage}>
                    ×
                  </button>
                </div>
              ) : (
                <div className="image-placeholder">
                  <span>🚜</span>
                  <p>Dodaj zdjęcie maszyny</p>
                </div>
              )}
              <input
                type="file"
                id="machine-image"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
              <label htmlFor="machine-image" className="file-label">
                Wybierz zdjęcie
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nazwa maszyny *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="np. Ciągnik John Deere 6130M"
              />
            </div>

            <div className="form-group">
              <label>Marka *</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                placeholder="np. John Deere"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Typ maszyny *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                {machineTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Rok produkcji *</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1950"
                max={new Date().getFullYear()}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Numer rejestracyjny</label>
              <input
                type="text"
                name="registration"
                value={formData.registration}
                onChange={handleChange}
                placeholder="np. RZE 12345"
              />
            </div>

            <div className="form-group">
              <label>Status *</label>
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
          </div>

          <div className="form-group">
            <label>Data ostatniego serwisu</label>
            <input
              type="date"
              name="lastService"
              value={formData.lastService}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Notatki</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Dodatkowe informacje o maszynie..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Anuluj
            </button>
            <button type="submit" className="btn-primary">
              {machine ? 'Zapisz zmiany' : 'Dodaj maszynę'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MachineModal