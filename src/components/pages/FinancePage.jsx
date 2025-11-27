// pages/FinancePage.jsx
import React, { useState } from 'react'
import { useFinance } from '../../hooks/useFinance'
import FinanceDashboard from '../../components/Finance/FinanceDashboard'
import IncomeTab from '../../components/Finance/IncomeTab'
import ExpensesTab from '../../components/Finance/ExpensesTab'
import BudgetTab from '../../components/Finance/BudgetTab'
import ReportsTab from '../../components/Finance/ReportsTab'
import './FinancePage.css'

function FinancePage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { 
    transactions, 
    budgets, 
    loading, 
    error,
    getFinancialSummary 
  } = useFinance()

  const financialSummary = getFinancialSummary()

  const tabs = [
    { id: 'dashboard', name: 'Pulpit', icon: '📊' },
    { id: 'income', name: 'Przychody', icon: '💰' },
    { id: 'expenses', name: 'Koszty', icon: '📉' },
    { id: 'budget', name: 'Budżet', icon: '🎯' },
    { id: 'reports', name: 'Raporty', icon: '📈' }
  ]

  if (loading) {
    return (
      <div className="finance-page">
        <div className="loading">Ładowanie danych finansowych...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="finance-page">
        <div className="error">Błąd: {error}</div>
      </div>
    )
  }

  return (
    <div className="finance-page">
      <div className="finance-header">
        <h2>Zarządzanie finansami</h2>
      </div>

      <div className="finance-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-name">{tab.name}</span>
          </button>
        ))}
      </div>

      <div className="finance-content">
        {activeTab === 'dashboard' && (
          <FinanceDashboard 
            transactions={transactions}
            budgets={budgets}
            summary={financialSummary}
          />
        )}
        {activeTab === 'income' && (
          <IncomeTab 
            transactions={transactions.filter(t => t.type === 'income')}
          />
        )}
        {activeTab === 'expenses' && (
          <ExpensesTab 
            transactions={transactions.filter(t => t.type === 'expense')}
          />
        )}
        {activeTab === 'budget' && (
          <BudgetTab 
            budgets={budgets}
            transactions={transactions}
          />
        )}
        {activeTab === 'reports' && (
          <ReportsTab 
            transactions={transactions}
            summary={financialSummary}
          />
        )}
      </div>
    </div>
  )
}

export default FinancePage