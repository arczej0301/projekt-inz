// src/pages/FinancePage.jsx
import React, { useState, useEffect } from 'react' // DODAJ useEffect
import { useFinance } from '../../hooks/useFinance'
import FinanceDashboard from './FinanceDashboard'
import IncomeTab from './IncomeTab'
import ExpensesTab from './ExpensesTab'

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

  // DODAJ TEN useEffect
  useEffect(() => {
  // Sprawdź czy otworzyć zakładkę przychodów
  const shouldOpenIncomeModal = localStorage.getItem('shouldOpenIncomeModal');
  const shouldOpenExpenseModal = localStorage.getItem('shouldOpenExpenseModal');
  const financeTab = localStorage.getItem('financeActiveTab');
  
  if (financeTab === 'income') {
    setActiveTab('income');
  } else if (financeTab === 'expenses') {
    setActiveTab('expenses');
  }
  
  if (shouldOpenIncomeModal === 'true') {
    // Otwórz formularz przychodu
    localStorage.setItem('openIncomeForm', 'true');
    
    // Wyczyść flagi
    localStorage.removeItem('shouldOpenIncomeModal');
    localStorage.removeItem('financeActiveTab');
    
    // Przewiń do góry
    window.scrollTo(0, 0);
  }
  
  if (shouldOpenExpenseModal === 'true') {
    // Otwórz formularz kosztów
    localStorage.setItem('openExpenseForm', 'true');
    
    // Wyczyść flagi
    localStorage.removeItem('shouldOpenExpenseModal');
    localStorage.removeItem('financeActiveTab');
    
    // Przewiń do góry
    window.scrollTo(0, 0);
  }
}, []);

  const financialSummary = getFinancialSummary()

  const tabs = [
    { id: 'dashboard', name: 'Pulpit', icon: '📊' },
    { id: 'income', name: 'Przychody', icon: '💰' },
    { id: 'expenses', name: 'Koszty', icon: '📉' },
   
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
        
      </div>
    </div>
  )
}

export default FinancePage