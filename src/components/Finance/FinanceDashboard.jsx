// components/Finance/FinanceDashboard.jsx
import React from 'react'
import './FinanceComponents.css'

const FinanceDashboard = ({ transactions, budgets, summary }) => {
  // Ostatnie transakcje
  const recentTransactions = transactions.slice(0, 10)
  
  // Mapowanie kategorii z angielskiego na polski
  const categoryTranslations = {
    // Z incomeCategories
  'sprzedaz_plonow': 'Sprzedaż plonów',
  'sprzedaz_zwierzat': 'Sprzedaż zwierząt',
  'sprzedaz_maszyn': 'Maszyny i sprzęt',
  'dotacje': 'Dotacje',
  'inne_przychody': 'Inne przychody',
  
  // Z expenseCategories
  'zwierzeta': 'Zwierzęta',
  'maszyny': 'Maszyny i sprzęt',
  'zboza': 'Zboża',
  'nawozy_nasiona': 'Nawozy i nasiona',
  'pasze': 'Pasze',
  'paliwo': 'Paliwo',
  'sprzet_czesci': 'Narzędzia i części',
  'naprawy_konserwacja': 'Naprawa i konserwacja',
  'naprawa_konserwacja': 'Naprawa i konserwacja', // Dla spójności jeśli są różne wersje
  'inne_koszty': 'Inne koszty',
  
  // Dodatkowe kategorie które mogą się pojawić (z categoryMapping w useFinance.js)
  'produkty_zwierzece': 'Produkty zwierzęce',
  'zakup_zwierzat': 'Zakup zwierząt',
  'podatki_oplaty': 'Podatki i opłaty',
  'nasiona': 'Nasiona',
  'nawozy': 'Nawozy',

  }

  const parseTransactionDescription = (description) => {
  // Jeśli opis zawiera dwukropek, podziel na części
  if (description && description.includes(':')) {
    const parts = description.split(':')
    if (parts.length >= 2) {
      return {
        machineName: parts[1].trim(), // "Case Puma - 12test12"
        operationType: parts[0].trim() // "Naprawa/przegląd"
      }
    }
  }
  // Jeśli nie ma dwukropka, zwróć oryginalny opis
  return {
    machineName: description || 'Brak opisu',
    operationType: ''
  }
}

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
  
  // Funkcja do tłumaczenia kategorii
  const translateCategory = (category) => {
    return categoryTranslations[category] || category
  }
  
  // Podsumowanie kategorii
  const categorySummary = transactions.reduce((acc, transaction) => {
    const translatedCategory = translateCategory(transaction.category)
    
    if (!acc[translatedCategory]) {
      acc[translatedCategory] = { income: 0, expenses: 0 }
    }
    
    if (transaction.type === 'income') {
      acc[translatedCategory].income += transaction.amount
    } else {
      acc[translatedCategory].expenses += transaction.amount
    }
    
    return acc
  }, {})

  return (
    <div className="finance-dashboard">
      <div className="dashboard-grid">
        {/* Kafelki z podsumowaniem */}
        <div className="summary-cards">
          {/* Bilans miesięczny */}
          <div className="summary-card balance">
            <div className="card-icon">⚖️</div>
            <div className="card-content">
              <div className="card-label">Bilans miesięczny</div>
              <div className={`card-amount ${summary.monthlyBalance >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(summary.monthlyBalance)}
              </div>
            </div>
          </div>
          
          {/* Przychody */}
          <div className="summary-card income">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <div className="card-label">Przychody</div>
              <div className="card-amount positive">{formatCurrency(summary.monthlyIncome)}</div>
            </div>
          </div>
          
          {/* Koszty */}
          <div className="summary-card expenses">
            <div className="card-icon">📉</div>
            <div className="card-content">
              <div className="card-label">Koszty</div>
              <div className="card-amount negative">{formatCurrency(summary.monthlyExpenses)}</div>
            </div>
          </div>
        </div>

        {/* Ostatnie transakcje */}
        <div className="recent-transactions">
          <h3>Ostatnie transakcje</h3>
          {recentTransactions.length === 0 ? (
            <p className="no-data">Brak transakcji</p>
          ) : (
            <div className="transactions-list">
              {recentTransactions.map(transaction => {
  const parsed = parseTransactionDescription(transaction.description)
  const category = translateCategory(transaction.category)
  
  return (
    <div key={transaction.id} className="transaction-item">
      <div className="transaction-main">
        <span className={`transaction-type ${transaction.type}`}>
          {transaction.type === 'income' ? '💰' : '📉'}
        </span>
        <div className="transaction-info">
          {/* NAZWA MASZYNY JAKO GŁÓWNY OPIS */}
          <div className="transaction-description">
            {parsed.machineName}
          </div>
          {/* TYP OPERACJI */}
          
          <div className="transaction-details">
            {parsed.operationType && (
              <span className="operation-type">
                {parsed.operationType}
              </span>
            )}
            
          </div>
        </div>
      </div>
      <div className={`transaction-amount ${transaction.type}`}>
        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
      </div>
    </div>
  )
})}
            </div>
          )}
        </div>

        {/* Podsumowanie kategorii */}
<div className="category-summary">
  <h3>Podsumowanie kategorii</h3>
  <div className="categories-list">
    {Object.entries(categorySummary)
      .filter(([category, data]) => data.income !== 0 || data.expenses !== 0) // Filtruj tylko kategorie z kwotami
      .map(([category, data]) => {
        // Wybierz odpowiednią kwotę do wyświetlenia
        let displayAmount = 0
        let amountType = ''
        
        if (data.income > 0 && data.expenses > 0) {
          // Jeśli kategoria ma zarówno przychody jak i wydatki, pokaż obie kwoty osobno
          return (
            <div key={category} className="category-item">
              <div className="category-name">{category}</div>
              <div className="category-amounts">
                <span className="income-amount">+{formatCurrency(data.income)}</span>
                <span className="expense-amount">-{formatCurrency(data.expenses)}</span>
              </div>
            </div>
          )
        } else if (data.income > 0) {
          displayAmount = data.income
          amountType = 'income'
        } else if (data.expenses > 0) {
          displayAmount = data.expenses
          amountType = 'expense'
        } else {
          return null // Pomijaj kategorie z zerowymi kwotami
        }

        return (
          <div key={category} className="category-item">
            <div className="category-name">{category}</div>
            <div className="category-amounts">
              <span className={`${amountType}-amount ${amountType === 'income' ? 'positive' : 'negative'}`}>
                {amountType === 'income' ? '+' : '-'}{formatCurrency(displayAmount)}
              </span>
            </div>
          </div>
        )
      })}
  </div>
</div>
      </div>
    </div>
  )
}

export default FinanceDashboard