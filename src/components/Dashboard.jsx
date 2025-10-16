import StatCard from './StatCard'

function Dashboard({ farmData }) {
  const quickActions = [
    { id: 1, title: 'Dodaj zadanie', icon: '➕', color: '#4caf50' },
    { id: 2, title: 'Zarejestruj sprzedaż', icon: '💰', color: '#ff9800' },
    { id: 3, title: 'Dodaj zwierzę', icon: '🐄', color: '#795548' },
    { id: 4, title: 'Planuj zasiew', icon: '🌱', color: '#8bc34a' },
    { id: 5, title: 'Raport finansowy', icon: '📊', color: '#2196f3' },
    { id: 6, title: 'Kalendarz prac', icon: '📅', color: '#9c27b0' }
  ]

  const recentActivities = [
    { id: 1, title: 'Zasiano pszenicę', description: 'Pole nr 3 - 15 ha', time: '2 godziny temu', icon: '🌾' },
    { id: 2, title: 'Sprzedaż mleka', description: '1200 litrów - 2400 zł', time: 'Wczoraj', icon: '🥛' },
    { id: 3, title: 'Kontrola weterynaryjna', description: 'Stado bydła - wszystkie zdrowe', time: '2 dni temu', icon: '🐄' },
    { id: 4, title: 'Nawożenie pola', description: 'Pole nr 1 - nawozy azotowe', time: '3 dni temu', icon: '🧪' },
    { id: 5, title: 'Zakup paszy', description: '10 ton - 8500 zł', time: '5 dni temu', icon: '🌾' }
  ]

  return (
    <div>
      <div className="dashboard-header">
        <h2>Witaj w systemie AgroManager</h2>
        <p>Przegląd Twojego gospodarstwa rolnego na dzień {new Date().toLocaleDateString('pl-PL')}</p>
      </div>

      <div className="dashboard-grid">
        <StatCard 
          title="Powierzchnia upraw (ha)" 
          value={farmData.area} 
          change={2.5} 
          icon="🌾" 
        />
        <StatCard 
          title="Liczba zwierząt" 
          value={farmData.animals} 
          change={-1.2} 
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
          change={3} 
          icon="✅" 
        />
        <StatCard 
          title="Przychody (zł)" 
          value={farmData.income.toLocaleString('pl-PL')} 
          change={5.7} 
          icon="💰" 
        />
        <StatCard 
          title="Wydatki (zł)" 
          value={farmData.expenses.toLocaleString('pl-PL')} 
          change={-2.1} 
          icon="💸" 
        />
      </div>

      <div className="quick-actions">
        <h3 className="section-title">Szybkie akcje</h3>
        <div className="actions-grid">
          {quickActions.map(action => (
            <div key={action.id} className="action-card">
              <div className="action-icon">{action.icon}</div>
              <div className="action-title">{action.title}</div>
            </div>
          ))}
        </div>
      </div>

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
    </div>
  )
}

export default Dashboard