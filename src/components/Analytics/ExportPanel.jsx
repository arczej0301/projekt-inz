// components/Analytics/ExportPanel.jsx
import React, { useState } from 'react'
import CustomSelect from '../CustomSelect'
import './AnalyticsComponents.css'

const ExportPanel = ({ financialAnalytics, fieldAnalytics, animalAnalytics }) => {
  const [exportType, setExportType] = useState('financial')
  const [format, setFormat] = useState('excel')
  const [dateRange, setDateRange] = useState('current_month')

  const exportTypeOptions = [
    { value: 'financial', label: 'Raport finansowy', icon: '💰' },
    { value: 'production', label: 'Raport produkcyjny', icon: '🌾' },
    { value: 'animals', label: 'Raport zwierząt', icon: '🐄' },
    { value: 'comprehensive', label: 'Raport kompleksowy', icon: '📊' }
  ]

  const formatOptions = [
    { value: 'excel', label: 'Excel (.xlsx)', icon: '📊' },
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'csv', label: 'CSV', icon: '📋' }
  ]

  const dateRangeOptions = [
    { value: 'current_week', label: 'Bieżący tydzień', icon: '📅' },
    { value: 'current_month', label: 'Bieżący miesiąc', icon: '📆' },
    { value: 'current_quarter', label: 'Bieżący kwartał', icon: '📈' },
    { value: 'current_year', label: 'Bieżący rok', icon: '🎯' },
    { value: 'last_year', label: 'Poprzedni rok', icon: '⏪' }
  ]

  const handleExport = () => {
    // Symulacja eksportu
    alert(`Eksportowanie: ${exportType} w formacie ${format} dla zakresu ${dateRange}`)
    
    // Tutaj prawdziwa logika eksportu:
    // - excel: użyj biblioteki like exceljs
    // - pdf: użyj biblioteki like jspdf
    // - csv: prosty generator CSV
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="export-panel">
      <div className="export-header">
        <h3>Eksport Raportów</h3>
        <p>Wybierz dane i format do eksportu lub wydruku</p>
      </div>

      <div className="export-config">
        <div className="config-row">
          <div className="config-group">
            <label>Typ raportu:</label>
            <CustomSelect
              options={exportTypeOptions}
              value={exportType}
              onChange={setExportType}
            />
          </div>

          <div className="config-group">
            <label>Format:</label>
            <CustomSelect
              options={formatOptions}
              value={format}
              onChange={setFormat}
            />
          </div>

          <div className="config-group">
            <label>Zakres czasowy:</label>
            <CustomSelect
              options={dateRangeOptions}
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
        </div>

        {/* Podgląd danych do eksportu */}
        <div className="export-preview">
          <h4>Podgląd danych</h4>
          <div className="preview-content">
            {exportType === 'financial' && (
              <FinancialPreview data={financialAnalytics} />
            )}
            {exportType === 'production' && (
              <ProductionPreview data={fieldAnalytics} />
            )}
            {exportType === 'animals' && (
              <AnimalsPreview data={animalAnalytics} />
            )}
            {exportType === 'comprehensive' && (
              <ComprehensivePreview 
                financial={financialAnalytics}
                production={fieldAnalytics}
                animals={animalAnalytics}
              />
            )}
          </div>
        </div>

        {/* Przyciski akcji */}
        <div className="export-actions">
          <button className="btn btn-primary" onClick={handleExport}>
            <span className="btn-icon">📤</span>
            Eksportuj do {format.toUpperCase()}
          </button>
          
          <button className="btn btn-secondary" onClick={handlePrint}>
            <span className="btn-icon">🖨️</span>
            Drukuj raport
          </button>

          <button className="btn btn-outline">
            <span className="btn-icon">💾</span>
            Zapisz szablon
          </button>
        </div>
      </div>

      {/* Szablony raportów */}
      <div className="report-templates">
        <h4>Szybkie szablony</h4>
        <div className="templates-grid">
          <div className="template-card" onClick={() => setExportType('financial')}>
            <div className="template-icon">💰</div>
            <div className="template-name">Miesięczny raport finansowy</div>
            <div className="template-desc">Przychody, koszty, zyski</div>
          </div>

          <div className="template-card" onClick={() => setExportType('production')}>
            <div className="template-icon">🌾</div>
            <div className="template-name">Raport produkcyjny</div>
            <div className="template-desc">Wydajność pól i upraw</div>
          </div>

          <div className="template-card" onClick={() => setExportType('animals')}>
            <div className="template-icon">🐄</div>
            <div className="template-name">Raport zwierząt</div>
            <div className="template-desc">Zdrowie i produktywność</div>
          </div>

          <div className="template-card" onClick={() => setExportType('comprehensive')}>
            <div className="template-icon">📊</div>
            <div className="template-name">Raport roczny</div>
            <div className="template-desc">Kompleksowy przegląd gospodarstwa</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Komponenty podglądu - ZABEZPIECZONE
const FinancialPreview = ({ data }) => {
  if (!data || !data.kpis) return <div className="no-data">Brak danych finansowych</div>
  
  return (
    <div className="preview-table">
      <table>
        <thead>
          <tr>
            <th>Wskaźnik</th>
            <th>Wartość</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Przychód całkowity</td>
            <td>{data.kpis.totalRevenue?.toFixed(2) || '0.00'} zł</td>
          </tr>
          <tr>
            <td>Koszty całkowite</td>
            <td>{data.kpis.totalExpenses?.toFixed(2) || '0.00'} zł</td>
          </tr>
          <tr>
            <td>Zysk netto</td>
            <td>{data.kpis.netProfit?.toFixed(2) || '0.00'} zł</td>
          </tr>
          <tr>
            <td>Marża zysku</td>
            <td>{data.kpis.profitMargin?.toFixed(1) || '0.0'}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const ProductionPreview = ({ data }) => {
  if (!data || !data.productivity) return <div className="no-data">Brak danych produkcyjnych</div>
  
  return (
    <div className="preview-table">
      <table>
        <thead>
          <tr>
            <th>Pole</th>
            <th>Uprawa</th>
            <th>Powierzchnia</th>
            <th>Wydajność</th>
          </tr>
        </thead>
        <tbody>
          {data.productivity.slice(0, 5).map((field, index) => (
            <tr key={index}>
              <td>{field.name || 'Brak nazwy'}</td>
              <td>{field.crop || 'Brak'}</td>
              <td>{field.area || 0} ha</td>
              <td>{field.efficiency?.toFixed(1) || 0}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const AnimalsPreview = ({ data }) => {
  if (!data) return <div className="no-data">Brak danych zwierząt</div>
  
  return (
    <div className="preview-table">
      <table>
        <thead>
          <tr>
            <th>Wskaźnik</th>
            <th>Wartość</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Średnia wydajność mleka</td>
            <td>{data.productivity?.milkYield?.dailyAverage || 0} l/dzień</td>
          </tr>
          <tr>
            <td>Wskaźnik zdrowia</td>
            <td>{data.health?.healthIndex || 0}%</td>
          </tr>
          <tr>
            <td>Koszty paszy</td>
            <td>{data.costs?.feedCosts?.toFixed(2) || '0.00'} zł</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const ComprehensivePreview = ({ financial, production, animals }) => {
  const calculateAverageEfficiency = (fields) => {
    if (!fields || !fields.length) return 0
    const sum = fields.reduce((acc, field) => acc + (field.efficiency || 0), 0)
    return (sum / fields.length).toFixed(1)
  }

  return (
    <div className="preview-comprehensive">
      <div className="preview-section">
        <h5>Finanse</h5>
        <div>Przychód: {financial?.kpis?.totalRevenue?.toFixed(2) || '0.00'} zł</div>
        <div>Zysk: {financial?.kpis?.netProfit?.toFixed(2) || '0.00'} zł</div>
      </div>
      <div className="preview-section">
        <h5>Produkcja</h5>
        <div>Liczba pól: {production?.productivity?.length || 0}</div>
        <div>Średnia wydajność: {calculateAverageEfficiency(production?.productivity)}%</div>
      </div>
      <div className="preview-section">
        <h5>Zwierzeta</h5>
        <div>Wskaźnik zdrowia: {animals?.health?.healthIndex || 0}%</div>
        <div>Koszty: {animals?.costs?.totalCosts?.toFixed(2) || '0.00'} zł</div>
      </div>
    </div>
  )
}

const calculateAverageEfficiency = (fields) => {
  if (!fields.length) return 0
  const sum = fields.reduce((acc, field) => acc + field.efficiency, 0)
  return (sum / fields.length).toFixed(1)
}

export default ExportPanel