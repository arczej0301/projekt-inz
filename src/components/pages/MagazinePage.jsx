// components/pages/MagazinePage.jsx
import { useState } from 'react'
import { useWarehouse } from '../../hooks/useWarehouse'
import ProductModal from './ProductModal'
import './MagazinePage.css'

function MagazinePage() {
  const [activeCategory, setActiveCategory] = useState('zboza')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
<<<<<<< HEAD
  const [sortOrder, setSortOrder] = useState('name-asc')

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
=======
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce

  const { 
    warehouseData, 
    categories, 
    loading, 
    error,
    addProduct,
    updateProduct,
    deleteProduct
  } = useWarehouse()

<<<<<<< HEAD
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
          const dateA = a.createdAt || a.lastUpdate || new Date(0)
          const dateB = b.createdAt || b.lastUpdate || new Date(0)
          return new Date(dateB) - new Date(dateA)
        case 'date-asc':
          const dateA2 = a.createdAt || a.lastUpdate || new Date(0)
          const dateB2 = b.createdAt || b.lastUpdate || new Date(0)
          return new Date(dateA2) - new Date(dateB2)
        case 'quantity-asc':
          return a.quantity - b.quantity
        case 'quantity-desc':
          return b.quantity - a.quantity
        default:
          return 0
      }
    })
=======
  const filteredItems = warehouseData[activeCategory]?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce

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
    if (editingProduct) {
<<<<<<< HEAD
=======
      // Aktualizacja istniejącego produktu
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
      const result = await updateProduct(editingProduct.id, productData)
      if (result.success) {
        setIsModalOpen(false)
        setEditingProduct(null)
      } else {
        alert(`Błąd: ${result.error}`)
      }
    } else {
<<<<<<< HEAD
=======
      // Dodawanie nowego produktu
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
      const result = await addProduct({
        ...productData,
        category: activeCategory
      })
      if (result.success) {
        setIsModalOpen(false)
      } else {
        alert(`Błąd: ${result.error}`)
      }
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten produkt?')) {
      const result = await deleteProduct(productId)
      if (!result.success) {
        alert(`Błąd: ${result.error}`)
      }
    }
  }

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
<<<<<<< HEAD
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
=======
        <h2>📦 Magazyn Gospodarstwa</h2>
        <p>Zarządzanie zapasami i towarami w gospodarstwie</p>
      </div>

      <div className="magazine-stats">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>Łączna wartość</h3>
            <p>{calculateTotalValue().toFixed(2)} zł</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>Łączna ilość produktów</h3>
            <p>{Object.values(warehouseData).flat().length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>Niskie stany</h3>
            <p>{countLowStockItems()}</p>
          </div>
        </div>
      </div>
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce

      <div className="magazine-content">
        <div className="categories-sidebar">
          <div className="sidebar-header">
            <h3>Kategorie</h3>
<<<<<<< HEAD
=======
            <button 
              className="add-product-btn"
              onClick={handleAddProduct}
              title="Dodaj nowy produkt"
            >
              +
            </button>
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
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
<<<<<<< HEAD
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
=======
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Szukaj produktu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="search-icon">🔍</span>
              </div>
<<<<<<< HEAD
              
              {/* Na końcu przycisk dodaj produkt */}
=======
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
              <button 
                className="btn-primary"
                onClick={handleAddProduct}
              >
                + Dodaj produkt
              </button>
            </div>
          </div>

<<<<<<< HEAD
          
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
            onClick={() => handleDeleteProduct(item.id)}
          >
            Usuń
          </button>
        </div>
      </div>
    )
  })}
</div>
=======
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
                      <span className="value">{item.quantity} {item.unit}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Minimalny stan:</span>
                      <span className="value">{item.minStock} {item.unit}</span>
                    </div>
                    {item.price && (
                      <>
                        <div className="detail-row">
                          <span className="label">Cena:</span>
                          <span className="value">{item.price} zł/{item.unit}</span>
                        </div>
                        <div className="detail-row">
                          <span className="label">Wartość:</span>
                          <span className="value">{(item.quantity * item.price).toFixed(2)} zł</span>
                        </div>
                      </>
                    )}
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
                      onClick={() => handleDeleteProduct(item.id)}
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce

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

      {isModalOpen && (
<<<<<<< HEAD
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
=======
        <ProductModal
          product={editingProduct}
          category={activeCategory}
          onSave={handleSaveProduct}
          onClose={() => {
            setIsModalOpen(false)
            setEditingProduct(null)
          }}
        />
      )}
>>>>>>> 3495661e7661bd5f21447fce73bf84f457018fce
    </div>
  )
}

export default MagazinePage