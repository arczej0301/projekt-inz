import React, { useState, useEffect } from 'react';
import { 
  getAnimals, 
  addAnimal, 
  updateAnimal, 
  deleteAnimal,
  subscribeToAnimals 
} from '../../services/animalsService'; 
import './AnimalsPage.css';

function AnimalsPage() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAnimal, setCurrentAnimal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('wszystkie');
  const [saveLoading, setSaveLoading] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);

  const animalTypes = [
    { value: 'krowa', label: 'Krowy' },
    { value: 'byk', label: 'Byki' },
    { value: 'świnia', label: 'Świnie' },
    { value: 'koń', label: 'Konie' },
    { value: 'owca', label: 'Owce' },
    { value: 'koza', label: 'Kozy' },
    { value: 'kura', label: 'Kury' }
  ];

  const healthStatuses = [
    { value: 'zdrowy', label: 'Zdrowy' },
    { value: 'chory', label: 'Chory' },
    { value: 'w leczeniu', label: 'W leczeniu' },
    { value: 'w kwarantannie', label: 'W kwarantannie' },
    { value: 'krytyczny', label: 'Krytyczny' }
  ];

  const animalStatuses = [
    { value: 'aktywny', label: 'Aktywny' },
    { value: 'nieaktywny', label: 'Nieaktywny' },
    { value: 'w tuczu', label: 'W tuczu' },
    { value: 'ciężarny', label: 'Ciężarny' },
    { value: 'karmiący', label: 'Karmiący' },
    { value: 'na sprzedaż', label: 'Na sprzedaż' }
  ];

  // Pobierz zwierzęta przy pierwszym renderowaniu
  useEffect(() => {
    const loadAnimals = async () => {
      try {
        setLoading(true);
        const animalsData = await getAnimals();
        setAnimals(animalsData);
      } catch (error) {
        console.error('Error loading animals:', error);
        alert('Błąd podczas ładowania zwierząt: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadAnimals();

    // Subskrybuj real-time updates
    const unsubscribe = subscribeToAnimals((animalsData) => {
      setAnimals(animalsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAnimalModal = (animal = null) => {
    if (animal) {
      setCurrentAnimal(animal);
    } else {
      setCurrentAnimal({
        name: '',
        type: '',
        breed: '',
        earTag: '',
        birthDate: '',
        weight: '',
        status: 'aktywny',
        health: 'zdrowy',
        notes: ''
      });
    }
    setIsModalOpen(true);
    setIsTypeOpen(false);
    setIsStatusOpen(false);
    setIsHealthOpen(false);
  };

  const closeAnimalModal = () => {
    setIsModalOpen(false);
    setCurrentAnimal(null);
    setSaveLoading(false);
    setIsTypeOpen(false);
    setIsStatusOpen(false);
    setIsHealthOpen(false);
  };

  // POPRAWIONE: Funkcja do obsługi zmian w polach select
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAnimal(prev => ({
      ...prev,
      [name]: name === 'weight' ? (value === '' ? '' : parseFloat(value)) : value
    }));
  };

  // NOWA FUNKCJA: Custom select dla typu, statusu i zdrowia
  const handleCustomSelect = (name, value) => {
    setCurrentAnimal(prev => ({
      ...prev,
      [name]: value
    }));
    setIsTypeOpen(false);
    setIsStatusOpen(false);
    setIsHealthOpen(false);
  };

  // POPRAWIONE: Funkcja do obsługi zmian w filtrach
  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
  };

  const saveAnimal = async () => {
    if (!currentAnimal?.name || !currentAnimal?.type || !currentAnimal?.earTag) {
      alert('Proszę wypełnić wymagane pola (Imię, Typ i Numer kolczyka)!');
      return;
    }

    try {
      setSaveLoading(true);
      
      // Przygotuj dane do zapisania
      const animalData = {
        name: currentAnimal.name,
        type: currentAnimal.type,
        breed: currentAnimal.breed,
        earTag: currentAnimal.earTag,
        birthDate: currentAnimal.birthDate,
        weight: currentAnimal.weight ? parseFloat(currentAnimal.weight) : null,
        status: currentAnimal.status,
        health: currentAnimal.health,
        notes: currentAnimal.notes
      };

      if (currentAnimal.id) {
        // Edycja istniejącego zwierzęcia
        await updateAnimal(currentAnimal.id, animalData);
      } else {
        // Dodanie nowego zwierzęcia
        await addAnimal(animalData);
      }
      
      closeAnimalModal();
    } catch (error) {
      console.error('Error saving animal:', error);
      alert('Błąd podczas zapisywania zwierzęcia: ' + error.message);
      setSaveLoading(false);
    }
  };

  const handleDeleteAnimal = async (animalId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć to zwierzę?')) {
      return;
    }

    try {
      await deleteAnimal(animalId);
    } catch (error) {
      console.error('Error deleting animal:', error);
      alert('Błąd podczas usuwania zwierzęcia: ' + error.message);
    }
  };

  // Filtrowanie zwierząt
  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.earTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (animal.breed && animal.breed.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'wszystkie' || animal.type === filterType;
    return matchesSearch && matchesType;
  });

  const getHealthColor = (health) => {
    switch(health) {
      case 'zdrowy': return '#27ae60';
      case 'chory': return '#f39c12';
      case 'w leczeniu': return '#3498db';
      case 'w kwarantannie': return '#e74c3c';
      case 'krytyczny': return '#c0392b';
      default: return '#95a5a6';
    }
  };

  // Funkcje pomocnicze do custom selectów
  const getCurrentTypeLabel = () => {
    const option = animalTypes.find(opt => opt.value === (currentAnimal?.type || ''));
    return option ? option.label : 'Wybierz typ';
  };

  const getCurrentStatusLabel = () => {
    const option = animalStatuses.find(opt => opt.value === (currentAnimal?.status || 'aktywny'));
    return option ? option.label : 'Aktywny';
  };

  const getCurrentHealthLabel = () => {
    const option = healthStatuses.find(opt => opt.value === (currentAnimal?.health || 'zdrowy'));
    return option ? option.label : 'Zdrowy';
  };

  if (loading) {
    return (
      <div className="animals-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Ładowanie zwierząt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animals-page">
      <div className="animals-header">
        <h2>Zarządzanie zwierzętami</h2>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={() => openAnimalModal()}
          >
            <i className="fas fa-plus"></i> Dodaj zwierzę
          </button>
        </div>
      </div>

      <div className="animals-content">
        <div className="filters-bar">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Szukaj zwierząt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Filtruj według typu:</label>
            <select
              value={filterType}
              onChange={handleFilterChange}
            >
              <option value="wszystkie">Wszystkie</option>
              {animalTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="animals-stats">
          <div className="stat-card">
            <h3>{animals.length}</h3>
            <p>Wszystkich zwierząt</p>
          </div>
          <div className="stat-card">
            <h3>{animals.filter(a => a.health === 'zdrowy').length}</h3>
            <p>Zdrowych</p>
          </div>
          <div className="stat-card">
            <h3>{animals.filter(a => a.type === 'krowa').length}</h3>
            <p>Krów</p>
          </div>
          <div className="stat-card">
            <h3>{animals.filter(a => a.type === 'świnia').length}</h3>
            <p>Świń</p>
          </div>
        </div>

        <div className="animals-list">
          <h3>Lista zwierząt ({filteredAnimals.length})</h3>
          {filteredAnimals.length === 0 ? (
            <div className="no-animals">
              <p>Brak zwierząt do wyświetlenia</p>
            </div>
          ) : (
            <div className="animals-grid">
              {filteredAnimals.map(animal => (
                <div key={animal.id} className="animal-card">
                  <div className="animal-header">
                    <h4>{animal.name}</h4>
                    <span 
                      className="health-badge"
                      style={{ backgroundColor: getHealthColor(animal.health) }}
                    >
                      {animal.health}
                    </span>
                  </div>
                  <div className="animal-details">
                    <p><strong>Typ:</strong> {animal.type}</p>
                    <p><strong>Rasa:</strong> {animal.breed}</p>
                    <p><strong>Kolczyk:</strong> {animal.earTag}</p>
                    <p><strong>Waga:</strong> {animal.weight} kg</p>
                    <p><strong>Status:</strong> {animal.status}</p>
                    <p><strong>Data urodzenia:</strong> {animal.birthDate ? new Date(animal.birthDate).toLocaleDateString('pl-PL') : 'Nieznana'}</p>
                    {animal.notes && <p><strong>Notatki:</strong> {animal.notes}</p>}
                  </div>
                  <div className="animal-actions">
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => openAnimalModal(animal)}
                    >
                      <i className="fas fa-edit"></i> Edytuj
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteAnimal(animal.id)}
                    >
                      <i className="fas fa-trash"></i> Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal dodawania/edycji zwierzęcia */}
      {isModalOpen && currentAnimal && (
        <div className="modal-overlay" onClick={closeAnimalModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{currentAnimal.id ? 'Edytuj zwierzę' : 'Dodaj nowe zwierzę'}</h3>
              <button className="close-btn" onClick={closeAnimalModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Imię *</label>
                  <input
                    type="text"
                    name="name"
                    value={currentAnimal.name || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                {/* CUSTOM SELECT dla typu zwierzęcia */}
                <div className="form-group">
                  <label>Typ zwierzęcia *</label>
                  <div className="custom-select">
                    <div 
                      className={`select-header ${isTypeOpen ? 'open' : ''}`}
                      onClick={() => setIsTypeOpen(!isTypeOpen)}
                    >
                      {getCurrentTypeLabel()}
                      <span className="arrow">▼</span>
                    </div>
                    {isTypeOpen && (
                      <div className="select-options">
                        {animalTypes.map(type => (
                          <div
                            key={type.value}
                            className={`select-option ${currentAnimal?.type === type.value ? 'selected' : ''}`}
                            onClick={() => handleCustomSelect('type', type.value)}
                          >
                            {type.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Rasa *</label>
                  <input
                    type="text"
                    name="breed"
                    value={currentAnimal.breed || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Numer kolczyka *</label>
                  <input
                    type="text"
                    name="earTag"
                    value={currentAnimal.earTag || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Data urodzenia</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={currentAnimal.birthDate || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Waga (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={currentAnimal.weight || ''}
                    onChange={handleInputChange}
                    step="0.1"
                  />
                </div>
                
                {/* CUSTOM SELECT dla statusu */}
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
                        {animalStatuses.map(status => (
                          <div
                            key={status.value}
                            className={`select-option ${currentAnimal?.status === status.value ? 'selected' : ''}`}
                            onClick={() => handleCustomSelect('status', status.value)}
                          >
                            {status.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* CUSTOM SELECT dla stanu zdrowia */}
                <div className="form-group">
                  <label>Stan zdrowia</label>
                  <div className="custom-select">
                    <div 
                      className={`select-header ${isHealthOpen ? 'open' : ''}`}
                      onClick={() => setIsHealthOpen(!isHealthOpen)}
                    >
                      {getCurrentHealthLabel()}
                      <span className="arrow">▼</span>
                    </div>
                    {isHealthOpen && (
                      <div className="select-options">
                        {healthStatuses.map(health => (
                          <div
                            key={health.value}
                            className={`select-option ${currentAnimal?.health === health.value ? 'selected' : ''}`}
                            onClick={() => handleCustomSelect('health', health.value)}
                          >
                            {health.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Notatki</label>
                  <textarea
                    name="notes"
                    value={currentAnimal.notes || ''}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Dodatkowe informacje o zwierzęciu..."
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAnimalModal}>
                Anuluj
              </button>
              <button 
                className="btn btn-primary" 
                onClick={saveAnimal}
                disabled={saveLoading}
              >
                {saveLoading ? 'Zapisywanie...' : 'Zapisz zwierzę'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnimalsPage;