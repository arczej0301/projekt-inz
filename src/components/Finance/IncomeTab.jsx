// components/Finance/IncomeTab.jsx - UPROSZCZONA I NAPRAWIONA WERSJA
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useFinance } from '../../hooks/useFinance'
import { useWarehouse } from '../../hooks/useWarehouse'
import CustomSelect from '../CustomSelect'
import './FinanceComponents.css'

const IncomeTab = ({ transactions }) => {
  const { incomeCategories, addTransaction } = useFinance()
  const { warehouseData, categories: warehouseCategories } = useWarehouse()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTransaction, setNewTransaction] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    productId: '',
    quantity: '',
    unit: ''
  })
  const [availableProducts, setAvailableProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // Użyj ref do przechowywania poprzednich wartości
  const prevCategoryRef = useRef('')
  const prevProductIdRef = useRef('')
  const prevQuantityRef = useRef('')

  // Static formatter functions - nie zmieniają się nigdy
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0,00 zł'
    }
    const numAmount = parseFloat(amount)
    const formatted = numAmount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return `${formatted} zł`
  }

  const formatNumber = (number) => {
    if (number === null || number === undefined || isNaN(number)) return '0'
    const num = parseFloat(number)
    if (num % 1 !== 0) {
      return num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  // Memoized options
  const categoryOptions = useMemo(() => 
    incomeCategories.map(cat => ({
      value: cat.id,
      label: cat.name,
      icon: cat.icon
    })), 
    [incomeCategories]
  )

  const productOptions = useMemo(() => 
    availableProducts.map(product => {
      const cat = warehouseCategories.find(c => c.id === product.category)
      return {
        value: product.id,
        label: `${product.name} (${formatNumber(product.quantity)} ${product.unit})`,
        subLabel: `Cena: ${formatCurrency(product.price || 0)}/${product.unit} | Kategoria: ${cat?.name || product.category}`,
        icon: cat?.icon || '📦'
      }
    }), 
    [availableProducts, warehouseCategories] // Usunięto formatCurrency i formatNumber z zależności
  )

  // Effect 1: Filtrowanie produktów gdy zmienia się kategoria
  useEffect(() => {
    if (newTransaction.category === 'sprzedaz_plonow') {
      const allProducts = Object.values(warehouseData).flat()
      const sellableProducts = allProducts.filter(product => 
        ['zboza', 'warzywa', 'owoce', 'mleko'].includes(product.category) && 
        (product.quantity || 0) > 0
      )
      setAvailableProducts(sellableProducts)
      
      // Jeśli produkt jest niedostępny, wyczyść go
      if (newTransaction.productId) {
        const productStillAvailable = sellableProducts.some(p => p.id === newTransaction.productId)
        if (!productStillAvailable) {
          setNewTransaction(prev => ({
            ...prev,
            productId: '',
            quantity: '',
            unit: ''
          }))
        }
      }
    } else {
      setAvailableProducts([])
      setSelectedProduct(null)
      // Czyść pola związane z magazynem
      if (newTransaction.productId || newTransaction.quantity) {
        setNewTransaction(prev => ({
          ...prev,
          productId: '',
          quantity: '',
          unit: ''
        }))
      }
    }
    prevCategoryRef.current = newTransaction.category
  }, [newTransaction.category, warehouseData]) // Uproszczone zależności

  // Effect 2: Ustawianie selectedProduct gdy zmienia się productId
  useEffect(() => {
    if (newTransaction.productId && availableProducts.length > 0 && prevProductIdRef.current !== newTransaction.productId) {
      const product = availableProducts.find(p => p.id === newTransaction.productId)
      setSelectedProduct(product || null)
      prevProductIdRef.current = newTransaction.productId
      
      // Automatycznie ustaw opis
      if (product && !newTransaction.description.includes(product.name)) {
        setNewTransaction(prev => ({
          ...prev,
          description: `Sprzedaż ${product.name}`,
          unit: product.unit
        }))
      }
    } else if (!newTransaction.productId && selectedProduct) {
      setSelectedProduct(null)
    }
  }, [newTransaction.productId, availableProducts]) // Uproszczone zależności

  // Effect 3: Obliczanie kwoty gdy zmienia się ilość
  useEffect(() => {
    if (selectedProduct && newTransaction.quantity && prevQuantityRef.current !== newTransaction.quantity) {
      const quantity = parseFloat(newTransaction.quantity)
      if (!isNaN(quantity) && quantity > 0) {
        const totalAmount = (selectedProduct.price || 0) * quantity
        setNewTransaction(prev => ({
          ...prev,
          amount: totalAmount.toString()
        }))
      }
      prevQuantityRef.current = newTransaction.quantity
    } else if (!newTransaction.quantity && selectedProduct) {
      // Wyczyść kwotę jeśli nie ma ilości
      setNewTransaction(prev => ({
        ...prev,
        amount: ''
      }))
    }
  }, [newTransaction.quantity, selectedProduct]) // Uproszczone zależności

  // Handlers - useCallback z pustymi zależnościami
  const handleCategoryChange = useCallback((value) => {
    setNewTransaction(prev => {
      if (prev.category === value) return prev
      return {
        type: 'income',
        category: value,
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        productId: '',
        quantity: '',
        unit: ''
      }
    })
    setSelectedProduct(null)
  }, [])

  const handleProductChange = useCallback((productId) => {
    if (newTransaction.productId === productId) return
    
    setNewTransaction(prev => ({
      ...prev,
      productId: productId,
      quantity: '',
      amount: ''
    }))
  }, [newTransaction.productId])

  const handleQuantityChange = useCallback((e) => {
    const value = e.target.value
    setNewTransaction(prev => ({
      ...prev,
      quantity: value
    }))
  }, [])

  const handleAmountChange = useCallback((e) => {
    const value = e.target.value
    setNewTransaction(prev => ({
      ...prev,
      amount: value
    }))
  }, [])

  const handleDescriptionChange = useCallback((e) => {
    const value = e.target.value
    setNewTransaction(prev => ({
      ...prev,
      description: value
    }))
  }, [])

  const handleDateChange = useCallback((e) => {
    const value = e.target.value
    setNewTransaction(prev => ({
      ...prev,
      date: value
    }))
  }, [])

  const handleAddTransaction = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Walidacja
      if (!newTransaction.category || !newTransaction.amount || !newTransaction.description) {
        alert('Proszę wypełnić wszystkie pola')
        setLoading(false)
        return
      }

      // Dodatkowa walidacja dla sprzedaży plonów
      if (newTransaction.category === 'sprzedaz_plonow') {
        if (!newTransaction.productId || !newTransaction.quantity) {
          alert('Proszę wybrać produkt z magazynu i podać ilość')
          setLoading(false)
          return
        }
        
        const quantity = parseFloat(newTransaction.quantity)
        if (isNaN(quantity) || quantity <= 0) {
          alert('Proszę podać poprawną ilość')
          setLoading(false)
          return
        }

        // Sprawdź czy mamy wystarczającą ilość
        if (selectedProduct && quantity > (selectedProduct.quantity || 0)) {
          alert(`Nie masz wystarczającej ilości w magazynie! Dostępne: ${formatNumber(selectedProduct.quantity)} ${selectedProduct.unit}`)
          setLoading(false)
          return
        }
      }

      // Przygotuj dane transakcji
      const transactionData = {
      type: 'income',
      category: newTransaction.category,
      amount: parseFloat(newTransaction.amount),
      description: newTransaction.description,
      date: newTransaction.date
    }

      // Dodaj dane magazynowe dla sprzedaży plonów
      if (newTransaction.category === 'sprzedaz_plonow' && selectedProduct) {
      transactionData.productId = newTransaction.productId
      transactionData.quantity = parseFloat(newTransaction.quantity)
      transactionData.productName = selectedProduct.name
      transactionData.unit = selectedProduct.unit
      transactionData.source = 'warehouse'
      transactionData.unitPrice = selectedProduct.price || 0
    }

      // Dodaj transakcję
      const result = await addTransaction(transactionData)
      
      if (result.success) {
        // Reset formularza
        setShowAddForm(false)
        setNewTransaction({
          type: 'income',
          category: '',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          productId: '',
          quantity: '',
          unit: ''
        })
        setSelectedProduct(null)
        setAvailableProducts([])
        
        // Komunikat sukcesu
        if (newTransaction.category === 'sprzedaz_plonow') {
          alert(`✅ Sprzedaż zarejestrowana! Sprzedano ${newTransaction.quantity} ${selectedProduct.unit} ${selectedProduct.name}`)
        } else {
          alert('✅ Przychód został dodany!')
        }
      } else {
        alert('Błąd przy dodawaniu transakcji: ' + result.error)
      }
    } catch (error) {
      console.error('Błąd:', error)
      alert('Wystąpił nieoczekiwany błąd: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const totalIncome = useMemo(() => 
    transactions.reduce((sum, t) => sum + t.amount, 0), 
    [transactions]
  )

  // Reset form on close
  const handleCloseForm = useCallback(() => {
    if (!loading) {
      setShowAddForm(false)
      setNewTransaction({
        type: 'income',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        productId: '',
        quantity: '',
        unit: ''
      })
      setSelectedProduct(null)
    }
  }, [loading])

  return (
    <div className="income-tab">
      <div className="tab-header">
        <h3>Przychody</h3>
        <div className="tab-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
            disabled={loading}
          >
            + Dodaj przychód
          </button>
        </div>
      </div>

      <div className="total-summary">
        Łączne przychody: <strong>{formatCurrency(totalIncome)}</strong>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Dodaj nowy przychód</h4>
              <button 
                className="close-btn" 
                onClick={handleCloseForm}
                disabled={loading}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddTransaction}>
              <div className="form-group">
                <label>Kategoria *</label>
                <CustomSelect
                  options={categoryOptions}
                  value={newTransaction.category}
                  onChange={handleCategoryChange}
                  placeholder="Wybierz kategorię..."
                  searchable={true}
                  disabled={loading}
                />
              </div>

              {/* SEKCJA MAGAZYNOWA DLA SPRZEDAŻY PLONÓW */}
              {newTransaction.category === 'sprzedaz_plonow' && (
                <div className="warehouse-section">
                  <div className="section-header">
                    <span className="section-icon">📦</span>
                    <span className="section-title">Produkt z magazynu</span>
                  </div>
                  
                  <div className="form-group">
                    <label>Wybierz produkt *</label>
                    <CustomSelect
                      options={productOptions}
                      value={newTransaction.productId}
                      onChange={handleProductChange}
                      placeholder="Wybierz produkt do sprzedaży..."
                      searchable={true}
                      disabled={loading || availableProducts.length === 0}
                    />
                    {availableProducts.length === 0 && (
                      <div className="form-hint warning">
                        ⚠️ Brak dostępnych produktów do sprzedaży w magazynie
                      </div>
                    )}
                  </div>

                  {selectedProduct && (
    <>
        <div className="product-info-card">
            <div className="product-header">
                <span className="product-icon">
                    {warehouseCategories.find(cat => cat.id === selectedProduct.category)?.icon || '📦'}
                </span>
                <div className="product-details">
                    <h5>{selectedProduct.name}</h5>
                    <div className="product-stats">
                        <span className="stat">
                            <strong>Dostępne:</strong> {formatNumber(selectedProduct.quantity)} {selectedProduct.unit}
                        </span>
                        <span className="stat">
                            <strong>Cena:</strong> {formatCurrency(selectedProduct.price || 0)}/{selectedProduct.unit}
                        </span>
                    </div>
                </div>
                
                {/* PODGLĄD ZAMÓWIENIA - dodany tutaj */}
                {newTransaction.quantity && parseFloat(newTransaction.quantity) > 0 && (
                    <div className="order-preview-side">
                        <div className="preview-summary">
                            <div className="preview-row">
                                <span className="label">Ilość:</span>
                                <span className="value">
                                    {formatNumber(newTransaction.quantity)} {selectedProduct.unit}
                                </span>
                            </div>
                            <div className="preview-row">
                                <span className="label">Wartość:</span>
                                <span className="value amount-positive">
                                    {formatCurrency((selectedProduct.price || 0) * parseFloat(newTransaction.quantity))}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="form-group">
            <label>Ilość do sprzedaży ({selectedProduct.unit}) *</label>
            <div className="quantity-input-group">
                <input 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    max={selectedProduct.quantity}
                    value={newTransaction.quantity}
                    onChange={handleQuantityChange}
                    required
                    disabled={loading}
                    className="quantity-input"
                />
                <span className="quantity-unit">{selectedProduct.unit}</span>
            </div>
        </div>
    </>
)}

                  
                </div>
              )}

              {/* KWOTA DLA INNYCH KATEGORII */}
              {newTransaction.category !== 'sprzedaz_plonow' && (
                <div className="form-group">
                  <label>Kwota (zł) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={handleAmountChange}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Opis *</label>
                <input 
                  type="text" 
                  value={newTransaction.description}
                  onChange={handleDescriptionChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Data</label>
                <input 
                  type="date" 
                  value={newTransaction.date}
                  onChange={handleDateChange}
                  disabled={loading}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleCloseForm}
                  disabled={loading}
                >
                  Anuluj
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Przetwarzanie...' : newTransaction.category === 'sprzedaz_plonow' ? 'Zarejestruj sprzedaż' : 'Dodaj przychód'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABELA TRANSAKCJI */}
      <div className="transactions-table">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Kategoria</th>
              <th>Opis</th>
              <th>Kwota</th>
              <th>Produkt</th>
              <th>Źródło</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => {
              const categoryInfo = incomeCategories.find(cat => cat.id === transaction.category)
              return (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.date).toLocaleDateString('pl-PL')}</td>
                  <td>
                    <span className="category-with-icon">
                      <span className="icon" style={{ color: categoryInfo?.color }}>
                        {categoryInfo?.icon || '💰'}
                      </span>
                      {categoryInfo?.name || transaction.category}
                    </span>
                  </td>
                  <td>{transaction.description}</td>
                  <td className="amount positive">+{formatCurrency(transaction.amount)}</td>
                  <td>
                    {transaction.productName ? (
                      <span className="product-badge">
                        {transaction.productName}
                        {transaction.quantity && ` (${transaction.quantity} ${transaction.unit})`}
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    {transaction.source === 'warehouse' ? (
                      <span className="warehouse-badge">Magazyn</span>
                    ) : transaction.autoGenerated ? (
                      <span className="auto-badge">Auto</span>
                    ) : (
                      <span className="manual-badge">Ręczne</span>
                    )}
                  </td>
                </tr>
              )
            })}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="6" className="no-data">
                  Brak transakcji przychodowych
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default React.memo(IncomeTab)