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

// Struktura kosztów z WSZYSTKICH źródeł
const prepareCostStructure = (completeCostData) => {
  if (!completeCostData || !completeCostData.summary || completeCostData.summary.length === 0) {
    console.log('Brak danych kosztowych z różnych źródeł')
    return []
  }

  return completeCostData.summary.map(item => ({
    name: item.name,
    value: parseFloat(item.value) || 0,
    percentage: item.percentage,
    bySource: item.bySource,
    details: item.details,
    transactionCount: item.transactionCount
  }))
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
    data: analyticsData,
    completeCostStructure
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
      costStructure: prepareCostStructure(completeCostStructure),
      productivity: fieldAnalytics?.productivity || [],
      healthData: animalAnalytics?.health || {
        healthIndex: 95,
        commonIssues: [],
        healthDistribution: {}
      },
      alerts: realAlerts || [],
      completeCostData: completeCostStructure
    }
  }, [financeTransactions, fieldAnalytics, animalAnalytics, realAlerts, completeCostStructure])

  // Funkcje formatujące
  const safeFormatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0,00 zł'
    }

    const numAmount = parseFloat(amount)
    const formatted = numAmount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return `${formatted} zł`
  }

  if (isLoading) {
    return (
      <div className="analytics-dashboard">
        <div className="state-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Ładowanie danych dashboardu...</p>
          {financeTransactions.length === 0 && (
            <p className="loading-subtext">
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
        <div className="state-container error">
          <h3>Błąd ładowania danych</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-refresh"
          >
            Odśwież stronę
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-dashboard">
      <h3>Kluczowe Wskaźniki Wydajności</h3>

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
  const [selectedSource, setSelectedSource] = useState('all');

  // Filtruj dane według źródła
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    if (selectedSource === 'all') {
      return data.filter(item => item.value > 0);
    }

    // Filtruj dane według źródła
    return data
      .filter(item => item.bySource && item.bySource[selectedSource] > 0)
      .map(item => ({
        ...item,
        value: item.bySource[selectedSource] || 0,
        percentage: (item.bySource[selectedSource] /
          Object.values(item.bySource).reduce((sum, val) => sum + val, 0)) * 100
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [data, selectedSource]);

  // Przygotuj listę źródeł
  const sources = useMemo(() => {
    if (!data || data.length === 0) return ['all'];

    const sourceSet = new Set(['all']);
    data.forEach(item => {
      if (item.bySource) {
        Object.keys(item.bySource).forEach(source => sourceSet.add(source));
      }
    });

    return Array.from(sourceSet);
  }, [data]);

  // Sortowanie danych malejąco
  const sortedData = filteredData ? [...filteredData].sort((a, b) => (b.value || 0) - (a.value || 0)) : [];

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="empty-state-placeholder cost-chart">
        <div className="empty-icon large">💰</div>
        <div className="empty-title">
          Brak danych kosztowych
        </div>
        <div className="empty-subtitle">
          {selectedSource !== 'all'
            ? `Brak kosztów z źródła: ${selectedSource}`
            : 'Dodaj transakcje wydatków w module Finanse, naprawy w Garażu lub zakupy w Magazynie'}
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      return (
        <div className="custom-tooltip-container">
          <p className="tooltip-title">
            {label}
          </p>
          <p className="tooltip-row" style={{ color: payload[0].payload.fill || '#e74c3c' }}>
            <strong>Koszt:</strong> {formatCurrency ? formatCurrency(payload[0].value) : payload[0].value}
          </p>
          <p className="tooltip-row" style={{ color: '#7f8c8d' }}>
            <strong>Procent kosztów:</strong> {dataItem.percentage.toFixed(1)}%
          </p>

          {dataItem.bySource && (
            <div className="tooltip-section">
              <p className="tooltip-subtitle">Rozkład źródeł:</p>
              {Object.entries(dataItem.bySource).map(([source, amount], index) => (
                <div key={index} className="tooltip-detail-row">
                  <span style={{ color: '#7f8c8d' }}>
                    {source === 'finance' ? 'Finanse' :
                      source === 'garage' ? 'Garaż' :
                        source === 'warehouse' ? 'Magazyn' : source}
                  </span>
                  <span style={{ fontWeight: '600', color: '#2c3e50' }}>
                    {formatCurrency ? formatCurrency(amount) : amount}
                  </span>
                </div>
              ))}
            </div>
          )}

          {dataItem.details && dataItem.details.length > 0 && (
            <div className="tooltip-section">
              <p className="tooltip-subtitle">Ostatnie transakcje:</p>
              {dataItem.details.slice(0, 3).map((detail, index) => (
                <div key={index} className="tooltip-transaction-item">
                  <div style={{ color: '#2c3e50' }}>
                    {detail.description || 'Brak opisu'}
                  </div>
                  <div className="tooltip-transaction-date">
                    {formatCurrency ? formatCurrency(detail.amount) : detail.amount} •
                    {detail.date ? new Date(detail.date).toLocaleDateString('pl-PL') : 'Brak daty'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const totalValue = sortedData.reduce((sum, item) => sum + (item.value || 0), 0);
  const categoryCount = sortedData.length;

  return (
    <div className="cost-chart-wrapper">
      {/* Nagłówek z filtrami */}
      <div className="cost-chart-header">
        <div className="header-subtitle">
          {categoryCount} kategorii • Łącznie: {formatCurrency ? formatCurrency(totalValue) : totalValue}
        </div>


        {/* Filtry źródeł */}
        <div className="cost-filters">
          <span className="filter-label">Źródło:</span>
          <div className="filter-buttons">
            {sources.map(source => (
              <button
                key={source}
                onClick={() => setSelectedSource(source)}
                className={`source-btn ${selectedSource === source ? 'active' : ''}`}
              >
                {source === 'all' ? 'Wszystkie' :
                  source === 'finance' ? 'Finanse' :
                    source === 'garage' ? 'Garaż' :
                      source === 'warehouse' ? 'Magazyn' : source}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Wykres */}
      <ResponsiveContainer width="100%" height="85%">
        <RechartsBarChart
          layout="vertical"
          data={sortedData}
          margin={{ top: 5, right: 30, left: 120, bottom: 15 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
          <XAxis
            type="number"
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M zł`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}k zł`;
              return `${value} zł`;
            }}
            tick={{ fontSize: 11, fill: '#666' }}
            label={{
              value: 'Kwota (zł)',
              position: 'insideBottom',
              offset: -5,
              fontSize: 11,
              fill: '#7f8c8d'
            }}
          />
          <YAxis
            dataKey="name"
            type="category"
            width={115}
            tick={{ fontSize: 11, fill: '#666' }}
            interval={0}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            barSize={24}
            animationDuration={1500}
            animationBegin={300}
          >
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                strokeWidth={1}
                stroke="#fff"
              />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>

      {/* Legenda procentowa na dole */}
      <div className="cost-chart-legend">
        {sortedData.slice(0, 5).map((item, index) => (
          <div key={index} className="legend-item">
            <div
              className="legend-color-box"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></div>
            <span className="legend-text">{item.name}:</span>
            <span className="legend-percent">
              {item.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Lokalny komponent BarChart dla wydajności pól
const BarChart = ({ data = [] }) => {
  // Jeśli brak danych, pokaż placeholder
  if (!data || data.length === 0) {
    return (
      <div className="empty-state-placeholder yield-chart">
        <div className="empty-icon">🌾</div>
        <div>Brak danych o wydajności pól</div>
        <div className="empty-subtitle" style={{ marginTop: '5px' }}>
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
    <div className="yield-chart-wrapper">
      {/* Nagłówek z informacjami */}
      <div className="yield-header">
        <div className="yield-header-info">
          <h4>
            Wydajność wszystkich pól
          </h4>
          <div className="yield-subtitle">
            {data.length} pól • Średnia: {averageEfficiency.toFixed(1)}%
          </div>
        </div>

        <div className="yield-legend-mini">
          <div className="mini-legend-item">
            <div className="mini-color-box"></div>
            <span className="mini-label">Wydajność</span>
          </div>
        </div>
      </div>

      {/* Kontener wykresu */}
      <div className="yield-bars-container">
        {/* Linia średniej */}
        <div
          className="average-line"
          style={{ top: `${100 - (averageEfficiency / maxEfficiency * 100)}%` }}
        >
          <div className="average-label">
            Średnia: {averageEfficiency.toFixed(1)}%
          </div>
        </div>

        {/* Kolumny wykresu */}
        {data.map((item, index) => {
          const efficiency = item.efficiency || 0;
          const height = (efficiency / maxEfficiency) * 100;
          const isAboveAverage = efficiency > averageEfficiency;

          return (
            <div key={index} className="bar-column">
              {/* Kolumna */}
              <div
                className={`bar-visual ${isAboveAverage ? 'above-average' : 'below-average'}`}
                style={{ height: `${height}%` }}
              >
                {/* Tooltip na hover */}
                <div className="bar-tooltip">
                  <div className="tooltip-header">
                    {item.name || `Pole ${index + 1}`}
                  </div>
                  <div>Wydajność: {efficiency.toFixed(1)}%</div>
                  <div className={`tooltip-status ${isAboveAverage ? 'status-good' : 'status-bad'}`}>
                    {isAboveAverage ? 'Powyżej średniej' : 'Poniżej średniej'}
                  </div>
                </div>

                {/* Wartość na kolumnie */}
                <div className="bar-value">
                  {efficiency.toFixed(0)}%
                </div>
              </div>

              {/* Podpis pola */}
              <div className="bar-label">
                {item.name || `Pole ${index + 1}`}
              </div>

              {/* Oznaczenie powyżej/poniżej średniej */}
              <div className={`bar-trend ${isAboveAverage ? 'trend-up' : 'trend-down'}`}>
                {isAboveAverage ? '↑' : '↓'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="yield-legend-footer">
        <div className="footer-legend-item">
          <div className="footer-color-box good"></div>
          <span className="mini-label">Powyżej średniej</span>
        </div>
        <div className="footer-legend-item">
          <div className="footer-color-box bad"></div>
          <span className="mini-label">Poniżej średniej</span>
        </div>
      </div>
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