// src/components/pages/MagazineForm.jsx
import { useState, useEffect } from 'react';
import { magazineService, MAGAZINE_CATEGORIES } from '../../services/magazineService';
import './MagazinePage.css';

function MagazineForm({ item, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    unit: '',
    minQuantity: 0,
    location: '',
    supplier: '',
    purchaseDate: '',
    expirationDate: '',
    price: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || '',
        quantity: item.quantity || 0,
        unit: item.unit || '',
        minQuantity: item.minQuantity || 0,
        location: item.location || '',
        supplier: item.supplier || '',
        purchaseDate: item.purchaseDate || '',
        expirationDate: item.expirationDate || '',
        price: item.price || 0,
        notes: item.notes || ''
      });
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (item) {
        await magazineService.updateItem(item.id, formData);
      } else {
        await magazineService.addItem(formData);
      }
      onSave();
    } catch (error) {
      alert('Błąd zapisu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{item ? 'Edytuj przedmiot' : 'Dodaj nowy przedmiot'}</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="magazine-form">
          <div className="form-row">
            <div className="form-group">
              <label>Nazwa *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Kategoria *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="">Wybierz kategorię</option>
                {Object.entries(MAGAZINE_CATEGORIES).map(([key, value]) => (
                  <option key={key} value={value}>{value}</option>
                ))}
              </select>
            </div>
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
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                placeholder="kg, l, szt..."
                required
              />
            </div>

            <div className="form-group">
              <label>Minimalny stan</label>
              <input
                type="number"
                name="minQuantity"
                value={formData.minQuantity}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Lokalizacja</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="np. Magazyn A, Regał 1"
              />
            </div>

            <div className="form-group">
              <label>Dostawca</label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data zakupu</label>
              <input
                type="date"
                name="purchaseDate"
                value={formData.purchaseDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Data ważności</label>
              <input
                type="date"
                name="expirationDate"
                value={formData.expirationDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Cena (zł)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notatki</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Anuluj
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Zapisywanie...' : (item ? 'Zapisz zmiany' : 'Dodaj przedmiot')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MagazineForm;