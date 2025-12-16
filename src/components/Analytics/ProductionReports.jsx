// components/Analytics/ProductionReports.jsx
import React, { useState } from 'react'
import CustomSelect from '../common/CustomSelect'
import './AnalyticsComponents.css'

const ProductionReports = ({
  fieldAnalytics,
  animalAnalytics,
  equipmentAnalytics,
  formatCurrency,
  formatNumber,
  formatPercentage
}) => {
  const [activeTab, setActiveTab] = useState('fields')
  const [cropFilter, setCropFilter] = useState('all')

  const tabOptions = [
    { value: 'fields', label: 'Pola uprawne' },
    { value: 'animals', label: 'Zwierzęta' },
    { value: 'efficiency', label: 'Wydajność' }
  ]

  const cropOptions = [
    { value: 'all', label: 'Wszystkie uprawy' },
    { value: 'pszenica', label: 'Pszenica' },
    { value: 'kukurydza', label: 'Kukurydza' },
    { value: 'rzepak', label: 'Rzepak' },
    { value: 'buraki', label: 'Buraki cukrowe' },
    { value: 'ziemniaki', label: 'Ziemniaki' },
    { value: 'owies', label: 'Owies' },
    { value: 'jęczmień', label: 'Jęczmień' },
    { value: 'żyto', label: 'Żyto' }
  ]

  return (
    <div className="production-reports">
      <div className="reports-header">
        <h3>Analiza Wydajności Produkcyjnej</h3>
        <div className="report-controls">
          <CustomSelect
            options={tabOptions}
            value={activeTab}
            onChange={setActiveTab}
          />
          {activeTab === 'fields' && (
            <CustomSelect
              options={cropOptions}
              value={cropFilter}
              onChange={setCropFilter}
            />
          )}
        </div>
      </div>

      {activeTab === 'fields' && (
        <FieldProduction
          fieldAnalytics={fieldAnalytics}
          cropFilter={cropFilter}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
          formatPercentage={formatPercentage}
        />
      )}

      {activeTab === 'animals' && (
        <AnimalProduction
          animalAnalytics={animalAnalytics}
          formatCurrency={formatCurrency}
          formatNumber={formatNumber}
          formatPercentage={formatPercentage}
        />
      )}

      {activeTab === 'efficiency' && (
        <EfficiencyAnalysis
          fieldAnalytics={fieldAnalytics}
          animalAnalytics={animalAnalytics}
          formatCurrency={formatCurrency}
          formatPercentage={formatPercentage}
        />
      )}
    </div>
  )
}

const getFieldStatusConfig = (status) => {
  const configs = {
    'planted': { label: 'Zasiane', class: 'status-planted' },
    'growing': { label: 'Wzrost', class: 'status-growing' },
    'ready': { label: 'Gotowe do zbioru', class: 'status-ready' },
    'harvested': { label: 'Zebrane', class: 'status-harvested' },
    'plowed': { label: 'Zaorane', class: 'status-plowed' },
    'fallow': { label: 'Odłóg', class: 'status-neutral' },
    'unknown': { label: 'Brak danych', class: 'status-neutral' }
  }
  return configs[status?.toLowerCase()] || configs['unknown']
}

