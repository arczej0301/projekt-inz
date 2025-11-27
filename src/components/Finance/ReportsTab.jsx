// components/Finance/ReportsTab.jsx
import React, { useState, useMemo } from 'react'
import { useFinance } from '../../hooks/useFinance'
import './FinanceComponents.css'

const ReportsTab = ({ transactions, summary }) => {
  const { incomeCategories, expenseCategories } = useFinance()
  const [period, setPeriod] = useState('month')
  const [reportType, setReportType] = useState('income')

  // Filtruj transakcje według okresu
  const filteredTransactions = useMemo(() => {
    const now = new Date()
    let startDate

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    return transactions.filter(transaction => {
      const transactionDate = transaction.date?.toDate ? transaction.date.toDate() : new Date(transaction.date)
      return transactionDate >= startDate
    })
  }, [transactions, period])

  // Generuj dane dla wykresów
  const chartData = useMemo(() => {
    const data = {}

    filteredTransactions.forEach(transaction => {
      const category = transaction.category
      if (!data[category]) {
        data[category] = { income: 0, expenses: 0 }
      }

      if (transaction.type === 'income') {
        data[category].income += transaction.amount
      } else {
        data[category].expenses += transaction.amount
      }
    })

    return data
  }, [filteredTransactions])

  // Przygotuj dane dla wybranego typu raportu
  const reportData = useMemo(() => {
    if (reportType === 'income') {
      return Object.entries(chartData)
        .filter(([_, data]) => data.income > 0)
        .map(([category, data]) => ({
          category,
          amount: data.income,
          type: 'income'
        }))
        .sort((a, b) => b.amount - a.amount)
    } else {
      return Object.entries(chartData)
        .filter(([_, data]) => data.expenses > 0)
        .map(([category, data]) => ({
          category,
          amount: data.expenses,
          type: 'expense'
        }))
        .sort((a, b) => b.amount - a.amount)
    }
  }, [chartData, reportType])

  const totalAmount = reportData.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div className="reports-tab">
      <div className="tab-header">
        <h3>Raporty finansowe</h3>
        <div className="report-controls">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="control-select"
          >
            <option value="week">Ostatni tydzień</option>
            <option value="month">Ten miesiąc</option>
            <option value="year">Ten rok</option>
          </select>
          
          <select 
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="control-select"
          >
            <option value="income">Przychody</option>
            <option value="expenses">Koszty</option>
          </select>
        </div>
      </div>

      {/* Podsumowanie raportu */}
      <div className="report-summary">
        <div className="summary-card">
          <div className="summary-title">
            {reportType === 'income' ? 'Łączne przychody' : 'Łączne koszty'}
          </div>
          <div className={`summary-amount ${reportType === 'income' ? 'positive' : 'negative'}`}>
            {totalAmount.toFixed(2)} zł
          </div>
          <div className="summary-period">
            Okres: {period === 'week' ? 'ostatni tydzień' : period === 'month' ? 'ten miesiąc' : 'ten rok'}
          </div>
        </div>
      </div>

      {/* Wykres słupkowy (prosty CSS) */}
      <div className="chart-container">
        <h4>Rozkład według kategorii</h4>
        <div className="bar-chart">
          {reportData.map((item, index) => {
            const percentage = (item.amount / totalAmount) * 100
            const category = reportType === 'income' 
              ? incomeCategories.find(cat => cat.id === item.category)
              : expenseCategories.find(cat => cat.id === item.category)

            return (
              <div key={item.category} className="bar-item">
                <div className="bar-label">
                  <span className="category-icon">{category?.icon || '💰'}</span>
                  <span className="category-name">{category?.name || item.category}</span>
                  <span className="bar-amount">{item.amount.toFixed(2)} zł</span>
                </div>
                <div className="bar-track">
                  <div 
                    className={`bar-fill ${item.type}`}
                    style={{ width: `${percentage}%` }}
                  >
                    <span className="bar-percentage">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabela szczegółów */}
      <div className="report-details">
        <h4>Szczegóły transakcji</h4>
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Kategoria</th>
                <th>Opis</th>
                <th>Kwota</th>
                <th>Typ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions
                .filter(t => t.type === reportType.slice(0, -1))
                .map(transaction => {
                  const category = reportType === 'income' 
                    ? incomeCategories.find(cat => cat.id === transaction.category)
                    : expenseCategories.find(cat => cat.id === transaction.category)

                  return (
                    <tr key={transaction.id}>
                      <td>{transaction.date?.toLocaleDateString?.() || new Date(transaction.date).toLocaleDateString()}</td>
                      <td>
                        <span className="category-with-icon">
                          <span className="icon">{category?.icon || '💰'}</span>
                          {category?.name || transaction.category}
                        </span>
                      </td>
                      <td>{transaction.description}</td>
                      <td className={`amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toFixed(2)} zł
                      </td>
                      <td>
                        <span className={`type-badge ${transaction.type}`}>
                          {transaction.type === 'income' ? 'Przychód' : 'Koszt'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              {filteredTransactions.filter(t => t.type === reportType.slice(0, -1)).length === 0 && (
                <tr>
                  <td colSpan="5" className="no-data">
                    Brak transakcji dla wybranych kryteriów
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ReportsTab