// components/Finance/BudgetTab.jsx - tylko fragment z funkcjami formatującymi
import React, { useState, useMemo } from 'react'
import { useFinance } from '../../hooks/useFinance'
import { useWarehouse } from '../../hooks/useWarehouse'
import CustomSelect from '../CustomSelect'
import './FinanceComponents.css'

const BudgetTab = ({ budgets, transactions }) => {
  const { expenseCategories, addBudget, updateBudget, addTransaction } = useFinance()
  const { warehouseData, categories, updateStock, addProduct } = useWarehouse()
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

  // Mapowanie kategorii magazynowych na finansowe
  const getFinancialCategory = (warehouseCategory) => {
    const categoryMap = {
      'zboza': 'food',
      'mleko': 'food', 
      'nawozy': 'supplies',
      'paliwo': 'transport',
      'pasze': 'supplies',
      'warzywa': 'food',
      'owoce': 'food',
      'narzedzia': 'tools'
    }
    return categoryMap[warehouseCategory] || 'other-expenses'
  }

  // Mapowanie kategorii finansowych na magazynowe
  const getWarehouseCategories = (financialCategory) => {
    const reverseMap = {
      'food': ['zboza', 'mleko', 'warzywa', 'owoce'],
      'supplies': ['nawozy', 'pasze'],
      'transport': ['paliwo'],
      'tools': ['narzedzia'],
      'other-expenses': []
    }
    return reverseMap[financialCategory] || []
  }

  // Przygotuj opcje dla CustomSelect
  const categoryOptions = useMemo(() => {
    if (!expenseCategories || expenseCategories.length === 0) {
      return [
        { value: 'food', label: 'Żywność', icon: '🍎' },
        { value: 'supplies', label: 'Zaopatrzenie', icon: '📦' },
        { value: 'transport', label: 'Transport', icon: '⛽' },
        { value: 'tools', label: 'Narzędzia', icon: '🛠️' },
        { value: 'other-expenses', label: 'Inne wydatki', icon: '💰' }
      ]
    }

    return expenseCategories
      .filter(cat => cat && cat.id && cat.name)
      .map(cat => ({
        value: cat.id,
        label: cat.name,
        icon: cat.icon || '💰'
      }))
  }, [expenseCategories])

  const periodOptions = [
    { value: 'monthly', label: 'Miesięczny', icon: '📅' },
    { value: 'quarterly', label: 'Kwartalny', icon: '📊' },
    { value: 'yearly', label: 'Roczny', icon: '📈' }
  ]

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
    
    if (totalCost > budget.availableForPurchases) {
      alert(`Brak środków w budżecie! Potrzeba: ${formatCurrency(totalCost)}, dostępne: ${formatCurrency(budget.availableForPurchases)}`)
      return
    }

    // 1. Dodaj transakcję wydatku
    const transactionResult = await addTransaction({
      type: 'expense',
      category: budget.category,
      amount: totalCost,
      description: `Zakup: ${product.name} - ${quantityToBuy} ${product.unit}`,
      date: new Date().toISOString().split('T')[0],
      inventoryRelated: true,
      productId: product.id
    })

    if (!transactionResult.success) {
      alert('Błąd przy rejestrowaniu transakcji: ' + transactionResult.error)
      return
    }

    // 2. Zaktualizuj stan magazynowy
    const newQuantity = (product.quantity || 0) + quantityToBuy
    const stockResult = await updateStock(product.id, newQuantity, 'purchase')

    if (!stockResult.success) {
      alert('Błąd przy aktualizacji magazynu: ' + stockResult.error)
      return
    }

    alert(`✅ Zakup zrealizowany! Dodano ${quantityToBuy} ${product.unit} ${product.name} do magazynu.`)
  }

  // FUNKCJA DO SPRZEDAŻY PRODUKTU Z MAGAZYNU
  const handleAutoSale = async (budget, product, quantityToSell) => {
    if (quantityToSell > product.quantity) {
      alert(`Niewystarczająca ilość w magazynie! Dostępne: ${product.quantity} ${product.unit}`)
      return
    }

    const totalIncome = quantityToSell * (product.price || 0)
    
    // 1. Dodaj transakcję przychodu
    const transactionResult = await addTransaction({
      type: 'income',
      category: budget.category,
      amount: totalIncome,
      description: `Sprzedaż: ${product.name} - ${quantityToSell} ${product.unit}`,
      date: new Date().toISOString().split('T')[0],
      inventoryRelated: true,
      productId: product.id
    })

    if (!transactionResult.success) {
      alert('Błąd przy rejestrowaniu transakcji: ' + transactionResult.error)
      return
    }

    // 2. Zaktualizuj stan magazynowy
    const newQuantity = product.quantity - quantityToSell
    const stockResult = await updateStock(product.id, newQuantity, 'sale')

    if (!stockResult.success) {
      alert('Błąd przy aktualizacji magazynu: ' + stockResult.error)
      return
    }

    alert(`✅ Sprzedaż zrealizowana! Sprzedano ${quantityToSell} ${product.unit} ${product.name}.`)
  }

  // OBLICZENIA POWIĄZANE Z MAGAZYNEM
  const budgetsWithInventoryData = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    return budgets.map(budget => {
      // Znajdź produkty w magazynie powiązane z tą kategorią budżetu
      const relatedWarehouseCategories = getWarehouseCategories(budget.category)
      const categoryInventory = relatedWarehouseCategories.flatMap(catId => 
        warehouseData[catId] || []
      )

      // Wydatki na zakupy dla tej kategorii (związane z magazynem)
      const purchaseExpenses = transactions
        .filter(t => t.type === 'expense' && 
          t.category === budget.category &&
          t.date?.getMonth?.() === currentMonth &&
          t.date?.getFullYear?.() === currentYear &&
          t.inventoryRelated === true)
        .reduce((sum, t) => sum + t.amount, 0)

      // Przychody ze sprzedaży dla tej kategorii (związane z magazynem)
      const salesIncome = transactions
        .filter(t => t.type === 'income' && 
          t.category === budget.category &&
          t.date?.getMonth?.() === currentMonth &&
          t.date?.getFullYear?.() === currentYear &&
          t.inventoryRelated === true)
        .reduce((sum, t) => sum + t.amount, 0)

      // Obliczenia magazynowe
      const totalInventoryValue = categoryInventory.reduce((sum, item) => 
        sum + (item.quantity * (item.price || 0)), 0
      )

      const lowStockItems = categoryInventory.filter(item => 
        item.quantity < item.minStock
      )
      
      const estimatedRestockCost = lowStockItems.reduce((sum, item) => 
        sum + ((item.minStock - item.quantity) * (item.price || 0)), 0
      )

      // Produkty do sprzedaży (nadmiarowe)
      const excessStockItems = categoryInventory.filter(item => 
        item.quantity > item.minStock * 2
      )

      // Dynamiczny budżet uwzględniający magazyn
      const dynamicBudget = parseFloat(budget.amount) + salesIncome - purchaseExpenses
      const availableForPurchases = Math.max(0, dynamicBudget - purchaseExpenses)
      const percentage = dynamicBudget > 0 ? (purchaseExpenses / dynamicBudget) * 100 : 0

      return {
        ...budget,
        purchaseExpenses,
        salesIncome,
        dynamicBudget,
        availableForPurchases,
        percentage,
        initialAmount: parseFloat(budget.amount),
        inventoryItems: categoryInventory.length,
        totalInventoryValue,
        lowStockItems: lowStockItems.length,
        estimatedRestockCost,
        excessStockItems: excessStockItems.length,
        relatedWarehouseCategories: relatedWarehouseCategories.map(id => 
          categories.find(cat => cat.id === id)?.name || id
        ),
        categoryInventory, // Dodajemy pełną listę produktów
        lowStockProducts: lowStockItems, // Produkty wymagające uzupełnienia
        excessStockProducts: excessStockItems // Produkty nadmiarowe
      }
    })
  }, [budgets, transactions, warehouseData, categories])

  // PODSUMOWANIE MAGAZYNOWE
  const inventorySummary = useMemo(() => {
    const allInventory = Object.values(warehouseData).flat()
    const totalInventoryValue = allInventory.reduce((sum, item) => 
      sum + (item.quantity * (item.price || 0)), 0
    )
    
    const lowStockItems = allInventory.filter(item => 
      item.quantity < item.minStock
    )
    
    const totalEstimatedRestockCost = lowStockItems.reduce((sum, item) => 
      sum + ((item.minStock - item.quantity) * (item.price || 0)), 0
    )

    return {
      totalInventoryValue,
      totalLowStockItems: lowStockItems.length,
      totalEstimatedRestockCost
    }
  }, [warehouseData])

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
            <div className="card-amount">{inventorySummary.totalEstimatedRestockCost.toFixed(2)} zł</div>
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
                <label>Kategoria *</label>
                <CustomSelect
                  options={categoryOptions}
                  value={newBudget.category}
                  onChange={(value) => setNewBudget(prev => ({...prev, category: value}))}
                  placeholder="Wybierz kategorię..."
                  searchable={true}
                />
                <div className="form-hint">
                  Wybierz kategorię finansową powiązaną z magazynem
                </div>
              </div>

              <div className="form-group">
                <label>Budżet na zakupy (zł) *</label>
                <input 
                  type="number" 
                  step="0.01"
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
            const category = expenseCategories.find(cat => cat.id === budget.category)
            const status = budget.percentage > 100 ? 'exceeded' : 
                          budget.percentage > 80 ? 'warning' : 'good'

            return (
              <div key={budget.id} className="budget-item">
                <div className="budget-header">
                  <div className="budget-category">
                    <span className="category-icon">{category?.icon || '📦'}</span>
                    <div>
                      <div className="category-name">{category?.name || budget.category}</div>
                      <div className="budget-period">{budget.period}</div>
                      {budget.relatedWarehouseCategories.length > 0 && (
                        <div className="related-categories">
                          Powiązane kategorie: {budget.relatedWarehouseCategories.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="budget-amounts">
                    <div className="budget-total">{formatCurrency(budget.dynamicBudget)}</div>
                    <div className="budget-available">Dostępne: {formatCurrency(budget.availableForPurchases)}</div>
                  </div>
                </div>

                {/* INFORMACJE MAGAZYNOWE */}
                {budget.inventoryItems > 0 && (
                  <div className="inventory-info">
                    <div className="inventory-stats">
                      <div className="stat-item">
                        <span className="stat-label">Produkty w magazynie:</span>
                        <span className="stat-value">{budget.inventoryItems} szt.</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Wartość magazynu:</span>
                        <span className="stat-value">{budget.totalInventoryValue.toFixed(2)} zł</span>
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
                      className={`progress-fill ${status}`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="progress-info">
                    <span>{budget.percentage.toFixed(1)}% wykorzystane</span>
                    <span>Wydano: {budget.purchaseExpenses.toFixed(2)} zł</span>
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
                      const quantityToBuy = product.minStock - product.quantity
                      const totalCost = quantityToBuy * (product.price || 0)
                      
                      return (
                        <div key={product.id} className="purchase-item">
                          <div className="product-info">
                            <span className="product-name">{product.name}</span>
                            <span className="product-details">
                              Potrzeba: {quantityToBuy} {product.unit} × {product.price?.toFixed(2) || '0.00'} zł
                            </span>
                          </div>
                          <div className="purchase-actions">
                            <span className="product-cost">{formatCurrency(totalCost)}</span>
                            <button 
                              className="btn-buy"
                              onClick={() => handleAutoPurchase(budget, product, quantityToBuy)}
                              disabled={totalCost > budget.availableForPurchases}
                            >
                              Kup
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* SUGESTIE SPRZEDAŻY */}
                {budget.excessStockProducts && budget.excessStockProducts.length > 0 && (
                  <div className="sale-suggestions">
                    <div className="suggestion-header">
                      <span className="suggestion-icon">💰</span>
                      <span className="suggestion-title">Nadmiarowe produkty (sprzedaż)</span>
                    </div>
                    {budget.excessStockProducts.map(product => {
                      const maxSellQuantity = Math.floor((product.quantity - product.minStock) / 2)
                      const potentialIncome = maxSellQuantity * (product.price || 0)
                      
                      return (
                        <div key={product.id} className="sale-item">
                          <div className="product-info">
                            <span className="product-name">{product.name}</span>
                            <span className="product-details">
                              Można sprzedać: {maxSellQuantity} {product.unit}
                            </span>
                          </div>
                          <div className="sale-actions">{formatCurrency(potentialIncome)}
                            <span className="potential-income">+{formatCurrency(potentialIncome)}</span>
                            <button 
                              className="btn-sell"
                              onClick={() => handleAutoSale(budget, product, maxSellQuantity)}
                            >
                              Sprzedaj
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

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