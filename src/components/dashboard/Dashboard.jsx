// src/components/dashboard/Dashboard.jsx
import { useState, useEffect } from 'react'
import { useFinance } from '../../hooks/useFinance'
import { useTasks } from '../../hooks/useTasks'
import { useAnalytics } from '../../hooks/useAnalytics'
import { getAnimals } from '../../services/animalsService'
import { getFields } from '../../services/fieldsService'
import './Dashboard.css'

function Dashboard({ farmData, onTabChange }) {
  const { getFinancialSummary, transactions, loading: financeLoading } = useFinance()
  const { tasks, loading: tasksLoading } = useTasks()
  const {
    financialAnalytics,
    fieldAnalytics,
    animalAnalytics,
    warehouseAnalytics,
    alerts,
    loading: analyticsLoading
  } = useAnalytics()

  const [dashboardFarmData, setDashboardFarmData] = useState({
    area: 0,
    animals: 0,
    crops: 0,
    tasks: 0,
    income: 0,
    expenses: 0
  })

  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

const [hasLoaded, setHasLoaded] = useState(false) // DODAJ TE LINIE

// ZMIEŃ useEffect:
useEffect(() => {
  let isMounted = true // DODAJ FLAGĘ
  
  if (hasLoaded) return
  
  const fetchRealData = async () => {
    if (!isMounted) return 
    
    try {
      setLoading(true)
      
      // 1. Pobierz dane z serwisów (tylko raz!)
      const [fields, animals, financialSummary] = await Promise.all([
        getFields(),
        getAnimals(),
        getFinancialSummary()
      ])
      
      // 2. Oblicz rzeczywiste statystyki
      const totalArea = fields.reduce((sum, field) => sum + (parseFloat(field.area) || 0), 0)
      const animalCount = animals.length
      const uniqueCrops = [...new Set(fields.map(field => field.crop).filter(Boolean))]
      
      // 3. Stwórz ostateczne dane
      const updatedFarmData = {
        area: totalArea,
        animals: animalCount,
        crops: uniqueCrops.length,
        tasks: tasks.filter(task => task.status === 'pending').length,
        income: financialSummary?.monthlyIncome || 0,
        expenses: financialSummary?.monthlyExpenses || 0
      }

      setDashboardFarmData(updatedFarmData)
      setHasLoaded(true) // ZAZNACZ ŻE DANE SĄ ZAŁADOWANE
      
    if (isMounted) { // TYLKO jeśli komponent jest zamontowany
        setDashboardFarmData(updatedFarmData)
        setHasLoaded(true)
      }
      
    } catch (error) {
      if (isMounted) {
        console.error('Błąd pobierania danych:', error)
        if (farmData) {
          setDashboardFarmData(farmData)
        }
        setHasLoaded(true)
      }
    } finally {
      if (isMounted) {
        setLoading(false)
      }
    }
  }

  if (!analyticsLoading && !tasksLoading && !financeLoading) {
    fetchRealData()
  }
  
  return () => {
    isMounted = false // CLEANUP - ustaw flagę na false
  }
}, [analyticsLoading, tasksLoading, financeLoading, farmData])


  useEffect(() => {
    const generateActivities = () => {
      const activities = []

      // Ostatnie transakcje (5 najnowszych)
      if (transactions && transactions.length > 0) {
        transactions.slice(0, 5).forEach(transaction => {
          const isIncome = transaction.type === 'income'
          const amount = parseFloat(transaction.amount) || 0
          
          activities.push({
            id: `transaction_${transaction.id}`,
            // ZMIANA TUTAJ: Usunięto '💰 ' i '💸 ' z początku stringa title
            title: `${isIncome ? 'Przychód' : 'Wydatek'}: ${getCategoryName(transaction.category)}`,
            description: `${transaction.description || 'Brak opisu'} - ${amount.toLocaleString('pl-PL')} zł`,
            time: formatTimeAgo(transaction.date),
            icon: isIncome ? '💰' : '💸' // Ikona zostaje tylko tutaj (dla lewej kolumny)
          })
        })
      }

      // Ostatnio ukończone zadania (maks 3)
      if (tasks && tasks.length > 0) {
        const completedTasks = tasks
          .filter(task => task.status === 'completed')
          .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))
          .slice(0, 3)
        
        completedTasks.forEach(task => {
          activities.push({
            id: `task_${task.id}`,
            // ZMIANA TUTAJ: Usunięto '✅ ' z początku stringa title
            title: `Ukończono: ${task.title || 'Zadanie'}`,
            description: task.description || 'Zadanie zostało ukończone',
            time: task.completedAt ? formatTimeAgo(task.completedAt) : 'Nieznany czas',
            icon: '✅'
          })
        })
      }

      // Domyślna aktywność jeśli brak
      if (activities.length === 0) {
        activities.push({
          id: 1,
          // ZMIANA TUTAJ: Usunięto '👋 ' z tytułu
          title: 'Witamy w systemie AgroManager!',
          description: 'Dodaj swoje pierwsze dane aby zobaczyć statystyki',
          time: 'Teraz',
          icon: '👋'
        })
      }

      return activities.slice(0, 8) // Maksymalnie 8 aktywności
    }

    setRecentActivities(generateActivities())
  }, [transactions, tasks])

  const quickActions = [
    {
      id: 1,
      title: 'Dodaj zadanie',
      icon: '➕',
      color: '#4caf50',
      tab: 'tasks',
      action: 'openTaskModal'
    },
    {
      id: 2,
      title: 'Zarejestruj sprzedaż',
      icon: '💰',
      color: '#ff9800',
      tab: 'finance',
      action: 'openIncomeModal'
    },
    {
      id: 3,
      title: 'Dodaj koszt',
      icon: '💸',
      color: '#f44336',
      tab: 'finance',
      action: 'openExpenseModal'
    },
    {
      id: 4,
      title: 'Dodaj zwierzę',
      icon: '🐄',
      color: '#795548',
      tab: 'animals',
      action: 'openAnimalModal'
    },
    {
      id: 5,
      title: 'Dodaj maszynę',
      icon: '🚜',
      color: '#8bc34a',
      tab: 'garage',
      action: 'openMachineModal'
    },
    {
      id: 6,
      title: 'Raport finansowy',
      icon: '📊',
      color: '#2196f3',
      tab: 'reports'
    },
    {
      id: 7,
      title: 'Kalendarz prac',
      icon: '📅',
      color: '#9c27b0',
      tab: 'tasks',
      action: 'openCalendarView'
    }
  ]

  // Funkcje pomocnicze
  function formatTimeAgo(date) {
    if (!date) return 'Nieznany czas'

    let dateObj
    try {
      if (date?.toDate) {
        dateObj = date.toDate()
      } else if (date?.seconds) {
        dateObj = new Date(date.seconds * 1000)
      } else if (date instanceof Date) {
        dateObj = date
      } else {
        dateObj = new Date(date)
      }
      
      if (isNaN(dateObj.getTime())) return 'Nieznany czas'
    } catch {
      return 'Nieznany czas'
    }

    const now = new Date()
    const diffMs = now - dateObj
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Przed chwilą'
    if (diffMins < 60) return `${diffMins} min temu`
    if (diffHours < 24) return `${diffHours} godz. temu`
    if (diffDays === 1) return 'Wczoraj'
    if (diffDays < 7) return `${diffDays} dni temu`

    return dateObj.toLocaleDateString('pl-PL')
  }

  function getCategoryName(categoryId) {
    const categoryMap = {
      'sprzedaz_plonow': 'Sprzedaż plonów',
      'sprzedaz_zwierzat': 'Sprzedaż zwierząt',
      'dotacje': 'Dotacje',
      'inne_przychody': 'Inne przychody',
      'zwierzeta': 'Zwierzęta',
      'maszyny': 'Maszyny',
      'zboza': 'Plony',
      'nawozy_nasiona': 'Nawozy i nasiona',
      'pasze': 'Pasza',
      'paliwo': 'Paliwo',
      'sprzet_czesci': 'Narzędzia i części',
      'naprawy_konserwacja': 'Naprawa i konserwacja',
      'inne_koszty': 'Inne koszty'
    }
    
    return categoryMap[categoryId] || categoryId
  }

  const handleQuickAction = (action) => {
    if (action.tab && onTabChange) {
      onTabChange(action.tab)

      // Ustaw odpowiednią flagę w localStorage
      if (action.action === 'openTaskModal') {
        localStorage.setItem('shouldOpenTaskModal', 'true')
      } else if (action.action === 'openIncomeModal') {
        localStorage.setItem('shouldOpenIncomeModal', 'true')
        localStorage.setItem('financeActiveTab', 'income')
      } else if (action.action === 'openExpenseModal') {
        localStorage.setItem('shouldOpenExpenseModal', 'true')
        localStorage.setItem('financeActiveTab', 'expenses')
      } else if (action.action === 'openAnimalModal') {
        localStorage.setItem('openAnimalForm', 'true')
      } else if (action.action === 'openMachineModal') {
        localStorage.setItem('shouldOpenMachineModal', 'true')
      } else if (action.action === 'openCalendarView') {
        localStorage.setItem('shouldOpenCalendarView', 'true')
      }
    }
  }

  // Oblicz procenty zmian na podstawie poprzedniego miesiąca
  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return { value: '0%', isPositive: true }
    const change = ((current - previous) / previous) * 100
    return {
      value: `${change > 0 ? '+' : ''}${change.toFixed(0)}%`,
      isPositive: change > 0
    }
  }

  // Symulacja danych z poprzedniego miesiąca (w rzeczywistości pobierz z bazy)
  const previousMonthData = {
    area: dashboardFarmData.area * 0.87, // -13%
    animals: dashboardFarmData.animals * 0.82, // -18%
    crops: Math.max(dashboardFarmData.crops - 1, 1),
    tasks: dashboardFarmData.tasks * 0.93,
    income: dashboardFarmData.income * 0.85,
    expenses: dashboardFarmData.expenses * 0.78
  }

  // Ładowanie
  if (loading || financeLoading || tasksLoading || analyticsLoading) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Witaj w systemie AgroManager</h2>
        <p>Ładowanie danych...</p>
      </div>
      <div className="loading-spinner">⏳</div>
      <p style={{textAlign: 'center', color: '#666', marginTop: '20px'}}>
        To może chwilę potrwać... Pobieram dane z bazy.
      </p>
    </div>
  )
}

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Witaj w systemie AgroManager</h2>
        <p>Przegląd Twojego gospodarstwa rolnego na dzień {new Date().toLocaleDateString('pl-PL')}</p>
      </div>

      {/* Alerty i powiadomienia */}
      {alerts && alerts.length > 0 && (
        <div className="dashboard-alerts">
          <h3 className="section-title">⚠️ Alerty i powiadomienia</h3>
          <div className="alerts-grid">
            {alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className={`alert-card ${alert.type}`}>
                <div className="alert-icon">
                  {alert.type === 'danger' ? '⚠️' :
                    alert.type === 'warning' ? '🔔' : 'ℹ️'}
                </div>
                <div className="alert-content">
                  <div className="alert-title">{alert.title}</div>
                  <div className="alert-message">{alert.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statystyki gospodarstwa - RZECZYWISTE DANE */}
      <div className="dashboard-stats">
        <h3 className="section-title">📊 Statystyki gospodarstwa</h3>
        <div className="stats-grid">
          {/* Powierzchnia */}
          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-title">POWIERZCHNIA UPRAW (HA) 🌾</div>
              <div className="stats-value">{dashboardFarmData.area.toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</div>
              <div className={`stats-change ${calculatePercentageChange(dashboardFarmData.area, previousMonthData.area).isPositive ? 'positive' : 'negative'}`}>
                {calculatePercentageChange(dashboardFarmData.area, previousMonthData.area).value}
              </div>
            </div>
          </div>

          {/* Zwierzęta */}
          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-title">LICZBA ZWIERZĄT 🐄</div>
              <div className="stats-value">{dashboardFarmData.animals.toLocaleString('pl-PL')}</div>
              <div className={`stats-change ${calculatePercentageChange(dashboardFarmData.animals, previousMonthData.animals).isPositive ? 'positive' : 'negative'}`}>
                {calculatePercentageChange(dashboardFarmData.animals, previousMonthData.animals).value}
              </div>
            </div>
          </div>

          {/* Uprawy */}
          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-title">RODZAJE UPRAW 🌱</div>
              <div className="stats-value">{dashboardFarmData.crops}</div>
              <div className={`stats-change ${calculatePercentageChange(dashboardFarmData.crops, previousMonthData.crops).isPositive ? 'positive' : 'negative'}`}>
                {calculatePercentageChange(dashboardFarmData.crops, previousMonthData.crops).value}
              </div>
            </div>
          </div>

          {/* Zadania */}
          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-title">ZADANIA DO WYKONANIA ✅</div>
              <div className="stats-value">{dashboardFarmData.tasks}</div>
              <div className={`stats-change ${calculatePercentageChange(dashboardFarmData.tasks, previousMonthData.tasks).isPositive ? 'positive' : 'negative'}`}>
                {calculatePercentageChange(dashboardFarmData.tasks, previousMonthData.tasks).value}
              </div>
            </div>
          </div>

          {/* Przychody */}
          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-title">PRZYCHODY (ZŁ) 💰</div>
              <div className="stats-value">{dashboardFarmData.income.toLocaleString('pl-PL')}</div>
              <div className={`stats-change ${calculatePercentageChange(dashboardFarmData.income, previousMonthData.income).isPositive ? 'positive' : 'negative'}`}>
                {calculatePercentageChange(dashboardFarmData.income, previousMonthData.income).value}
              </div>
            </div>
          </div>

          {/* Wydatki */}
          <div className="stats-card">
            <div className="stats-content">
              <div className="stats-title">WYDATKI (ZŁ) 💸</div>
              <div className="stats-value">{dashboardFarmData.expenses.toLocaleString('pl-PL')}</div>
              <div className={`stats-change ${calculatePercentageChange(dashboardFarmData.expenses, previousMonthData.expenses).isPositive ? 'negative' : 'positive'}`}>
                {calculatePercentageChange(dashboardFarmData.expenses, previousMonthData.expenses).value}
              </div>
              <small className="stats-note">Mniejsze wydatki = lepiej</small>
            </div>
          </div>
        </div>
      </div>

      {/* Szybkie akcje */}
      <div className="quick-actions">
        <h3 className="section-title">⚡ Szybkie akcje</h3>
        <div className="actions-grid">
          {quickActions.map(action => (
            <div
              key={action.id}
              className="action-card"
              onClick={() => handleQuickAction(action)}
              style={{ cursor: 'pointer' }}
            >
              <div
                className="action-icon"
                style={{ backgroundColor: action.color }}
              >
                {action.icon}
              </div>
              <div className="action-title">{action.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ostatnie aktywności */}
      <div className="recent-activities">
        <h3 className="section-title">🕐 Ostatnie aktywności</h3>
        <div className="activities-list">
          {recentActivities.length > 0 ? (
            recentActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-desc">{activity.description}</div>
                </div>
                <div className="activity-time">{activity.time}</div>
              </div>
            ))
          ) : (
            <div className="no-activities">
              <div className="activity-icon">📝</div>
              <div className="activity-content">
                <div className="activity-title">Brak ostatnich aktywności</div>
                <div className="activity-desc">Rozpocznij korzystanie z systemu</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Podsumowanie analityczne - RZECZYWISTE DANE */}
      <div className="analytics-summary">
        <h3 className="section-title">📈 Podsumowanie analityczne</h3>
        <div className="analytics-grid">
          <div className="analytics-card">
            <h4>💰 Finanse</h4>
            <p>Marża zysku: {financialAnalytics?.kpis?.profitMargin?.toFixed(1) || 0}%</p>
            <p>Bilans miesięczny: {(dashboardFarmData.income - dashboardFarmData.expenses).toLocaleString('pl-PL')} zł</p>
            <p>Przychody: {dashboardFarmData.income.toLocaleString('pl-PL')} zł</p>
            <p>Wydatki: {dashboardFarmData.expenses.toLocaleString('pl-PL')} zł</p>
          </div>
          
          <div className="analytics-card">
            <h4>🌾 Produkcja</h4>
            <p>Powierzchnia: {dashboardFarmData.area.toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ha</p>
            <p>Wykorzystanie pól: {fieldAnalytics?.fieldUtilization?.utilizationRate?.toFixed(1) || 0}%</p>
            <p>Rodzaje upraw: {dashboardFarmData.crops}</p>
            <p>Zadania oczekujące: {dashboardFarmData.tasks}</p>
          </div>
          
          <div className="analytics-card">
            <h4>📦 Magazyn i zwierzęta</h4>
            <p>Zwierzeta: {dashboardFarmData.animals} szt.</p>
            <p>Wartość zapasów: {warehouseAnalytics?.inventoryValue?.toLocaleString('pl-PL') || 0} zł</p>
            <p>Niskie stany: {warehouseAnalytics?.stockLevels?.lowStock || 0} produktów</p>
            <p>Kondycja stada: {animalAnalytics?.health?.healthIndex?.toFixed(1) || 0}%</p>
          </div>
        </div>
      </div>

      {/* Stopka */}
      <div className="dashboard-footer">
        <p>
          <strong>Dane aktualne:</strong> {new Date().toLocaleString('pl-PL')} | 
          <strong> Liczba transakcji:</strong> {transactions?.length || 0} | 
          <strong> Liczba zadań:</strong> {tasks?.length || 0}
        </p>
        <p className="footer-note">
          Aktualizacja danych w czasie rzeczywistym. Wszystkie kwoty w PLN.
        </p>
      </div>
    </div>
  )
}

export default Dashboard