// src/components/TaskModal.jsx
import React, { useState, useEffect } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import CustomSelect from './CustomSelect';
import './TaskModal.css';

const TaskModal = ({ task, onClose, TASK_TYPES, TASK_STATUS, PRIORITIES }) => {
  const { addTask, updateTask } = useTasks();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    status: 'pending',
    priority: 'normal',
    assignedTo: '',
    dueDate: '',
    fieldId: '',
    animalId: '',
    machineId: '',
    materialId: '',
    materials: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Custom lists dla powiązań (tutaj będą dynamiczne dane z innych modułów)
  const FIELD_OPTIONS = [
    { value: '', label: 'Brak powiązania' },
    { value: 'field1', label: 'Pole A - Kukurydza' },
    { value: 'field2', label: 'Pole B - Pszenica' },
    { value: 'field3', label: 'Pole C - Rzepak' }
  ];

  const ANIMAL_OPTIONS = [
    { value: '', label: 'Brak powiązania' },
    { value: 'cattle', label: 'Bydło' },
    { value: 'pigs', label: 'Świnie' },
    { value: 'poultry', label: 'Drób' }
  ];

  const MACHINE_OPTIONS = [
    { value: '', label: 'Brak powiązania' },
    { value: 'tractor1', label: 'Ciągnik URSUS 1234' },
    { value: 'tractor2', label: 'Ciągnik JOHN DEERE' },
    { value: 'combine', label: 'Kombajn zbożowy' }
  ];

  const MATERIAL_OPTIONS = [
    { value: '', label: 'Brak powiązania' },
    { value: 'seed1', label: 'Nasiona kukurydzy' },
    { value: 'seed2', label: 'Nasiona pszenicy' },
    { value: 'fertilizer1', label: 'Nawóz NPK' },
    { value: 'fertilizer2', label: 'Nawóz azotowy' }
  ];

  const PRODUCT_OPTIONS = [
    { value: '', label: 'Wybierz produkt' },
    { value: 'product1', label: 'Nasiona kukurydzy' },
    { value: 'product2', label: 'Nawóz azotowy' },
    { value: 'product3', label: 'Środek ochrony roślin' },
    { value: 'product4', label: 'Paszka dla bydła' }
  ];

  const UNIT_OPTIONS = [
    { value: 'kg', label: 'kg' },
    { value: 'l', label: 'l' },
    { value: 'szt', label: 'szt' },
    { value: 'opak', label: 'opak' }
  ];

  // Inicjalizacja formularza danymi zadania (tryb edycji)
  useEffect(() => {
    if (task) {
      const dueDate = task.dueDate ? new Date(task.dueDate.seconds * 1000).toISOString().split('T')[0] : '';
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        type: task.type || '',
        status: task.status || 'pending',
        priority: task.priority || 'normal',
        assignedTo: task.assignedTo || '',
        dueDate: dueDate,
        fieldId: task.fieldId || '',
        animalId: task.animalId || '',
        machineId: task.machineId || '',
        materialId: task.materialId || '',
        materials: task.materials || []
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMaterialChange = (index, field, value) => {
    const updatedMaterials = [...formData.materials];
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      materials: updatedMaterials
    }));
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { productId: '', quantity: '', unit: 'kg' }]
    }));
  };

  const removeMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  // W funkcji handleSubmit w TaskModal.jsx zaktualizuj końcówkę:
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    if (!formData.title.trim()) {
      throw new Error('Tytuł jest wymagany');
    }

    if (task) {
      await updateTask(task.id, formData);
    } else {
      await addTask(formData);
    }
    
    // Modal zamknie się automatycznie po udanej operacji
    // a lista zadań odświeży się przez aktualizację stanu w hooku
    onClose();
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{task ? 'Edytuj Zadanie' : 'Nowe Zadanie'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label>Tytuł *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Np. Siew kukurydzy - Pole A"
            />
          </div>

          <div className="form-group">
            <label>Opis</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Szczegółowy opis zadania..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Typ zadania</label>
              <CustomSelect
                value={formData.type}
                onChange={(value) => handleSelectChange('type', value)}
                options={TASK_TYPES}
                placeholder="Wybierz typ zadania"
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <CustomSelect
                value={formData.status}
                onChange={(value) => handleSelectChange('status', value)}
                options={TASK_STATUS}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priorytet</label>
              <CustomSelect
                value={formData.priority}
                onChange={(value) => handleSelectChange('priority', value)}
                options={PRIORITIES}
              />
            </div>

            <div className="form-group">
              <label>Termin wykonania</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Przypisane do</label>
            <input
              type="text"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              placeholder="Imię i nazwisko wykonawcy"
            />
          </div>

          <div className="form-section">
            <h3>Powiązania</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Pole</label>
                <CustomSelect
                  value={formData.fieldId}
                  onChange={(value) => handleSelectChange('fieldId', value)}
                  options={FIELD_OPTIONS}
                />
              </div>

              <div className="form-group">
                <label>Zwierze/Grupa</label>
                <CustomSelect
                  value={formData.animalId}
                  onChange={(value) => handleSelectChange('animalId', value)}
                  options={ANIMAL_OPTIONS}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Maszyna</label>
                <CustomSelect
                  value={formData.machineId}
                  onChange={(value) => handleSelectChange('machineId', value)}
                  options={MACHINE_OPTIONS}
                />
              </div>

              <div className="form-group">
                <label>Materiał</label>
                <CustomSelect
                  value={formData.materialId}
                  onChange={(value) => handleSelectChange('materialId', value)}
                  options={MATERIAL_OPTIONS}
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>Materiały do zużycia</h3>
              <button type="button" onClick={addMaterial} className="btn-secondary">
                + Dodaj materiał
              </button>
            </div>
            
            {formData.materials.map((material, index) => (
              <div key={index} className="material-row">
                <CustomSelect
                  value={material.productId}
                  onChange={(value) => handleMaterialChange(index, 'productId', value)}
                  options={PRODUCT_OPTIONS}
                  className="material-select"
                />
                
                <input
                  type="number"
                  value={material.quantity}
                  onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)}
                  placeholder="Ilość"
                  className="material-quantity"
                />
                
                <CustomSelect
                  value={material.unit}
                  onChange={(value) => handleMaterialChange(index, 'unit', value)}
                  options={UNIT_OPTIONS}
                  className="material-unit"
                />
                
                <button 
                  type="button" 
                  onClick={() => removeMaterial(index)}
                  className="remove-button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="btn-cancel"
            >
              Anuluj
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-save"
            >
              {loading ? 'Zapisywanie...' : (task ? 'Zapisz zmiany' : 'Utwórz zadanie')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;