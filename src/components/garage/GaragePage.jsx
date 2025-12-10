import React, { useState, useEffect } from 'react';
import { useFinance } from '../../hooks/useFinance';
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
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [repairHistory, setRepairHistory] = useState([]);
  const [showRepairList, setShowRepairList] = useState(false);
  const [loadingRepairHistory, setLoadingRepairHistory] = useState(false);
  const { addAutoTransaction } = useFinance();
  const [createFinanceTransaction, setCreateFinanceTransaction] = useState(true);
  const [transactionType, setTransactionType] = useState('expense');

  // Stany dla custom selectów
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isFuelTypeOpen, setIsFuelTypeOpen] = useState(false);
  const [isFilterStatusOpen, setIsFilterStatusOpen] = useState(false);

  useEffect(() => {
  const shouldOpenMachineModal = localStorage.getItem('shouldOpenMachineModal');
  
  if (shouldOpenMachineModal === 'true') {
    resetForm(); 
    setShowForm(true);
    
    localStorage.removeItem('shouldOpenMachineModal');
  }
}, []); 

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
    nextServiceDate: '',
    lastService: new Date().toISOString().split('T')[0],
    serviceInterval: 12,
    changeStatusToActive: true
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
      alert('Błąd podczas ładowania danych garażu');
    } finally {
      setLoading(false);
    }
  };


  // Funkcja do ładowania historii napraw
  const loadRepairHistory = async (machineId) => {
    setLoadingRepairHistory(true);

    try {
      const history = await garageService.getRepairHistory(machineId);

      setRepairHistory(history);
      return history; // Zwróć dane

    } catch (error) {
      setRepairHistory([]);
      return [];
    } finally {
      setLoadingRepairHistory(false);
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

    // Walidacja
    if (!formData.name.trim()) {
      alert('Nazwa maszyny jest wymagana');
      return;
    }

    try {
      // 1. Zapisz maszynę do bazy
      const machineData = {
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Status domyślnie "active" dla zakupionej maszyny
        status: formData.status || 'active'
      };

      let machineId;
      if (editingId) {
        // Edycja istniejącej maszyny
        await garageService.updateMachine(editingId, machineData);
        machineId = editingId;
      } else {
        // Dodanie nowej maszyny
        const docRef = await garageService.addMachine(machineData);
        machineId = docRef.id;
      }

      // 2. AUTOMATYCZNA TRANSAKCJA FINANSOWA (TYLKO DLA NOWYCH MASZYN)
      if (!editingId && formData.purchasePrice > 0) {
        const transactionData = {
          type: 'expense', // ZMIENIONE: 'expense' zamiast 'income' - to jest KOSZT!
          category: 'maszyny', // ZMIENIONE: 'maszyny' (kategoria wydatków)
          amount: parseFloat(formData.purchasePrice),
          description: `Zakup maszyny: ${formData.name}`,
          source: 'garage',
          sourceId: machineId,
          date: formData.purchaseDate || new Date().toISOString().split('T')[0]
        };

        const result = await addAutoTransaction('expense', transactionData);

        if (result.success) {
          alert(`✅ Maszyna "${formData.name}" dodana! Dodano również do kosztów finansowych.`);
        } else {
          alert(`✅ Maszyna "${formData.name}" dodana. Błąd przy dodawaniu do finansów: ${result.error}`);
        }
      } else if (editingId) {
        alert(`✅ Maszyna "${formData.name}" zaktualizowana.`);
      } else {
        alert(`✅ Maszyna "${formData.name}" dodana (bez transakcji - brak ceny).`);
      }

      // 3. Odśwież listę i zamknij formularz
      loadMachines();
      resetForm();

    } catch (error) {
      alert('Błąd podczas zapisywania maszyny: ' + error.message);
    }
  };

  const handleEdit = (machine) => {
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

  const handleDeleteMachine = async (machineId) => {
    try {
      await deleteMachine(machineId);
      setDeleteConfirm(null);
      if (selectedMachine?.id === machineId) {
        setSelectedMachine(null);
      }
    } catch (error) {
      alert('Błąd podczas usuwania maszyny: ' + error.message);
      setDeleteConfirm(null);
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
      status: 'active', // ZMIENIONE: 'active' zamiast 'sold'
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

    // Ustaw wartości z maszyny do formularza naprawy
    setRepairForm({
      date: new Date().toISOString().split('T')[0],
      description: '',
      cost: '',
      parts: '',
      mechanic: '',
      nextServiceDate: machine.nextService || '',
      lastService: machine.lastService || new Date().toISOString().split('T')[0],
      serviceInterval: machine.serviceInterval || 12,
      changeStatusToActive: true
    });

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
      nextServiceDate: '',
      lastService: new Date().toISOString().split('T')[0],
      serviceInterval: 12,
      changeStatusToActive: true
    });
  };

  const handleRepairSubmit = async (e) => {
    e.preventDefault();
    if (!currentRepairMachine) return;

    try {
      const repairData = {
        ...repairForm,
        machineId: currentRepairMachine.id,
        machineName: currentRepairMachine.name,
        cost: parseFloat(repairForm.cost) || 0,
        serviceInterval: parseInt(repairForm.serviceInterval) || 12,
        createdAt: new Date()
      };

      // 1. Dodaj naprawę do historii
      await garageService.addRepair(repairData);

      // 2. Automatycznie dodaj do finansów (JEŚLI JEST KOSZT)
      if (repairForm.cost && repairForm.cost > 0) {
        await addAutoTransaction('expense', {
          category: 'naprawy_konserwacja', // Musi być zgodne z ID z expenseCategories
          amount: parseFloat(repairForm.cost),
          description: `Naprawa/przegląd: ${currentRepairMachine.name} - ${repairForm.description || 'Brak opisu'}`,
          source: 'garage',
          sourceId: currentRepairMachine.id
        });
      }

      // 3. Aktualizuj maszynę z nowymi danymi przeglądów
      const updateData = {
        ...currentRepairMachine,
        lastService: repairForm.lastService,
        nextService: repairForm.nextServiceDate,
        serviceInterval: repairForm.serviceInterval
      };

      // Automatyczna zmiana statusu na "sprawny" jeśli zaznaczono
      if (repairForm.changeStatusToActive) {
        updateData.status = 'active';
      }

      await garageService.updateMachine(currentRepairMachine.id, updateData);

      alert('Naprawa/przegląd został zapisany!' + (repairForm.cost > 0 ? ' Koszt dodano do finansów.' : ''));
      closeRepairHistory();
      loadMachines();
    } catch (error) {
      alert('Błąd podczas zapisywania naprawy: ' + error.message);
    }
  };
  // Nowa funkcja do sprawdzania czy maszyna wymaga przeglądu
  const checkServiceDueStatus = (nextServiceDate, status) => {
    if (!nextServiceDate || status === 'sold') return status;

    const today = new Date();
    const nextService = new Date(nextServiceDate);

    // Ustaw godzinę na 00:00:00 dla poprawnego porównania
    today.setHours(0, 0, 0, 0);
    nextService.setHours(0, 0, 0, 0);

    // Jeśli data przeglądu minęła i NIE ma już statusu "wymaga przeglądu"
    if (nextService <= today && status !== 'needs_service') {
      return 'needs_service';
    }

    return status;
  };

  // Funkcja do otwierania listy historii napraw
  const openRepairList = async (machine) => {
    setCurrentRepairMachine(machine);
    setShowRepairList(true);

    // Załaduj dane po otwarciu modala
    await loadRepairHistory(machine.id);
    setCurrentRepairMachine(machine);
    setShowRepairList(true); // NAJPIERW pokaż modal

    const history = await loadRepairHistory(machine.id);
  };

  const closeRepairList = () => {
    setShowRepairList(false);
    setCurrentRepairMachine(null);
    setRepairHistory([]);
  };

  // Zaktualizuj funkcję getStatusText
  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Sprawny';
      case 'maintenance': return 'W serwisie';
      case 'broken': return 'Awaria';
      case 'sold': return 'Sprzedany';
      case 'needs_service': return 'Wymaga przeglądu';
      default: return status;
    }
  };

  // Zaktualizuj funkcję getStatusColor
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'maintenance': return 'status-maintenance';
      case 'broken': return 'status-broken';
      case 'sold': return 'status-sold';
      case 'needs_service': return 'status-warning';
      default: return 'status-default';
    }
  };

  // Funkcja do automatycznego sprawdzania przeglądów przy ładowaniu
  useEffect(() => {
    const updateMachineStatuses = async () => {
      const updatedMachines = await Promise.all(
        machines.map(async (machine) => {
          const newStatus = checkServiceDueStatus(machine.nextService, machine.status);

          if (newStatus !== machine.status && newStatus === 'needs_service') {
            // Aktualizuj w bazie danych
            await garageService.updateMachine(machine.id, {
              ...machine,
              status: newStatus
            });
            return { ...machine, status: newStatus };
          }
          return machine;
        })
      );

      setMachines(updatedMachines);
    };

    if (machines.length > 0) {
      updateMachineStatuses();
    }
  }, [machines]);

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
    { value: 'sold', label: 'Sprzedany' },
    { value: 'needs_service', label: 'Wymaga przeglądu' }
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
    return machine.status === 'needs_service';
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
      'sold': 'Sprzedane',
      'needs_service': 'Wymagają przeglądu'
    };
    return options[filterStatus] || 'Wszystkie statusy';
  };

  // Dodaj tę funkcję do obsługi zmiany filtra
  const handleFilterStatusChange = (value) => {
    setFilterStatus(value);
    setIsFilterStatusOpen(false);
  };

  const handleEditMachine = (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    if (machine) {
      handleEdit(machine);
    }
  };

  const handleServiceRecord = (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    if (machine) {
      openRepairHistory(machine);
    }
  };

  const deleteMachine = async (machineId) => {
    try {
      await garageService.deleteMachine(machineId);
      setMachines(prev => prev.filter(m => m.id !== machineId));
      alert('Maszyna została usunięta pomyślnie');
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="garage-page">
      <div className="garage-header">
        <h2>Zarządzanie garażem</h2>
      </div>

      <div className="garage-content">
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
              <div className="actions-bar">
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
                    <div
                      className={`select-option ${filterStatus === 'needs_service' ? 'selected' : ''}`}
                      onClick={() => handleFilterStatusChange('needs_service')}
                    >
                      Wymagają przeglądu
                    </div>
                  </div>
                )}
              </div>
                 <div className="action-buttons">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  <i className="fas fa-plus"></i> Dodaj maszynę
                </button>
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
                      className={`machine-row ${selectedMachine?.id === machine.id ? 'selected' : ''
                        } ${needsService && machine.status !== 'sold' ? 'needs-service' : ''
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
                          className="action-btn btn-info"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRepairHistory(machine);
                          }}
                        >
                          <i className="fas fa-tools"></i> Serwis
                        </button>
                        <button
                          className="action-btn btn-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRepairList(machine);
                          }}
                        >
                          <i className="fas fa-history"></i> Historia
                        </button>
                        <button
                          className="action-btn btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(machine);
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

      {/* Modal potwierdzenia usunięcia maszyny */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Potwierdzenie usunięcia</h3>
              <button className="close-btn" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Czy na pewno chcesz usunąć maszynę <strong>"{deleteConfirm.name}"</strong>?</p>
              <div className="delete-confirm-warning">
                <i className="fas fa-exclamation-triangle"></i>
                <span>Tej operacji nie można cofnąć.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Anuluj
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteMachine(deleteConfirm.id)}
              >
                <i className="fas fa-trash"></i> Tak, usuń
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal dodawania/edycji maszyny */}
      {showForm && (
        <MachineModal
          formData={formData}
          onFormDataChange={setFormData}
          onSave={handleSubmit} // TYLKO TO - prosto wywołaj handleSubmit
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

      {/* Modal listy historii napraw */}
      {showRepairList && currentRepairMachine && (
        <RepairListModal
          machine={currentRepairMachine}
          repairHistory={repairHistory}
          loading={loadingRepairHistory}
          onClose={closeRepairList}
          onRepairsUpdated={() => {
            // Odśwież historię napraw po usunięciu
            loadRepairHistory(currentRepairMachine.id);
          }}
        />
      )}

      {/* Modal formularza naprawy */}
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
  // DODAJ TĘ FUNKCJĘ - BRAKUJE JEJ!
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onFormDataChange(prev => ({
      ...prev,
      [name]: name.includes('Price') || name.includes('Value') || name === 'cost'
        ? (value === '' ? '' : parseFloat(value.replace(',', '.')))
        : (name === 'year' || name === 'serviceInterval' || name === 'power'
          ? (value === '' ? '' : parseInt(value) || 0)
          : value)
    }));
  };

  // DODAJ TAKŻE FUNKCJĘ DO ZAPISU:
  const handleSaveClick = (e) => {
    e.preventDefault();
    onSave(e);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editingId ? 'Edytuj maszynę' : 'Dodaj nową maszynę'}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {/* FORMULARZ */}
          <form onSubmit={handleSaveClick}>
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
                <label htmlFor="power">Moc (KM)</label>
                <input
                  type="number"
                  id="power"
                  name="power"
                  min="0"
                  value={formData?.power || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="serialNumber">Numer seryjny</label>
                <input
                  type="text"
                  id="serialNumber"
                  name="serialNumber"
                  value={formData?.serialNumber || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="purchaseDate">Data zakupu</label>
                <input
                  type="date"
                  id="purchaseDate"
                  name="purchaseDate"
                  value={formData?.purchaseDate || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="purchasePrice">Cena zakupu (zł)</label>
                <input
                  type="number"
                  id="purchasePrice"
                  name="purchasePrice"
                  step="0.01"
                  min="0"
                  value={formData?.purchasePrice || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="currentValue">Aktualna wartość (zł)</label>
                <input
                  type="number"
                  id="currentValue"
                  name="currentValue"
                  step="0.01"
                  min="0"
                  value={formData?.currentValue || ''}
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
          <button
            className="btn btn-primary"
            onClick={handleSaveClick}
          >
            {editingId ? 'Zaktualizuj' : 'Dodaj maszynę'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Nowy komponent dla listy historii napraw
const RepairListModal = ({ machine, repairHistory, onClose, loading, onRepairsUpdated }) => {
  const [editingMode, setEditingMode] = useState(false);
  const [selectedRepairs, setSelectedRepairs] = useState([]);
  const [deleting, setDeleting] = useState(false);

  // Sortuj naprawy od najnowszej do najstarszej
  const sortedRepairs = [...repairHistory].sort((a, b) => {
    const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.date || a.createdAt);
    const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.date || b.createdAt);
    return new Date(dateB) - new Date(dateA);
  });

  // Obsługa zaznaczania/odznaczania napraw
  const handleSelectRepair = (repairId) => {
    setSelectedRepairs(prev => {
      if (prev.includes(repairId)) {
        return prev.filter(id => id !== repairId);
      } else {
        return [...prev, repairId];
      }
    });
  };

  // Obsługa zaznaczania wszystkich
  const handleSelectAll = () => {
    if (selectedRepairs.length === sortedRepairs.length) {
      // Jeśli wszystkie już zaznaczone - odznacz wszystkie
      setSelectedRepairs([]);
    } else {
      // W przeciwnym razie zaznacz wszystkie
      setSelectedRepairs(sortedRepairs.map(repair => repair.id));
    }
  };

  // Funkcja usuwania zaznaczonych napraw
  const handleDeleteSelected = async () => {
    if (selectedRepairs.length === 0) {
      alert('Nie zaznaczono żadnych napraw do usunięcia');
      return;
    }

    if (!window.confirm(`Czy na pewno chcesz usunąć ${selectedRepairs.length} zaznaczonych napraw? Tej operacji nie można cofnąć.`)) {
      return;
    }

    setDeleting(true);
    try {
      // Usuwanie napraw z backendu
      const deletePromises = selectedRepairs.map(repairId =>
        garageService.deleteRepair(repairId)
      );

      // Wykonaj wszystkie usunięcia równolegle
      await Promise.all(deletePromises);

      // Pokaż potwierdzenie
      alert(`Pomyślnie usunięto ${selectedRepairs.length} napraw`);

      // Resetuj stan
      setSelectedRepairs([]);
      setEditingMode(false);

      // Powiadom komponent nadrzędny o zmianie
      if (typeof onRepairsUpdated === 'function') {
        onRepairsUpdated();
      }

    } catch (error) {
      console.error('Błąd podczas usuwania napraw:', error);
      alert('Błąd podczas usuwania napraw: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Resetuj zaznaczenia przy wyjściu z trybu edycji
  const handleCancelEditing = () => {
    setEditingMode(false);
    setSelectedRepairs([]);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content repair-history-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <i className="fas fa-history"></i> Historia napraw - {machine.name}
          </h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Ładowanie */}
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Ładowanie historii napraw...</p>
            </div>
          ) : (
            <>
              {/* Statystyki */}
              {repairHistory.length > 0 && (
                <div className="repair-stats">
                  <div className="stat-item">
                    <i className="fas fa-calculator"></i>
                    <span>Łączny koszt: <strong>{repairHistory.reduce((sum, repair) => sum + (parseFloat(repair.cost) || 0), 0).toFixed(2)} zł</strong></span>
                  </div>
                  <div className="stat-item">
                    <i className="fas fa-list"></i>
                    <span>Liczba napraw: <strong>{repairHistory.length}</strong></span>
                  </div>
                </div>
              )}

              {repairHistory.length === 0 ? (
                <div className="no-repairs">
                  <i className="fas fa-inbox fa-2x"></i>
                  <p>Brak historii napraw dla tej maszyny</p>
                </div>
              ) : (
                <div className="repair-list-container">
                  <div className="repair-list-header">
                    <h4>Wszystkie naprawy i przeglądy:</h4>
                    <div className="header-actions">
                      <span className="repair-count">{repairHistory.length} wpisów</span>

                      {!editingMode ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditingMode(true)}
                        >
                          <i className="fas fa-edit"></i> Edytuj wpisy
                        </button>
                      ) : (
                        <div className="editing-controls">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={handleCancelEditing}
                          >
                            <i className="fas fa-times"></i> Anuluj
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={handleDeleteSelected}
                            disabled={selectedRepairs.length === 0 || deleting}
                          >
                            {deleting ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i> Usuwanie...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-trash"></i> Usuń ({selectedRepairs.length})
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {editingMode && (
                    <div className="select-all-control">
                      <label className="select-all-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedRepairs.length === sortedRepairs.length && sortedRepairs.length > 0}
                          onChange={handleSelectAll}
                        />
                        <span>Zaznacz wszystkie ({selectedRepairs.length}/{sortedRepairs.length})</span>
                      </label>
                    </div>
                  )}

                  <div className="repairs-table-container">
                    <table className="repairs-table">
                      <thead>
                        <tr>
                          {editingMode && <th className="repair-select-column"></th>}
                          <th>#</th>
                          <th>Data naprawy</th>
                          <th>Koszt</th>
                          <th>Wymienione części</th>
                          <th>Opis naprawy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRepairs.map((repair, index) => {
                          const repairDate = repair.date ? new Date(repair.date).toLocaleDateString('pl-PL') : 'Brak daty';
                          const cost = repair.cost > 0 ? `${parseFloat(repair.cost).toFixed(2)} zł` : '-';
                          const parts = repair.parts || '-';
                          const description = repair.description || '-';
                          const mechanic = repair.mechanic || repair.mechanik || null;
                          const isSelected = selectedRepairs.includes(repair.id);

                          return (
                            <tr
                              key={repair.id || index}
                              className={`repair-row ${isSelected ? 'selected' : ''}`}
                            >
                              {editingMode && (
                                <td className="repair-select-cell">
                                  <div className="repair-checkbox">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleSelectRepair(repair.id)}
                                      id={`repair-${repair.id || index}`}
                                    />
                                  </div>
                                </td>
                              )}
                              <td className="repair-number" data-label="Numer naprawy">
                                <span className="repeir-index">{sortedRepairs.length - index}</span>
                              </td>
                              <td className="repair-date" data-label="Data naprawy">
                                <div className="date-main">{repairDate}</div>
                                {mechanic && (
                                  <div className="mechanic-info">
                                    <i className="fas fa-user-cog"></i> {mechanic}
                                  </div>
                                )}
                              </td>
                              <td className="repair-cost" data-label="Koszt">
                                <div className={`cost-value ${repair.cost > 0 ? 'has-cost' : 'no-cost'}`}>
                                  {cost}
                                </div>
                              </td>
                              <td className="repair-parts" data-label="Wymienione części">
                                <div className="parts-content">
                                  {parts}
                                </div>
                              </td>
                              <td className="repair-description" data-label="Opis naprawy">
                                <div className="description-content">
                                  {description}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            <i className="fas fa-times"></i> Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};

// Komponent modala dla napraw
const RepairHistoryModal = ({ machine, repairForm, onRepairFormChange, onSave, onClose }) => {
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    onRepairFormChange(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'cost' ? (value === '' ? '' : parseFloat(value)) : value)
    }));
  };

  // Sprawdź czy aktualny status maszyny wymaga zmiany na sprawny
  const needsStatusChange = machine.status === 'broken' ||
    machine.status === 'maintenance' ||
    machine.status === 'needs_service';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content repair-service-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Dodaj naprawę/przegląd - {machine.name}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="repairDate">Data naprawy/przeglądu *</label>
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

              {/* NOWE POLA - przeniesione z formularza maszyny */}
              <div className="form-group">
                <label htmlFor="lastService">Ostatni przegląd *</label>
                <input
                  type="date"
                  id="lastService"
                  name="lastService"
                  value={repairForm.lastService || repairForm.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="nextServiceDate">Następny przegląd *</label>
                <input
                  type="date"
                  id="nextServiceDate"
                  name="nextServiceDate"
                  value={repairForm.nextServiceDate || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="serviceInterval">Interwał przeglądu (mies.)</label>
                <input
                  type="number"
                  id="serviceInterval"
                  name="serviceInterval"
                  min="1"
                  value={repairForm.serviceInterval || 12}
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
              <label htmlFor="repairDescription">Opis naprawy/przeglądu *</label>
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

            {/* Opcja zmiany statusu na sprawny */}
            {needsStatusChange && (
              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="changeStatusToActive"
                    name="changeStatusToActive"
                    checked={repairForm.changeStatusToActive}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="changeStatusToActive">
                    Zmień status maszyny na <strong>Sprawny</strong> po naprawie/przeglądzie
                  </label>
                </div>
              </div>
            )}
          </form>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Anuluj
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Zapisz naprawę/przegląd
          </button>
        </div>
      </div>
    </div>
  );
};

export default GaragePage; 