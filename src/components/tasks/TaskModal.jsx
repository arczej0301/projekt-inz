import React, { useState, useEffect } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { useAuth } from '../../hooks/useAuth';
import { useFields } from '../../hooks/useFields';
import CustomSelect from '../common/CustomSelect';
import './TaskModal.css';

const TaskModal = ({ task, onClose, TASK_TYPES, TASK_STATUS, PRIORITIES }) => {
  const { addTask, updateTask, fields, tractors, machines, warehouseItems, refreshWarehouseItems } = useTasks();
  const { user } = useAuth();
  const { fieldStatuses } = useFields();
  
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
  const [productAvailability, setProductAvailability] = useState({});

  // Funkcja do tłumaczenia statusów z angielskiego na polski
  const translateFieldStatus = (status) => {
    const statusMap = {
      'sown': 'Zasiane',
      'harvested': 'Zebrane',
      'ready_for_sowing': 'Przygotowane do siewu',
      'fallow': 'Ugór',
      'pasture': 'Pastwisko/Łąka',
      // Domyślne wartości
      'Brak statusu': 'Brak statusu'
    };
    
    if (!status) return 'Brak statusu';
    
    // Sprawdź czy status jest już po polsku (zaczyna się od dużej litery)
    if (status.charAt(0) === status.charAt(0).toUpperCase() && status.charAt(0) !== status.charAt(0).toLowerCase()) {
      return status; // Już jest po polsku
    }
    
    const lowerStatus = status.toLowerCase();
    
    // Przekształć podkreślenia na spacje i zrób pierwszą literę dużą
    if (statusMap[lowerStatus]) {
      return statusMap[lowerStatus];
    }
    
    // Jeśli nie ma w mapie, spróbuj sformatować
    const formatted = status
      .toLowerCase()
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return formatted || 'Brak statusu';
  };

  // Funkcja do formatowania nazwy uprawy
  const formatCropName = (crop) => {
    if (!crop) return 'Brak uprawy';
    
    // Jeśli uprawa jest już po polsku (z dużej litery), zostaw jak jest
    if (crop.charAt(0) === crop.charAt(0).toUpperCase() && crop.charAt(0) !== crop.charAt(0).toLowerCase()) {
      return crop;
    }
    
    // Tłumaczenie popularnych upraw z angielskiego na polski
    const cropTranslations = {
      'wheat': 'Pszenica',
      'corn': 'Kukurydza',
      'barley': 'Jęczmień',
      'rye': 'Żyto',
      'oats': 'Owies',
      'rapeseed': 'Rzepak',
      'sunflower': 'Słonecznik',
      'potato': 'Ziemniak',
      'sugar_beet': 'Burak cukrowy',
      'grass': 'Trawa',
      'clover': 'Koniczyna',
      'alfalfa': 'Lucerna'
    };
    
    const lowerCrop = crop.toLowerCase();
    if (cropTranslations[lowerCrop]) {
      return cropTranslations[lowerCrop];
    }
    
    // Dla innych upraw - zrób pierwszą literę dużą
    return crop.charAt(0).toUpperCase() + crop.slice(1);
  };

  // Funkcja do sortowania pól alfabetycznie
  const sortFieldsAlphabetically = (fieldsArray) => {
    return [...fieldsArray].sort((a, b) => {
      // Pobierz nazwy pól (domyślnie pusty string jeśli brak)
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      
      // Sortuj alfabetycznie
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  };

  // Posortuj pola alfabetycznie
  const sortedFields = sortFieldsAlphabetically(fields);

  // ZMIENIONO: Użyj posortowanych pól i dodaj uprawę zamiast "Stan"
  const FIELD_OPTIONS = [
    { value: '', label: 'Brak powiązania' },
    ...sortedFields.map(field => {
      // Znajdź status dla tego pola
      const status = fieldStatuses[field.id];
      const rawStatus = status?.status || 'Brak statusu';
      const translatedStatus = translateFieldStatus(rawStatus);
      
      // Pobierz uprawę z pola (zakładając, że pole ma pole 'crop')
      const crop = field.crop || 'Brak uprawy';
      const formattedCrop = formatCropName(crop);
      
      return {
        value: field.id,
        label: `${field.name || 'Pole'} ${field.area ? `(${field.area} ha)` : ''} - ${formattedCrop}: ${translatedStatus}`
      };
    })
  ];

  // ... reszta kodu pozostaje bez zmian
  const TRACTOR_OPTIONS = [
    { value: '', label: 'Brak powiązania' },
    ...tractors.map(tractor => ({
      value: tractor.id,
      label: tractor.name || `${tractor.brand || ''} ${tractor.model || ''}`.trim() || `Ciągnik ${tractor.id}`
    }))
  ];

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

  // DODAJ FUNKCJĘ removeMaterial
  const removeMaterial = (index) => {
    const updatedMaterials = [...formData.materials];
    updatedMaterials.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      materials: updatedMaterials
    }));
  };

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
    
    setTimeout(() => {
      checkProductAvailability();
    }, 100);
  };

  const addMaterial = async () => {
    await refreshWarehouseItems();
    
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { productId: '', quantity: '', unit: 'kg' }]
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

      const isAvailable = checkProductAvailability();
      if (!isAvailable) {
        const unavailableItems = Object.entries(productAvailability)
          .filter(([_, info]) => !info.isAvailable)
          .map(([index, info]) => `${info.productName} (dostępne: ${info.available} ${info.unit}, wymagane: ${info.requested} ${info.unit})`)
          .join(', ');
        
        throw new Error(`Niewystarczająca ilość produktów: ${unavailableItems}`);
      }

      const taskData = {
        ...formData,
        fieldId: formData.fieldId || null,
        tractorId: formData.tractorId || null,
        machineId: formData.machineId || null,
        materialId: formData.materialId || null,
        materials: formData.materials.filter(m => m.productId && m.quantity)
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
                  {fields.length > 0 && `Pola posortowane alfabetycznie (${fields.length} dostępnych)`}
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
            
            {formData.materials.map((material, index) => {
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