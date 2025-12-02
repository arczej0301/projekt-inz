// components/Finance/BudgetTab.jsx
import React, { useState, useMemo } from 'react'
import { useFinance } from '../../hooks/useFinance'
import { useWarehouse } from '../../hooks/useWarehouse'
import CustomSelect from '../CustomSelect'
import './FinanceComponents.css'

const BudgetTab = () => {
  const { 
    budgets, 
    transactions, 
    expenseCategories, 
    incomeCategories,
    addBudget, 
    updateBudget, 
    addTransaction,
    getBudgetsWithStatus,
    categoryMapping,
    reverseCategoryMapping
  } = useFinance()
  
  const { warehouseData, categories: warehouseCategories, updateStock } = useWarehouse()
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    description: ''
  })

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

  // Mapowanie kategorii magazynowych na budżetowe
  const getBudgetCategoryFromWarehouse = (warehouseCategory) => {
    const warehouseToBudgetMap = {
      'zboza': 'food',
      'mleko': 'food', 
      'nawozy': 'supplies',
      'paliwo': 'transport',
      'pasze': 'supplies',
      'warzywa': 'food',
      'owoce': 'food',
      'narzedzia': 'tools'
    }
    return warehouseToBudgetMap[warehouseCategory] || 'other'
  }

  // Mapowanie odwrotne - kategorie budżetowe na magazynowe
  const getWarehouseCategoriesFromBudget = (budgetCategory) => {
    const budgetToWarehouseMap = {
      'food': ['zboza', 'mleko', 'warzywa', 'owoce'],
      'supplies': ['nawozy', 'pasze'],
      'transport': ['paliwo'],
      'tools': ['narzedzia'],
      'animals': [],
      'maintenance': [],
      'taxes': [],
      'other': []
    }
    return budgetToWarehouseMap[budgetCategory] || []
  }

  // Przygotuj opcje dla CustomSelect - kategorie budżetowe
  const budgetCategoryOptions = useMemo(() => {
    return [
      { value: 'food', label: '🍎 Żywność i plony', icon: '🍎', color: '#4caf50' },
      { value: 'supplies', label: '📦 Zaopatrzenie', icon: '📦', color: '#ff9800' },
      { value: 'transport', label: '⛽ Transport', icon: '⛽', color: '#f44336' },
      { value: 'tools', label: '🛠️ Narzędzia i sprzęt', icon: '🛠️', color: '#607d8b' },
      { value: 'animals', label: '🐄 Zwierzęta', icon: '🐄', color: '#795548' },
      { value: 'maintenance', label: '🔧 Naprawy i konserwacja', icon: '🔧', color: '#ff5722' },
      { value: 'taxes', label: '🏛️ Podatki i opłaty', icon: '🏛️', color: '#3f51b5' },
      { value: 'other', label: '💰 Inne', icon: '💰', color: '#9c27b0' }
    ]
  }, [])

  const periodOptions = [
    { value: 'monthly', label: '📅 Miesięczny', icon: '📅' },
    { value: 'quarterly', label: '📊 Kwartalny', icon: '📊' },
    { value: 'yearly', label: '📈 Roczne', icon: '📈' }
  ]

  // Pobierz budżety z aktualnym statusem
  const budgetsWithStatus = useMemo(() => {
    return getBudgetsWithStatus()
  }, [budgets, transactions, getBudgetsWithStatus])

  // Obliczenia magazynowe dla każdego budżetu
  const budgetsWithInventoryData = useMemo(() => {
    return budgetsWithStatus.map(budget => {
      // Znajdź powiązane kategorie magazynowe
      const relatedWarehouseCategories = getWarehouseCategoriesFromBudget(budget.category)
      
      // Zbierz wszystkie produkty z powiązanych kategorii
      let categoryInventory = []
      let totalInventoryValue = 0
      let lowStockItems = []
      let estimatedRestockCost = 0
      
      if (relatedWarehouseCategories.length > 0) {
        relatedWarehouseCategories.forEach(catId => {
          const items = warehouseData[catId] || []
          categoryInventory = [...categoryInventory, ...items]
        })
        
        // Oblicz wartość magazynu
        totalInventoryValue = categoryInventory.reduce((sum, item) => 
          sum + ((item.quantity || 0) * (item.price || 0)), 0
        )
        
        // Znajdź produkty z niskim stanem
        lowStockItems = categoryInventory.filter(item => 
          (item.quantity || 0) < (item.minStock || 0)
        )
        
        // Oblicz koszt uzupełnienia
        estimatedRestockCost = lowStockItems.reduce((sum, item) => 
          sum + (((item.minStock || 0) - (item.quantity || 0)) * (item.price || 0)), 0
        )
      }
      
      // Znajdź transakcje powiązane z magazynem dla tego budżetu
      const inventoryTransactions = transactions.filter(t => 
        t.budgetCategory === budget.category && 
        (t.inventoryRelated === true || t.source === 'warehouse')
      )
      
      const purchaseExpenses = inventoryTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0)
      
      const salesIncome = inventoryTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0)
      
      return {
        ...budget,
        categoryInventory,
        totalInventoryValue,
        lowStockItems: lowStockItems.length,
        lowStockProducts: lowStockItems,
        estimatedRestockCost,
        inventoryTransactions,
        purchaseExpenses,
        salesIncome,
        relatedWarehouseCategories: relatedWarehouseCategories.map(id => 
          warehouseCategories.find(cat => cat.id === id)?.name || id
        ),
        hasWarehouseIntegration: relatedWarehouseCategories.length > 0
      }
    })
  }, [budgetsWithStatus, warehouseData, warehouseCategories, transactions])

  // PODSUMOWANIE MAGAZYNOWE
  const inventorySummary = useMemo(() => {
    const allInventory = Object.values(warehouseData).flat()
    const totalInventoryValue = allInventory.reduce((sum, item) => 
      sum + ((item.quantity || 0) * (item.price || 0)), 0
    )
    
    const lowStockItems = allInventory.filter(item => 
      (item.quantity || 0) < (item.minStock || 0)
    )
    
    const totalEstimatedRestockCost = lowStockItems.reduce((sum, item) => 
      sum + (((item.minStock || 0) - (item.quantity || 0)) * (item.price || 0)), 0
    )

    return {
      totalInventoryValue,
      totalLowStockItems: lowStockItems.length,
      totalEstimatedRestockCost
    }
  }, [warehouseData])

  const handleAddBudget = async (e) => {
    e.preventDefault()
    
    if (!newBudget.category || !newBudget.amount) {
      alert('Proszę wypełnić wszystkie wymagane pola')
      return
    }

    const result = await addBudget(newBudget)
    if (result.success) {
      setShowAddForm(false)
      setNewBudget({
        category: '',
        amount: '',
        period: 'monthly',
        description: ''
      })
    } else {
      alert('Błąd przy dodawaniu budżetu: ' + result.error)
    }
  }

  // FUNKCJA DO AUTOMATYCZNEGO ZAKUPU PRODUKTU Z BUDŻETU
  const handleAutoPurchase = async (budget, product, quantityToBuy) => {
    const totalCost = quantityToBuy * (product.price || 0)
    
    if (totalCost > budget.remaining) {
      alert(`Brak środków w budżecie! Potrzeba: ${formatCurrency(totalCost)}, dostępne: ${formatCurrency(budget.remaining)}`)
      return
    }

    // 1. Znajdź kategorię transakcji dla tego produktu
    let transactionCategory = 'inne_koszty'
    
    // Mapuj kategorię magazynową na finansową
    const warehouseCategory = product.category
    if (warehouseCategory === 'zboza' || warehouseCategory === 'warzywa' || warehouseCategory === 'owoce') {
      transactionCategory = 'nasiona'
    } else if (warehouseCategory === 'nawozy') {
      transactionCategory = 'nawozy'
    } else if (warehouseCategory === 'pasze') {
      transactionCategory = 'pasze'
    } else if (warehouseCategory === 'paliwo') {
      transactionCategory = 'paliwo'
    } else if (warehouseCategory === 'narzedzia') {
      transactionCategory = 'sprzet_czesci'
    }

    // 2. Dodaj transakcję wydatku
    const transactionResult = await addTransaction({
      type: 'expense',
      category: transactionCategory,
      amount: totalCost,
      description: `Zakup: ${product.name} - ${quantityToBuy} ${product.unit || 'szt.'}`,
      date: new Date().toISOString().split('T')[0],
      inventoryRelated: true,
      productId: product.id,
      source: 'warehouse'
    })

    if (!transactionResult.success) {
      alert('Błąd przy rejestrowaniu transakcji: ' + transactionResult.error)
      return
    }

    // 3. Zaktualizuj stan magazynowy
    const newQuantity = (product.quantity || 0) + quantityToBuy
    const stockResult = await updateStock(product.id, newQuantity, 'purchase')

    if (!stockResult.success) {
      alert('Błąd przy aktualizacji magazynu: ' + stockResult.error)
      return
    }

    alert(`✅ Zakup zrealizowany! Dodano ${quantityToBuy} ${product.unit || 'szt.'} ${product.name} do magazynu.`)
  }

  // FUNKCJA DO SPRZEDAŻY PRODUKTU Z MAGAZYNU
  const handleAutoSale = async (budget, product, quantityToSell) => {
    if (quantityToSell > (product.quantity || 0)) {
      alert(`Niewystarczająca ilość w magazynie! Dostępne: ${product.quantity || 0} ${product.unit || 'szt.'}`)
      return
    }

    const totalIncome = quantityToSell * (product.price || 0)
    
    // 1. Znajdź kategorię transakcji dla tego produktu
    let transactionCategory = 'inne_przychody'
    
    // Mapuj kategorię magazynową na finansową
    const warehouseCategory = product.category
    if (warehouseCategory === 'zboza' || warehouseCategory === 'warzywa' || warehouseCategory === 'owoce') {
      transactionCategory = 'sprzedaz_plonow'
    } else if (warehouseCategory === 'mleko') {
      transactionCategory = 'produkty_zwierzece'
    }

    // 2. Dodaj transakcję przychodu
    const transactionResult = await addTransaction({
      type: 'income',
      category: transactionCategory,
      amount: totalIncome,
      description: `Sprzedaż: ${product.name} - ${quantityToSell} ${product.unit || 'szt.'}`,
      date: new Date().toISOString().split('T')[0],
      inventoryRelated: true,
      productId: product.id,
      source: 'warehouse'
    })

    if (!transactionResult.success) {
      alert('Błąd przy rejestrowaniu transakcji: ' + transactionResult.error)
      return
    }

    // 3. Zaktualizuj stan magazynowy
    const newQuantity = (product.quantity || 0) - quantityToSell
    const stockResult = await updateStock(product.id, newQuantity, 'sale')

    if (!stockResult.success) {
      alert('Błąd przy aktualizacji magazynu: ' + stockResult.error)
      return
    }

    alert(`✅ Sprzedaż zrealizowana! Sprzedano ${quantityToSell} ${product.unit || 'szt.'} ${product.name}.`)
  }

  // Znajdź kategorię budżetową dla wyświetlania
  const getBudgetCategoryInfo = (categoryId) => {
    return budgetCategoryOptions.find(cat => cat.value === categoryId) || 
           { label: categoryId, icon: '💰', color: '#9c27b0' }
  }

  return (
    <div className="budget-tab">
      <div className="tab-header">
        <h3>Budżet Magazynowy</h3>
        <div className="tab-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(true)}
          >
            + Nowy budżet
          </button>
        </div>
      </div>

      {/* PODSUMOWANIE MAGAZYNOWE */}
      <div className="inventory-summary-cards">
        <div className="summary-card inventory-value">
          <div className="card-icon">📦</div>
          <div className="card-content">
            <div className="card-label">Wartość magazynu</div>
            <div className="card-amount">{formatCurrency(inventorySummary.totalInventoryValue)}</div>
          </div>
        </div>
        
        <div className="summary-card low-stock">
          <div className="card-icon">⚠️</div>
          <div className="card-content">
            <div className="card-label">Produkty do uzupełnienia</div>
            <div className="card-amount">{inventorySummary.totalLowStockItems} szt.</div>
          </div>
        </div>
        
        <div className="summary-card restock-cost">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <div className="card-label">Szacowany koszt uzupełnienia</div>
            <div className="card-amount">{formatCurrency(inventorySummary.totalEstimatedRestockCost)}</div>
          </div>
        </div>
      </div>

      {/* Formularz dodawania budżetu */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Dodaj nowy budżet magazynowy</h4>
              <button className="close-btn" onClick={() => setShowAddForm(false)}>×</button>
            </div>
            <form onSubmit={handleAddBudget}>
              <div className="form-group">
                <label>Kategoria budżetu *</label>
                <CustomSelect
                  options={budgetCategoryOptions}
                  value={newBudget.category}
                  onChange={(value) => setNewBudget(prev => ({...prev, category: value}))}
                  placeholder="Wybierz kategorię..."
                  searchable={true}
                />
                <div className="form-hint">
                  {newBudget.category && reverseCategoryMapping[newBudget.category] && (
                    <span>
                      Powiązane kategorie transakcji: {reverseCategoryMapping[newBudget.category].join(', ')}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Budżet na okres (zł) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={newBudget.amount}
                  onChange={(e) => setNewBudget(prev => ({...prev, amount: e.target.value}))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Okres</label>
                <CustomSelect
                  options={periodOptions}
                  value={newBudget.period}
                  onChange={(value) => setNewBudget(prev => ({...prev, period: value}))}
                  placeholder="Wybierz okres..."
                />
              </div>

              <div className="form-group">
                <label>Opis (opcjonalnie)</label>
                <input 
                  type="text" 
                  value={newBudget.description}
                  onChange={(e) => setNewBudget(prev => ({...prev, description: e.target.value}))}
                  placeholder="np. 'Budżet na zakup nasion na wiosnę'"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                  Anuluj
                </button>
                <button type="submit" className="btn btn-primary">
                  Dodaj budżet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista budżetów z danymi magazynowymi */}
      <div className="budgets-list">
        {budgetsWithInventoryData.length === 0 ? (
          <div className="no-data">
            <p>Brak zdefiniowanych budżetów magazynowych</p>
            <p>Dodaj pierwszy budżet, aby zarządzać zakupami</p>
          </div>
        ) : (
          budgetsWithInventoryData.map(budget => {
            const categoryInfo = getBudgetCategoryInfo(budget.category)
            
            return (
              <div key={budget.id} className="budget-item">
                <div className="budget-header">
                  <div className="budget-category">
                    <span 
                      className="category-icon"
                      style={{ color: categoryInfo.color }}
                    >
                      {categoryInfo.icon}
                    </span>
                    <div>
                      <div className="category-name">{categoryInfo.label}</div>
                      <div className="budget-period">
                        {budget.period === 'monthly' ? 'Miesięczny' : 
                         budget.period === 'quarterly' ? 'Kwartalny' : 'Roczny'}
                      </div>
                      <div className="budget-stats">
                        <small>
                          Wydano: {formatCurrency(budget.spent)} / 
                          Budżet: {formatCurrency(budget.amount)}
                        </small>
                      </div>
                    </div>
                  </div>
                  <div className="budget-amounts">
                    <div className="budget-total">{formatCurrency(budget.amount)}</div>
                    <div className={`budget-remaining ${budget.remaining < 0 ? 'negative' : 'positive'}`}>
                      Pozostało: {formatCurrency(budget.remaining)}
                    </div>
                  </div>
                </div>

                {/* INFORMACJE MAGAZYNOWE */}
                {budget.hasWarehouseIntegration && (
                  <div className="inventory-info">
                    <div className="inventory-stats">
                      <div className="stat-item">
                        <span className="stat-label">Produkty w magazynie:</span>
                        <span className="stat-value">{budget.categoryInventory.length} szt.</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Wartość magazynu:</span>
                        <span className="stat-value">{formatCurrency(budget.totalInventoryValue)}</span>
                      </div>
                      {budget.lowStockItems > 0 && (
                        <div className="stat-item warning">
                          <span className="stat-label">Wymaga uzupełnienia:</span>
                          <span className="stat-value">{budget.lowStockItems} szt.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PROGRES BUDŻETU */}
                <div className="budget-progress">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${budget.status}`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="progress-info">
                    <span>{budget.percentage.toFixed(1)}% wykorzystane</span>
                    <span>Wydano: {formatCurrency(budget.spent)}</span>
                  </div>
                </div>

                {/* SUGESTIE ZAKUPÓW */}
                {budget.lowStockProducts && budget.lowStockProducts.length > 0 && (
                  <div className="purchase-suggestions">
                    <div className="suggestion-header">
                      <span className="suggestion-icon">🛒</span>
                      <span className="suggestion-title">Produkty do zakupu</span>
                    </div>
                    {budget.lowStockProducts.map(product => {
                      const quantityToBuy = (product.minStock || 0) - (product.quantity || 0)
                      const totalCost = quantityToBuy * (product.price || 0)
                      
                      return (
                        <div key={product.id} className="purchase-item">
                          <div className="product-info">
                            <span className="product-name">{product.name}</span>
                            <span className="product-details">
                              Potrzeba: {quantityToBuy} {product.unit || 'szt.'} × {formatCurrency(product.price || 0)}
                            </span>
                          </div>
                          <div className="purchase-actions">
                            <span className="product-cost">{formatCurrency(totalCost)}</span>
                            <button 
                              className="btn-buy"
                              onClick={() => handleAutoPurchase(budget, product, quantityToBuy)}
                              disabled={totalCost > budget.remaining}
                            >
                              Kup
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* TRANSAKCJE POWIĄZANE */}
                <div className="budget-transactions">
                  <h5>Ostatnie transakcje ({budget.relatedTransactions.length}):</h5>
                  {budget.relatedTransactions.length === 0 ? (
                    <div className="no-transactions">
                      Brak transakcji w tym miesiącu
                    </div>
                  ) : (
                    budget.relatedTransactions.map(transaction => (
                      <div key={transaction.id} className="transaction-mini">
                        <div className="transaction-info">
                          <span>{transaction.description || 'Brak opisu'}</span>
                          <span className="transaction-date">
                            {transaction.date?.toLocaleDateString?.() || 'Brak daty'}
                          </span>
                        </div>
                        <span className={`amount ${transaction.type}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {budget.description && (
                  <div className="budget-description">
                    {budget.description}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default BudgetTab