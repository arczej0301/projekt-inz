// components/Finance/FinanceDashboard.jsx
import React from 'react'
import './FinanceComponents.css'

const FinanceDashboard = ({ transactions, budgets, summary }) => {
  // Ostatnie transakcje
  const recentTransactions = transactions.slice(0, 5)
  
  // Podsumowanie kategorii
  const categorySummary = transactions.reduce((acc, transaction) => {
    if (!acc[transaction.category]) {
      acc[transaction.category] = { income: 0, expenses: 0 }
    }
    
    if (transaction.type === 'income') {
      acc[transaction.category].income += transaction.amount
    } else {
      acc[transaction.category].expenses += transaction.amount
    }
    
    return acc
  }, {})

  return (
    <div className="finance-dashboard">
      <div className="dashboard-grid">
        {/* Kafelki z podsumowaniem - ZAKTUALIZOWANE */}
        <div className="summary-cards">
          {/* Bilans miesięczny */}
          <div className="summary-card balance">
            <div className="card-icon">⚖️</div>
            <div className="card-content">
              <div className="card-label">Bilans miesięczny</div>
              <div className={`card-amount ${summary.monthlyBalance >= 0 ? 'positive' : 'negative'}`}>
                {summary.monthlyBalance.toFixed(2)} zł
              </div>
            </div>
          </div>
          
          {/* Przychody */}
          <div className="summary-card income">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <div className="card-label">Przychody</div>
              <div className="card-amount positive">{summary.monthlyIncome.toFixed(2)} zł</div>
            </div>
          </div>
          
          {/* Koszty */}
          <div className="summary-card expenses">
            <div className="card-icon">📉</div>
            <div className="card-content">
              <div className="card-label">Koszty</div>
              <div className="card-amount negative">{summary.monthlyExpenses.toFixed(2)} zł</div>
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
                        {transaction.category}
                      </div>
                    </div>
                  </div>
                  <div className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}{transaction.amount} zł
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
                  <span className="income-amount">+{data.income.toFixed(2)} zł</span>
                  <span className="expense-amount">-{data.expenses.toFixed(2)} zł</span>
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