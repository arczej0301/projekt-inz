// components/pages/MagazinePage.jsx
import { useState } from 'react'
import { useWarehouse } from '../../hooks/useWarehouse'
import { useWarehouseFinanceIntegration } from '../../hooks/useWarehouseFinanceIntegration'
import ProductModal from './ProductModal'
import './MagazinePage.css'

function MagazinePage() {
  const [activeCategory, setActiveCategory] = useState('zboza')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [sortOrder, setSortOrder] = useState('name-asc')
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Poprawiona funkcja do formatowania waluty
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0,00 zł'
    }

    const numAmount = parseFloat(amount)
    const formatted = numAmount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return `${formatted} zł`
  }

  // Poprawiona funkcja do formatowania liczb
  const formatNumber = (number) => {
    if (number === null || number === undefined || isNaN(number)) return '0'

    const num = parseFloat(number)

    // Dla liczb zmiennoprzecinkowych - formatuj z 2 miejscami po przecinku
    if (num % 1 !== 0) {
      return num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    }

    // Dla liczb całkowitych
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const handleCategoryChange = (newCategory) => {
    setActiveCategory(newCategory)
  }

  const {
    warehouseData,
    categories,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct
  } = useWarehouse()

  const { addWarehouseTransaction, updateWarehouseTransaction } = useWarehouseFinanceIntegration()

  // Helper do bezpiecznego pobierania daty
  const getDate = (item) => {
    const val = item.createdAt || item.lastUpdate;
    if (!val) return 0;
    // Obsługa Firestore Timestamp
    if (val.toDate && typeof val.toDate === 'function') {
      return val.toDate().getTime();
    }
    // Obsługa zwykłej daty/stringa
    return new Date(val).getTime();
  }

  // Filtrowanie i sortowanie produktów
  const filteredItems = (warehouseData[activeCategory] || [])
    .filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortOrder) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'date-desc':
          return getDate(b) - getDate(a)
        case 'date-asc':
          return getDate(a) - getDate(b)
        case 'quantity-asc':
          return a.quantity - b.quantity
        case 'quantity-desc':
          return b.quantity - a.quantity
        default:
          return 0
      }
    })

  const getStockStatus = (quantity, minStock) => {
    if (quantity === 0) return 'brak'
    if (quantity < minStock) return 'niski'
    if (quantity <= minStock * 1.5) return 'średni'
    return 'wysoki'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'brak': return '#f44336'
      case 'niski': return '#ff9800'
      case 'średni': return '#ffeb3b'
      case 'wysoki': return '#4caf50'
      default: return '#9e9e9e'
    }
  }

  const calculateTotalValue = () => {
    return Object.values(warehouseData)
      .flat()
      .reduce((total, item) => total + (item.quantity * (item.price || 0)), 0)
  }

  const countLowStockItems = () => {
    return Object.values(warehouseData)
      .flat()
      .filter(item => item.quantity < item.minStock).length
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        // Edycja istniejącego produktu
        const oldProduct = editingProduct
        const result = await updateProduct(editingProduct.id, productData)

        if (result.success) {
          // Aktualizuj transakcję finansową jeśli cena się zmieniła
          await updateWarehouseTransaction(oldProduct, productData, editingProduct.id)

          setIsModalOpen(false)
          setEditingProduct(null)
        } else {
          alert(`Błąd: ${result.error}`)
        }
      } else {
        // Dodawanie nowego produktu
        const result = await addProduct({
          ...productData,
          category: activeCategory
        })

        if (result.success) {
          // Znajdź obiekt kategorii do wyświetlenia
          const currentCategoryObj = categories.find(cat => cat.id === activeCategory)

          // Dodaj transakcję finansową z obiektem kategorii
          await addWarehouseTransaction(
            productData,
            result.id,
            'add',
            currentCategoryObj // Przekaż cały obiekt kategorii (z name i icon)
          )

          setIsModalOpen(false)
        } else {
          alert(`Błąd: ${result.error}`)
        }
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert(`Błąd podczas zapisywania: ${error.message}`)
    }
  }

  const handleDeleteProduct = async (productId) => {
    try {
      const result = await deleteProduct(productId);
      setDeleteConfirm(null);
      if (!result.success) {
        alert(`Błąd: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Błąd podczas usuwania produktu: ' + error.message);
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Ładowanie danych magazynu...</p>
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
    <div className="magazine-page">
      <div className="magazine-header">
        <h2>Magazyn Gospodarstwa</h2>
      </div>


      <div className="magazine-stats">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Łączna wartość</h3>
            {/* Użyj formatCurrency dla wartości całkowitej */}
            <p>{formatCurrency(calculateTotalValue())}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>Łączna ilość produktów</h3>
            {/* Użyj formatNumber dla liczby produktów */}
            <p>{formatNumber(Object.values(warehouseData).flat().length)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>Niskie stany</h3>
            {/* Użyj formatNumber dla niskich stanów */}
            <p>{formatNumber(countLowStockItems())}</p>
          </div>
        </div>
      </div>

      <div className="magazine-content">
        <div className="categories-sidebar">
          <div className="sidebar-header">
            <h3>Kategorie</h3>
          </div>
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
              style={{ borderLeftColor: category.color }}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
              <span className="category-count">
                ({warehouseData[category.id]?.length || 0})
              </span>
            </button>
          ))}
        </div>

        <div className="products-section">
          <div className="products-header">
            <h3>
              {categories.find(cat => cat.id === activeCategory)?.icon}
              {categories.find(cat => cat.id === activeCategory)?.name}
            </h3>
            <div className="products-controls">
              {/* Najpierw sortowanie */}
              <div className="filter-group">
                <label>Sortuj:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="name-asc">Nazwa A-Z</option>
                  <option value="name-desc">Nazwa Z-A</option>
                  <option value="quantity-asc">Ilość (najniższe)</option>
                  <option value="quantity-desc">Ilość (najwyższe)</option>
                  <option value="date-desc">Ostatnio dodane (najnowsze)</option>
                  <option value="date-asc">Najstarsze</option>
                </select>
              </div>

              {/* Potem wyszukiwanie */}
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Szukaj produktu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="search-icon">🔍</span>
              </div>

              {/* Na końcu przycisk dodaj produkt */}
              <button
                className="btn-primary"
                onClick={handleAddProduct}
              >
                Dodaj produkt
              </button>
            </div>
          </div>


          <div className="products-grid">
            {filteredItems.map(item => {
              const stockStatus = getStockStatus(item.quantity, item.minStock)
              return (
                <div key={item.id} className="product-card">
                  <div className="product-header">
                    <h4>{item.name}</h4>
                    <div
                      className="stock-status"
                      style={{ backgroundColor: getStatusColor(stockStatus) }}
                    >
                      {stockStatus}
                    </div>
                  </div>

                  <div className="product-details">
                    <div className="detail-row">
                      <span className="label">Ilość:</span>
                      <span className="value">{formatNumber(item.quantity)} {item.unit}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Minimalny stan:</span>
                      <span className="value">{formatNumber(item.minStock)} {item.unit}</span>
                    </div>

                    {/* ZMIANA: Usuń warunek item.price i zawsze pokazuj cenę i wartość */}
                    <div className="detail-row">
                      <span className="label">Cena:</span>
                      <span className="value">{formatCurrency(item.price || 0)}/{item.unit}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Wartość:</span>
                      <span className="value">{formatCurrency((item.quantity || 0) * (item.price || 0))}</span>
                    </div>

                    <div className="detail-row">
                      <span className="label">Ostatnia aktualizacja:</span>
                      <span className="value">
                        {item.lastUpdate?.toDate ?
                          item.lastUpdate.toDate().toLocaleDateString('pl-PL') :
                          'Brak danych'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="product-actions">
                    <button
                      className="btn-primary"
                      onClick={() => handleEditProduct(item)}
                    >
                      Edytuj
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setDeleteConfirm(item)}
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="no-products">
              <p>📭 Brak produktów w tej kategorii</p>
              <button
                className="btn-primary"
                onClick={handleAddProduct}
              >
                Dodaj pierwszy produkt
              </button>
            </div>
          )}
        </div>
      </div>


      {/* Modal potwierdzenia usunięcia produktu */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content delete-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Potwierdzenie usunięcia</h3>
              <button className="close-btn" onClick={() => setDeleteConfirm(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Czy na pewno chcesz usunąć produkt <strong>"{deleteConfirm.name}"</strong>?</p>
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
                onClick={() => handleDeleteProduct(deleteConfirm.id)}
              >
                <i className="fas fa-trash"></i>Tak
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <ProductModal
          product={editingProduct}
          category={activeCategory}
          categories={categories} // DODAJ TĘ LINIĘ
          onCategoryChange={handleCategoryChange} // DODAJ TĘ LINIĘ
          onSave={handleSaveProduct}
          onClose={() => {
            setIsModalOpen(false)
            setEditingProduct(null)
          }}
        />
      )}
    </div>
  )
}

export default MagazinePage