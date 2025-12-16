import React, { useState, useEffect } from 'react';
import CustomSelect from '../common/CustomSelect';
import { useFields } from '../../hooks/useFields';
import './AnalyticsComponents.css';

const ProductionReports = ({
  formatCurrency,
  formatNumber,
  formatPercentage
}) => {
  // Stan globalny widoku
  const [activeTab, setActiveTab] = useState('fields');
  const [cropFilter, setCropFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  // Dane z API
  const [performanceData, setPerformanceData] = useState(null);
  const [statusReport, setStatusReport] = useState(null);
  const [cropPerformance, setCropPerformance] = useState([]);

  const { generatePerformanceReport, generateStatusReport, getCropPerformance } = useFields();

  const tabOptions = [
    { value: 'fields', label: 'Pola uprawne' },
    { value: 'status', label: 'Stany pól' },
    { value: 'efficiency', label: 'Wydajność' }
  ];

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
  ];

  // Ładuj dane przy zmianie taba
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        if (activeTab === 'fields' || activeTab === 'efficiency') {
          const report = await generatePerformanceReport();
          setPerformanceData(report);

          // Pobierz również analizę upraw
          const crops = await getCropPerformance();
          setCropPerformance(crops);
        } else if (activeTab === 'status') {
          const report = await generateStatusReport();
          setStatusReport(report);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

  // Pomocnicze funkcje do formatowania
  const defaultFormatNumber = (value) => {
    if (typeof formatNumber === 'function') {
      return formatNumber(value);
    }
    return value?.toFixed(2) || '0.00';
  };

  const defaultFormatCurrency = (value) => {
    if (typeof formatCurrency === 'function') {
      return formatCurrency(value);
    }
    return `${value?.toFixed(2) || '0.00'} zł`;
  };

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

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Ładowanie danych...</p>
        </div>
      ) : (
        <>
          {activeTab === 'fields' && (
            <FieldProduction
              performanceData={performanceData}
              cropPerformance={cropPerformance}
              cropFilter={cropFilter}
              formatCurrency={defaultFormatCurrency}
              formatNumber={defaultFormatNumber}
            />
          )}

          {activeTab === 'status' && (
            <StatusReport
              statusReport={statusReport}
              formatNumber={defaultFormatNumber}
            />
          )}

          {activeTab === 'efficiency' && (
            <EfficiencyAnalysis
              performanceData={performanceData}
              formatNumber={defaultFormatNumber}
            />
          )}
        </>
      )}
    </div>
  );
};

