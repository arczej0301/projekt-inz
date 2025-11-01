// Dashboard.jsx - POPRAWIONA WERSJA Z DANYMI
import { useState, useEffect } from 'react'
import StatCard from './StatCard'
import { useFinance } from '../hooks/useFinance'
import { useTasks } from '../hooks/useTasks'
import { useAnalytics } from '../hooks/useAnalytics'

function Dashboard() {
  const { getFinancialSummary, transactions } = useFinance()
  const { tasks } = useTasks()
  const { 
    financialAnalytics, 
    fieldAnalytics, 
    animalAnalytics,
    warehouseAnalytics,
    alerts,
    loading: analyticsLoading 
  } = useAnalytics()

  const [farmData, setFarmData] = useState({
    area: 0,
    animals: 0,
    crops: 0,
    tasks: 0,
    income: 0,
    expenses: 0
  })

  const [recentActivities, setRecentActivities] = useState([])

  // POPRAWNY useEffect - z odpowiednimi zależnościami
  useEffect(() => {
    //console.log('🔄 Aktualizacja danych farmy');
    
    const financialSummary = getFinancialSummary()
    
    const updatedFarmData = {
      area: fieldAnalytics?.totalArea || 0,
      animals: animalAnalytics?.totalAnimals || 0,
      crops: fieldAnalytics?.activeCrops || fieldAnalytics?.cropPerformance?.length || 0,
      tasks: tasks.filter(task => task.status === 'pending').length,
      income: financialSummary?.monthlyIncome || 0,
      expenses: financialSummary?.monthlyExpenses || 0
    }
    
    //console.log('📊 Nowe dane farmy:', updatedFarmData);
    setFarmData(updatedFarmData)
  }, [
    // BEZ funkcji getFinancialSummary - ona powoduje problem
    transactions, // cała tablica transactions
    tasks, // cała tablica tasks
    fieldAnalytics?.totalArea, // tylko konkretne właściwości
    fieldAnalytics?.activeCrops,
    fieldAnalytics?.cropPerformance,
    animalAnalytics?.totalAnimals
  ])

  // POPRAWNY efekt dla aktywności
  useEffect(() => {
    const generateActivities = () => {
      const activities = []

      // Ostatnie transakcje
      if (transactions && transactions.length > 0) {
        transactions.slice(0, 3).forEach(transaction => {
          const isIncome = transaction.type === 'income'
          activities.push({
            id: `transaction_${transaction.id}`,
            title: `${isIncome ? 'Przychód' : 'Wydatek'}: ${transaction.category}`,
            description: `${transaction.description} - ${transaction.amount?.toLocaleString('pl-PL')} zł`,
            time: formatTimeAgo(transaction.date),
            icon: isIncome ? '💰' : '💸'
          })
        })
      }

      // Ostatnio ukończone zadania
      if (tasks && tasks.length > 0) {
        tasks
          .filter(task => task.status === 'completed')
          .slice(0, 2)
          .forEach(task => {
            activities.push({
              id: `task_${task.id}`,
              title: `Ukończono: ${task.title}`,
              description: task.description || 'Zadanie zostało ukończone',
              time: task.completedAt ? formatTimeAgo(task.completedAt.toDate()) : 'Nieznany czas',
              icon: '✅'
            })
          })
      }

      // Domyślna aktywność jeśli brak
      if (activities.length === 0) {
        activities.push({ 
          id: 1, 
          title: 'Witamy w systemie!', 
          description: 'Rozpocznij dodawanie swoich danych', 
          time: 'Teraz', 
          icon: '👋' 
        })
      }

      return activities.slice(0, 5)
    }

    setRecentActivities(generateActivities())
  }, [transactions, tasks]) // Tylko transactions i tasks

  const quickActions = [
    { id: 1, title: 'Dodaj zadanie', icon: '➕', color: '#4caf50', link: '/tasks' },
    { id: 2, title: 'Zarejestruj sprzedaż', icon: '💰', color: '#ff9800', link: '/finance' },
    { id: 3, title: 'Dodaj zwierzę', icon: '🐄', color: '#795548', link: '/animals' },
    { id: 4, title: 'Planuj zasiew', icon: '🌱', color: '#8bc34a', link: '/fields' },
    { id: 5, title: 'Raport finansowy', icon: '📊', color: '#2196f3', link: '/reports' },
    { id: 6, title: 'Kalendarz prac', icon: '📅', color: '#9c27b0', link: '/tasks' }
  ]

  // Funkcja pomocnicza do formatowania czasu
  function formatTimeAgo(date) {
    if (!date) return 'Nieznany czas'
    
    const now = new Date()
    const diffMs = now - new Date(date)
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Przed chwilą'
    if (diffMins < 60) return `${diffMins} min temu`
    if (diffHours < 24) return `${diffHours} godz. temu`
    if (diffDays === 1) return 'Wczoraj'
    if (diffDays < 7) return `${diffDays} dni temu`
    
    return new Date(date).toLocaleDateString('pl-PL')
  }

  const handleQuickAction = (action) => {
    if (action.link) {
      window.location.href = action.link
    }
  }

  if (analyticsLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Ładowanie danych dashboardu...</p>
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
          <h3 className="section-title">Alerty i powiadomienia</h3>
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

      {/* Karty statystyk */}
      <div className="dashboard-grid">
        <StatCard 
          title="Powierzchnia upraw (ha)" 
          value={farmData.area} 
          change={fieldAnalytics?.fieldUtilization?.utilizationRate ? Math.round(fieldAnalytics.fieldUtilization.utilizationRate) : 0} 
          icon="🌾" 
        />
        <StatCard 
          title="Liczba zwierząt" 
          value={farmData.animals} 
          change={animalAnalytics?.productivity?.growthRate || 0} 
          icon="🐄" 
        />
        <StatCard 
          title="Rodzaje upraw" 
          value={farmData.crops} 
          change={0} 
          icon="🌱" 
        />
        <StatCard 
          title="Zadania do wykonania" 
          value={farmData.tasks} 
          change={0} 
          icon="✅" 
        />
        <StatCard 
          title="Przychody (zł)" 
          value={farmData.income.toLocaleString('pl-PL')} 
          change={financialAnalytics?.kpis?.profitMargin ? Math.round(financialAnalytics.kpis.profitMargin) : 0} 
          icon="💰" 
        />
        <StatCard 
          title="Wydatki (zł)" 
          value={farmData.expenses.toLocaleString('pl-PL')} 
          change={financialAnalytics?.kpis?.expenseRatio ? Math.round(financialAnalytics.kpis.expenseRatio) : 0} 
          icon="💸" 
        />
      </div>

      {/* Szybkie akcje */}
      <div className="quick-actions">
        <h3 className="section-title">Szybkie akcje</h3>
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
        <h3 className="section-title">Ostatnie aktywności</h3>
        <div className="activities-list">
          {recentActivities.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">{activity.icon}</div>
              <div className="activity-content">
                <div className="activity-title">{activity.title}</div>
                <div className="activity-desc">{activity.description}</div>
              </div>
              <div className="activity-time">{activity.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Podsumowanie analityczne */}
      <div className="analytics-summary">
        <h3 className="section-title">Podsumowanie analityczne</h3>
        <div className="analytics-grid">
          <div className="analytics-card">
            <h4>💰 Finanse</h4>
            <p>Marża zysku: {financialAnalytics?.kpis?.profitMargin?.toFixed(1) || 0}%</p>
            <p>Bilans miesięczny: {(farmData.income - farmData.expenses).toLocaleString('pl-PL')} zł</p>
          </div>
          <div className="analytics-card">
            <h4>🌾 Produkcja</h4>
            <p>Wykorzystanie pól: {fieldAnalytics?.fieldUtilization?.utilizationRate?.toFixed(1) || 0}%</p>
            <p>Wydajność stada: {animalAnalytics?.health?.healthIndex?.toFixed(1) || 0}%</p>
          </div>
          <div className="analytics-card">
            <h4>📦 Magazyn</h4>
            <p>Wartość zapasów: {warehouseAnalytics?.inventoryValue?.toLocaleString('pl-PL') || 0} zł</p>
            <p>Niskie stany: {warehouseAnalytics?.stockLevels?.lowStock || 0} produktów</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard