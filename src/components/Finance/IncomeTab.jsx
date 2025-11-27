// components/Finance/IncomeTab.jsx
import React, { useState } from 'react'
import { useFinance } from '../../hooks/useFinance'
import CustomSelect from '../CustomSelect'
import './FinanceComponents.css'

const IncomeTab = ({ transactions }) => {
  const { incomeCategories, addTransaction } = useFinance()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTransaction, setNewTransaction] = useState({
    type: 'income',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  // Przygotuj opcje dla CustomSelect
  const categoryOptions = incomeCategories.map(cat => ({
    value: cat.id,
    label: cat.name,
    icon: cat.icon
  }))

  const handleAddTransaction = async (e) => {
    e.preventDefault()
    if (!newTransaction.category || !newTransaction.amount || !newTransaction.description) {
      alert('Proszę wypełnić wszystkie pola')
      return
    }

    const result = await addTransaction(newTransaction)
    if (result.success) {
      setShowAddForm(false)
      setNewTransaction({
        type: 'income',
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      })
    } else {
      alert('Błąd przy dodawaniu transakcji: ' + result.error)
    }
  }

  const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="income-tab">
      <div className="tab-header">
        <h3>Przychody</h3>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          + Dodaj przychód
        </button>
      </div>

      <div className="total-summary">
        Łączne przychody: <strong>{totalIncome.toFixed(2)} zł</strong>
      </div>

      {/* Formularz dodawania transakcji */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Dodaj nowy przychód</h4>
              <button className="close-btn" onClick={() => setShowAddForm(false)}>×</button>
            </div>
            <form onSubmit={handleAddTransaction}>
              <div className="form-group">
                <label>Kategoria *</label>
                <CustomSelect
                  options={categoryOptions}
                  value={newTransaction.category}
                  onChange={(value) => setNewTransaction(prev => ({...prev, category: value}))}
                  placeholder="Wybierz kategorię..."
                  searchable={true}
                />
              </div>

              <div className="form-group">
                <label>Kwota (zł) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({...prev, amount: e.target.value}))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Opis *</label>
                <input 
                  type="text" 
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({...prev, description: e.target.value}))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Data</label>
                <input 
                  type="date" 
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction(prev => ({...prev, date: e.target.value}))}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                  Anuluj
                </button>
                <button type="submit" className="btn btn-primary">
                  Dodaj przychód
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista transakcji pozostaje bez zmian */}
      <div className="transactions-table">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Kategoria</th>
              <th>Opis</th>
              <th>Kwota</th>
              <th>Źródło</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id}>
                <td>{transaction.date?.toLocaleDateString?.() || new Date(transaction.date).toLocaleDateString()}</td>
                <td>
                  <span className="category-with-icon">
                    <span className="icon">
                      {incomeCategories.find(cat => cat.id === transaction.category)?.icon || '💰'}
                    </span>
                    {incomeCategories.find(cat => cat.id === transaction.category)?.name || transaction.category}
                  </span>
                </td>
                <td>{transaction.description}</td>
                <td className="amount positive">+{transaction.amount.toFixed(2)} zł</td>
                <td>
                  {transaction.autoGenerated ? (
                    <span className="auto-badge">Auto</span>
                  ) : (
                    'Ręczne'
                  )}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan="5" className="no-data">Brak transakcji przychodowych</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default IncomeTab