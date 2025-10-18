// App.jsx
import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import FieldsPage from './components/pages/FieldsPage'
import AnimalsPage from './components/pages/AnimalsPage'
import TasksPage from './components/pages/TasksPage'
import FinancePage from './components/pages/FinancePage'
import ReportsPage from './components/pages/ReportsPage'
import MagazinePage from './components/pages/MagazinePage'
import LoginPage from './components/LoginPage'
import InactivityWarning from './components/InactivityWarning'

function App() {
  const { user, loading, updateUserActivity } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [farmData, setFarmData] = useState({
    area: 0,
    animals: 0,
    crops: 0,
    tasks: 0,
    income: 0,
    expenses: 0
  })

  // Inicjalizacja danych farmy po zalogowaniu
  useEffect(() => {
    if (user) {
      setTimeout(() => {
        setFarmData({
          area: 125,
          animals: 340,
          crops: 5,
          tasks: 12,
          income: 45200,
          expenses: 28750
        })
      }, 1000)
    }
  }, [user])

  // Dodatkowe śledzenie aktywności
  useEffect(() => {
    if (!user) return;

    const handleUserActivity = () => {
      updateUserActivity();
    };

    // Dodaj event listeners dla kluczowych akcji w aplikacji
    const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [user, updateUserActivity]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard farmData={farmData} />
      case 'fields':
        return <FieldsPage />
      case 'animals':
        return <AnimalsPage />
      case 'magazine':
        return <MagazinePage />
      case 'tasks':
        return <TasksPage />
      case 'finance':
        return <FinancePage />
      case 'reports':
        return <ReportsPage />
      default:
        return <Dashboard farmData={farmData} />
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Ładowanie...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="app">
      <InactivityWarning />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Header />
        <div className="content">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default App