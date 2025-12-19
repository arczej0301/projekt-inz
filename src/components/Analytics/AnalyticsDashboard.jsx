// components/Analytics/AnalyticsDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react'
import CustomSelect from '../common/CustomSelect'
import FieldYieldChart from './FieldYieldChart'
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
import { useFinance } from '../../hooks/useFinance'
import { useAnalytics } from '../../hooks/useAnalytics'

// Import funkcji do generowania mock danych (jako fallback)
import { generateMockFinancialData, generateMockCostStructure } from '../../utils/chartUtils'

// Główne funkcje przetwarzania danych
const prepareChartData = (transactions = []) => {
  if (!transactions || transactions.length === 0) {
    return []
  }

  // Grupowanie transakcji miesięcznie
  const monthlyData = {}
  
  transactions.forEach(transaction => {
    if (!transaction.date) return
    
    // Konwersja daty
    let date
    if (transaction.date.toDate) {
      date = transaction.date.toDate()
    } else if (transaction.date instanceof Date) {
      date = transaction.date
    } else {
      date = new Date(transaction.date)
    }
    
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleDateString('pl-PL', { month: 'short' })
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        name: monthName,
        fullDate: `${monthName} ${date.getFullYear()}`,
        revenue: 0,
        expenses: 0,
        transactionCount: 0
      }
    }
    
    const amount = parseFloat(transaction.amount) || 0
    
    if (transaction.type === 'income') {
      monthlyData[monthKey].revenue += amount
    } else if (transaction.type === 'expense') {
      monthlyData[monthKey].expenses += amount
    }
    
    monthlyData[monthKey].transactionCount++
  })

  // Sortowanie chronologicznie
  const sortedData = Object.keys(monthlyData)
    .sort()
    .map(key => monthlyData[key])
    .slice(-12) // Ostatnie 12 miesięcy

  // Oblicz trend przychodów (średnia ruchoma 3-miesięczna)
  const dataWithTrend = sortedData.map((item, index, array) => {
    const trendWindow = 3
    let trend = item.revenue
    
    if (index >= trendWindow - 1) {
      const windowData = array.slice(index - trendWindow + 1, index + 1)
      trend = windowData.reduce((sum, d) => sum + d.revenue, 0) / trendWindow
    } else if (index > 0) {
      trend = (array[index - 1].revenue + item.revenue) / 2
    }
    
    return {
      ...item,
      revenue: parseFloat(item.revenue.toFixed(2)),
      expenses: parseFloat(item.expenses.toFixed(2)),
      revenueTrend: parseFloat(trend.toFixed(2)),
      balance: parseFloat((item.revenue - item.expenses).toFixed(2))
    }
  })

  return dataWithTrend
}

// Struktura kosztów z rzeczywistych transakcji
const prepareCostStructure = (transactions = []) => {
  const expenses = transactions.filter(t => t.type === 'expense')
  
  if (expenses.length === 0) return []
  
  const categoryTotals = {}
  
  expenses.forEach(transaction => {
    const category = transaction.category || 'Inne'
    const amount = parseFloat(transaction.amount) || 0
    
    if (!categoryTotals[category]) {
      categoryTotals[category] = 0
    }
    
    categoryTotals[category] += amount
  })
  
  const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0)
  
  return Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
      percentage: totalExpenses > 0 ? parseFloat(((value / totalExpenses) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.value - a.value)
}

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('month')
  const [viewType, setViewType] = useState('overview')
  
  // UŻYJ rzeczywistych hooków
  const { 
    financialAnalytics, 
    fieldAnalytics, 
    animalAnalytics, 
    loading: analyticsLoading, 
    error: analyticsError,
    alerts: realAlerts,
    data: analyticsData
  } = useAnalytics()
  
  const { 
    transactions: financeTransactions = [],
    getFinancialSummary,
    getBudgetsWithStatus,
    loading: financeLoading,
    error: financeError
  } = useFinance()

  const isLoading = analyticsLoading || financeLoading
  const error = analyticsError || financeError

  // Przygotuj dane dla wykresów z rzeczywistych transakcji
  const dashboardData = useMemo(() => {
    // Fallback do mock danych jeśli nie ma rzeczywistych
    if (!financeTransactions || financeTransactions.length === 0) {
      console.log('Brak transakcji, używam mock danych')
      const mockTrends = generateMockFinancialData ? generateMockFinancialData(12) : []
      const mockCosts = generateMockCostStructure ? generateMockCostStructure() : []
      
      return {
        financialTrends: mockTrends,
        costStructure: mockCosts,
        productivity: fieldAnalytics?.productivity || [],
        healthData: animalAnalytics?.health || {
          healthIndex: 95,
          commonIssues: [],
          healthDistribution: {}
        },
        alerts: realAlerts || []
      }
    }

    console.log('Używam rzeczywistych transakcji:', financeTransactions.length)

    return {
      financialTrends: prepareChartData(financeTransactions),
      costStructure: prepareCostStructure(financeTransactions),
      productivity: fieldAnalytics?.productivity || [],
      healthData: animalAnalytics?.health || {
        healthIndex: 95,
        commonIssues: [],
        healthDistribution: {}
      },
      alerts: realAlerts || []
    }
  }, [financeTransactions, fieldAnalytics, animalAnalytics, realAlerts])

  // Oblicz rzeczywiste KPI z transakcji
  const realKPIs = useMemo(() => {
    if (!financeTransactions || financeTransactions.length === 0) {
      // Fallback do przykładowych wartości
      return {
        totalRevenue: 892000,
        netProfit: 215000,
        profitMargin: 24.1,
        revenueTrend: 12.5,
        monthlyExpenses: 0,
        activeFields: fieldAnalytics?.totalFields || 0
      }
    }

    const summary = getFinancialSummary ? getFinancialSummary() : { totalIncome: 0, totalExpenses: 0, monthlyExpenses: 0 }
    const totalRevenue = summary.totalIncome || 0
    const totalExpenses = summary.totalExpenses || 0
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    
    // Oblicz trend (ostatni miesiąc vs poprzedni miesiąc)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    
    const currentMonthRevenue = financeTransactions
      .filter(t => {
        if (!t.date) return false
        const date = t.date.toDate ? t.date.toDate() : new Date(t.date)
        return t.type === 'income' && 
          date.getMonth() === currentMonth && 
          date.getFullYear() === currentYear
      })
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    
    const lastMonthRevenue = financeTransactions
      .filter(t => {
        if (!t.date) return false
        const date = t.date.toDate ? t.date.toDate() : new Date(t.date)
        return t.type === 'income' && 
          date.getMonth() === lastMonth && 
          date.getFullYear() === lastMonthYear
      })
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
    
    const revenueTrend = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : (currentMonthRevenue > 0 ? 100 : 0)
    
    return {
      totalRevenue,
      netProfit,
      profitMargin: parseFloat(profitMargin.toFixed(1)),
      revenueTrend: parseFloat(revenueTrend.toFixed(1)),
      monthlyExpenses: summary.monthlyExpenses || 0,
      activeFields: fieldAnalytics?.totalFields || 0,
      totalArea: fieldAnalytics?.totalArea || 0
    }
  }, [financeTransactions, getFinancialSummary, fieldAnalytics])

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
        <div className="loading-container" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px'
        }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '20px', color: '#7f8c8d' }}>Ładowanie danych dashboardu...</p>
          {financeTransactions.length === 0 && (
            <p style={{ fontSize: '0.9rem', color: '#95a5a6', marginTop: '10px' }}>
              Pierwsze uruchomienie może trwać dłużej
            </p>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-dashboard">
        <div className="error-container" style={{
          padding: '40px',
          textAlign: 'center',
          color: '#e74c3c'
        }}>
          <h3>Błąd ładowania danych</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Odśwież stronę
          </button>
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

      {/* KPI Cards z rzeczywistymi danymi */}
      <div className="kpi-section">
        <h3>Kluczowe Wskaźniki Wydajności 
          {financeTransactions.length > 0 ? (
            <span style={{fontSize: '0.8rem', color: '#27ae60', marginLeft: '10px'}}>
              (dane rzeczywiste)
            </span>
          ) : (
            <span style={{fontSize: '0.8rem', color: '#f39c12', marginLeft: '10px'}}>
              (dane przykładowe)
            </span>
          )}
        </h3>
        <div className="kpi-grid">
          <div className="kpi-card revenue">
            <div className="kpi-icon">💰</div>
            <div className="kpi-content">
              <div className="kpi-value">
                {safeFormatCurrency(realKPIs.totalRevenue)}
              </div>
              <div className="kpi-label">Przychód całkowity</div>
              <div className={`kpi-trend ${realKPIs.revenueTrend >= 0 ? 'positive' : 'negative'}`}>
                {realKPIs.revenueTrend >= 0 ? '+' : ''}{realKPIs.revenueTrend.toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="kpi-card profit">
            <div className="kpi-icon">📈</div>
            <div className="kpi-content">
              <div className="kpi-value">
                {safeFormatCurrency(realKPIs.netProfit)}
              </div>
              <div className="kpi-label">Zysk netto</div>
              <div className={`kpi-trend ${realKPIs.netProfit >= 0 ? 'positive' : 'negative'}`}>
                {realKPIs.netProfit >= 0 ? '+' : ''}{realKPIs.profitMargin >= 0 ? '+' : ''}{realKPIs.profitMargin.toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="kpi-card margin">
            <div className="kpi-icon">⚖️</div>
            <div className="kpi-content">
              <div className="kpi-value">{realKPIs.profitMargin.toFixed(1)}%</div>
              <div className="kpi-label">Marża zysku</div>
              <div className={`kpi-trend ${realKPIs.profitMargin >= 0 ? 'positive' : 'negative'}`}>
                {realKPIs.profitMargin >= 0 ? 'Dodatnia' : 'Ujemna'}
              </div>
            </div>
          </div>

          <div className="kpi-card efficiency">
            <div className="kpi-icon">🌾</div>
            <div className="kpi-content">
              <div className="kpi-value">{realKPIs.activeFields}</div>
              <div className="kpi-label">Aktywne pola</div>
              <div className="kpi-trend neutral">
                {realKPIs.totalArea > 0 ? `${realKPIs.totalArea.toFixed(1)} ha` : '0 ha'}
              </div>
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
            <div className="chart-card-content"></div>
             <FieldYieldChart />
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
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#999',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px dashed #ddd'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
        <div>Brak danych kosztowych</div>
        <div style={{ fontSize: '0.8rem', marginTop: '5px', color: '#bbb' }}>
          Dodaj transakcje wydatków w module Finanse
        </div>
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
          <p style={{ color: '#7f8c8d', fontSize: '0.85rem', marginTop: '3px' }}>
            {payload[0].payload.percentage}% wszystkich kosztów
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        padding: '0 10px'
      }}>
        <h4 style={{ margin: 0, fontSize: '1rem', color: '#2c3e50' }}>
          Rozkład kosztów
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#7f8c8d', 
            marginLeft: '10px',
            fontWeight: 'normal'
          }}>
            ({sortedData.length} kategorii)
          </span>
        </h4>
      </div>
      
      <ResponsiveContainer width="100%" height="90%">
        <RechartsBarChart
          layout="vertical"
          data={sortedData}
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
          <XAxis 
            type="number" 
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k zł`}
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

// Lokalny komponent BarChart dla wydajności pól
const BarChart = ({ data = [] }) => {
  // Jeśli brak danych, pokaż placeholder
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: '300px', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#999',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px dashed #ddd'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🌾</div>
        <div>Brak danych o wydajności pól</div>
        <div style={{ fontSize: '0.8rem', marginTop: '5px', color: '#bbb' }}>
          Dodaj pola w module Pola
        </div>
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

// W AnalyticsDashboard.jsx - zaktualizuj komponent HealthChart
const HealthChart = ({ data = {} }) => {
  const healthIndex = data.healthIndex || 0;
  const commonIssues = data.commonIssues || [];
  const healthDistribution = data.healthDistribution || {};
  const totalAnimals = data.totalAnimals || 0;
  const sickAnimals = data.sickAnimals || 0;
  const healthyAnimals = totalAnimals - sickAnimals;

  // Mapowanie statusów zdrowia na klasy CSS
  const getHealthDotClass = (status) => {
    const statusMap = {
      'zdrowy': 'healthy',
      'chory': 'sick',
      'w leczeniu': 'treating',
      'w kwarantannie': 'quarantine',
      'krytyczny': 'critical',
      'nieznany': 'unknown'
    };
    return statusMap[status.toLowerCase()] || 'unknown';
  };

  // Mapowanie severity na klasy CSS
  const getIssueSeverityClass = (severity) => {
    return severity || 'medium';
  };

  // Określenie klasy dla wskaźnika zdrowia
  const getHealthScoreClass = () => {
    if (healthIndex >= 80) return 'excellent';
    if (healthIndex >= 60) return 'good';
    if (healthIndex >= 40) return 'poor';
    return 'critical';
  };

  // Przygotowanie danych dla wykresu
  const chartData = Object.entries(healthDistribution)
    .filter(([status, count]) => count > 0)
    .map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      percentage: totalAnimals > 0 ? Math.round((count / totalAnimals) * 100) : 0,
      dotClass: getHealthDotClass(status)
    }));

  // Jeśli nie ma danych o zwierzętach
  if (totalAnimals === 0) {
    return (
      <div className="no-animals-data">
        <div className="no-animals-icon">🐮</div>
        <div className="no-animals-text">Brak danych o zwierzętach</div>
        <div className="no-animals-subtext">
          Dodaj zwierzęta w module Zwierzęta
        </div>
      </div>
    );
  }

  return (
    <div className="compact-health-chart">
      <div className="health-score-compact">
        <div className={`score-value-compact ${getHealthScoreClass()}`}>
          {healthIndex}%
        </div>
        <div className="score-label-compact">
          Wskaźnik zdrowia stada
        </div>
        <div className="health-stats-compact">
          <span className="total-animals">🐄 {totalAnimals} zwierząt</span>
          <span className={sickAnimals > 0 ? 'sick-animals' : 'healthy-animals'}>
            {sickAnimals > 0 ? '⚠️' : '✓'} {sickAnimals} chorych
          </span>
        </div>
      </div>
      
      {/* Prosty wykres rozkładu zdrowia */}
      {chartData.length > 0 && (
        <div className="health-distribution-compact">
          <div className="health-distribution-title">
            Rozkład zdrowia:
          </div>
          
          <div className="health-distribution-list">
            {chartData.map((item, index) => (
              <div key={index} className="health-distribution-item-compact">
                <div className={`health-dot ${item.dotClass}`}></div>
                <div className="health-item-name">
                  {item.name}
                </div>
                <div className="health-item-count">
                  {item.value}
                </div>
                <div className="health-item-percentage">
                  {item.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista problemów zdrowotnych */}
      {commonIssues.length > 0 && (
        <div className="health-issues-compact">
          <div className="health-issues-title">
            Problemy:
          </div>
          
          <div className="health-issues-list">
            {commonIssues.map((issue, index) => (
              <div key={index} className="health-issue-item">
                <span className="issue-name">
                  {issue.issue}
                </span>
                <span className={`issue-count ${getIssueSeverityClass(issue.severity)}`}>
                  {issue.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Eksport domyślny - TYLKO AnalyticsDashboard
export default AnalyticsDashboard;

// Jeśli potrzebujesz eksportować inne komponenty, dodaj:
// export { CostStructureChart, BarChart, HealthChart };