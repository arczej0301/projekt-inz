// components/Finance/FinanceDashboard.jsx
import React, { useState, useMemo } from 'react'
import './FinanceComponents.css'

const FinanceDashboard = ({ transactions, budgets, summary }) => {
  // Ostatnie transakcje
  const recentTransactions = transactions.slice(0, 10)
  
  // Stan dla wybranego okresu - DOMYŚLNIE YEARLY
  const [period, setPeriod] = useState('yearly') // yearly, quarterly, monthly
  
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
  
  // Funkcja do filtrowania transakcji według okresu
  const getFilteredTransactionsByPeriod = useMemo(() => {
    const now = new Date()
    
    let startDate = new Date()
    let endDate = new Date()
    
    switch (period) {
      case 'yearly':
        // ROK WSTECZ (od dzisiaj minus 365 dni do dzisiaj)
        endDate = now
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) // minus 365 dni
        break
        
      case 'quarterly':
        // OSTATNI PEŁNY KWARTAŁ
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth()
        // Znajdź poprzedni kwartał
        const previousQuarter = Math.floor((currentMonth - 1) / 3)
        
        if (previousQuarter < 0) {
          // Jeśli styczeń, to poprzedni kwartał to IV kwartał poprzedniego roku
          startDate = new Date(currentYear - 1, 9, 1)  // 1 października
          endDate = new Date(currentYear - 1, 11, 31, 23, 59, 59)  // 31 grudnia
        } else {
          // Poprzedni kwartał w bieżącym roku
          const quarterStartMonth = previousQuarter * 3
          startDate = new Date(currentYear, quarterStartMonth, 1)
          endDate = new Date(currentYear, quarterStartMonth + 3, 0, 23, 59, 59)
        }
        break
        
      case 'monthly':
        // OSTATNI PEŁNY MIESIĄC
        const currentYearNow = now.getFullYear()
        const currentMonthNow = now.getMonth()
        
        if (currentMonthNow === 0) {
          // Jeśli styczeń, to poprzedni miesiąc to grudzień poprzedniego roku
          startDate = new Date(currentYearNow - 1, 11, 1)
          endDate = new Date(currentYearNow - 1, 11, 31, 23, 59, 59)
        } else {
          // Poprzedni miesiąc w bieżącym roku
          startDate = new Date(currentYearNow, currentMonthNow - 1, 1)
          endDate = new Date(currentYearNow, currentMonthNow, 0, 23, 59, 59)
        }
        break
        
      default:
        // Domyślnie ROK WSTECZ
        endDate = now
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    }
    
    // Filtruj transakcje
    return transactions.filter(transaction => {
      // Pobierz datę transakcji
      const getTransactionDate = (t) => {
        if (t.date?.toDate) return t.date.toDate()
        if (t.date instanceof Date) return t.date
        if (typeof t.date === 'string') return new Date(t.date)
        if (t.createdAt?.toDate) return t.createdAt.toDate()
        return new Date(t.date || t.createdAt || 0)
      }
      
      const transactionDate = getTransactionDate(transaction)
      return transactionDate >= startDate && transactionDate <= endDate
    })
  }, [transactions, period])
  
  // Obliczanie podsumowania dla wybranego okresu
  const periodSummary = useMemo(() => {
    const filteredTransactions = getFilteredTransactionsByPeriod
    
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
      
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
      
    const balance = income - expenses
    
    return {
      income,
      expenses,
      balance
    }
  }, [getFilteredTransactionsByPeriod])
  
  // Opcje dla selektora okresu
  const periodOptions = [
    { value: 'yearly', label: 'Rok', icon: '📈' },
    { value: 'quarterly', label: 'Kwartał', icon: '📊' },
    { value: 'monthly', label: 'Miesiąc', icon: '📅' }
  ]
  
  // Etykiety dla okresu
  const getPeriodLabel = () => {
    const now = new Date()
    const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 
                       'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
    
    switch (period) {
      case 'yearly':
        // Oblicz datę sprzed roku
        const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        const startDay = oneYearAgo.getDate()
        const startMonth = monthNames[oneYearAgo.getMonth()]
        const startYear = oneYearAgo.getFullYear()
        const endDay = now.getDate()
        const endMonth = monthNames[now.getMonth()]
        const endYear = now.getFullYear()
        
        return `${startDay} ${startMonth.toLowerCase()} ${startYear} - ${endDay} ${endMonth.toLowerCase()} ${endYear}`
        
      case 'quarterly':
        const currentMonth = now.getMonth()
        const quarterNames = ['I kwartał', 'II kwartał', 'III kwartał', 'IV kwartał']
        
        // Znajdź poprzedni kwartał
        let quarterIndex = Math.floor((currentMonth - 1) / 3)
        let year = now.getFullYear()
        
        if (quarterIndex < 0) {
          quarterIndex = 3  // IV kwartał
          year = year - 1   // poprzedni rok
        }
        
        return `${quarterNames[quarterIndex]} ${year}`
        
      case 'monthly':
        let monthIndex = now.getMonth() - 1
        let monthYear = now.getFullYear()
        
        if (monthIndex < 0) {
          monthIndex = 11   // Grudzień
          monthYear = monthYear - 1  // poprzedni rok
        }
        
        return `${monthNames[monthIndex]} ${monthYear}`
        
      default:
        return `Ostatnie 12 miesięcy`
    }
  }

  // Podsumowanie kategorii dla wybranego okresu
  const categorySummary = useMemo(() => {
    return getFilteredTransactionsByPeriod.reduce((acc, transaction) => {
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
  }, [getFilteredTransactionsByPeriod])

  return (
    <div className="finance-dashboard">
      <div className="dashboard-grid">
        {/* SELEKTOR OKRESU i PRZYCISKI OBOK SIEBIE */}
        <div className="period-selector-row">
          <div className="period-selector-header">
            <h3>Podsumowanie finansowe</h3>
            <p className="period-label">{getPeriodLabel()}</p>
          </div>
          
          <div className="period-buttons">
            {periodOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`period-button ${period === option.value ? 'active' : ''}`}
              >
                <span className="period-icon">{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Kafelki z podsumowaniem (POD SELEKTOREM) */}
        <div className="summary-cards">
          {/* Bilans */}
          <div className="summary-card balance">
            <div className="card-icon">⚖️</div>
            <div className="card-content">
              <div className="card-label">Bilans</div>
              <div className={`card-amount ${periodSummary.balance >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(periodSummary.balance)}
              </div>
              <div className="card-description">
                {period === 'yearly' ? 'Ostatnie 12 miesięcy' : 
                 period === 'quarterly' ? 'Ostatni pełny kwartał' : 
                 'Ostatni pełny miesiąc'}
              </div>
            </div>
          </div>
          
          {/* Przychody */}
          <div className="summary-card income">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <div className="card-label">Przychody</div>
              <div className="card-amount positive">{formatCurrency(periodSummary.income)}</div>
              <div className="card-description">
                {period === 'yearly' ? 'Ostatnie 12 miesięcy' : 
                 period === 'quarterly' ? 'Ostatni pełny kwartał' : 
                 'Ostatni pełny miesiąc'}
              </div>
            </div>
          </div>
          
          {/* Koszty */}
          <div className="summary-card expenses">
            <div className="card-icon">📉</div>
            <div className="card-content">
              <div className="card-label">Koszty</div>
              <div className="card-amount negative">{formatCurrency(periodSummary.expenses)}</div>
              <div className="card-description">
                {period === 'yearly' ? 'Ostatnie 12 miesięcy' : 
                 period === 'quarterly' ? 'Ostatni pełny kwartał' : 
                 'Ostatni pełny miesiąc'}
              </div>
            </div>
          </div>
        </div>

        {/* Ostatnie transakcje (zawsze pokazujemy ostatnie 10) */}
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

        {/* Podsumowanie kategorii DLA WYBRANEGO OKRESU */}
        <div className="category-summary">
          <h3>Podsumowanie kategorii {period === 'yearly' ? '(rok wstecz)' : period === 'quarterly' ? '(kwartał)' : '(miesiąc)'}</h3>
          <div className="categories-list">
            {Object.entries(categorySummary)
              .filter(([category, data]) => data.income !== 0 || data.expenses !== 0)
              .sort(([catA, dataA], [catB, dataB]) => {
                // Sortuj według sumy bezwzględnej wartości (malejąco)
                const totalA = Math.abs(dataA.income) + Math.abs(dataA.expenses)
                const totalB = Math.abs(dataB.income) + Math.abs(dataB.expenses)
                return totalB - totalA
              })
              .slice(0, 8) // Pokazuj tylko top 8 kategorii
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
                  return null
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
          {Object.keys(categorySummary).filter(([cat, data]) => data.income !== 0 || data.expenses !== 0).length > 8 && (
            <p className="category-summary-footer">
              ... i {Object.keys(categorySummary).filter(([cat, data]) => data.income !== 0 || data.expenses !== 0).length - 8} więcej kategorii
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default FinanceDashboard