// components/Analytics/ProductionReports.jsx
import React, { useState } from 'react'
import CustomSelect from '../CustomSelect'
import './AnalyticsComponents.css'

const ProductionReports = ({ fieldAnalytics, animalAnalytics }) => {
  const [activeTab, setActiveTab] = useState('fields')
  const [cropFilter, setCropFilter] = useState('all')

  const tabOptions = [
    { value: 'fields', label: 'Pola uprawne', icon: '🌾' },
    { value: 'animals', label: 'Zwierzęta', icon: '🐄' },
    { value: 'efficiency', label: 'Wydajność', icon: '📊' }
  ]

  const cropOptions = [
    { value: 'all', label: 'Wszystkie uprawy', icon: '🌱' },
    { value: 'pszenica', label: 'Pszenica', icon: '🌾' },
    { value: 'kukurydza', label: 'Kukurydza', icon: '🌽' },
    { value: 'rzepak', label: 'Rzepak', icon: '🟡' },
    { value: 'buraki', label: 'Buraki', icon: '🍠' }
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
        <FieldProduction fieldAnalytics={fieldAnalytics} cropFilter={cropFilter} />
      )}

      {activeTab === 'animals' && (
        <AnimalProduction animalAnalytics={animalAnalytics} />
      )}

      {activeTab === 'efficiency' && (
        <EfficiencyAnalysis fieldAnalytics={fieldAnalytics} animalAnalytics={animalAnalytics} />
      )}
    </div>
  )
}

const FieldProduction = ({ fieldAnalytics, cropFilter }) => {
  const filteredFields = cropFilter === 'all' 
    ? fieldAnalytics.productivity
    : fieldAnalytics.productivity.filter(field => field.crop === cropFilter)

  return (
    <div className="field-production">
      <div className="production-summary">
        <div className="summary-card">
          <div className="summary-value">{fieldAnalytics.totalFields}</div>
          <div className="summary-label">Liczba pól</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{fieldAnalytics.totalArea.toFixed(1)} ha</div>
          <div className="summary-label">Łączna powierzchnia</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">
            {calculateAverageEfficiency(fieldAnalytics.productivity)}%
          </div>
          <div className="summary-label">Średnia wydajność</div>
        </div>
      </div>

      <div className="fields-table">
        <h4>Wydajność poszczególnych pól</h4>
        <table>
          <thead>
            <tr>
              <th>Nazwa pola</th>
              <th>Uprawa</th>
              <th>Powierzchnia (ha)</th>
              <th>Typ gleby</th>
              <th>Wydajność</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredFields.map((field, index) => (
              <tr key={index}>
                <td>{field.name}</td>
                <td>
                  <span className="crop-badge">{field.crop}</span>
                </td>
                <td>{field.area}</td>
                <td>{field.soil}</td>
                <td>
                  <div className="efficiency-bar">
                    <div 
                      className={`efficiency-fill ${getEfficiencyClass(field.efficiency)}`}
                      style={{ width: `${field.efficiency}%` }}
                    ></div>
                    <span className="efficiency-text">{field.efficiency.toFixed(1)}%</span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${getEfficiencyClass(field.efficiency)}`}>
                    {getEfficiencyStatus(field.efficiency)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const AnimalProduction = ({ animalAnalytics }) => (
  <div className="animal-production">
    <div className="production-metrics">
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-value">
            {animalAnalytics.productivity?.milkYield?.dailyAverage || 0} l
          </div>
          <div className="metric-label">Średnia wydajność mleka/dzień</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {animalAnalytics.health?.healthIndex || 0}%
          </div>
          <div className="metric-label">Wskaźnik zdrowia</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            {animalAnalytics.costs?.costPerAnimal?.toFixed(2) || 0} zł
          </div>
          <div className="metric-label">Koszt na zwierzę</div>
        </div>
      </div>
    </div>

    <div className="health-analysis">
      <h4>Analiza zdrowia stada</h4>
      <div className="health-issues">
        {animalAnalytics.health?.commonIssues?.map((issue, index) => (
          <div key={index} className="health-issue-card">
            <div className="issue-name">{issue.issue}</div>
            <div className="issue-count">{issue.count} przypadków</div>
            <div className={`issue-trend ${issue.trend > 0 ? 'negative' : 'positive'}`}>
              {issue.trend > 0 ? '↑' : '↓'} {Math.abs(issue.trend)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

const EfficiencyAnalysis = ({ fieldAnalytics, animalAnalytics }) => (
  <div className="efficiency-analysis">
    <h4>Analiza efektywności całego gospodarstwa</h4>
    <div className="efficiency-metrics">
      <div className="efficiency-card">
        <h5>Wydajność pól</h5>
        <div className="efficiency-score">
          {calculateAverageEfficiency(fieldAnalytics.productivity)}%
        </div>
        <div className="efficiency-breakdown">
          {fieldAnalytics.soilEfficiency.map((soil, index) => (
            <div key={index} className="soil-efficiency">
              <span>{soil.soil}</span>
              <span>{soil.averageArea.toFixed(1)} ha średnio</span>
            </div>
          ))}
        </div>
      </div>

      <div className="efficiency-card">
        <h5>Wydajność zwierząt</h5>
        <div className="efficiency-score">
          {animalAnalytics.health?.healthIndex || 0}%
        </div>
        <div className="efficiency-breakdown">
          <div className="animal-metric">
            <span>Koszty paszy</span>
            <span>{animalAnalytics.costs?.feedCosts?.toFixed(2) || 0} zł</span>
          </div>
          <div className="animal-metric">
            <span>Koszty weterynaryjne</span>
            <span>{animalAnalytics.costs?.vetCosts?.toFixed(2) || 0} zł</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Funkcje pomocnicze
const calculateAverageEfficiency = (fields) => {
  if (!fields.length) return 0
  const sum = fields.reduce((acc, field) => acc + (field.efficiency || 0), 0)
  return (sum / fields.length).toFixed(1)
}

const getEfficiencyClass = (efficiency) => {
  if (efficiency >= 80) return 'high'
  if (efficiency >= 60) return 'medium'
  return 'low'
}

const getEfficiencyStatus = (efficiency) => {
  if (efficiency >= 80) return 'Optymalna'
  if (efficiency >= 60) return 'Dobra'
  return 'Wymaga uwagi'
}

export default ProductionReports