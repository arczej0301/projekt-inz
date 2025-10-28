// components/Analytics/FinancialReports.jsx
import React, { useState } from 'react'
import CustomSelect from '../CustomSelect'
import './AnalyticsComponents.css'

const FinancialReports = ({ data }) => {
  const [reportType, setReportType] = useState('profitability')
  const [timeRange, setTimeRange] = useState('year')

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
            <div className="metric-value">{data.kpis.totalRevenue.toFixed(2)} zł</div>
            <div className="metric-label">Przychody całkowite</div>
            <div className="metric-trend positive">+8.3%</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{data.kpis.totalExpenses.toFixed(2)} zł</div>
            <div className="metric-label">Koszty całkowite</div>
            <div className="metric-trend negative">+5.2%</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{data.kpis.netProfit.toFixed(2)} zł</div>
            <div className="metric-label">Zysk netto</div>
            <div className="metric-trend positive">+12.1%</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{data.kpis.profitMargin.toFixed(1)}%</div>
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
              {data.costStructure.map((item, index) => (
                <div key={index} className="cost-item">
                  <div className="cost-category">{item.category}</div>
                  <div className="cost-bar">
                    <div 
                      className="bar-fill"
                      style={{ width: `${(item.amount / data.kpis.totalExpenses) * 100}%` }}
                    ></div>
                  </div>
                  <div className="cost-amount">{item.amount.toFixed(2)} zł</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <h4>Trend miesięczny</h4>
            <div className="chart-placeholder">
              <div className="trend-chart">
                {data.trends.map((month, index) => (
                  <div key={index} className="trend-item">
                    <div className="trend-bars">
                      <div 
                        className="bar revenue"
                        style={{ height: `${(month.revenue / 10000) * 100}%` }}
                        title={`Przychód: ${month.revenue.toFixed(2)} zł`}
                      ></div>
                      <div 
                        className="bar expense"
                        style={{ height: `${(month.expenses / 10000) * 100}%` }}
                        title={`Koszty: ${month.expenses.toFixed(2)} zł`}
                      ></div>
                    </div>
                    <div className="trend-label">{month.month.split('-')[1]}</div>
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
              {data.categoryPerformance?.income?.slice(0, 5).map((cat, index) => (
                <div key={index} className="analysis-item">
                  <span className="category-name">{cat.category}</span>
                  <span className="category-amount positive">+{cat.amount.toFixed(2)} zł</span>
                </div>
              ))}
            </div>
          </div>

          <div className="analysis-card">
            <h5>Największe koszty</h5>
            <div className="analysis-list">
              {data.costStructure.slice(0, 5).map((cost, index) => (
                <div key={index} className="analysis-item">
                  <span className="category-name">{cost.category}</span>
                  <span className="category-amount negative">-{cost.amount.toFixed(2)} zł</span>
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