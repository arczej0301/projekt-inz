import React, { useState, useEffect } from 'react';
import {
  getAnimals,
  addAnimal,
  updateAnimal,
  deleteAnimal,
  subscribeToAnimals,
  getAnimalHistory,
  addAnimalHistory
} from '../../services/animalsService';
import './AnimalsPage.css';

function AnimalsPage() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal stan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAnimal, setCurrentAnimal] = useState(null);

  // NOWOŚĆ: Przechowujemy oryginalne dane do porównania zmian w historii
  const [originalAnimal, setOriginalAnimal] = useState(null);

  // Filtry i wyszukiwanie
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('wszystkie');
  const [sortOrder, setSortOrder] = useState('name-asc');
  const [saveLoading, setSaveLoading] = useState(false);

  // Custom Select states
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isHealthOpen, setIsHealthOpen] = useState(false);
  const [healthFilter, setHealthFilter] = useState('wszystkie');

  // Confirm delete
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Historia
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [animalHistory, setAnimalHistory] = useState([]);
  const [newHistoryType, setNewHistoryType] = useState('Leczenie');
  const [newHistoryDesc, setNewHistoryDesc] = useState('');
  const [historySubmitting, setHistorySubmitting] = useState(false);

  // Opcje selectów
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

  // Ładowanie danych
  useEffect(() => {
    const loadAnimals = async () => {
      try {
        setLoading(true);
        const animalsData = await getAnimals();
        setAnimals(animalsData);
      } catch (error) {
        console.error('Error loading animals:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAnimals();

    const unsubscribe = subscribeToAnimals((animalsData) => {
      setAnimals(animalsData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Obsługa otwierania modala z localStorage
  useEffect(() => {
    const shouldOpenForm = localStorage.getItem('openAnimalForm');
    if (shouldOpenForm === 'true') {
      openAnimalModal();
      localStorage.removeItem('openAnimalForm');
    }
  }, []);

  // --- FUNKCJE MODALA EDYCJI ---

  const openAnimalModal = (animal = null) => {
    if (animal) {
      // Kopiujemy dane do edycji
      setCurrentAnimal({ ...animal });
      // NOWOŚĆ: Zapisujemy oryginał do porównania zmian
      setOriginalAnimal({ ...animal });
    } else {
      const newAnimal = {
        name: '',
        type: '',
        breed: '',
        earTag: '',
        birthDate: '',
        weight: '',
        status: 'aktywny',
        health: 'zdrowy',
        notes: ''
      };
      setCurrentAnimal(newAnimal);
      setOriginalAnimal(null); // Brak oryginału = nowe zwierzę
    }
    setIsModalOpen(true);
    setIsTypeOpen(false);
    setIsStatusOpen(false);
    setIsHealthOpen(false);
  };

  const closeAnimalModal = () => {
    setIsModalOpen(false);
    setCurrentAnimal(null);
    setOriginalAnimal(null);
    setSaveLoading(false);
    setIsTypeOpen(false);
    setIsStatusOpen(false);
    setIsHealthOpen(false);
  };

  // NAPRAWA: Usunięto parseFloat w locie, co naprawia problem z edycją wagi
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAnimal(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCustomSelect = (name, value) => {
    setCurrentAnimal(prev => ({
      ...prev,
      [name]: value
    }));
    setIsTypeOpen(false);
    setIsStatusOpen(false);
    setIsHealthOpen(false);
  };

  const saveAnimal = async () => {
    if (!currentAnimal?.name || !currentAnimal?.type || !currentAnimal?.earTag) {
      alert('Proszę wypełnić wymagane pola (Imię, Typ i Numer kolczyka)!');
      return;
    }

    try {
      setSaveLoading(true);

      // Konwersja danych przed wysłaniem (np. waga na liczbę)
      const animalData = {
        name: currentAnimal.name,
        type: currentAnimal.type,
        breed: currentAnimal.breed,
        earTag: currentAnimal.earTag,
        birthDate: currentAnimal.birthDate,
        // Tutaj bezpiecznie parsujemy wagę. Jeśli pusta -> null
        weight: currentAnimal.weight && currentAnimal.weight !== '' ? parseFloat(currentAnimal.weight) : null,
        status: currentAnimal.status,
        health: currentAnimal.health,
        notes: currentAnimal.notes
      };

      if (currentAnimal.id) {
        // EDYCJA: Przekazujemy ID, Nowe Dane ORAZ Oryginalne Dane (dla historii)
        await updateAnimal(currentAnimal.id, animalData, originalAnimal);
      } else {
        // NOWE ZWIERZĘ
        const newId = await addAnimal(animalData);
        // Automatyczny wpis do historii już jest w serwisie
      }

      closeAnimalModal();
    } catch (error) {
      console.error('Error saving animal:', error);
      alert('Błąd zapisu: ' + error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteAnimal = async (animalId, animalName) => {
    try {
      await deleteAnimal(animalId);
      setDeleteConfirm(null);
    } catch (error) {
      alert('Błąd usuwania: ' + error.message);
    }
  };

  // --- FUNKCJE HISTORII ---

  const openHistoryModal = async (animal) => {
    // Kopia obiektu, żeby mieć dane (ID, name) w modalu
    setCurrentAnimal({ ...animal });
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    setAnimalHistory([]); // Czyścimy starą listę
    try {
      const history = await getAnimalHistory(animal.id);
      setAnimalHistory(history);
    } catch (error) {
      console.error("Błąd pobierania historii", error);
      alert("Nie udało się pobrać historii.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
    // Nie czyścimy currentAnimal całkowicie, bo animacja może go potrzebować,
    // ale w tym komponencie i tak używamy warunku {currentAnimal && ...}, więc ok.
    setNewHistoryDesc('');
  };

  const handleAddHistoryEvent = async (e) => {
    if (e) e.preventDefault();
    if (!newHistoryDesc) return;

    setHistorySubmitting(true);
    try {
      // Wywołanie serwisu
      await addAnimalHistory(currentAnimal.id, newHistoryType, newHistoryDesc);

      // Odświeżenie listy po dodaniu
      const updatedHistory = await getAnimalHistory(currentAnimal.id);
      setAnimalHistory(updatedHistory);

      // Reset pola
      setNewHistoryDesc('');
    } catch (error) {
      console.error(error);
      alert('Błąd dodawania zdarzenia: ' + error.message);
    } finally {
      setHistorySubmitting(false);
    }
  };

  // --- HELPERSY UI ---

  const handleFilterChange = (e) => setFilterType(e.target.value);

  const filteredAndSortedAnimals = animals
    .filter(animal => {
      const matchesSearch = animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.earTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (animal.breed && animal.breed.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'wszystkie' || animal.type === filterType;
      const matchesHealth = healthFilter === 'wszystkie' || animal.health === healthFilter;
      return matchesSearch && matchesType && matchesHealth;
    })
    .sort((a, b) => {
      switch (sortOrder) {
        case 'name-asc': return a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' });
        case 'name-desc': return b.name.localeCompare(a.name, 'pl', { sensitivity: 'base' });
        case 'date-desc': return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0); // Lepsze sortowanie po dacie utworzenia
        case 'date-asc': return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        default: return 0;
      }
    });

  const getHealthColor = (health) => {
    switch (health) {
      case 'zdrowy': return '#27ae60';
      case 'chory': return '#f39c12';
      case 'w leczeniu': return '#3498db';
      case 'w kwarantannie': return '#e74c3c';
      case 'krytyczny': return '#c0392b';
      default: return '#95a5a6';
    }
  };

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
        <div className="animals-loading">
          <div className="animals-loading-spinner"></div>
          <p>Ładowanie zwierząt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animals-page">
      <div className="animals-header">
        <h2>Zarządzanie zwierzętami</h2>
      </div>

      <div className="animals-content">
        {/* Pasek filtrów */}
        <div className="filters-bar">
          <div className="search-group">
            <label>Wyszukiwarka</label>
            <div className="animals-search-box">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Szukaj..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="filter-group">
            <label>Typ:</label>
            <select value={filterType} onChange={handleFilterChange}>
              <option value="wszystkie">Wszystkie</option>
              {animalTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Zdrowie:</label>
            <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)}>
              <option value="wszystkie">Wszystkie</option>
              {healthStatuses.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Sortuj:</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="name-asc">Nazwa A-Z</option>
              <option value="name-desc">Nazwa Z-A</option>
              <option value="date-desc">Najnowsze</option>
              <option value="date-asc">Najstarsze</option>
            </select>
          </div>
          <button className="animals-btn animals-btn-primary" onClick={() => openAnimalModal()}>
            <i className="fas fa-plus"></i> Dodaj
          </button>
        </div>

        {/* Lista zwierząt */}
        <div className="animals-list">
          <h3>Lista zwierząt ({filteredAndSortedAnimals.length})</h3>
          {filteredAndSortedAnimals.length === 0 ? (
            <div className="no-animals"><p>Brak zwierząt spełniających kryteria.</p></div>
          ) : (
            <div className="animals-list-view">
              {filteredAndSortedAnimals.map(animal => (
                <div key={animal.id} className="animal-list-item">
                  <div className="animal-list-info">
                    <div className="animal-list-main">
                      <h4 className="animal-list-name">{animal.name}</h4>
                      <span className="health-badge" style={{ backgroundColor: getHealthColor(animal.health) }}>
                        {animal.health}
                      </span>
                    </div>
                    <div className="animal-list-details">
                      <div className="detail-row">
                        <span className="animal-list-detail"><strong>Typ:</strong> {animal.type}</span>
                        <span className="animal-list-detail"><strong>Rasa:</strong> {animal.breed || '-'}</span>
                        <span className="animal-list-detail"><strong>Kolczyk:</strong> {animal.earTag}</span>
                      </div>
                      <div className="detail-row">
                        <span className="animal-list-detail"><strong>Waga:</strong> {animal.weight ? `${animal.weight} kg` : '-'}</span>
                        <span className="animal-list-detail"><strong>Status:</strong> {animal.status}</span>
                        <span className="animal-list-detail">
                          <strong>Data ur.:</strong> {animal.birthDate ? new Date(animal.birthDate).toLocaleDateString('pl-PL') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="animal-list-actions">
                    <button className="animals-btn animals-btn-primary animals-btn-sm" onClick={() => openAnimalModal(animal)}>
                      <i className="fas fa-edit"></i> Edytuj
                    </button>
                    <button className="animals-btn animals-btn-info animals-btn-sm" onClick={() => openHistoryModal(animal)}>
                      <i className="fas fa-history"></i> Historia
                    </button>
                    <button className="animals-btn animals-btn-danger animals-btn-sm" onClick={() => setDeleteConfirm(animal)}>
                      <i className="fas fa-trash"></i> Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL POTWIERDZENIA USUNIĘCIA --- */}
      {deleteConfirm && (
        <div className="animals-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="animals-modal-content delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="animals-modal-header">
              <h3>Potwierdź usunięcie</h3>
              <button className="animals-close-btn" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="animals-modal-body">
              <p>Czy na pewno chcesz usunąć zwierzę <strong>"{deleteConfirm.name}"</strong>?</p>
              <div className="delete-confirm-warning"><i className="fas fa-exclamation-triangle"></i><span>Operacja jest nieodwracalna.</span></div>
            </div>
            <div className="animals-modal-footer">
              <button className="animals-btn animals-btn-secondary" onClick={() => setDeleteConfirm(null)}>Anuluj</button>
              <button className="animals-btn animals-btn-danger" onClick={() => handleDeleteAnimal(deleteConfirm.id, deleteConfirm.name)}>Usuń</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EDYCJI / DODAWANIA --- */}
      {isModalOpen && currentAnimal && (
        <div className="animals-modal-overlay" onClick={closeAnimalModal}>
          <div className="animals-modal-content" onClick={e => e.stopPropagation()}>
            <div className="animals-modal-header">
              <h3>{currentAnimal.id ? 'Edytuj zwierzę' : 'Dodaj nowe zwierzę'}</h3>
              <button className="animals-close-btn" onClick={closeAnimalModal}>&times;</button>
            </div>
            <div className="animals-modal-body">
              <div className="animals-form-grid">
                <div className="animals-form-group">
                  <label>Imię *</label>
                  <input type="text" name="name" value={currentAnimal.name || ''} onChange={handleInputChange} required />
                </div>
                <div className="animals-form-group">
                  <label>Typ zwierzęcia *</label>
                  <div className="animals-custom-select">
                    <div className={`animals-select-header ${isTypeOpen ? 'open' : ''}`} onClick={() => setIsTypeOpen(!isTypeOpen)}>
                      {getCurrentTypeLabel()}<span className="arrow">▼</span>
                    </div>
                    {isTypeOpen && (
                      <div className="animals-select-options">
                        {animalTypes.map(t => (
                          <div key={t.value} className={`animals-select-option ${currentAnimal.type === t.value ? 'selected' : ''}`} onClick={() => handleCustomSelect('type', t.value)}>{t.label}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-group"><label>Rasa *</label><input type="text" name="breed" value={currentAnimal.breed || ''} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Numer kolczyka *</label><input type="text" name="earTag" value={currentAnimal.earTag || ''} onChange={handleInputChange} required /></div>
                <div className="form-group"><label>Data urodzenia</label><input type="date" name="birthDate" value={currentAnimal.birthDate || ''} onChange={handleInputChange} /></div>

                {/* POPRAWIONY INPUT WAGI: text/number bez parseFloat w onChange */}
                <div className="form-group"><label>Waga (kg)</label><input type="number" name="weight" value={currentAnimal.weight || ''} onChange={handleInputChange} step="0.1" /></div>

                <div className="form-group"><label>Status</label><div className="custom-select"><div className={`select-header ${isStatusOpen ? 'open' : ''}`} onClick={() => setIsStatusOpen(!isStatusOpen)}>{getCurrentStatusLabel()}<span className="arrow">▼</span></div>{isStatusOpen && (<div className="select-options">{animalStatuses.map(s => (<div key={s.value} className={`select-option ${currentAnimal.status === s.value ? 'selected' : ''}`} onClick={() => handleCustomSelect('status', s.value)}>{s.label}</div>))}</div>)}</div></div>
                <div className="form-group"><label>Stan zdrowia</label><div className="custom-select"><div className={`select-header ${isHealthOpen ? 'open' : ''}`} onClick={() => setIsHealthOpen(!isHealthOpen)}>{getCurrentHealthLabel()}<span className="arrow">▼</span></div>{isHealthOpen && (<div className="select-options">{healthStatuses.map(h => (<div key={h.value} className={`select-option ${currentAnimal.health === h.value ? 'selected' : ''}`} onClick={() => handleCustomSelect('health', h.value)}>{h.label}</div>))}</div>)}</div></div>
                <div className="form-group full-width"><label>Notatki</label><textarea name="notes" value={currentAnimal.notes || ''} onChange={handleInputChange} rows="3" /></div>
              </div>
            </div>
            <div className="animals-modal-footer">
              <button className="animals-btn animals-btn-secondary" onClick={closeAnimalModal}>Anuluj</button>
              <button className="animals-btn animals-btn-primary" onClick={saveAnimal} disabled={saveLoading}>{saveLoading ? 'Zapisywanie...' : 'Zapisz'}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL HISTORII --- */}
      {isHistoryModalOpen && currentAnimal && (
        <div className="animals-modal-overlay" onClick={closeHistoryModal}>
          <div className="animals-modal-content" onClick={e => e.stopPropagation()}>
            <div className="animals-modal-header">
              <h3>Historia: {currentAnimal.name}</h3>
              <button className="animals-close-btn" onClick={closeHistoryModal}>&times;</button>
            </div>
            <div className="animals-modal-body">
              {/* Formularz dodawania */}
              <div className="add-history-form" style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ marginTop: 0, marginBottom: '10px', fontSize: '14px' }}>Dodaj zdarzenie ręcznie</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <select value={newHistoryType} onChange={e => setNewHistoryType(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                    <option value="Leczenie">Leczenie / Weterynarz</option>
                    <option value="Szczepienie">Szczepienie</option>
                    <option value="Rozród">Rozród</option>
                    <option value="Żywienie">Żywienie</option>
                    <option value="Ważenie">Ważenie</option>
                    <option value="Inne">Inne</option>
                  </select>
                  <input type="text" placeholder="Opis zdarzenia..." value={newHistoryDesc} onChange={e => setNewHistoryDesc(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
                  <button onClick={handleAddHistoryEvent} disabled={historySubmitting} className="animals-btn animals-btn-primary" style={{ padding: '8px 15px' }}>Dodaj</button>
                </div>
              </div>

              {/* Lista */}
              {historyLoading ? (
                <div className="animals-loading"><div className="animals-loading-spinner"></div><p>Pobieranie historii...</p></div>
              ) : animalHistory.length > 0 ? (
                <div className="history-timeline">
                  {animalHistory.map((item, index) => (
                    <div key={index} className="history-item">
                      <div className="history-date">
                        {item.date?.toDate ? item.date.toDate().toLocaleDateString('pl-PL') : (item.date instanceof Date ? item.date.toLocaleDateString('pl-PL') : '-')}
                      </div>
                      <div className="history-content">
                        <strong>{item.type}</strong>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-animals">Brak wpisów w historii.</p>
              )}
            </div>
            <div className="animals-modal-footer">
              <button className="animals-btn animals-btn-secondary" onClick={closeHistoryModal}>Zamknij</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnimalsPage;