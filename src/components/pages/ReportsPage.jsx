// pages/ReportsPage.jsx
import React, { useState } from 'react'
import { useAnalytics } from '../../hooks/useAnalytics'
import AnalyticsDashboard from '../../components/Analytics/AnalyticsDashboard'
import FinancialReports from '../../components/Analytics/FinancialReports'
import ProductionReports from '../../components/Analytics/ProductionReports'
import CostAnalysis from '../../components/Analytics/CostAnalysis'
import ExportPanel from '../../components/Analytics/ExportPanel'
import './ReportsPage.css'

const ReportsPage = () => {
  const { 
    loading, 
    error, 
    financialAnalytics, 
    fieldAnalytics, 
    animalAnalytics, 
    warehouseAnalytics,
    equipmentAnalytics,
    alerts 
  } = useAnalytics()
  
  const [activeTab, setActiveTab] = useState('dashboard')

  const tabs = [
    { id: 'dashboard', name: 'Pulpit', icon: '📊' },
    { id: 'financial', name: 'Analiza Finansowa', icon: '💰' },
    { id: 'production', name: 'Wydajność', icon: '🌾' },
    { id: 'costs', name: 'Optymalizacja Kosztów', icon: '📉' },
    { id: 'export', name: 'Eksport', icon: '📤' }
  ]

  if (loading) {
    return (
      <div className="reports-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Ładowanie danych analitycznych...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="reports-page">
        <div className="error">
          <div className="error-icon">⚠️</div>
          <h3>Błąd podczas ładowania danych</h3>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.reload()}
          >
            Odśwież stronę
          </button>
        </div>
      </div>
    )
  }

  const criticalAlerts = alerts.filter(alert => alert.priority === 'critical')
  const warningAlerts = alerts.filter(alert => alert.priority === 'high' || alert.priority === 'medium')

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div className="header-main">
          <h2>Raporty i Analizy</h2>
          <p className="header-subtitle">Kompleksowy przegląd efektywności Twojego gospodarstwa</p>
        </div>
        
        <div className="alerts-preview">
          {criticalAlerts.length > 0 && (
            <div className="critical-alerts">
              <span className="alert-count critical">{criticalAlerts.length}</span>
              <span>Krytyczne alerty</span>
            </div>
          )}
          {warningAlerts.length > 0 && (
            <div className="warning-alerts">
              <span className="alert-count warning">{warningAlerts.length}</span>
              <span>Ostrzeżenia</span>
            </div>
          )}
          {alerts.length === 0 && (
            <div className="no-alerts">
              <span className="alert-count positive">✓</span>
              <span>Brak alertów</span>
            </div>
          )}
        </div>
      </div>

      {/* Szybki podgląd KPI */}
      <div className="quick-overview">
        <div className="overview-grid">
          <div className="overview-item">
            <div className="overview-icon">💰</div>
            <div className="overview-content">
              <div className="overview-value">{financialAnalytics.kpis.totalRevenue.toFixed(2)} zł</div>
              <div className="overview-label">Przychód roczny</div>
            </div>
          </div>
          
          <div className="overview-item">
            <div className="overview-icon">📈</div>
            <div className="overview-content">
              <div className="overview-value">{financialAnalytics.kpis.netProfit.toFixed(2)} zł</div>
              <div className="overview-label">Zysk netto</div>
            </div>
          </div>
          
          <div className="overview-item">
            <div className="overview-icon">🌾</div>
            <div className="overview-content">
              <div className="overview-value">{fieldAnalytics.totalFields}</div>
              <div className="overview-label">Aktywne pola</div>
            </div>
          </div>
          
          <div className="overview-item">
            <div className="overview-icon">🐄</div>
            <div className="overview-content">
              <div className="overview-value">{animalAnalytics.totalAnimals}</div>
              <div className="overview-label">Zwierzęta</div>
            </div>
          </div>
        </div>
      </div>

      <div className="reports-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-name">{tab.name}</span>
          </button>
        ))}
      </div>

      <div className="reports-content">
        {activeTab === 'dashboard' && (
          <AnalyticsDashboard 
            financialAnalytics={financialAnalytics}
            fieldAnalytics={fieldAnalytics}
            animalAnalytics={animalAnalytics}
            warehouseAnalytics={warehouseAnalytics}
            equipmentAnalytics={equipmentAnalytics}
            alerts={alerts}
          />
        )}
        
        {activeTab === 'financial' && (
          <FinancialReports 
            data={financialAnalytics}
            fieldAnalytics={fieldAnalytics}
          />
        )}
        
        {activeTab === 'production' && (
          <ProductionReports 
            fieldAnalytics={fieldAnalytics}
            animalAnalytics={animalAnalytics}
            equipmentAnalytics={equipmentAnalytics}
          />
        )}
        
        {activeTab === 'costs' && (
          <CostAnalysis 
            financialAnalytics={financialAnalytics}
            fieldAnalytics={fieldAnalytics}
            animalAnalytics={animalAnalytics}
            equipmentAnalytics={equipmentAnalytics}
          />
        )}
        
        {activeTab === 'export' && (
          <ExportPanel 
            financialAnalytics={financialAnalytics}
            fieldAnalytics={fieldAnalytics}
            animalAnalytics={animalAnalytics}
            warehouseAnalytics={warehouseAnalytics}
            equipmentAnalytics={equipmentAnalytics}
            alerts={alerts}
          />
        )}
      </div>

      {/* Alerty w stopce */}
      {criticalAlerts.length > 0 && (
        <div className="floating-alerts">
          <div className="floating-alert critical">
            <div className="alert-header">
              <span className="alert-icon">🚨</span>
              <strong>Krytyczne alerty wymagają Twojej uwagi!</strong>
            </div>
            <div className="alert-messages">
              {criticalAlerts.slice(0, 2).map((alert, index) => (
                <div key={index} className="alert-message">
                  {alert.title}
                </div>
              ))}
              {criticalAlerts.length > 2 && (
                <div className="alert-message">
                  +{criticalAlerts.length - 2} więcej...
                </div>
              )}
            </div>
            <button 
              className="btn btn-small"
              onClick={() => setActiveTab('dashboard')}
            >
              Sprawdź
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportsPage