import React, { useState, useEffect } from 'react'
import CustomSelect from '../common/CustomSelect'
import FinancialTrendChart from './FinancialTrendChart'
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts'
import './AnalyticsDashboard.css'

// Import funkcji do generowania mock danych
import { generateMockFinancialData, generateMockCostStructure } from '../../utils/chartUtils'

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('month')
  const [viewType, setViewType] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  
  // Stan dla danych - zaczynamy od mock danych
  const [dashboardData, setDashboardData] = useState({
    financialTrends: [],
    costStructure: [],
    productivity: [],
    healthData: {},
    alerts: []
  })

  // Załaduj dane przy pierwszym renderowaniu
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      
      // Tutaj możesz dodać pobieranie danych z API
      // Na razie używamy tylko mock danych
      
      const mockTrends = generateMockFinancialData(12)
      const mockCosts = generateMockCostStructure()
      
      // Przykładowe dane produktywności
      const mockProductivity = [
        { name: 'Pole A', efficiency: 85 },
        { name: 'Pole B', efficiency: 92 },
        { name: 'Pole C', efficiency: 78 },
        { name: 'Pole D', efficiency: 95 },
        { name: 'Pole E', efficiency: 88 }
      ]
      
      // Przykładowe dane zdrowia
      const mockHealthData = {
        healthIndex: 87,
        commonIssues: [
          { issue: 'Choroby układu oddechowego', count: 3 },
          { issue: 'Problemy z racicami', count: 2 },
          { issue: 'Zapalenie wymienia', count: 1 }
        ]
      }
      
      // Przykładowe alerty
      const mockAlerts = [
        { 
          type: 'warning', 
          priority: 'high',
          title: 'Niski poziom paszy',
          message: 'Zapas paszy wystarczy tylko na 3 dni'
        },
        { 
          type: 'info', 
          priority: 'low',
          title: 'Planowane szczepienia',
          message: 'Za 5 dni szczepienie przeciw BVD'
        }
      ]
      
      setDashboardData({
        financialTrends: mockTrends,
        costStructure: mockCosts,
        productivity: mockProductivity,
        healthData: mockHealthData,
        alerts: mockAlerts
      })
      
      setIsLoading(false)
    }
    
    loadData()
  }, [])

  // Funkcje formatujące
  const safeFormatCurrency = (amount) => {
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

  if (isLoading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Ładowanie danych dashboardu...</p>
        </div>
      </div>
    )
  }

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

      {/* KPI Cards */}
      <div className="kpi-section">
        <h3>Kluczowe Wskaźniki Wydajności</h3>
        <div className="kpi-grid">
          <div className="kpi-card revenue">
            <div className="kpi-icon">💰</div>
            <div className="kpi-content">
              <div className="kpi-value">
                {safeFormatCurrency(892000)}
              </div>
              <div className="kpi-label">Przychód roczny</div>
              <div className="kpi-trend positive">+12.5%</div>
            </div>
          </div>
          
          <div className="kpi-card profit">
            <div className="kpi-icon">📈</div>
            <div className="kpi-content">
              <div className="kpi-value">
                {safeFormatCurrency(215000)}
              </div>
              <div className="kpi-label">Zysk netto</div>
              <div className="kpi-trend positive">+8.2%</div>
            </div>
          </div>
          
          <div className="kpi-card margin">
            <div className="kpi-icon">⚖️</div>
            <div className="kpi-content">
              <div className="kpi-value">24.1%</div>
              <div className="kpi-label">Marża zysku</div>
              <div className="kpi-trend positive">+2.4%</div>
            </div>
          </div>

          <div className="kpi-card efficiency">
            <div className="kpi-icon">🌾</div>
            <div className="kpi-content">
              <div className="kpi-value">6</div>
              <div className="kpi-label">Aktywne pola</div>
              <div className="kpi-trend neutral">0%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wykresy */}
      <div className="charts-section">
        <div className="chart-row">
          <div className="chart-card large-chart">
            <FinancialTrendChart 
              data={dashboardData.financialTrends}
              formatCurrency={safeFormatCurrency}
            />
          </div>
          
          <div className="chart-card">
            <h4>Struktura kosztów</h4>
            <CostStructureChart 
              data={dashboardData.costStructure}
              formatCurrency={safeFormatCurrency}
            />
          </div>
        </div>

        <div className="chart-row">
          <div className="chart-card">
            <h4>Wydajność pól</h4>
            <BarChart data={dashboardData.productivity} />
          </div>
          
          <div className="chart-card">
            <h4>Zdrowie stada</h4>
            <HealthChart data={dashboardData.healthData} />
          </div>
        </div>
      </div>
      
      {/* Alerty */}
      {dashboardData.alerts.length > 0 && (
        <div className="alerts-section">
          <h3>Alerty i Rekomendacje</h3>
          <div className="alerts-grid">
            {dashboardData.alerts.map((alert, index) => (
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
      )}
    </div>
  )
}

// Komponenty pomocnicze pozostają bez zmian...
// (CostStructureChart, BarChart, HealthChart)

// --- Komponenty Pomocnicze ---

// Wykres słupkowy poziomy dla struktury kosztów (korzysta z Recharts)
const CostStructureChart = ({ data, formatCurrency }) => {
  const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#95a5a6'];

  // Sortowanie danych malejąco
  const sortedData = data ? [...data].sort((a, b) => (b.value || 0) - (a.value || 0)) : [];

  if (!sortedData || sortedData.length === 0) {
    return (
      <div style={{ 
        height: '300px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#999',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px dashed #ddd'
      }}>
        Brak danych kosztowych
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '10px', 
          border: '1px solid #ccc', 
          borderRadius: '5px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>{label}</p>
          <p style={{ color: payload[0].payload.fill || '#e74c3c' }}>
            Koszt: {formatCurrency ? formatCurrency(payload[0].value) : payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          layout="vertical"
          data={sortedData}
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
          <XAxis 
            type="number" 
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: '#666' }}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={120} 
            tick={{ fontSize: 11, fill: '#666' }}
            interval={0}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Lokalny komponent BarChart (prosty HTML/CSS)
// Lokalny komponent BarChart dla wydajności pól
const BarChart = ({ data = [] }) => {
  // Jeśli brak danych, pokaż placeholder
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: '300px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#999',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px dashed #ddd'
      }}>
        Brak danych o wydajności pól
      </div>
    );
  }

  // Oblicz maksymalną wartość dla skalowania
  const maxEfficiency = Math.max(...data.map(item => item.efficiency || 0), 100);
  
  // Oblicz średnią wydajność
  const averageEfficiency = data.length > 0 
    ? data.reduce((sum, item) => sum + (item.efficiency || 0), 0) / data.length 
    : 0;

  return (
    <div style={{ width: '100%', height: '350px' }}>
      {/* Nagłówek z informacjami */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '10px',
        borderBottom: '1px solid #eee'
      }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#2c3e50' }}>
            Wydajność wszystkich pól
          </h4>
          <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '4px' }}>
            {data.length} pól • Średnia: {averageEfficiency.toFixed(1)}%
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              backgroundColor: '#2ecc71',
              marginRight: '6px',
              borderRadius: '2px'
            }}></div>
            <span style={{ color: '#7f8c8d' }}>Wydajność</span>
          </div>
        </div>
      </div>

      {/* Kontener wykresu */}
      <div style={{ 
        height: '250px', 
        display: 'flex', 
        alignItems: 'flex-end',
        gap: '8px',
        padding: '0 10px',
        position: 'relative'
      }}>
        {/* Linia średniej */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '2px',
          backgroundColor: '#e74c3c',
          top: `${100 - (averageEfficiency / maxEfficiency * 100)}%`,
          zIndex: 1,
          opacity: 0.7
        }}>
          <div style={{
            position: 'absolute',
            right: '10px',
            top: '-20px',
            backgroundColor: '#e74c3c',
            color: 'white',
            fontSize: '0.7rem',
            padding: '2px 6px',
            borderRadius: '3px'
          }}>
            Średnia: {averageEfficiency.toFixed(1)}%
          </div>
        </div>

        {/* Kolumny wykresu */}
        {data.map((item, index) => {
          const efficiency = item.efficiency || 0;
          const height = (efficiency / maxEfficiency) * 100;
          const isAboveAverage = efficiency > averageEfficiency;
          
          return (
            <div 
              key={index} 
              style={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                position: 'relative'
              }}
            >
              {/* Kolumna */}
              <div
                style={{
                  width: '80%',
                  height: `${height}%`,
                  backgroundColor: isAboveAverage ? '#2ecc71' : '#3498db',
                  backgroundImage: isAboveAverage 
                    ? 'linear-gradient(to top, #27ae60, #2ecc71)' 
                    : 'linear-gradient(to top, #2980b9, #3498db)',
                  borderRadius: '4px 4px 0 0',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  minHeight: '3px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Tooltip na hover */}
                <div style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  minWidth: '120px',
                  textAlign: 'center',
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.2s',
                  zIndex: 10,
                  whiteSpace: 'nowrap',
                  marginBottom: '8px'
                }} className="bar-tooltip">
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    {item.name || `Pole ${index + 1}`}
                  </div>
                  <div>Wydajność: {efficiency.toFixed(1)}%</div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    marginTop: '4px',
                    color: isAboveAverage ? '#2ecc71' : '#e74c3c'
                  }}>
                    {isAboveAverage ? 'Powyżej średniej' : 'Poniżej średniej'}
                  </div>
                </div>
                
                {/* Wartość na kolumnie */}
                <div style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  opacity: 0.8
                }}>
                  {efficiency.toFixed(0)}%
                </div>
              </div>
              
              {/* Podpis pola */}
              <div style={{
                marginTop: '8px',
                fontSize: '0.8rem',
                color: '#7f8c8d',
                textAlign: 'center',
                fontWeight: '600',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                padding: '0 4px'
              }}>
                {item.name || `Pole ${index + 1}`}
              </div>
              
              {/* Oznaczenie powyżej/poniżej średniej */}
              <div style={{
                marginTop: '4px',
                fontSize: '0.7rem',
                color: isAboveAverage ? '#27ae60' : '#e74c3c',
                fontWeight: '600'
              }}>
                {isAboveAverage ? '↑' : '↓'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px',
        marginTop: '15px',
        paddingTop: '10px',
        borderTop: '1px solid #eee',
        fontSize: '0.8rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '15px', 
            height: '15px', 
            backgroundColor: '#2ecc71',
            marginRight: '6px',
            borderRadius: '3px'
          }}></div>
          <span style={{ color: '#7f8c8d' }}>Powyżej średniej</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '15px', 
            height: '15px', 
            backgroundColor: '#3498db',
            marginRight: '6px',
            borderRadius: '3px'
          }}></div>
          <span style={{ color: '#7f8c8d' }}>Poniżej średniej</span>
        </div>
      </div>

      {/* Skrypt do pokazywania tooltipów */}
      <style>{`
        .bar-tooltip {
          opacity: 0 !important;
        }
        div[style*="cursor: pointer"]:hover .bar-tooltip {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

const HealthChart = ({ data = {} }) => {
  const healthIndex = data.healthIndex || 0;
  const commonIssues = data.commonIssues || [];
  
  return (
    <div className="health-chart">
      <div className="health-score">
        <div className="score-value">{healthIndex}%</div>
        <div className="score-label">Wskaźnik zdrowia</div>
      </div>
      <div className="health-issues">
        {commonIssues.map((issue, index) => (
          <div key={index} className="health-issue">
            <span>{issue.issue || `Problem ${index + 1}`}</span>
            <span>{issue.count || 0} przypadków</span>
          </div>
        ))}
        
        {commonIssues.length === 0 && (
          <div className="health-issue" style={{ color: '#27ae60', fontWeight: '600' }}>
            <span>Brak poważnych problemów zdrowotnych</span>
            <span>👍</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;