const FieldProduction = ({ fieldAnalytics, cropFilter, formatCurrency, formatNumber }) => {
  const [sortBy, setSortBy] = useState('name-asc')

  const sortOptions = [
    { value: 'name-asc', label: 'Nazwa (A-Z)' },
    { value: 'name-desc', label: 'Nazwa (Z-A)' },
    { value: 'area-desc', label: 'Powierzchnia (Największa)' },
    { value: 'yield-desc', label: 'Plon całk. (Największy)' },
    { value: 'yield-ha-desc', label: 'Wydajność t/ha (Największa)' },
    { value: 'cost-asc', label: 'Koszt/ha (Najniższy)' },
    { value: 'cost-desc', label: 'Koszt/ha (Najwyższy)' }
  ]

  const filteredFields = cropFilter === 'all'
    ? fieldAnalytics.productivity
    : fieldAnalytics.productivity.filter(field => field.crop === cropFilter)

  const cropPerformance = fieldAnalytics.cropPerformance || []

  const sortedCrops = [...cropPerformance].sort((a, b) => {
    switch (sortBy) {
      case 'name-asc': return a.name.localeCompare(b.name)
      case 'name-desc': return b.name.localeCompare(a.name)
      case 'area-desc': return b.totalArea - a.totalArea
      case 'yield-desc': return b.totalYield - a.totalYield
      case 'yield-ha-desc': return b.yieldPerHectare - a.yieldPerHectare
      case 'cost-asc': return (a.costPerHectare || 0) - (b.costPerHectare || 0)
      case 'cost-desc': return (b.costPerHectare || 0) - (a.costPerHectare || 0)
      default: return 0
    }
  })

  const totalProductionCost = cropPerformance.reduce((acc, c) => acc + (c.totalCost || 0), 0)
  const averageCostPerHa = fieldAnalytics.totalArea > 0
    ? totalProductionCost / fieldAnalytics.totalArea
    : 0

  return (
    <div className="field-production">
      {/* 1. GŁÓWNE KPI */}
      <div className="production-summary">
        <div className="summary-card">
          <div className="summary-value">{fieldAnalytics.totalFields}</div>
          <div className="summary-label">Liczba pól</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{formatNumber(fieldAnalytics.totalArea)} ha</div>
          <div className="summary-label">Łączna powierzchnia</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">
            {formatCurrency ? formatCurrency(averageCostPerHa) : `${averageCostPerHa.toFixed(0)} zł`}
          </div>
          <div className="summary-label">Śr. koszt produkcji / ha</div>
        </div>
      </div>

      {/* 2. KARTY WYDAJNOŚCI */}
      {cropFilter === 'all' && (
        <div className="crop-performance-section">
          <div className="section-header-row">
            <h4 className="section-title">Wyniki poszczególnych upraw</h4>
            <div className="sort-container">
              <span className="sort-label">Sortowanie:</span>
              <div className="sort-control">
                <CustomSelect
                  options={sortOptions}
                  value={sortBy}
                  onChange={setSortBy}
                  placeholder="Sortuj według..."
                />
              </div>
            </div>
          </div>
          <div className="crop-cards-grid">
            {sortedCrops.map((crop, index) => (
              <div key={index} className="crop-card">
                <div className="crop-header">
                  <span className="crop-name">{crop.name}</span>
                  <span className="crop-area">{formatNumber(crop.totalArea)} ha</span>
                </div>
                <div className="crop-stats">
                  <div className="stat">
                    <span className="label">Plon całk.</span>
                    <span className="value">{formatNumber(crop.totalYield)} t</span>
                  </div>
                  <div className="stat">
                    <span className="label">Śr. plon</span>
                    <span className="value highlight">{formatNumber(crop.yieldPerHectare)} t/ha</span>
                  </div>
                  <div className="stat">
                    <span className="label">Koszt/ha</span>
                    <span className="value negative">
                      {formatCurrency ? formatCurrency(crop.costPerHectare) : `${crop.costPerHectare?.toFixed(0)} zł`}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="label">Koszt/t</span>
                    <span className="value">
                      {formatCurrency ? formatCurrency(crop.costPerTon) : `${crop.costPerTon?.toFixed(0)} zł`}
                    </span>
                  </div>
                </div>
                <div className="area-share-bar">
                  <div
                    className="share-fill"
                    style={{ width: `${(crop.totalArea / fieldAnalytics.totalArea) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {sortedCrops.length === 0 && <div className="no-data">Brak danych o zbiorach i kosztach</div>}
          </div>
        </div>
      )}

      {/* 3. TABELA WSZYSTKICH PÓL */}
      <div className="fields-table-container">
        <h4 className="section-title">
          {cropFilter === 'all' ? 'Szczegóły wszystkich pól' : `Szczegóły pól: ${cropFilter}`}
        </h4>
        <div className="fields-table-wrapper">
          <table className="fields-table">
            <thead>
              <tr>
                <th>Nazwa pola</th>
                <th>Uprawa</th>
                <th>Obszar</th>
                <th>Gleba</th>
                <th>Ostatni Plon</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredFields.map((field, index) => {
                const statusConfig = getFieldStatusConfig(field.status)

                return (
                  <tr key={index}>
                    <td className="fw-bold">{field.name}</td>
                    <td><span className="crop-badge">{field.crop}</span></td>
                    <td>{formatNumber(field.area)} ha</td>
                    <td className="soil-cell">{field.soil}</td>
                    <td>
                      <div className="yield-cell">
                        {field.lastYieldPerHectare > 0 ? (
                          <>
                            <div className="yield-value-row">
                              <span className="yield-number">{formatNumber(field.lastYieldPerHectare)}</span>
                              <span className="yield-unit">t/ha</span>
                            </div>
                            {field.lastYieldDate && (
                              <div className="yield-date">
                                {new Date(field.lastYieldDate).toLocaleDateString()}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="neutral">-</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${statusConfig.class}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {filteredFields.length === 0 && (
                <tr><td colSpan="6" className="no-data">Brak pól spełniających kryteria.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const AnimalProduction = ({ animalAnalytics, formatCurrency, formatNumber, formatPercentage }) => (
  <div className="animal-production">
    <div className="production-metrics">
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-value">
            {formatNumber(animalAnalytics.productivity?.milkYield?.dailyAverage || 0)} l
          </div>
          <div className="metric-label">Średnia wydajność mleka/dzień</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {formatPercentage(animalAnalytics.health?.healthIndex || 0)}
          </div>
          <div className="metric-label">Wskaźnik zdrowia</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {formatCurrency ? formatCurrency(animalAnalytics.costs?.costPerAnimal || 0) : `${animalAnalytics.costs?.costPerAnimal?.toFixed(2)} zł`}
          </div>
          <div className="metric-label">Koszt paszy na zwierzę</div>
        </div>
      </div>
    </div>

    <div className="health-analysis">
      <h4>Analiza zdrowia stada</h4>
      {animalAnalytics.health?.commonIssues?.length > 0 ? (
        <div className="health-issues">
          {animalAnalytics.health.commonIssues.map((issue, index) => (
            <div key={index} className="health-issue-card">
              <div className="issue-name">{issue.issue}</div>
              <div className="issue-count">{issue.count} przypadków</div>
              <div className={`issue-trend ${issue.trend > 0 ? 'negative' : 'positive'}`}>
                {issue.trend > 0 ? '↑' : '↓'} {Math.abs(issue.trend)}%
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-data">Brak zgłoszonych problemów zdrowotnych w ostatnim okresie.</div>
      )}
    </div>
  </div>
)

const EfficiencyAnalysis = ({ fieldAnalytics, animalAnalytics, formatCurrency, formatPercentage }) => (
  <div className="efficiency-analysis">
    <h4>Analiza efektywności całego gospodarstwa</h4>
    <div className="efficiency-metrics">
      <div className="efficiency-card">
        <h5>Wydajność pól (Średnia)</h5>
        <div className="efficiency-score">
          {formatPercentage(calculateAverageEfficiency(fieldAnalytics.productivity))}
        </div>
        <div className="efficiency-breakdown">
          {fieldAnalytics.soilEfficiency.map((soil, index) => (
            <div key={index} className="soil-efficiency">
              <span>{soil.soil}</span>
              <span>{soil.averageArea.toFixed(1)} ha (śr.)</span>
            </div>
          ))}
        </div>
      </div>

      <div className="efficiency-card">
        <h5>Wydajność zwierząt (Zdrowie)</h5>
        <div className="efficiency-score">
          {formatPercentage(animalAnalytics.health?.healthIndex || 0)}
        </div>
        <div className="efficiency-breakdown">
          <div className="animal-metric">
            <span>Koszty paszy (Suma)</span>
            <span>{formatCurrency(animalAnalytics.costs?.feedCosts || 0)}</span>
          </div>
          <div className="animal-metric">
            <span>Koszty weterynaryjne</span>
            <span>{formatCurrency(animalAnalytics.costs?.vetCosts || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Komponenty pomocnicze
const StatusBadge = ({ efficiency }) => {
  let statusClass = 'low'
  let text = 'Niska'

  if (efficiency >= 80) { statusClass = 'high'; text = 'Wysoka' }
  else if (efficiency >= 50) { statusClass = 'medium'; text = 'Średnia' }

  return (
    <span className={`status-badge ${statusClass}`}>
      {text}
    </span>
  )
}

const calculateAverageEfficiency = (fields) => {
  if (!fields || !fields.length) return 0
  const sum = fields.reduce((acc, field) => acc + (field.efficiency || 0), 0)
  return sum / fields.length
}

export default ProductionReports