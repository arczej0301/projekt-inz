import React, { useState } from 'react' // DODANY useState
import CustomSelect from '../common/CustomSelect'
import './AnalyticsComponents.css'

const AnalyticsDashboard = ({ 
  financialAnalytics, 
  fieldAnalytics, 
  animalAnalytics, 
  warehouseAnalytics, 
  equipmentAnalytics, 
  alerts,
  formatCurrency,
  formatNumber
 }) => {
  
  const [timeRange, setTimeRange] = useState('month')
  const [viewType, setViewType] = useState('overview')

  // Bezpieczne funkcje formatujące
  const safeFormatCurrency = (amount) => {
    if (formatCurrency) return formatCurrency(amount)
    
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0,00 zł'
    }
    
    const numAmount = parseFloat(amount)
    const formatted = numAmount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return `${formatted} zł`
  }

  const timeRangeOptions = [
    { value: 'week', label: 'Tydzień', icon: '📅' },
    { value: 'month', label: 'Miesiąc', icon: '📊' },
    { value: 'quarter', label: 'Kwartał', icon: '📈' },
    { value: 'year', label: 'Rok', icon: '🎯' }
  ]

  const viewTypeOptions = [
    { value: 'overview', label: 'Przegląd', icon: '👁️' },
    { value: 'detailed', label: 'Szczegółowy', icon: '🔍' }
  ]

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-controls">
        <div className="control-group">
          <label>Zakres czasowy:</label>
          <CustomSelect
            options={timeRangeOptions}
            value={timeRange}
            onChange={setTimeRange}
          />
        </div>
        <div className="control-group">
          <label>Widok:</label>
          <CustomSelect
            options={viewTypeOptions}
            value={viewType}
            onChange={setViewType}
          />
        </div>
      </div>

      {/* Alerty */}
      <div className="alerts-section">
        <h3>Alerty i Rekomendacje</h3>
        <div className="alerts-grid">
          {alerts.map((alert, index) => (
            <div key={index} className={`alert-card ${alert.type} ${alert.priority}`}>
              <div className="alert-icon">
                {alert.type === 'danger' ? '⚠️' : 
                 alert.type === 'warning' ? '🚨' : 'ℹ️'}
              </div>
              <div className="alert-content">
                <div className="alert-title">{alert.title}</div>
                <div className="alert-message">{alert.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-section">
        <h3>Kluczowe Wskaźniki Wydajności</h3>
        <div className="kpi-grid">
          {/* Karta Przychodu */}
          <div className="kpi-card revenue">
            <div className="kpi-icon">💰</div>
            <div className="kpi-content">
              <div className="kpi-value">
                {formatCurrency ? formatCurrency(financialAnalytics.kpis.totalRevenue) : financialAnalytics.kpis.totalRevenue}
              </div>
              <div className="kpi-label">Przychód roczny</div>
            </div>
          </div>
          
          {/* Karta Zysku */}
          <div className="kpi-card profit">
            <div className="kpi-icon">📈</div>
            <div className="kpi-content">
              <div className="kpi-value">
                {formatCurrency ? formatCurrency(financialAnalytics.kpis.netProfit) : financialAnalytics.kpis.netProfit}
              </div>
              <div className="kpi-label">Zysk netto</div>
            </div>
          </div>
          <div className="kpi-card margin">
            <div className="kpi-icon">⚖️</div>
            <div className="kpi-content">
              <div className="kpi-value">
                {financialAnalytics.kpis.profitMargin.toFixed(1)}%
              </div>
              <div className="kpi-label">Marża zysku</div>
              <div className="kpi-trend positive">+2.4%</div>
            </div>
          </div>

          <div className="kpi-card efficiency">
            <div className="kpi-icon">🌾</div>
            <div className="kpi-content">
              <div className="kpi-value">
                {fieldAnalytics.totalFields}
              </div>
              <div className="kpi-label">Aktywne pola</div>
              <div className="kpi-trend neutral">0%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wykresy */}
      <div className="charts-section">
        <div className="chart-row">
          <div className="chart-card">
            <h4>Trend przychodów i kosztów</h4>
            <div className="chart-placeholder">
              <LineChart data={financialAnalytics.trends} />
            </div>
          </div>
          
          <div className="chart-card">
            <h4>Struktura kosztów</h4>
            <div className="chart-placeholder">
              <PieChart data={financialAnalytics.costStructure} />
            </div>
          </div>
        </div>

        <div className="chart-row">
          <div className="chart-card">
            <h4>Wydajność pól</h4>
            <div className="chart-placeholder">
              <BarChart data={fieldAnalytics.productivity} />
            </div>
          </div>
          
          <div className="chart-card">
            <h4>Zdrowie stada</h4>
            <div className="chart-placeholder">
              <HealthChart data={animalAnalytics.health} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Komponenty placeholder dla wykresów
const LineChart = ({ data }) => (
  <div className="chart-container">
    <div className="chart-line">
      {data.map((item, index) => (
        <div key={index} className="chart-bar">
          <div 
            className="bar revenue" 
            style={{ height: `${(item.revenue / 10000) * 100}%` }}
          ></div>
          <div 
            className="bar expense" 
            style={{ height: `${(item.expenses / 10000) * 100}%` }}
          ></div>
        </div>
      ))}
    </div>
    <div className="chart-labels">
      {data.map((item, index) => (
        <div key={index} className="chart-label">
          {item.month.split('-')[1]}
        </div>
      ))}
    </div>
  </div>
)

const PieChart = ({ data }) => (
  <div className="pie-chart">
    {data.map((item, index) => (
      <div 
        key={index}
        className="pie-segment"
        style={{ 
          transform: `rotate(${index * 45}deg)`,
          backgroundColor: getColor(index)
        }}
      ></div>
    ))}
  </div>
)

const BarChart = ({ data }) => (
  <div className="bar-chart-vertical">
    {data.map((item, index) => (
      <div key={index} className="bar-item">
        <div 
          className="bar-fill"
          style={{ height: `${item.efficiency}%` }}
        ></div>
        <div className="bar-label">{item.name}</div>
      </div>
    ))}
  </div>
)

const HealthChart = ({ data }) => (
  <div className="health-chart">
    <div className="health-score">
      <div className="score-value">{data?.healthIndex || 0}%</div>
      <div className="score-label">Wskaźnik zdrowia</div>
    </div>
    <div className="health-issues">
      {data?.commonIssues?.map((issue, index) => (
        <div key={index} className="health-issue">
          <span>{issue.issue}</span>
          <span>{issue.count} przypadków</span>
        </div>
      ))}
    </div>
  </div>
)

const getColor = (index) => {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c']
  return colors[index % colors.length]
}

export default AnalyticsDashboard