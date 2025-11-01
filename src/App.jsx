// App.jsx - WERSJA Z DEBUGOWANIEM
import React, { useState, useEffect } from 'react'
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
import GaragePage from './components/pages/GaragePage'
import TestPage from './components/pages/TestPage';
import { LoadScript } from '@react-google-maps/api';

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
    //console.log('🟡 App useEffect - user changed:', user)
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

  const handleTabChange = (tab) => {
    //console.log('🟢 Changing tab to:', tab)
    setActiveTab(tab)
  }

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
      case 'garage':
        return <GaragePage />
      case 'tasks':
        return <TasksPage />
      case 'finance':
        return <FinancePage />
      case 'reports':
        return <ReportsPage />
        case 'test':
  return <TestPage />;
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
    <LoadScript 
      googleMapsApiKey="AIzaSyDwQY25si9n-D7toIcLHKh32Ejq8l2KcFA"
      libraries={['geometry']}
    >
      <div className="app">
        <InactivityWarning />
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
        <div className="main-content">
          <Header />
          <div className="content">
            {renderContent()}
          </div>
        </div>
      </div>
    </LoadScript>
  )
}

export default App