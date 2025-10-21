// src/components/pages/MagazinePage.jsx
import { useState, useEffect } from 'react';
import { magazineService, MAGAZINE_CATEGORIES } from '../../services/magazineService';
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

  useEffect(() => {
    const unsubscribe = magazineService.subscribeToMagazine((magazineItems) => {
      setItems(magazineItems);
      setLoading(false);
    });

    return () => unsubscribe();
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

  // Filtrowanie przedmiotów
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
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
          
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option value="all">Wszystkie kategorie</option>
            {Object.entries(MAGAZINE_CATEGORIES).map(([key, value]) => (
              <option key={key} value={value}>{value}</option>
            ))}
          </select>
        </div>

        <button onClick={handleAddItem} className="btn-primary">
          + Dodaj nowy przedmiot
        </button>
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