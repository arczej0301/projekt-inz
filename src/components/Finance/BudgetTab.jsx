// components/Finance/BudgetTab.jsx
import React, { useState } from 'react'
import { useFinance } from '../../hooks/useFinance'
import CustomSelect from '../CustomSelect'
import './FinanceComponents.css'

const BudgetTab = ({ budgets, transactions }) => {
  const { expenseCategories, addBudget, updateBudget } = useFinance()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    description: ''
  })

  // Przygotuj opcje dla CustomSelect
  const categoryOptions = expenseCategories.map(cat => ({
    value: cat.id,
    label: cat.name,
    icon: cat.icon
  }))

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

  // Oblicz wydatki dla każdego budżetu
  const budgetsWithSpent = budgets.map(budget => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const spent = transactions
      .filter(t => t.type === 'expense' && 
        t.category === budget.category &&
        t.date?.getMonth?.() === currentMonth &&
        t.date?.getFullYear?.() === currentYear)
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      ...budget,
      spent,
      remaining: budget.amount - spent,
      percentage: (spent / budget.amount) * 100
    }
  })

  return (
    <div className="budget-tab">
      <div className="tab-header">
        <h3>Planowanie budżetu</h3>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          + Nowy budżet
        </button>
      </div>

      {/* Formularz dodawania budżetu */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Dodaj nowy budżet</h4>
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
              </div>

              <div className="form-group">
                <label>Kwota budżetu (zł) *</label>
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

      {/* Lista budżetów pozostaje bez zmian */}
      <div className="budgets-list">
        {budgetsWithSpent.length === 0 ? (
          <div className="no-data">
            <p>Brak zdefiniowanych budżetów</p>
            <p>Dodaj pierwszy budżet, aby śledzić swoje wydatki</p>
          </div>
        ) : (
          budgetsWithSpent.map(budget => {
            const category = expenseCategories.find(cat => cat.id === budget.category)
            const status = budget.percentage > 100 ? 'exceeded' : 
                          budget.percentage > 80 ? 'warning' : 'good'

            return (
              <div key={budget.id} className="budget-item">
                <div className="budget-header">
                  <div className="budget-category">
                    <span className="category-icon">{category?.icon || '💰'}</span>
                    <div>
                      <div className="category-name">{category?.name || budget.category}</div>
                      <div className="budget-period">{budget.period}</div>
                    </div>
                  </div>
                  <div className="budget-amounts">
                    <div className="budget-total">{budget.amount.toFixed(2)} zł</div>
                    <div className="budget-spent">Wydano: {budget.spent.toFixed(2)} zł</div>
                  </div>
                </div>

                <div className="budget-progress">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${status}`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="progress-info">
                    <span>{budget.percentage.toFixed(1)}%</span>
                    <span>Pozostało: {budget.remaining.toFixed(2)} zł</span>
                  </div>
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