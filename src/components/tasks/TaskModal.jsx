// src/components/TaskModal.jsx - POPRAWIONA WERSJA (SPÓJNE ETYKIETY)
import React, { useState, useEffect } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../hooks/useAuth';
import CustomSelect from '../common/CustomSelect';
import './TaskModal.css';


const TaskModal = ({ task, onClose, TASK_TYPES, TASK_STATUS, PRIORITIES }) => {
  const { addTask, updateTask, fields, tractors, machines, warehouseItems } = useTasks();
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
    tractorId: '',
    machineId: '',
    materialId: '',
    materials: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const FIELD_OPTIONS = [
    { value: '', label: 'Brak powiązania' },
    ...fields.map(field => ({
      value: field.id,
      label: `${field.name || 'Pole'} ${field.area ? `(${field.area} ha)` : ''}`
    }))
  ];

  // POPRAWIONE: Używa name zamiast model
  const TRACTOR_OPTIONS = [
    { value: '', label: 'Brak powiązania' },
    ...tractors.map(tractor => ({
      value: tractor.id,
      label: tractor.name || `${tractor.brand || ''} ${tractor.model || ''}`.trim() || `Ciągnik ${tractor.id}`
    }))
  ];

  // POPRAWIONE: Używa name zamiast model
  const MACHINE_OPTIONS = [
    { value: '', label: 'Brak powiązania' },
    ...machines.map(machine => ({
      value: machine.id,
      label: machine.name || `${machine.brand || ''} ${machine.model || ''}`.trim() || `Maszyna ${machine.id}`
    }))
  ];

  const WAREHOUSE_OPTIONS = [
    { value: '', label: 'Brak powiązania' },
    ...warehouseItems.map(item => ({
      value: item.id,
      label: `${item.name || 'Produkt'} ${item.quantity ? `(${item.quantity} ${item.unit || 'szt'})` : ''}`
    }))
  ];

  const PRODUCT_OPTIONS = [
    { value: '', label: 'Wybierz produkt' },
    ...warehouseItems.map(item => ({
      value: item.id,
      label: `${item.name || 'Produkt'} - ${item.quantity || 0} ${item.unit || 'szt'}`
    }))
  ];

  const UNIT_OPTIONS = [
    { value: 'kg', label: 'kg' },
    { value: 'l', label: 'l' },
    { value: 'szt', label: 'szt' },
    { value: 'opak', label: 'opak' },
    { value: 'ha', label: 'ha' }
  ];

  useEffect(() => {
    if (task) {
      let dueDate = '';
      if (task.dueDate) {
        if (task.dueDate.toDate) {
          dueDate = task.dueDate.toDate().toISOString().split('T')[0];
        } else if (task.dueDate.seconds) {
          dueDate = new Date(task.dueDate.seconds * 1000).toISOString().split('T')[0];
        } else {
          dueDate = task.dueDate;
        }
      }
      
      setFormData({
        title: task.title || '',
        description: task.description || '',
        type: task.type || '',
        status: task.status || 'pending',
        priority: task.priority || 'normal',
        assignedTo: task.assignedTo || '',
        dueDate: dueDate,
        fieldId: task.fieldId || '',
        tractorId: task.tractorId || '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.title.trim()) {
        throw new Error('Tytuł jest wymagany');
      }

      const taskData = {
        ...formData,
        fieldId: formData.fieldId || null,
        tractorId: formData.tractorId || null,
        machineId: formData.machineId || null,
        materialId: formData.materialId || null,
      };

      if (task) {
        await updateTask(task.id, taskData);
      } else {
        await addTask(taskData);
      }
      
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
                <div className="select-info">
                  {fields.length === 0 && 'Brak pól w bazie danych'}
                </div>
              </div>

              <div className="form-group">
                <label>Ciagnik/Kombajn</label>
                <CustomSelect
                  value={formData.tractorId}
                  onChange={(value) => handleSelectChange('tractorId', value)}
                  options={TRACTOR_OPTIONS}
                />
                <div className="select-info">
                  {tractors.length === 0 ? 'Brak ciągników w garażu' : `${tractors.length} ciągników dostępnych`}
                </div>
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
                <div className="select-info">
                  {machines.length === 0 ? 'Brak maszyn w garażu' : `${machines.length} maszyn dostępnych`}
                </div>
              </div>

              <div className="form-group">
                <label>Nasiona i Nawozy</label>
                <CustomSelect
                  value={formData.materialId}
                  onChange={(value) => handleSelectChange('materialId', value)}
                  options={WAREHOUSE_OPTIONS}
                />
                <div className="select-info">
                  {warehouseItems.length === 0 ? 'Brak nasion i nawozów w magazynie' : `${warehouseItems.length} produktów dostępnych`}
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>Nasiona i nawozy do zużycia</h3>
              <button type="button" onClick={addMaterial} className="btn-secondary">
                + Dodaj produkt
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
                  min="0"
                  step="0.01"
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