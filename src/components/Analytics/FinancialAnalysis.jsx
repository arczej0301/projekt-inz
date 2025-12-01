// components/Analytics/FinancialAnalysis.jsx
import React, { useState, useMemo } from 'react'
import { useFinance } from '../../hooks/useFinance'
import './AnalyticsComponents.css'

const FinancialAnalysis = ({ transactions, summary }) => {
  // 1. HOOKI NA POCZĄTKU
  const { incomeCategories, expenseCategories } = useFinance()
  const [period, setPeriod] = useState('month')
  const [reportType, setReportType] = useState('income')

  // 2. HOOKI useMemo/useCallback
  const filteredTransactions = useMemo(() => {
    const now = new Date()
    let startDate

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
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
      let transactionDate
      try {
        if (transaction.date?.toDate) {
          transactionDate = transaction.date.toDate()
        } else if (transaction.date instanceof Date) {
          transactionDate = transaction.date
        } else {
          transactionDate = new Date(transaction.date)
        }
      } catch (error) {
        console.error('Błąd parsowania daty:', error)
        transactionDate = new Date() // wartość domyślna
      }

      return transactionDate >= startDate && transactionDate <= new Date()
    })
  }, [transactions, period])

  const chartData = useMemo(() => {
    const data = {}
    filteredTransactions.forEach(transaction => {
      const category = transaction.category
      if (!data[category]) {
        data[category] = { income: 0, expenses: 0 }
      }
      if (transaction.type === 'income') {
        data[category].income += transaction.amount || 0
      } else {
        data[category].expenses += transaction.amount || 0
      }
    })
    return data
  }, [filteredTransactions])

  const reportData = useMemo(() => {
    const data = reportType === 'income'
      ? Object.entries(chartData).filter(([_, data]) => data.income > 0)
      : Object.entries(chartData).filter(([_, data]) => data.expenses > 0)

    return data.map(([category, data]) => ({
      category,
      amount: reportType === 'income' ? data.income : data.expenses,
      type: reportType === 'income' ? 'income' : 'expense'
    }))
      .sort((a, b) => (b.amount || 0) - (a.amount || 0))
  }, [chartData, reportType])

  const totalAmount = useMemo(() => 
    reportData.reduce((sum, item) => sum + (item.amount || 0), 0), 
    [reportData]
  )

  // 3. DOPIERO TERAZ ZWYKŁE FUNKCJE
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0,00 zł'
    }
    
    const numAmount = parseFloat(amount)
    const formatted = numAmount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return `${formatted} zł`
  }

  const formatNumber = (number) => {
    if (number === null || number === undefined || isNaN(number)) return '0'
    
    const num = parseFloat(number)
    
    if (num % 1 !== 0) {
      return num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    }
    
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const formatDate = (date) => {
    if (!date) return ''
    
    let transactionDate
    try {
      if (date?.toDate) {
        transactionDate = date.toDate()
      } else if (date instanceof Date) {
        transactionDate = date
      } else {
        transactionDate = new Date(date)
      }
    } catch (error) {
      console.error('Błąd formatowania daty:', error)
      return 'Błąd daty'
    }

    return transactionDate.toLocaleDateString('pl-PL')
  }

  const findCategory = (categoryId, type) => {
    const categories = type === 'income' ? incomeCategories : expenseCategories
    return categories.find(cat => cat.id === categoryId) || { name: categoryId, icon: '💰' }
  }

     // Tytuły okresów
  const periodTitles = {
    week: 'ostatni tydzień',
    month: 'ten miesiąc',
    year: 'ten rok'
  }

  // Tytuły raportów
  const reportTitles = {
    income: 'Przychody',
    expenses: 'Koszty'
  }

  return (
    <div className="financial-analysis">
      {/* ... cały JSX z ReportsTab pozostaje bez zmian ... */}
      <div className="tab-header">
        <h3>Analiza Finansowa</h3>
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
            {reportTitles[reportType]}
          </div>
          <div className={`summary-amount ${reportType === 'income' ? 'positive' : 'negative'}`}>
            {formatCurrency(totalAmount)}
          </div>
          <div className="summary-period">
            Okres: {periodTitles[period]}
          </div>
        </div>
      </div>

 {/* Wykres słupkowy */}
      <div className="chart-container">
        <h4>Rozkład według kategorii</h4>
        <div className="bar-chart">
          {reportData.length === 0 ? (
            <div className="no-data">
              Brak danych dla wybranych kryteriów
            </div>
          ) : (
            reportData.map((item, index) => {
              const percentage = totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0
              const category = findCategory(item.category, reportType)

              return (
                <div key={item.category} className="bar-item">
                  <div className="bar-label">
                    <div className="category-info">
                      <span className="category-icon">{category.icon}</span>
                      <span className="category-name">{category.name}</span>
                    </div>
                    <span className="bar-amount">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${item.type}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    >
                      {percentage >= 15 && (
                        <span className="bar-percentage">{percentage.toFixed(1)}%</span>
                      )}
                    </div>
                    {percentage < 15 && (
                      <span className="bar-percentage-outside">{percentage.toFixed(1)}%</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
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
                .filter(transaction => transaction.type === (reportType === 'income' ? 'income' : 'expense'))
                .map(transaction => {
                  const category = findCategory(transaction.category, transaction.type)

                  return (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.date)}</td>
                      <td>
                        <span className="category-with-icon">
                          <span className="icon">{category.icon}</span>
                          {category.name}
                        </span>
                      </td>
                      <td>{transaction.description}</td>
                      <td className={`amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td>
                        <span className={`type-badge ${transaction.type}`}>
                          {transaction.type === 'income' ? 'Przychód' : 'Koszt'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              {filteredTransactions.filter(t => t.type === (reportType === 'income' ? 'income' : 'expense')).length === 0 && (
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

export default FinancialAnalysis