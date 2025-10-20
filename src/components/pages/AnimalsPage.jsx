import React, { useState } from 'react';
import './AnimalsPage.css';

function AnimalsPage() {
  const [animals, setAnimals] = useState([
    {
      id: 1,
      name: "Bella",
      type: "krowa",
      breed: "Holstein",
      earTag: "PL-001",
      birthDate: "2020-03-15",
      weight: 650,
      status: "aktywna",
      health: "zdrowa",
      notes: "Krowa mleczna, dobra wydajność"
    },
    {
      id: 2,
      name: "Max",
      type: "byk",
      breed: "Limousine",
      earTag: "PL-002",
      birthDate: "2019-07-20",
      weight: 950,
      status: "aktywny",
      health: "zdrowy",
      notes: "Byk hodowlany"
    },
    {
      id: 3,
      name: "Luna",
      type: "świnia",
      breed: "Wielka Biała",
      earTag: "PL-003",
      birthDate: "2023-01-10",
      weight: 120,
      status: "w tuczu",
      health: "zdrowa",
      notes: "Prosię do tuczu"
    }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAnimal, setCurrentAnimal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('wszystkie');

  const animalTypes = [
    { value: 'wszystkie', label: 'Wszystkie' },
    { value: 'krowa', label: 'Krowy' },
    { value: 'byk', label: 'Byki' },
    { value: 'świnia', label: 'Świnie' },
    { value: 'koń', label: 'Konie' },
    { value: 'owca', label: 'Owce' },
    { value: 'koza', label: 'Kozy' },
    { value: 'kura', label: 'Kury' }
  ];

  const healthStatuses = [
    'zdrowy', 'chory', 'w leczeniu', 'w kwarantannie', 'krytyczny'
  ];

  const animalStatuses = [
    'aktywny', 'nieaktywny', 'w tuczu', 'ciężarny', 'karmiący', 'na sprzedaż'
  ];

  const openAnimalModal = (animal = null) => {
    if (animal) {
      setCurrentAnimal(animal);
    } else {
      setCurrentAnimal({
        id: Date.now(),
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
  };

  const closeAnimalModal = () => {
    setIsModalOpen(false);
    setCurrentAnimal(null);
  };

  const saveAnimal = () => {
    if (!currentAnimal.name || !currentAnimal.type || !currentAnimal.earTag) {
      alert('Proszę wypełnić wymagane pola!');
      return;
    }

    if (animals.find(a => a.id === currentAnimal.id)) {
      setAnimals(animals.map(a => a.id === currentAnimal.id ? currentAnimal : a));
    } else {
      setAnimals([...animals, currentAnimal]);
    }
    closeAnimalModal();
  };

  const deleteAnimal = (id) => {
    if (window.confirm('Czy na pewno chcesz usunąć to zwierzę?')) {
      setAnimals(animals.filter(a => a.id !== id));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAnimal({
      ...currentAnimal,
      [name]: name === 'weight' ? parseFloat(value) || '' : value
    });
  };

  // Filtrowanie zwierząt
  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.earTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         animal.breed.toLowerCase().includes(searchTerm.toLowerCase());
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
              onChange={(e) => setFilterType(e.target.value)}
            >
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
                  <p><strong>Data urodzenia:</strong> {new Date(animal.birthDate).toLocaleDateString('pl-PL')}</p>
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
                    onClick={() => deleteAnimal(animal.id)}
                  >
                    <i className="fas fa-trash"></i> Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal dodawania/edycji zwierzęcia */}
      {isModalOpen && currentAnimal && (
        <div className="modal-overlay" onClick={closeAnimalModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{currentAnimal.id && animals.find(a => a.id === currentAnimal.id) ? 'Edytuj zwierzę' : 'Dodaj nowe zwierzę'}</h3>
              <button className="close-btn" onClick={closeAnimalModal}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Imię *</label>
                  <input
                    type="text"
                    name="name"
                    value={currentAnimal.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Typ zwierzęcia *</label>
                  <select
                    name="type"
                    value={currentAnimal.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Wybierz typ</option>
                    {animalTypes.filter(t => t.value !== 'wszystkie').map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Rasa *</label>
                  <input
                    type="text"
                    name="breed"
                    value={currentAnimal.breed}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Numer kolczyka *</label>
                  <input
                    type="text"
                    name="earTag"
                    value={currentAnimal.earTag}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Data urodzenia</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={currentAnimal.birthDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Waga (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    value={currentAnimal.weight}
                    onChange={handleInputChange}
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={currentAnimal.status}
                    onChange={handleInputChange}
                  >
                    {animalStatuses.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Stan zdrowia</label>
                  <select
                    name="health"
                    value={currentAnimal.health}
                    onChange={handleInputChange}
                  >
                    {healthStatuses.map(health => (
                      <option key={health} value={health}>
                        {health}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Notatki</label>
                  <textarea
                    name="notes"
                    value={currentAnimal.notes}
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
              <button className="btn btn-primary" onClick={saveAnimal}>
                Zapisz zwierzę
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnimalsPage;