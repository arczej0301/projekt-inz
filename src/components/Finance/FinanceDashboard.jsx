// components/Finance/FinanceDashboard.jsx
import React from 'react'
import './FinanceComponents.css'

const FinanceDashboard = ({ transactions, budgets, summary }) => {
  // Ostatnie transakcje
  const recentTransactions = transactions.slice(0, 5)
  
  // Mapowanie kategorii z angielskiego na polski
  const categoryTranslations = {
    'salary': 'Wynagrodzenie',
    'freelance': 'Freelance',
    'investment': 'Inwestycje',
    'business': 'Biznes',
    'other-income': 'Inne przychody',
    'food': 'Jedzenie',
    'transport': 'Transport',
    'housing': 'Mieszkanie',
    'entertainment': 'Rozrywka',
    'health': 'Zdrowie',
    'shopping': 'Zakupy',
    'education': 'Edukacja',
    'bills': 'Rachunki',
    'other-expenses': 'Inne wydatki'
  }

  // Funkcja do formatowania kwot z separatorami tysięcy
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
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
                {formatAmount(summary.monthlyBalance)} zł
              </div>
            </div>
          </div>
          
          {/* Przychody */}
          <div className="summary-card income">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <div className="card-label">Przychody</div>
              <div className="card-amount positive">{formatAmount(summary.monthlyIncome)} zł</div>
            </div>
          </div>
          
          {/* Koszty */}
          <div className="summary-card expenses">
            <div className="card-icon">📉</div>
            <div className="card-content">
              <div className="card-label">Koszty</div>
              <div className="card-amount negative">{formatAmount(summary.monthlyExpenses)} zł</div>
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
              {recentTransactions.map(transaction => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-main">
                    <span className={`transaction-type ${transaction.type}`}>
                      {transaction.type === 'income' ? '💰' : '📉'}
                    </span>
                    <div className="transaction-info">
                      <div className="transaction-description">
                        {transaction.description}
                      </div>
                      <div className="transaction-category">
                        {translateCategory(transaction.category)}
                      </div>
                    </div>
                  </div>
                  <div className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)} zł
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Podsumowanie kategorii */}
        <div className="category-summary">
          <h3>Podsumowanie kategorii</h3>
          <div className="categories-list">
            {Object.entries(categorySummary).map(([category, data]) => (
              <div key={category} className="category-item">
                <div className="category-name">{category}</div>
                <div className="category-amounts">
                  <span className="income-amount">+{formatAmount(data.income)} zł</span>
                  <span className="expense-amount">-{formatAmount(data.expenses)} zł</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinanceDashboard