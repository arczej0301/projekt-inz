import React, { useState, useEffect } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../hooks/useAuth';
import CustomSelect from '../common/CustomSelect';
import './TaskModal.css';

const TaskModal = ({ task, onClose, TASK_TYPES, TASK_STATUS, PRIORITIES }) => {
  const { addTask, updateTask, fields, tractors, machines, warehouseItems, refreshWarehouseItems } = useTasks();
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
  const [productAvailability, setProductAvailability] = useState({}); // Nowy stan dla dostępności

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

  // NOWA FUNKCJA: Sprawdź dostępność produktów
  const checkProductAvailability = () => {
    const availability = {};
    
    formData.materials.forEach((material, index) => {
      if (material.productId && material.quantity) {
        const product = warehouseItems.find(item => item.id === material.productId);
        if (product) {
          const availableQty = parseFloat(product.quantity || 0);
          const requestedQty = parseFloat(material.quantity);
          const unit = material.unit || product.unit;
          
          availability[index] = {
            available: availableQty,
            requested: requestedQty,
            isAvailable: requestedQty <= availableQty,
            unit: unit,
            productName: product.name
          };
        }
      }
    });
    
    setProductAvailability(availability);
    return Object.values(availability).every(item => item.isAvailable);
  };

  // ZMODYFIKOWANA FUNKCJA: Sprawdzaj dostępność przy każdej zmianie materiałów
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
    
    // Sprawdź dostępność po krótkim opóźnieniu
    setTimeout(() => {
      checkProductAvailability();
    }, 100);
  };

  // ZMODYFIKOWANA FUNKCJA: Przy dodawaniu materiału odśwież magazyn
  const addMaterial = async () => {
    // Odśwież listę produktów przed dodaniem nowego materiału
    await refreshWarehouseItems();
    
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { productId: '', quantity: '', unit: 'kg' }]
    }));
  };

  // ZMODYFIKOWANA FUNKCJA handleSubmit: dodaj walidację magazynu
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Walidacja podstawowa
      if (!formData.title.trim()) {
        throw new Error('Tytuł jest wymagany');
      }

      // Walidacja dostępności materiałów
      const isAvailable = checkProductAvailability();
      if (!isAvailable) {
        const unavailableItems = Object.entries(productAvailability)
          .filter(([_, info]) => !info.isAvailable)
          .map(([index, info]) => `${info.productName} (dostępne: ${info.available} ${info.unit}, wymagane: ${info.requested} ${info.unit})`)
          .join(', ');
        
        throw new Error(`Niewystarczająca ilość produktów: ${unavailableItems}`);
      }

      // Przygotuj dane zadania
      const taskData = {
        ...formData,
        fieldId: formData.fieldId || null,
        tractorId: formData.tractorId || null,
        machineId: formData.machineId || null,
        materialId: formData.materialId || null,
        materials: formData.materials.filter(m => m.productId && m.quantity) // Filtruj puste
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

              
            </div>
          </div>

          <div className="form-section">
          <div className="section-header">
            <h3>Nasiona i nawozy do zużycia</h3>
            <button type="button" onClick={addMaterial} className="btn-secondary">
              + Dodaj produkt
            </button>
          </div>
          
          {formData.materials.map((material, index, info) => {
            const product = warehouseItems.find(item => item.id === material.productId);
            const availableQty = product ? parseFloat(product.quantity || 0) : 0;
            
            return (
              <div key={index} className="material-row">
                <div className="material-select-wrapper">
                  <CustomSelect
                    value={material.productId}
                    onChange={(value) => handleMaterialChange(index, 'productId', value)}
                    options={PRODUCT_OPTIONS}
                    className="material-select"
                  />
                  
                </div>
                
                <input
                  type="number"
                  value={material.quantity}
                  onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)}
                  placeholder="Ilość"
                  className="material-quantity"
                  min="0"
                  step="1"
                  max={availableQty}
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
            );
          })}
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