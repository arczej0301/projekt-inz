<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { garageService } from '../../services/garageService';
import './GaragePage.css';

const GaragePage = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [showRepairHistory, setShowRepairHistory] = useState(false);
  const [currentRepairMachine, setCurrentRepairMachine] = useState(null);

  // Stany dla custom selectów
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isFuelTypeOpen, setIsFuelTypeOpen] = useState(false);
  const [isFilterStatusOpen, setIsFilterStatusOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    serialNumber: '',
    status: 'active',
    lastService: '',
    nextService: '',
    serviceInterval: 12,
    notes: '',
    fuelType: 'diesel',
    power: '',
    purchaseDate: '',
    purchasePrice: 0,
    currentValue: 0
  });

  // Stan dla formularza naprawy
  const [repairForm, setRepairForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: '',
    parts: '',
    mechanic: '',
    nextServiceDate: ''
  });

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      setLoading(true);
      const data = await garageService.getAllMachines();
      setMachines(data);
    } catch (error) {
      console.error('Błąd ładowania maszyn:', error);
      alert('Błąd podczas ładowania danych garażu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'serviceInterval' || name === 'purchasePrice' || name === 'currentValue'
        ? (value === '' ? '' : parseFloat(value))
        : value
    }));
  };

  // POPRAWIONE: Funkcja do custom select
  const handleCustomSelect = (field, value) => {
    console.log('Setting', field, 'to:', value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Zamknij odpowiedni select
    if (field === 'category') setIsCategoryOpen(false);
    if (field === 'status') setIsStatusOpen(false);
    if (field === 'fuelType') setIsFuelTypeOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await garageService.updateMachine(editingId, formData);
      } else {
        await garageService.addMachine(formData);
      }
      resetForm();
      loadMachines();
    } catch (error) {
      console.error('Błąd zapisu:', error);
      alert('Błąd podczas zapisywania maszyny');
    }
  };

  const handleEdit = (machine) => {
    console.log('Editing machine:', machine);
    setFormData({
      name: machine.name || '',
      category: machine.category || '',
      brand: machine.brand || '',
      model: machine.model || '',
      year: machine.year || new Date().getFullYear(),
      serialNumber: machine.serialNumber || '',
      status: machine.status || 'active',
      lastService: machine.lastService || '',
      nextService: machine.nextService || '',
      serviceInterval: machine.serviceInterval || 12,
      notes: machine.notes || '',
      fuelType: machine.fuelType || 'diesel',
      power: machine.power || '',
      purchaseDate: machine.purchaseDate || '',
      purchasePrice: machine.purchasePrice || 0,
      currentValue: machine.currentValue || 0
    });
    setEditingId(machine.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę maszynę?')) {
      try {
        await garageService.deleteMachine(id);
        loadMachines();
        if (selectedMachine?.id === id) {
          setSelectedMachine(null);
        }
      } catch (error) {
        console.error('Błąd usuwania:', error);
        alert('Błąd podczas usuwania maszyny');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      serialNumber: '',
      status: 'active',
      lastService: '',
      nextService: '',
      serviceInterval: 12,
      notes: '',
      fuelType: 'diesel',
      power: '',
      purchaseDate: '',
      purchasePrice: 0,
      currentValue: 0
    });
    setEditingId(null);
    setShowForm(false);
    setIsCategoryOpen(false);
    setIsStatusOpen(false);
    setIsFuelTypeOpen(false);
  };

  // Funkcje do zarządzania historią napraw
  const openRepairHistory = (machine) => {
    setCurrentRepairMachine(machine);
    setShowRepairHistory(true);
  };

  const closeRepairHistory = () => {
    setShowRepairHistory(false);
    setCurrentRepairMachine(null);
    setRepairForm({
      date: new Date().toISOString().split('T')[0],
      description: '',
      cost: '',
      parts: '',
      mechanic: '',
      nextServiceDate: ''
    });
  };

  const handleRepairSubmit = async (e) => {
    e.preventDefault();
    if (!currentRepairMachine) return;

    try {
      const repairData = {
        ...repairForm,
        machineId: currentRepairMachine.id,
        cost: parseFloat(repairForm.cost) || 0,
        createdAt: new Date()
      };

      if (repairForm.nextServiceDate) {
        await garageService.updateMachine(currentRepairMachine.id, {
          ...currentRepairMachine,
          lastService: repairForm.date,
          nextService: repairForm.nextServiceDate
        });
      }

      alert('Naprawa została zapisana!');
      closeRepairHistory();
      loadMachines();
    } catch (error) {
      console.error('Błąd zapisu naprawy:', error);
      alert('Błąd podczas zapisywania naprawy');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'maintenance': return 'status-maintenance';
      case 'broken': return 'status-broken';
      case 'sold': return 'status-sold';
      default: return 'status-default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Sprawny';
      case 'maintenance': return 'W serwisie';
      case 'broken': return 'Awaria';
      case 'sold': return 'Sprzedany';
      default: return status;
    }
  };

  // Opcje dla custom selectów
  const categoryOptions = [
    { value: '', label: 'Wybierz kategorię' },
    { value: 'tractor', label: 'Ciągnik' },
    { value: 'harvester', label: 'Kombajn' },
    { value: 'plow', label: 'Pług' },
    { value: 'seeder', label: 'Siewnik' },
    { value: 'sprayer', label: 'Opryskiwacz' },
    { value: 'trailer', label: 'Przyczepa' },
    { value: 'truck', label: 'Samochód' },
    { value: 'other', label: 'Inne' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Sprawny' },
    { value: 'maintenance', label: 'W serwisie' },
    { value: 'broken', label: 'Awaria' },
    { value: 'sold', label: 'Sprzedany' }
  ];

  const fuelTypeOptions = [
    { value: 'diesel', label: 'Diesel' },
    { value: 'petrol', label: 'Benzyna' },
    { value: 'electric', label: 'Elektryczny' },
    { value: 'lpg', label: 'LPG' },
    { value: 'hybrid', label: 'Hybryda' }
  ];

  // Funkcje pomocnicze do wyświetlania aktualnych wartości
  const getCurrentCategoryLabel = () => {
    const option = categoryOptions.find(opt => opt.value === (formData?.category || ''));
    return option ? option.label : 'Wybierz kategorię';
  };

  const getCurrentStatusLabel = () => {
    const option = statusOptions.find(opt => opt.value === (formData?.status || 'active'));
    return option ? option.label : 'Sprawny';
  };

  const getCurrentFuelTypeLabel = () => {
    const option = fuelTypeOptions.find(opt => opt.value === (formData?.fuelType || 'diesel'));
    return option ? option.label : 'Diesel';
  };

  const filteredMachines = machines.filter(machine => {
    const matchesSearch = machine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.model?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || machine.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const machinesNeedingService = machines.filter(machine => {
    if (!machine.nextService) return false;
    const nextServiceDate = new Date(machine.nextService);
    return nextServiceDate <= new Date() && machine.status !== 'sold';
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Ładowanie danych garażu...</p>
      </div>
    );
  }

  const getCurrentFilterStatusLabel = () => {
    const options = {
      'all': 'Wszystkie statusy',
      'active': 'Sprawne',
      'maintenance': 'W serwisie',
      'broken': 'Awaria',
      'sold': 'Sprzedane'
    };
    return options[filterStatus] || 'Wszystkie statusy';
  };

  // Dodaj tę funkcję do obsługi zmiany filtra
  const handleFilterStatusChange = (value) => {
    console.log('Changing filter to:', value);
    setFilterStatus(value);
    setIsFilterStatusOpen(false);
  };

  return (
     <div className="garage-page">
      <div className="garage-content">
        <div className="garage-header">
          <h2>Garaż maszyn</h2>
      </div>

        <div className="actions-bar">
          <div className="action-buttons">
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <i className="fas fa-plus"></i> Dodaj maszynę
            </button>
          </div>
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Szukaj maszyny..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Statystyki */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fas fa-tractor"></i>
            </div>
            <div className="stat-content">
              <h3>Wszystkie maszyny</h3>
              <p className="stat-value">{machines.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon warning">
              <i className="fas fa-tools"></i>
            </div>
            <div className="stat-content">
              <h3>Wymagają przeglądu</h3>
              <p className="stat-value warning">{machinesNeedingService.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon success">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <h3>Sprawne</h3>
              <p className="stat-value success">
                {machines.filter(m => m.status === 'active').length}
              </p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon danger">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className="stat-content">
              <h3>W serwisie</h3>
              <p className="stat-value danger">
                {machines.filter(m => m.status === 'maintenance').length}
              </p>
            </div>
          </div>
        </div>

        {/* Lista maszyn */}
        <div className="machines-list">
          <div className="list-header">
            <h3>Lista maszyn ({filteredMachines.length})</h3>
            <div className="filter-controls">
              <div className="custom-select">
                <div
                  className={`select-header ${isFilterStatusOpen ? 'open' : ''}`}
                  onClick={() => setIsFilterStatusOpen(!isFilterStatusOpen)}
                >
                  {getCurrentFilterStatusLabel()}
                  <span className="arrow">▼</span>
                </div>
                {isFilterStatusOpen && (
                  <div className="select-options">
                    <div
                      className={`select-option ${filterStatus === 'all' ? 'selected' : ''}`}
                      onClick={() => handleFilterStatusChange('all')}
                    >
                      Wszystkie statusy
                    </div>
                    <div
                      className={`select-option ${filterStatus === 'active' ? 'selected' : ''}`}
                      onClick={() => handleFilterStatusChange('active')}
                    >
                      Sprawne
                    </div>
                    <div
                      className={`select-option ${filterStatus === 'maintenance' ? 'selected' : ''}`}
                      onClick={() => handleFilterStatusChange('maintenance')}
                    >
                      W serwisie
                    </div>
                    <div
                      className={`select-option ${filterStatus === 'broken' ? 'selected' : ''}`}
                      onClick={() => handleFilterStatusChange('broken')}
                    >
                      Awaria
                    </div>
                    <div
                      className={`select-option ${filterStatus === 'sold' ? 'selected' : ''}`}
                      onClick={() => handleFilterStatusChange('sold')}
                    >
                      Sprzedane
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {filteredMachines.length === 0 ? (
            <div className="no-machines">
              <p>Brak maszyn do wyświetlenia</p>
            </div>
          ) : (
            <table className="machines-table">
              <thead>
                <tr>
                  <th>Nazwa</th>
                  <th>Kategoria</th>
                  <th>Marka/Model</th>
                  <th>Status</th>
                  <th>Następny przegląd</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
  {filteredMachines.map((machine) => {
    const needsService = machine.nextService && new Date(machine.nextService) <= new Date();
    
    return (
      <tr 
        key={machine.id}
        className={`machine-row ${
          selectedMachine?.id === machine.id ? 'selected' : ''
        } ${
          needsService && machine.status !== 'sold' ? 'needs-service' : ''
        }`}
        onClick={() => setSelectedMachine(machine)}
      >
        <td>
          <div className="machine-name">
            <strong>{machine.name}</strong>
            <div className="machine-details">
              Rok: {machine.year} {machine.power && `• ${machine.power} KM`}
            </div>
          </div>
        </td>
        <td>{categoryOptions.find(opt => opt.value === machine.category)?.label || machine.category}</td>
        <td>
          <div className="brand-model">
            <div>{machine.brand}</div>
            <div className="model">{machine.model}</div>
          </div>
        </td>
        <td>
          <span className={`status-badge ${getStatusColor(machine.status)}`}>
            {getStatusText(machine.status)}
          </span>
        </td>
        <td>
          <div className="service-info">
            {machine.nextService ? new Date(machine.nextService).toLocaleDateString('pl-PL') : 'Brak danych'}
            {needsService && machine.status !== 'sold' && (
              <div className="service-warning">
                <i className="fas fa-exclamation-circle"></i> Wymaga przeglądu!
              </div>
            )}
          </div>
        </td>
        <td className="action-buttons">
          <button 
            className="action-btn btn-primary" 
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(machine);
            }}
          >
            <i className="fas fa-edit"></i> Edytuj
          </button>
          <button 
            className="action-btn btn-warning" 
            onClick={(e) => {
              e.stopPropagation();
              openRepairHistory(machine);
            }}
          >
            <i className="fas fa-tools"></i> Naprawa
          </button>
          <button 
            className="action-btn btn-danger" 
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(machine.id);
            }}
          >
            <i className="fas fa-trash"></i> Usuń
          </button>
        </td>
      </tr>
    );
  })}
</tbody>
            </table>
          )}
        </div>
      </div>


      {/* Modal dodawania/edycji maszyny */}
      {showForm && (
        <MachineModal
          formData={formData}
          onFormDataChange={setFormData}
          onSave={handleSubmit}
          onClose={resetForm}
          editingId={editingId}
          isCategoryOpen={isCategoryOpen}
          setIsCategoryOpen={setIsCategoryOpen}
          isStatusOpen={isStatusOpen}
          setIsStatusOpen={setIsStatusOpen}
          isFuelTypeOpen={isFuelTypeOpen}
          setIsFuelTypeOpen={setIsFuelTypeOpen}
          handleCustomSelect={handleCustomSelect}
          getCurrentCategoryLabel={getCurrentCategoryLabel}
          getCurrentStatusLabel={getCurrentStatusLabel}
          getCurrentFuelTypeLabel={getCurrentFuelTypeLabel}
          categoryOptions={categoryOptions}
          statusOptions={statusOptions}
          fuelTypeOptions={fuelTypeOptions}
        />
      )}

      {/* Modal historii napraw */}
      {showRepairHistory && currentRepairMachine && (
        <RepairHistoryModal
          machine={currentRepairMachine}
          repairForm={repairForm}
          onRepairFormChange={setRepairForm}
          onSave={handleRepairSubmit}
          onClose={closeRepairHistory}
        />
      )}
    </div>
  );
};

// Komponent modala dla maszyny
const MachineModal = ({
  formData,
  onFormDataChange,
  onSave,
  onClose,
  editingId,
  isCategoryOpen,
  setIsCategoryOpen,
  isStatusOpen,
  setIsStatusOpen,
  isFuelTypeOpen,
  setIsFuelTypeOpen,
  handleCustomSelect,
  getCurrentCategoryLabel,
  getCurrentStatusLabel,
  getCurrentFuelTypeLabel,
  categoryOptions,
  statusOptions,
  fuelTypeOptions
}) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFormDataChange(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'serviceInterval' || name === 'purchasePrice' || name === 'currentValue'
        ? (value === '' ? '' : parseFloat(value))
        : value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingId ? 'Edytuj maszynę' : 'Dodaj nową maszynę'}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="machineName">Nazwa maszyny *</label>
                <input
                  type="text"
                  id="machineName"
                  name="name"
                  value={formData?.name || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Custom Select dla kategorii */}
              <div className="form-group">
                <label>Kategoria</label>
                <div className="custom-select">
                  <div
                    className={`select-header ${isCategoryOpen ? 'open' : ''}`}
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  >
                    {getCurrentCategoryLabel()}
                    <span className="arrow">▼</span>
                  </div>
                  {isCategoryOpen && (
                    <div className="select-options">
                      {categoryOptions.map(option => (
                        <div
                          key={option.value}
                          className={`select-option ${formData?.category === option.value ? 'selected' : ''}`}
                          onClick={() => handleCustomSelect('category', option.value)}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Select dla statusu */}
              <div className="form-group">
                <label>Status</label>
                <div className="custom-select">
                  <div
                    className={`select-header ${isStatusOpen ? 'open' : ''}`}
                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                  >
                    {getCurrentStatusLabel()}
                    <span className="arrow">▼</span>
                  </div>
                  {isStatusOpen && (
                    <div className="select-options">
                      {statusOptions.map(option => (
                        <div
                          key={option.value}
                          className={`select-option ${formData?.status === option.value ? 'selected' : ''}`}
                          onClick={() => handleCustomSelect('status', option.value)}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="machineBrand">Marka</label>
                <input
                  type="text"
                  id="machineBrand"
                  name="brand"
                  value={formData?.brand || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="machineModel">Model</label>
                <input
                  type="text"
                  id="machineModel"
                  name="model"
                  value={formData?.model || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="machineYear">Rok produkcji</label>
                <input
                  type="number"
                  id="machineYear"
                  name="year"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData?.year || ''}
                  onChange={handleInputChange}
                />
              </div>

              {/* Custom Select dla typu paliwa */}
              <div className="form-group">
                <label>Typ paliwa</label>
                <div className="custom-select">
                  <div
                    className={`select-header ${isFuelTypeOpen ? 'open' : ''}`}
                    onClick={() => setIsFuelTypeOpen(!isFuelTypeOpen)}
                  >
                    {getCurrentFuelTypeLabel()}
                    <span className="arrow">▼</span>
                  </div>
                  {isFuelTypeOpen && (
                    <div className="select-options">
                      {fuelTypeOptions.map(option => (
                        <div
                          key={option.value}
                          className={`select-option ${formData?.fuelType === option.value ? 'selected' : ''}`}
                          onClick={() => handleCustomSelect('fuelType', option.value)}
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="lastService">Ostatni przegląd</label>
                <input
                  type="date"
                  id="lastService"
                  name="lastService"
                  value={formData?.lastService || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="nextService">Następny przegląd</label>
                <input
                  type="date"
                  id="nextService"
                  name="nextService"
                  value={formData?.nextService || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="serviceInterval">Interwał przeglądu (mies.)</label>
                <input
                  type="number"
                  id="serviceInterval"
                  name="serviceInterval"
                  min="1"
                  value={formData?.serviceInterval || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="machineNotes">Notatki</label>
              <textarea
                id="machineNotes"
                name="notes"
                value={formData?.notes || ''}
                onChange={handleInputChange}
                rows="3"
                placeholder="Dodatkowe informacje o maszynie..."
              />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            {editingId ? 'Zaktualizuj' : 'Dodaj maszynę'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Komponent modala dla napraw
const RepairHistoryModal = ({ machine, repairForm, onRepairFormChange, onSave, onClose }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onRepairFormChange(prev => ({
      ...prev,
      [name]: name === 'cost' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Dodaj naprawę - {machine.name}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="repairDate">Data naprawy *</label>
                <input
                  type="date"
                  id="repairDate"
                  name="date"
                  value={repairForm.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="repairCost">Koszt (zł)</label>
                <input
                  type="number"
                  id="repairCost"
                  name="cost"
                  step="0.01"
                  value={repairForm.cost}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="nextServiceDate">Następny przegląd</label>
                <input
                  type="date"
                  id="nextServiceDate"
                  name="nextServiceDate"
                  value={repairForm.nextServiceDate}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="mechanic">Mechanik</label>
                <input
                  type="text"
                  id="mechanic"
                  name="mechanic"
                  value={repairForm.mechanic}
                  onChange={handleInputChange}
                  placeholder="Imię i nazwisko mechanika"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="repairDescription">Opis naprawy *</label>
              <textarea
                id="repairDescription"
                name="description"
                value={repairForm.description}
                onChange={handleInputChange}
                rows="3"
                placeholder="Szczegółowy opis wykonanych prac..."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="repairParts">Wymienione części</label>
              <textarea
                id="repairParts"
                name="parts"
                value={repairForm.parts}
                onChange={handleInputChange}
                rows="2"
                placeholder="Lista wymienionych części..."
              />
            </div>
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Zapisz naprawę
          </button>
        </div>
      </div>
    </div>
  );
};

export default GaragePage;
=======
// components/pages/GaragePage.jsx
import { useState } from 'react'
import { useGarage } from '../../hooks/useGarage'
import MachineModal from './MachineModal'
import RepairModal from './RepairModal'
import RepairHistory from './RepairHistory'
import './GaragePage.css'

function GaragePage() {
  const [selectedMachine, setSelectedMachine] = useState(null)
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false)
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false)
  const [viewRepairHistory, setViewRepairHistory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { 
    machines, 
    loading, 
    error,
    addMachine,
    updateMachine,
    deleteMachine,
    addRepair,
    deleteRepair
  } = useGarage()

  const filteredMachines = machines.filter(machine =>
    machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    machine.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'sprawna': return '#4caf50'
      case 'do_naprawy': return '#ff9800'
      case 'zepsuta': return '#f44336'
      default: return '#9e9e9e'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'sprawna': return 'Sprawna'
      case 'do_naprawy': return 'Do naprawy'
      case 'zepsuta': return 'Zepsuta'
      default: return 'Nieznany'
    }
  }

  const calculateTotalRepairCosts = (machine) => {
    if (!machine.repairs) return 0
    return machine.repairs.reduce((total, repair) => total + (repair.cost || 0), 0)
  }

  const handleAddMachine = () => {
    setSelectedMachine(null)
    setIsMachineModalOpen(true)
  }

  const handleEditMachine = (machine) => {
    setSelectedMachine(machine)
    setIsMachineModalOpen(true)
  }

  const handleAddRepair = (machine) => {
    setSelectedMachine(machine)
    setIsRepairModalOpen(true)
  }

  const handleViewRepairs = (machine) => {
    setViewRepairHistory(machine)
  }

  const handleSaveMachine = async (machineData, imageFile) => {
    if (selectedMachine) {
      const result = await updateMachine(selectedMachine.id, machineData, imageFile)
      if (result.success) {
        setIsMachineModalOpen(false)
        setSelectedMachine(null)
      } else {
        alert(`Błąd: ${result.error}`)
      }
    } else {
      const result = await addMachine(machineData, imageFile)
      if (result.success) {
        setIsMachineModalOpen(false)
      } else {
        alert(`Błąd: ${result.error}`)
      }
    }
  }

  const handleSaveRepair = async (repairData) => {
    if (selectedMachine) {
      const result = await addRepair(selectedMachine.id, repairData)
      if (result.success) {
        setIsRepairModalOpen(false)
        setSelectedMachine(null)
      } else {
        alert(`Błąd: ${result.error}`)
      }
    }
  }

  const handleDeleteMachine = async (machine) => {
    if (window.confirm(`Czy na pewno chcesz usunąć maszynę "${machine.name}"?`)) {
      const result = await deleteMachine(machine.id, machine.imageUrl)
      if (!result.success) {
        alert(`Błąd: ${result.error}`)
      }
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Ładowanie danych garażu...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>❌ Błąd</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Odśwież stronę</button>
      </div>
    )
  }

  return (
    <div className="garage-page">
      <div className="garage-header">
        <h2>🚜 Garaż Maszyn</h2>
        <p>Zarządzanie maszynami i pojazdami w gospodarstwie</p>
      </div>

      <div className="garage-stats">
        <div className="stat-card">
          <div className="stat-icon">🚜</div>
          <div className="stat-info">
            <h3>Łączna liczba maszyn</h3>
            <p>{machines.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <h3>Wymagają naprawy</h3>
            <p>{machines.filter(m => m.status === 'do_naprawy').length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Łączny koszt napraw</h3>
            <p>{machines.reduce((total, machine) => total + calculateTotalRepairCosts(machine), 0).toFixed(2)} zł</p>
          </div>
        </div>
      </div>

      <div className="garage-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Szukaj maszyny, marki, typu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        <button className="btn-primary" onClick={handleAddMachine}>
          + Dodaj maszynę
        </button>
      </div>

      <div className="machines-grid">
        {filteredMachines.map(machine => (
          <div key={machine.id} className="machine-card">
            <div className="machine-image">
              {machine.imageUrl ? (
                <img src={machine.imageUrl} alt={machine.name} />
              ) : (
                <div className="no-image">🚜</div>
              )}
              <div 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(machine.status) }}
              >
                {getStatusText(machine.status)}
              </div>
            </div>

            <div className="machine-info">
              <h3>{machine.name}</h3>
              <div className="machine-details">
                <div className="detail-item">
                  <span className="label">Marka:</span>
                  <span className="value">{machine.brand}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Typ:</span>
                  <span className="value">{machine.type}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Rok prod.:</span>
                  <span className="value">{machine.year}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Numer rej.:</span>
                  <span className="value">{machine.registration || 'Brak'}</span>
                </div>
                {machine.lastService && (
                  <div className="detail-item">
                    <span className="label">Ostatni serwis:</span>
                    <span className="value">
                      {machine.lastService.toDate ? 
                        machine.lastService.toDate().toLocaleDateString('pl-PL') : 
                        machine.lastService
                      }
                    </span>
                  </div>
                )}
              </div>

              <div className="repair-summary">
                <div className="repair-count">
                  Liczba napraw: {machine.repairs?.length || 0}
                </div>
                <div className="repair-cost">
                  Koszt napraw: {calculateTotalRepairCosts(machine).toFixed(2)} zł
                </div>
              </div>
            </div>

            <div className="machine-actions">
              <button 
                className="btn-primary"
                onClick={() => handleEditMachine(machine)}
              >
                Edytuj
              </button>
              <button 
                className="btn-secondary"
                onClick={() => handleAddRepair(machine)}
              >
                Dodaj naprawę
              </button>
              <button 
                className="btn-info"
                onClick={() => handleViewRepairs(machine)}
              >
                Historia
              </button>
              <button 
                className="btn-danger"
                onClick={() => handleDeleteMachine(machine)}
              >
                Usuń
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMachines.length === 0 && (
        <div className="no-machines">
          <p>🚜 Brak maszyn w garażu</p>
          <button className="btn-primary" onClick={handleAddMachine}>
            Dodaj pierwszą maszynę
          </button>
        </div>
      )}

      {isMachineModalOpen && (
        <MachineModal
          machine={selectedMachine}
          onSave={handleSaveMachine}
          onClose={() => {
            setIsMachineModalOpen(false)
            setSelectedMachine(null)
          }}
        />
      )}

      {isRepairModalOpen && selectedMachine && (
        <RepairModal
          machine={selectedMachine}
          onSave={handleSaveRepair}
          onClose={() => {
            setIsRepairModalOpen(false)
            setSelectedMachine(null)
          }}
        />
      )}

      {viewRepairHistory && (
        <RepairHistory
          machine={viewRepairHistory}
          onClose={() => setViewRepairHistory(null)}
          onDeleteRepair={deleteRepair}
        />
      )}
    </div>
  )
}

export default GaragePage
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
