// components/Analytics/ProductionReports.jsx
import React, { useState } from 'react'
import CustomSelect from '../common/CustomSelect'
import './AnalyticsComponents.css'

const ProductionReports = ({ fieldAnalytics, animalAnalytics }) => {
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
    { value: 'buraki', label: 'Buraki' },
    { value: 'pszenica', label: 'Pszenica' },
    { value: 'kukurydza', label: 'Kukurydza' },
    { value: 'rzepak', label: 'Rzepak' },
    { value: 'ziemniaki', label: 'Ziemniaki' },
    { value: 'buraki', label: 'Buraki cukrowe' },
    { value: 'owies', label: 'Owies' },
    { value: 'jęczmień', label: 'Jęczmień' },
    { value: 'żyto', label: 'Żyto' }
  ]

  //  const cropOptions = [
  //     { value: '', label: 'Brak uprawy' },
  //     { value: 'pszenica', label: 'Pszenica' },
  //     { value: 'kukurydza', label: 'Kukurydza' },
  //     { value: 'rzepak', label: 'Rzepak' },
  //     { value: 'ziemniaki', label: 'Ziemniaki' },
  //     { value: 'buraki', label: 'Buraki cukrowe' },
  //     { value: 'owies', label: 'Owies' },
  //     { value: 'jęczmień', label: 'Jęczmień' },
  //     { value: 'żyto', label: 'Żyto' }
  //   ];

  //   const soilOptions = [
  //     { value: '', label: 'Wybierz typ gleby' },
  //     { value: 'gliniasta', label: 'Gliniasta' },
  //     { value: 'piaszczysta', label: 'Piaszczysta' },
  //     { value: 'ilasta', label: 'Ilasta' },
  //     { value: 'torfowa', label: 'Torfowa' },
  //     { value: 'mada', label: 'Mada rzeczna' }
  //   ];





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
  // Filtrowanie pól
  const filteredFields = cropFilter === 'all'
    ? fieldAnalytics.productivity
    : fieldAnalytics.productivity.filter(field => field.crop === cropFilter)

  // Pobieramy dane o wydajności upraw z analytics
  const cropPerformance = fieldAnalytics.cropPerformance || []

  return (
    <div className="field-production">
      {/* 1. GŁÓWNE KPI */}
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
            {fieldAnalytics.fieldUtilization?.utilizationRate.toFixed(1)}%
          </div>
          <div className="summary-label">Wykorzystanie gruntów</div>
        </div>
      </div>

      {/* 2. NOWOŚĆ: KARTY WYDAJNOŚCI UPRAW */}
      {cropFilter === 'all' && (
        <div className="crop-performance-section">
          <h4 className="section-title">Wydajność poszczególnych upraw</h4>
          <div className="crop-cards-grid">
            {cropPerformance.map((crop, index) => (
              <div key={index} className="crop-card">
                <div className="crop-header">
                  <span className="crop-name">{crop.crop}</span>
                  <span className="crop-area">{crop.totalArea.toFixed(1)} ha</span>
                </div>
                <div className="crop-stats">
                  <div className="stat">
                    <span className="label">Plon całk.</span>
                    <span className="value">{crop.totalYield.toFixed(1)} t</span>
                  </div>
                  <div className="stat">
                    <span className="label">Śr. plon/ha</span>
                    <span className="value highlight">{crop.yieldPerHectare.toFixed(1)} t/ha</span>
                  </div>
                </div>
                {/* Pasek wizualny udziału w areale */}
                <div className="area-share-bar">
                  <div
                    className="share-fill"
                    style={{ width: `${(crop.totalArea / fieldAnalytics.totalArea) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {cropPerformance.length === 0 && <div className="no-data">Brak danych o zbiorach</div>}
          </div>
        </div>
      )}

      {/* 3. TABELA PÓL (Zaktualizowana) */}
      <div className="fields-table-container">
        <h4 className="section-title">Szczegóły pól</h4>
        <div className="fields-table-wrapper">
          <table className="fields-table">
            <thead>
              <tr>
                <th>Nazwa pola</th>
                <th>Uprawa</th>
                <th>Obszar</th>
                <th>Gleba</th>
                <th>Plon (t/ha)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredFields.map((field, index) => (
                <tr key={index}>
                  <td className="fw-bold">{field.name}</td>
                  <td><span className="crop-badge">{field.crop}</span></td>
                  <td>{field.area} ha</td>
                  <td>{field.soil}</td>
                  <td>
                    <div className="yield-cell">
                      <span className="yield-value">{field.yieldPerHectare ? field.yieldPerHectare.toFixed(1) : '-'}</span>
                      <span className="yield-unit">t/ha</span>
                    </div>
                  </td>
                  <td><StatusBadge efficiency={field.efficiency || 0} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Pomocniczy komponent do statusu
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