// --- KOMPONENT 1: RAPORT STANÓW PÓL ---
const StatusReport = ({ statusReport, formatNumber }) => {
  if (!statusReport) return <div className="no-data">Brak danych o stanach pól</div>;

  const { statusCount, areaByStatus, fieldsWithStatus } = statusReport;

  const getStatusLabel = (status) => {
    const statusMap = {
      'sown': 'Zasiane',
      'harvested': 'Zebrane',
      'ready_for_sowing': 'Przygotowane do siewu',
      'fallow': 'Ugór',
      'pasture': 'Pastwisko/Łąka',
      'Brak danych': 'Brak danych'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'sown': '#27ae60',
      'harvested': '#e74c3c',
      'ready_for_sowing': '#3498db',
      'fallow': '#f39c12',
      'pasture': '#2ecc71',
      'Brak danych': '#95a5a6'
    };
    return statusColors[status] || '#95a5a6';
  };

  return (
    <div className="status-report">
      {/* Podsumowanie statystyk */}
      <div className="status-summary">
        <h4>Podsumowanie stanów pól</h4>
        <div className="summary-cards">
          {Object.entries(statusCount).map(([status, count]) => (
            <div key={status} className="summary-card">
              <div className="status-header">
                <span
                  className="status-dot"
                  style={{ backgroundColor: getStatusColor(status) }}
                ></span>
                <span className="status-name">{getStatusLabel(status)}</span>
              </div>
              <div className="status-stats">
                <div className="stat-value">{count} pól</div>
                <div className="stat-area">
                  {formatNumber(areaByStatus[status] || 0)} ha
                </div>
              </div>
              <div className="stat-percentage">
                {statusReport.totalFields > 0 ?
                  ((count / statusReport.totalFields) * 100).toFixed(1) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Szczegółowa lista pól */}
      <div className="fields-by-status">
        <div className="fields-table-container">
          {/* Uproszczony nagłówek dla tej sekcji */}
          <h4 >
            Lista pól według stanu
          </h4>
          <table className="fields-table">
            <thead>
              <tr>
                <th>Nazwa pola</th>
                <th>Powierzchnia (ha)</th>
                <th>Typ gleby</th>
                <th>Aktualna uprawa</th>
                <th>Stan</th>
                <th>Data ostatniej zmiany</th>
              </tr>
            </thead>
            <tbody>
              {fieldsWithStatus.map((field, index) => (
                <tr key={index}>
                  <td>{field.name}</td>
                  <td>{formatNumber(field.area)}</td>
                  <td>{field.soil || 'Brak danych'}</td>
                  <td>{field.crop || 'Brak'}</td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(field.currentStatus) }}
                    >
                      {getStatusLabel(field.currentStatus)}
                    </span>
                  </td>
                  <td>
                    {field.statusDate ?
                      new Date(field.statusDate).toLocaleDateString('pl-PL') :
                      'Brak danych'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- KOMPONENT 2: GŁÓWNA TABELA PRODUKCJI (Z SORTOWANIEM) ---
// --- KOMPONENT 2: GŁÓWNA TABELA PRODUKCJI + KARTY UPRAW ---
const FieldProduction = ({ performanceData, cropPerformance, cropFilter, formatCurrency, formatNumber }) => {
  // 1. Stan sortowania tabeli (domyślnie A-Z)
  const [sortBy, setSortBy] = useState('name_asc');
  // 2. Stan sortowania kart upraw (domyślnie A-Z)
  const [cropSortBy, setCropSortBy] = useState('name_asc');

  if (!performanceData) return <div className="no-data">Brak danych o wydajności pól</div>;

  // --- LOGIKA TABELI ---
  const filteredData = cropFilter === 'all'
    ? performanceData.performanceData
    : performanceData.performanceData.filter(field => 
        field.crop && field.crop.toLowerCase().includes(cropFilter.toLowerCase())
      );

  const getSortedFields = () => {
    const data = [...filteredData];
    return data.sort((a, b) => {
      switch (sortBy) {
        // Nazwa Pola
        case 'name_asc': return (a.fieldName || '').localeCompare(b.fieldName || '');
        case 'name_desc': return (b.fieldName || '').localeCompare(a.fieldName || '');
        
        // Powierzchnia
        case 'area_desc': return (b.area || 0) - (a.area || 0);
        case 'area_asc': return (a.area || 0) - (b.area || 0);
        
        // Typ gleby
        case 'soil_asc': return (a.soilType || '').localeCompare(b.soilType || '');
        case 'soil_desc': return (b.soilType || '').localeCompare(a.soilType || '');
        
        // Uprawa
        case 'crop_asc': return (a.crop || '').localeCompare(b.crop || '');
        case 'crop_desc': return (b.crop || '').localeCompare(a.crop || '');
        
        // Wydajność
        case 'yield_desc': return (b.yieldPerHectare || 0) - (a.yieldPerHectare || 0);
        case 'yield_asc': return (a.yieldPerHectare || 0) - (b.yieldPerHectare || 0);
        
        // Status
        case 'status_asc': return (a.currentStatusLabel || a.currentStatus || '').localeCompare(b.currentStatusLabel || b.currentStatus || '');
        case 'status_desc': return (b.currentStatusLabel || b.currentStatus || '').localeCompare(a.currentStatusLabel || a.currentStatus || '');
        
        // Data
        case 'date_desc': return new Date(b.lastHarvestDate || 0) - new Date(a.lastHarvestDate || 0);
        case 'date_asc': return new Date(a.lastHarvestDate || 0) - new Date(b.lastHarvestDate || 0);
        
        default: return 0;
      }
    });
  };
  const sortedFields = getSortedFields();

  // --- LOGIKA SORTOWANIA UPRAW ---
  const getSortedCrops = () => {
    const data = [...cropPerformance];
    return data.sort((a, b) => {
      switch (cropSortBy) {
        // Nazwa uprawy
        case 'name_asc': return (a.crop || '').localeCompare(b.crop || '');
        case 'name_desc': return (b.crop || '').localeCompare(a.crop || '');
        
        // Plon całkowity
        case 'total_yield_desc': return (b.totalYield || 0) - (a.totalYield || 0);
        case 'total_yield_asc': return (a.totalYield || 0) - (b.totalYield || 0);
        
        // Średni plon
        case 'avg_yield_desc': return (b.averageYieldPerHectare || 0) - (a.averageYieldPerHectare || 0);
        case 'avg_yield_asc': return (a.averageYieldPerHectare || 0) - (b.averageYieldPerHectare || 0);
        
        // Powierzchnia
        case 'area_desc': return (b.totalArea || 0) - (a.totalArea || 0);
        case 'area_asc': return (a.totalArea || 0) - (b.totalArea || 0);
        
        default: return 0;
      }
    });
  };
  const sortedCrops = getSortedCrops();

  // Helpery
  const getStatusColor = (status) => {
    const statusColors = {
      'sown': '#27ae60', 'Zasiane': '#27ae60',
      'harvested': '#e74c3c', 'Zebrane': '#e74c3c',
      'ready_for_sowing': '#3498db', 'Przygotowane do siewu': '#3498db',
      'fallow': '#f39c12', 'Ugór': '#f39c12',
      'pasture': '#2ecc71', 'Pastwisko/Łąka': '#2ecc71',
      'Brak danych': '#95a5a6', 'undefined': '#95a5a6'
    };
    return statusColors[status] || '#95a5a6';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Brak danych';
    try { return new Date(dateString).toLocaleDateString('pl-PL'); } 
    catch { return 'Brak danych'; }
  };

  return (
    <div className="field-production">
      {/* Podsumowanie */}
      <div className="production-summary">
        <div className="summary-card">
          <div className="summary-value">{performanceData.summary.totalFields}</div>
          <div className="summary-label">Wszystkie pola</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{formatNumber(performanceData.summary.totalArea)}</div>
          <div className="summary-label">Łączna powierzchnia (ha)</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{performanceData.summary.fieldsWithHarvest}</div>
          <div className="summary-label">Pola ze zbiorem</div>
        </div>
        <div className="summary-card">
          <div className="summary-value">{performanceData.summary.fieldsWithoutHarvest}</div>
          <div className="summary-label">Pola bez zbioru</div>
        </div>
      </div>

      {/* --- SEKCJA UPRAW --- */}
      {cropFilter === 'all' && cropPerformance.length > 0 && (
        <div className="crop-performance-section">
          
          <div className="section-header-flex">
            
            <h4>Analiza upraw</h4>
            <div className="sort-controls">
              
              <span className="sort-label">Sortuj wg:</span>
              
              <select 
                className="sort-select" 
                value={cropSortBy} 
                onChange={(e) => setCropSortBy(e.target.value)}
              >
                <option value="name_asc">Nazwa (A-Z)</option>
                <option value="name_desc">Nazwa (Z-A)</option>
                <option value="total_yield_desc">Plon całkowity (Największy)</option>
                <option value="total_yield_asc">Plon całkowity (Najmniejszy)</option>
                <option value="avg_yield_desc">Średni plon (Największy)</option>
                <option value="avg_yield_asc">Średni plon (Najmniejszy)</option>
                <option value="area_desc">Powierzchnia (Największa)</option>
                <option value="area_asc">Powierzchnia (Najmniejsza)</option>
              </select>
            </div>
          </div>

          <div className="crop-cards-grid">
            {sortedCrops.map((crop, index) => (
              <div key={index} className="crop-card">
                <div className="crop-header">
                  <span className="crop-name">{crop.crop}</span>
                  <span className="crop-area">{formatNumber(crop.totalArea)} ha</span>
                </div>
                <div className="crop-stats">
                  <div className="stat">
                    <span className="label">Plon całkowity</span>
                    <span className="value">{formatNumber(crop.totalYield)} t</span>
                  </div>
                  <div className="stat">
                    <span className="label">Średni plon</span>
                    <span className="value highlight">{formatNumber(crop.averageYieldPerHectare)} t/ha</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TABELA PÓL --- */}
      <div className="fields-table-container">
        <div className="table-header-wrapper">
          <h4>Szczegóły wszystkich pól</h4>
          <div className="sort-controls">
            <span className="sort-label">Sortuj wg:</span>
            <select 
              className="sort-select" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name_asc">Nazwa Pola (A-Z)</option>
              <option value="name_desc">Nazwa Pola (Z-A)</option>
              <option value="area_desc">Powierzchnia (Największa)</option>
              <option value="area_asc">Powierzchnia (Najmniejsza)</option>
              <option value="soil_asc">Typ gleby (A-Z)</option>
              <option value="soil_desc">Typ gleby (Z-A)</option>
              <option value="crop_asc">Uprawa (A-Z)</option>
              <option value="crop_desc">Uprawa (Z-A)</option>
              <option value="yield_desc">Wydajność (Największa)</option>
              <option value="yield_asc">Wydajność (Najmniejsza)</option>
              <option value="status_asc">Status (A-Z)</option>
              <option value="status_desc">Status (Z-A)</option>
              <option value="date_desc">Data (Najnowsze)</option>
              <option value="date_asc">Data (Najstarsze)</option>
            </select>
          </div>
        </div>

        <div className="fields-table-wrapper">
          <table className="fields-table">
            <thead>
              <tr>
                <th>Pole</th>
                <th>Powierzchnia (ha)</th>
                <th>Typ gleby</th>
                <th>Aktualna uprawa</th>
                <th>Wydajność (t/ha)</th>
                <th>Aktualny stan</th>
                <th>Ostatni zbiór</th>
              </tr>
            </thead>
            <tbody>
              {sortedFields.length > 0 ? (
                sortedFields.map((field, index) => (
                  <tr key={index} className={field.hasYields ? 'has-yield' : 'no-yield'}>
                    <td className="fw-bold">{field.fieldName}</td>
                    <td>{formatNumber(field.area)}</td>
                    <td>{field.soilType}</td>
                    <td><span className="crop-badge">{field.crop}</span></td>
                    <td>
                      {field.hasYields ? (
                        <div className="yield-value-row">
                          <span className="yield-number">{formatNumber(field.yieldPerHectare)}</span>
                        </div>
                      ) : <span className="no-data-cell">-</span>}
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ 
                          backgroundColor: getStatusColor(field.currentStatusLabel || field.currentStatus),
                          color: 'white',
                          borderColor: getStatusColor(field.currentStatusLabel || field.currentStatus)
                        }}
                      >
                        {field.currentStatusLabel || field.currentStatus}
                      </span>
                    </td>
                    <td>
                      {field.lastHarvestDate ? (
                        <div>
                          <div className="yield-date">{formatDate(field.lastHarvestDate)}</div>
                          {field.lastHarvestAmount && (
                            <small style={{ color: '#95a5a6', fontSize: '11px' }}>
                              {field.lastHarvestAmount}t {field.lastHarvestCrop ? `(${field.lastHarvestCrop})` : ''}
                            </small>
                          )}
                        </div>
                      ) : <span className="no-data-cell">Brak danych</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="no-data">Brak pól</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- KOMPONENT 3: ANALIZA WYDAJNOŚCI ---
const EfficiencyAnalysis = ({ performanceData, formatNumber }) => {
  if (!performanceData) return <div className="no-data">Brak danych do analizy wydajności</div>;

  // Definicja helpera kolorów (niezbędna tutaj, aby uniknąć błędu)
  const getStatusColor = (status) => {
    const statusColors = {
      'sown': '#27ae60', 'Zasiane': '#27ae60',
      'harvested': '#e74c3c', 'Zebrane': '#e74c3c',
      'ready_for_sowing': '#3498db', 'Przygotowane do siewu': '#3498db',
      'fallow': '#f39c12', 'Ugór': '#f39c12',
      'pasture': '#2ecc71', 'Pastwisko/Łąka': '#2ecc71',
      'Brak danych': '#95a5a6', 'undefined': '#95a5a6'
    };
    return statusColors[status] || '#95a5a6';
  };

  const fieldsWithYield = performanceData.performanceData.filter(field => field.hasYields);
  const rankedFields = [...fieldsWithYield]
    .sort((a, b) => b.yieldPerHectare - a.yieldPerHectare)
    .slice(0, 10);

  return (
    <div className="efficiency-analysis">
      <h4>Top 10 najwydajniejszych pól (ze zbiorem)</h4>
      <div className="ranking-table-container">
        <table className="ranking-table fields-table"> {/* Dodano klasę fields-table dla spójności */}
          <thead>
            <tr>
              <th>Pozycja</th>
              <th>Nazwa pola</th>
              <th>Uprawa</th>
              <th>Powierzchnia (ha)</th>
              <th>Wydajność (t/ha)</th>
              <th>Stan</th>
            </tr>
          </thead>
          <tbody>
            {rankedFields.length > 0 ? (
              rankedFields.map((field, index) => (
                <tr key={index}>
                  <td className="rank">#{index + 1}</td>
                  <td className="field-name fw-bold">{field.fieldName}</td>
                  <td><span className="crop-badge">{field.crop}</span></td>
                  <td>{formatNumber(field.area)}</td>
                  <td className={`yield-value ${field.yieldPerHectare > 5 ? 'high' : field.yieldPerHectare > 3 ? 'medium' : 'low'}`}>
                    {formatNumber(field.yieldPerHectare)}
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: getStatusColor(field.currentStatusLabel || field.currentStatus),
                        color: 'white'
                      }}
                    >
                      {field.currentStatusLabel || field.currentStatus}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  Brak pól ze zbiorem do rankingu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Statystyki */}
      <div className="efficiency-stats">
        <div className="stat-card">
          <h5>Podsumowanie</h5>
          <p>Pola ze zbiorem: {fieldsWithYield.length} / {performanceData.performanceData.length}</p>
          <p>Średnia wydajność: {performanceData.summary.averageYieldPerHectare > 0 ?
            formatNumber(performanceData.summary.averageYieldPerHectare) + ' t/ha' : 'Brak danych'}</p>
          <p>Łączny plon: {formatNumber(performanceData.summary.totalYield)} t</p>
        </div>
      </div>
    </div>
  );
};

export default ProductionReports;