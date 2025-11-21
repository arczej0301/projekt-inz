// components/Analytics/FinancialReports.jsx
import React, { useState } from 'react'
import CustomSelect from '../CustomSelect'
import './AnalyticsComponents.css'

const FinancialReports = ({ data, formatCurrency, formatNumber, formatPercentage }) => {
  const [reportType, setReportType] = useState('profitability')
  const [timeRange, setTimeRange] = useState('year')

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

  const safeFormatNumber = (number) => {
    if (formatNumber) return formatNumber(number)
    
    if (number === null || number === undefined || isNaN(number)) return '0'
    
    const num = parseFloat(number)
    
    if (num % 1 !== 0) {
      return num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    }
    
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const safeFormatPercentage = (number) => {
    if (formatPercentage) return formatPercentage(number)
    
    if (number === null || number === undefined || isNaN(number)) return '0%'
    
    const num = parseFloat(number)
    return num.toFixed(1).replace('.', ',') + '%'
  }

  const reportTypeOptions = [
    { value: 'profitability', label: 'Rentowność', icon: '📈' },
    { value: 'cashflow', label: 'Przepływy finansowe', icon: '💰' },
    { value: 'balance', label: 'Bilans', icon: '⚖️' },
    { value: 'trends', label: 'Trendy', icon: '📊' }
  ]

  const timeRangeOptions = [
    { value: 'month', label: 'Miesiąc', icon: '📅' },
    { value: 'quarter', label: 'Kwartał', icon: '📆' },
    { value: 'year', label: 'Rok', icon: '🎯' },
    { value: 'custom', label: 'Niestandardowy', icon: '⚙️' }
  ]

  return (
    <div className="financial-reports">
      <div className="reports-header">
        <h3>Analiza Finansowa</h3>
        <div className="report-controls">
          <CustomSelect
            options={reportTypeOptions}
            value={reportType}
            onChange={setReportType}
            placeholder="Wybierz typ raportu..."
          />
          <CustomSelect
            options={timeRangeOptions}
            value={timeRange}
            onChange={setTimeRange}
            placeholder="Zakres czasowy..."
          />
        </div>
      </div>

      <div className="financial-metrics">
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{safeFormatCurrency(data?.kpis?.totalRevenue || 0)}</div>
            <div className="metric-label">Przychody całkowite</div>
            <div className="metric-trend positive">+8.3%</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{safeFormatCurrency(data?.kpis?.totalExpenses || 0)}</div>
            <div className="metric-label">Koszty całkowite</div>
            <div className="metric-trend negative">+5.2%</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{safeFormatCurrency(data?.kpis?.netProfit || 0)}</div>
            <div className="metric-label">Zysk netto</div>
            <div className="metric-trend positive">+12.1%</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{safeFormatPercentage(data?.kpis?.profitMargin || 0)}</div>
            <div className="metric-label">Marża zysku</div>
            <div className="metric-trend positive">+2.4%</div>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-row">
          <div className="chart-container">
            <h4>Struktura kosztów</h4>
            <div className="chart-placeholder">
              {data?.costStructure?.map((item, index) => (
                <div key={index} className="cost-item">
                  <div className="cost-category">{item.category}</div>
                  <div className="cost-bar">
                    <div 
                      className="bar-fill"
                      style={{ width: `${(item.amount / (data?.kpis?.totalExpenses || 1)) * 100}%` }}
                    ></div>
                  </div>
                  <div className="cost-amount">{safeFormatCurrency(item.amount || 0)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <h4>Trend miesięczny</h4>
            <div className="chart-placeholder">
              <div className="trend-chart">
                {data?.trends?.map((month, index) => (
                  <div key={index} className="trend-item">
                    <div className="trend-bars">
                      <div 
                        className="bar revenue"
                        style={{ height: `${((month.revenue || 0) / 10000) * 100}%` }}
                        title={`Przychód: ${safeFormatCurrency(month.revenue || 0)}`}
                      ></div>
                      <div 
                        className="bar expense"
                        style={{ height: `${((month.expenses || 0) / 10000) * 100}%` }}
                        title={`Koszty: ${safeFormatCurrency(month.expenses || 0)}`}
                      ></div>
                    </div>
                    <div className="trend-label">{month.month?.split('-')[1]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="detailed-analysis">
        <h4>Szczegółowa analiza</h4>
        <div className="analysis-grid">
          <div className="analysis-card">
            <h5>Najbardziej dochodowe kategorie</h5>
            <div className="analysis-list">
              {data?.categoryPerformance?.income?.slice(0, 5).map((cat, index) => (
                <div key={index} className="analysis-item">
                  <span className="category-name">{cat.category}</span>
                  <span className="category-amount positive">+{safeFormatCurrency(cat.amount || 0)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="analysis-card">
            <h5>Największe koszty</h5>
            <div className="analysis-list">
              {data?.costStructure?.slice(0, 5).map((cost, index) => (
                <div key={index} className="analysis-item">
                  <span className="category-name">{cost.category}</span>
                  <span className="category-amount negative">-{safeFormatCurrency(cost.amount || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinancialReports