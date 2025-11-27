// App.jsx - POPRAWIONA WERSJA BEZ CONSOLE.LOG
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
import SettingsPage from './components/Settings/SettingsPage' 
import { LoadScript } from '@react-google-maps/api'
import './App.css'
import './components/MainContent.css'

const GOOGLE_MAPS_API_KEY = "AIzaSyDwQY25si9n-D7toIcLHKh32Ejq8l2KcFA";

function App() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [farmData, setFarmData] = useState({
    area: 0,
    animals: 0,
    crops: 0,
    tasks: 0,
    income: 0,
    expenses: 0
  })
  const [mapsLoaded, setMapsLoaded] = useState(false)

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

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const renderContent = () => {
    if (!mapsLoaded && activeTab === 'fields') {
      return (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Ładowanie map...</p>
        </div>
      )
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard farmData={farmData} />
      case 'fields':
        return mapsLoaded ? <FieldsPage /> : (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Ładowanie map...</p>
          </div>
        )
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
      case 'settings':
        return <SettingsPage />
      case 'test':
        return <TestPage />
      default:
        return <Dashboard farmData={farmData} />
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Ładowanie aplikacji...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <LoadScript 
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={['geometry']}
      onLoad={() => setMapsLoaded(true)}
      onError={() => setMapsLoaded(false)}
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