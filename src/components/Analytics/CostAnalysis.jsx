// components/Analytics/CostAnalysis.jsx
import React, { useState } from 'react'
import CustomSelect from '../common/CustomSelect'
import './AnalyticsComponents.css'

const CostAnalysis = ({ financialAnalytics, fieldAnalytics, animalAnalytics }) => {
  const [analysisType, setAnalysisType] = useState('breakdown')
  const [costCategory, setCostCategory] = useState('all')

  const analysisTypeOptions = [
    { value: 'breakdown', label: 'Struktura kosztów', icon: '📊' },
    { value: 'optimization', label: 'Optymalizacja', icon: '💡' },
    { value: 'comparison', label: 'Porównanie', icon: '⚖️' }
  ]

  const costCategoryOptions = [
    { value: 'all', label: 'Wszystkie kategorie', icon: '📋' },
    { value: 'seeds', label: 'Nasiona', icon: '🌱' },
    { value: 'fertilizers', label: 'Nawozy', icon: '🧪' },
    { value: 'animal_feed', label: 'Pasze', icon: '🌿' },
    { value: 'fuel', label: 'Paliwo', icon: '⛽' },
    { value: 'maintenance', label: 'Naprawy', icon: '🔧' }
  ]

  const optimizationSuggestions = [
    {
      category: 'Paliwo',
      saving: 1500,
      suggestion: 'Optymalizacja tras pracy maszyn',
      impact: 'medium'
    },
    {
      category: 'Pasze',
      saving: 3200,
      suggestion: 'Negocjacja cen z dostawcami',
      impact: 'high'
    },
    {
      category: 'Nawozy',
      saving: 2800,
      suggestion: 'Precyzyjne nawożenie wg map glebowych',
      impact: 'high'
    }
  ]

  return (
    <div className="cost-analysis">
      <div className="analysis-header">
        <h3>Optymalizacja Kosztów</h3>
        <div className="analysis-controls">
          <CustomSelect
            options={analysisTypeOptions}
            value={analysisType}
            onChange={setAnalysisType}
          />
          <CustomSelect
            options={costCategoryOptions}
            value={costCategory}
            onChange={setCostCategory}
          />
        </div>
      </div>

      <div className="cost-overview">
        <div className="overview-card total">
          <div className="overview-value">{financialAnalytics.kpis.totalExpenses.toFixed(2)} zł</div>
          <div className="overview-label">Łączne koszty roczne</div>
        </div>
        <div className="overview-card monthly">
          <div className="overview-value">{financialAnalytics.kpis.monthlyExpenses.toFixed(2)} zł</div>
          <div className="overview-label">Koszty miesięczne</div>
        </div>
        <div className="overview-card potential">
          <div className="overview-value">
            {optimizationSuggestions.reduce((sum, item) => sum + item.saving, 0).toFixed(2)} zł
          </div>
          <div className="overview-label">Potencjalne oszczędności</div>
        </div>
      </div>

      {analysisType === 'breakdown' && (
        <CostBreakdown 
          costStructure={financialAnalytics.costStructure}
          totalExpenses={financialAnalytics.kpis.totalExpenses}
        />
      )}

      {analysisType === 'optimization' && (
        <OptimizationOpportunities suggestions={optimizationSuggestions} />
      )}

      {analysisType === 'comparison' && (
        <CostComparison 
          financialAnalytics={financialAnalytics}
          fieldAnalytics={fieldAnalytics}
        />
      )}
    </div>
  )
}

