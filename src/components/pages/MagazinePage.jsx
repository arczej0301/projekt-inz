// src/components/pages/MagazinePage.jsx
import { useState, useEffect, useRef } from 'react';
import { magazineService } from '../../services/magazineService';
import MagazineList from './MagazineList';
import MagazineForm from './MagazineForm';
import MagazineStats from './MagazineStats';
import './MagazinePage.css';

function MagazinePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = magazineService.subscribeToMagazine((magazineItems) => {
      setItems(magazineItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Zamknij dropdown gdy klikniesz poza nim
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddItem = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten przedmiot?')) {
      try {
        await magazineService.deleteItem(itemId);
      } catch (error) {
        alert('Błąd podczas usuwania przedmiotu: ' + error.message);
      }
    }
  };

  const handleCategorySelect = (category) => {
    console.log('Category selected:', category);
    setSelectedCategory(category);
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Filtrowanie przedmiotów
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || 
                           (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="magazine-page">
        <div className="loading">Ładowanie magazynu...</div>
      </div>
    );
  }

  const categories = [
    { value: 'all', label: 'Wszystkie kategorie' },
    { value: 'zboża', label: 'Zboża' },
    { value: 'mleko', label: 'Mleko' },
    { value: 'pasze', label: 'Pasze' },
    { value: 'nawozy', label: 'Nawozy' },
    { value: 'nasiona', label: 'Nasiona' },
    { value: 'narzędzia', label: 'Narzędzia' },
    { value: 'inne', label: 'Inne' }
  ];

  const getCurrentCategoryLabel = () => {
    const category = categories.find(cat => cat.value === selectedCategory);
    return category ? category.label : 'Wszystkie kategorie';
  };

  return (
    <div className="magazine-page">
      <div className="magazine-header">
        <h2>Magazyn Gospodarstwa</h2>
        <p>Zarządzanie zasobami i surowcami</p>
      </div>

      <MagazineStats items={items} />

      <div className="magazine-controls">
        <div className="controls-left">
          <input
            type="text"
            placeholder="Szukaj po nazwie lub lokalizacji..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          {/* CUSTOM DROPDOWN */}
          <div className="custom-dropdown" ref={dropdownRef}>
            <div 
              className="dropdown-header"
              onClick={toggleDropdown}
              style={{
                padding: '10px 15px',
                border: '2px solid #4CAF50',
                borderRadius: '5px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                minWidth: '200px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{getCurrentCategoryLabel()}</span>
              <span style={{fontSize: '12px'}}>▼</span>
            </div>
            
            {showDropdown && (
              <div 
                className="dropdown-list"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}
              >
                {categories.map(category => (
                  <div
                    key={category.value}
                    onClick={() => handleCategorySelect(category.value)}
                    style={{
                      padding: '10px 15px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: selectedCategory === category.value ? '#f0f0f0' : 'white'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = selectedCategory === category.value ? '#f0f0f0' : 'white'}
                  >
                    {category.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button onClick={handleAddItem} className="btn-primary">
          + Dodaj nowy przedmiot
        </button>
      </div>

      <div style={{textAlign: 'center', margin: '10px 0', color: '#666'}}>
        Aktualna kategoria: <strong>{getCurrentCategoryLabel()}</strong>
      </div>

      <MagazineList
        items={filteredItems}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
      />

      {showForm && (
        <MagazineForm
          item={editingItem}
          onClose={handleCloseForm}
          onSave={handleCloseForm}
        />
      )}
    </div>
  );
}

export default MagazinePage;