const CostBreakdown = ({ costStructure, totalExpenses }) => (
  <div className="cost-breakdown">
    <h4>Szczegółowa struktura kosztów</h4>
    <div className="breakdown-chart">
      {costStructure.map((item, index) => (
        <div key={index} className="breakdown-item">
          <div className="breakdown-header">
            <span className="category-name">{item.category}</span>
            <span className="category-amount">{item.amount.toFixed(2)} zł</span>
          </div>
          <div className="breakdown-bar">
            <div 
              className="bar-fill"
              style={{ width: `${(item.amount / totalExpenses) * 100}%` }}
            ></div>
          </div>
          <div className="breakdown-percentage">
            {((item.amount / totalExpenses) * 100).toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  </div>
)

const OptimizationOpportunities = ({ suggestions }) => (
  <div className="optimization-opportunities">
    <h4>Propozycje optymalizacji kosztów</h4>
    <div className="suggestions-grid">
      {suggestions.map((suggestion, index) => (
        <div key={index} className={`suggestion-card ${suggestion.impact}`}>
          <div className="suggestion-header">
            <div className="suggestion-category">{suggestion.category}</div>
            <div className="suggestion-saving">Oszczędność: {suggestion.saving} zł</div>
          </div>
          <div className="suggestion-text">{suggestion.suggestion}</div>
          <div className="suggestion-impact">
            <span className={`impact-badge ${suggestion.impact}`}>
              {suggestion.impact === 'high' ? 'Wysoki' : 'Średni'} wpływ
            </span>
          </div>
        </div>
      ))}
    </div>

    <div className="optimization-summary">
      <h5>Podsumowanie optymalizacji</h5>
      <div className="summary-stats">
        <div className="stat-item">
          <span className="stat-label">Łączne oszczędności:</span>
          <span className="stat-value">
            {suggestions.reduce((sum, item) => sum + item.saving, 0).toFixed(2)} zł
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Redukcja kosztów:</span>
          <span className="stat-value">~8.5%</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Szacowany ROI:</span>
          <span className="stat-value positive">+15.2%</span>
        </div>
      </div>
    </div>
  </div>
)

const CostComparison = ({ financialAnalytics, fieldAnalytics }) => (
  <div className="cost-comparison">
    <h4>Porównanie kosztów z branżą</h4>
    <div className="comparison-grid">
      <div className="comparison-card">
        <h5>Koszty na hektar</h5>
        <div className="comparison-values">
          <div className="value-item">
            <span>Twoje gospodarstwo:</span>
            <span>{(financialAnalytics.kpis.totalExpenses / fieldAnalytics.totalArea).toFixed(2)} zł/ha</span>
          </div>
          <div className="value-item">
            <span>Średnia branżowa:</span>
            <span>2,850 zł/ha</span>
          </div>
          <div className="value-item">
            <span>Różnica:</span>
            <span className="positive">-4.2%</span>
          </div>
        </div>
      </div>

      <div className="comparison-card">
        <h5>Wydajność kosztowa</h5>
        <div className="comparison-values">
          <div className="value-item">
            <span>Twój koszt jednostkowy:</span>
            <span>{(financialAnalytics.kpis.totalExpenses / financialAnalytics.kpis.totalRevenue * 100).toFixed(1)}%</span>
          </div>
          <div className="value-item">
            <span>Średnia branżowa:</span>
            <span>78.5%</span>
          </div>
          <div className="value-item">
            <span>Różnica:</span>
            <span className="positive">-3.1%</span>
          </div>
        </div>
      </div>
    </div>

    <div className="benchmarking">
      <h5>Benchmarking efektywności</h5>
      <div className="benchmark-metrics">
        <div className="benchmark-item">
          <div className="metric-name">Wydajność pracy</div>
          <div className="metric-bar">
            <div className="bar-your" style={{ width: '72%' }}>72%</div>
            <div className="bar-industry" style={{ width: '68%' }}>68%</div>
          </div>
        </div>
        <div className="benchmark-item">
          <div className="metric-name">Wykorzystanie maszyn</div>
          <div className="metric-bar">
            <div className="bar-your" style={{ width: '65%' }}>65%</div>
            <div className="bar-industry" style={{ width: '58%' }}>58%</div>
          </div>
        </div>
        <div className="benchmark-item">
          <div className="metric-name">Efektywność nawożenia</div>
          <div className="metric-bar">
            <div className="bar-your" style={{ width: '78%' }}>78%</div>
            <div className="bar-industry" style={{ width: '72%' }}>72%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default CostAnalysis