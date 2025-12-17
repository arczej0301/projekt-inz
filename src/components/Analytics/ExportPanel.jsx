import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  subDays, 
  subMonths, 
  subYears, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear 
} from 'date-fns'; 

import { exportToExcel } from '../../utils/excelExport';
import { exportToPDF } from '../../utils/pdfExport';
import './ExportPanel.css';

// Importy hooków
import { useFinance } from '../../hooks/useFinance';
import { useWarehouse } from '../../hooks/useWarehouse';
import { useFields } from '../../hooks/useFields';
// ZMIANA: Zamiast useTasks importujemy serwis garażu
import { garageService } from '../../services/garageService';

// --- KATEGORIE FINANSOWE ---
const incomeCategories = [
  { id: 'sprzedaz_plonow', name: 'Plony', icon: '🌾' },
  { id: 'sprzedaz_zwierzat', name: 'Zwierzęta', icon: '🐄' },
  { id: 'sprzedaz_maszyn', name: 'Maszyny', icon: '🚜' },
  { id: 'dotacje', name: 'Dotacje', icon: '💰' },
  { id: 'inne_przychody', name: 'Inne przychody', icon: '📈' }
];

const expenseCategories = [
  { id: 'zwierzeta', name: 'Zwierzęta', icon: '🐄' },
  { id: 'maszyny', name: 'Maszyny', icon: '🚜' },
  { id: 'zboza', name: 'Plony', icon: '🌾' },
  { id: 'nawozy_nasiona', name: 'Nawozy i nasiona', icon: '🌱' },
  { id: 'pasze', name: 'Pasza', icon: '🌿' },
  { id: 'paliwo', name: 'Paliwo', icon: '⛽' },
  { id: 'sprzet_czesci', name: 'Narzędzia i części', icon: '🛠️' },
  { id: 'naprawy_konserwacja', name: 'Naprawa i konserwacja', icon: '🔧' },
  { id: 'inne_koszty', name: 'Inne koszty', icon: '📉' }
];

// --- NOWE KATEGORIE GARAŻOWE ---
const garageCategories = [
  { id: 'tractors', name: 'Ciągniki', icon: '🚜' },
  { id: 'harvesters', name: 'Kombajny', icon: '🌾' },
  { id: 'trailers', name: 'Przyczepy', icon: '🚛' },
  { id: 'machines', name: 'Maszyny towarzyszące', icon: '⚙️' },
  { id: 'other', name: 'Inne', icon: '🔧' }
];

// --- HELPERY ---
const getCategoryName = (catId) => {
  if (!catId) return '-';
  const incomeCat = incomeCategories.find(c => c.id === catId);
  if (incomeCat) return incomeCat.name;
  const expenseCat = expenseCategories.find(c => c.id === catId);
  if (expenseCat) return expenseCat.name;
  return catId;
};

const getGarageCategoryName = (catId) => {
  if (!catId) return 'Inne';
  const cat = garageCategories.find(c => c.id === catId);
  return cat ? cat.name : catId;
};

const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const safeFormatDate = (dateValue) => {
  if (!dateValue) return '-';
  try {
    if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
      return format(dateValue.toDate(), 'yyyy-MM-dd');
    }
    if (dateValue instanceof Date) {
      return format(dateValue, 'yyyy-MM-dd');
    }
    if (typeof dateValue === 'string') {
      return dateValue.substring(0, 10);
    }
    return dateValue;
  } catch (e) {
    return 'Błąd daty';
  }
};

const ExportPanel = () => {
  const { transactions } = useFinance();
  const { warehouseData, categories: warehouseCategoriesFromHook } = useWarehouse();
  const { fields, generatePerformanceReport } = useFields();
  
  // ZMIANA: Stan dla danych z garażu
  const [garageData, setGarageData] = useState([]);

  const [selectedModules, setSelectedModules] = useState({
    Finanse: true,
    Magazyn: false,
    Pola: false,
    Garaż: false, // ZMIANA: Zamiast Zadania jest Garaż
  });

  // --- STANY FILTROWANIA ---
  const [financeType, setFinanceType] = useState('all');
  const [selectedFinanceCategory, setSelectedFinanceCategory] = useState('all');
  const [selectedWarehouseCategory, setSelectedWarehouseCategory] = useState('all');
  const [selectedGarageCategory, setSelectedGarageCategory] = useState('all'); // Nowy filtr

  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [datePreset, setDatePreset] = useState('custom');
  const [activePreviewTab, setActivePreviewTab] = useState('Finanse');
  
  // Dane wydajności pól
  const [performanceDataMap, setPerformanceDataMap] = useState({});

  // --- 1. EFEKT: POBIERANIE WYDAJNOŚCI PÓL ---
  useEffect(() => {
    const fetchPerformance = async () => {
      if (fields.length > 0) {
        try {
          const report = await generatePerformanceReport();
          const perfMap = {};
          if (report && report.performanceData) {
            report.performanceData.forEach(item => {
              perfMap[item.fieldId] = {
                yield: item.yieldPerHectare || 0,
                lastCrop: item.lastHarvestCrop || item.crop || '',
                status: item.currentStatusLabel || item.currentStatus || 'Brak danych'
              };
            });
          }
          setPerformanceDataMap(perfMap);
        } catch (error) {
          console.error("Błąd pobierania danych do eksportu (Pola):", error);
        }
      }
    };
    fetchPerformance();
  }, [fields.length, generatePerformanceReport]);

  // --- 2. EFEKT: POBIERANIE DANYCH GARAŻU I KOSZTÓW NAPRAW ---
  useEffect(() => {
    const fetchGarageData = async () => {
      try {
        // 1. Pobierz wszystkie maszyny
        const machines = await garageService.getAllMachines();
        
        // 2. Dla każdej maszyny pobierz historię napraw, żeby policzyć koszty
        const machinesWithCosts = await Promise.all(machines.map(async (machine) => {
          const repairs = await garageService.getRepairHistory(machine.id);
          
          // Sumujemy koszty (zakładam, że pole w naprawie nazywa się 'cost' lub 'totalCost')
          const totalRepairCost = repairs.reduce((sum, repair) => {
            const cost = Number(repair.cost) || Number(repair.totalCost) || Number(repair.price) || 0;
            return sum + cost;
          }, 0);

          return {
            ...machine,
            totalRepairCost
          };
        }));

        setGarageData(machinesWithCosts);
      } catch (error) {
        console.error("Błąd pobierania danych z garażu:", error);
      }
    };

    fetchGarageData();
  }, []); // Uruchom raz przy montowaniu

  // --- SPŁASZCZANIE DANYCH MAGAZYNOWYCH ---
  const allWarehouseItems = useMemo(() => {
    if (!warehouseData) return [];
    return Object.values(warehouseData).flat();
  }, [warehouseData]);

  const getWarehouseCategoryName = (catId) => {
    if (!catId) return 'Inne';
    const cat = warehouseCategoriesFromHook.find(c => c.id === catId);
    return cat ? cat.name : catId;
  };

  // --- OBSŁUGA DAT ---
  const handleDatePresetChange = (e) => {
    const preset = e.target.value;
    setDatePreset(preset);
    const today = new Date();
    let startDate = '';
    let endDate = format(today, 'yyyy-MM-dd');
    
    switch(preset) {
      case 'last30days': startDate = format(subDays(today, 30), 'yyyy-MM-dd'); break;
      case 'lastMonth':
        startDate = format(startOfMonth(subMonths(today, 1)), 'yyyy-MM-dd');
        endDate = format(endOfMonth(subMonths(today, 1)), 'yyyy-MM-dd');
        break;
      case 'lastQuarter': startDate = format(subMonths(today, 3), 'yyyy-MM-dd'); break;
      case 'lastYear':
        startDate = format(startOfYear(subYears(today, 1)), 'yyyy-MM-dd');
        endDate = format(endOfYear(subYears(today, 1)), 'yyyy-MM-dd');
        break;
      case 'currentYear': startDate = format(startOfYear(today), 'yyyy-MM-dd'); break;
      case 'all': startDate = ''; endDate = ''; break;
      case 'custom': return;
      default: break;
    }
    setDateRange({ start: startDate, end: endDate });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
    setDatePreset('custom');
  };

  const handleCheckboxChange = (module) => {
    setSelectedModules(prev => {
      const newState = { ...prev, [module]: !prev[module] };
      if (!newState[module] && activePreviewTab === module) {
        const firstActive = Object.keys(newState).find(k => newState[k]);
        setActivePreviewTab(firstActive || null);
      }
      if (newState[module] && !activePreviewTab) {
        setActivePreviewTab(module);
      }
      return newState;
    });
  };

  const handleFinanceTypeChange = (e) => {
    setFinanceType(e.target.value);
    setSelectedFinanceCategory('all');
  };

  const availableFinanceCategories = useMemo(() => {
    if (financeType === 'income') return incomeCategories;
    if (financeType === 'expense') return expenseCategories;
    return [...incomeCategories, ...expenseCategories];
  }, [financeType]);

  // --- PRZYGOTOWANIE DANYCH (GŁÓWNA LOGIKA) ---
  const preparedData = useMemo(() => {
    const data = {};

    const isWithinRange = (itemDate) => {
      if (!dateRange.start && !dateRange.end) return true;
      if (!itemDate) return true; 

      const targetDate = new Date(itemDate);
      const start = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01');
      const end = dateRange.end ? new Date(dateRange.end) : new Date('2100-01-01');
      end.setHours(23, 59, 59);
      return targetDate >= start && targetDate <= end;
    };

    // 1. FINANSE
    if (selectedModules.Finanse && transactions) {
      let filtered = transactions.filter(t => isWithinRange(t.date));

      if (financeType !== 'all') {
        filtered = filtered.filter(t => t.type === financeType);
      }
      if (selectedFinanceCategory !== 'all') {
        filtered = filtered.filter(t => t.category === selectedFinanceCategory);
      }
      
      data['Finanse'] = filtered.map(t => ({
        Data: safeFormatDate(t.date),
        Typ: t.type === 'income' ? 'Przychód' : 'Wydatek',
        Kategoria: getCategoryName(t.category),
        Kwota: `${Number(t.amount).toFixed(2)} PLN`,
        Opis: t.description || '-'
      }));
    }

    // 2. MAGAZYN
    if (selectedModules.Magazyn && allWarehouseItems.length > 0) {
      let filtered = allWarehouseItems;

      if (selectedWarehouseCategory !== 'all') {
        filtered = filtered.filter(i => i.category === selectedWarehouseCategory);
      }

      data['Magazyn'] = filtered.map(i => {
        const price = Number(i.price) || 0;
        const quantity = Number(i.quantity) || 0;
        const totalValue = price * quantity;

        return {
          Produkt: i.name,
          Kategoria: getWarehouseCategoryName(i.category),
          Ilość: `${quantity} ${i.unit}`,
          Wartość: `${totalValue.toFixed(2)} PLN`, 
          'Cena jedn.': `${price.toFixed(2)} PLN`, 
          'Ostatnia zmiana': safeFormatDate(i.lastUpdate || i.createdAt)
        };
      });
    } else if (selectedModules.Magazyn) {
       data['Magazyn'] = [];
    }

    // 3. POLA
    if (selectedModules.Pola && fields) {
      data['Pola'] = fields.map(f => {
        const perfInfo = performanceDataMap[f.id] || {};
        const yieldValue = perfInfo.yield || f.yield || f.efficiency || 0;
        const lastCropValue = perfInfo.lastCrop || f.lastHarvestCrop || '';
        const currentStatus = perfInfo.status || f.status || '-';

        return {
          Nazwa: f.name,
          Powierzchnia: `${f.area} ha`,
          'Wydajność t/ha': yieldValue > 0 ? `${Number(yieldValue).toFixed(2)}` : '-',
          'Ostatnia uprawa': lastCropValue ? capitalizeFirstLetter(lastCropValue) : 'Brak',
          Status: currentStatus 
        };
      });
    }

    // 4. GARAŻ (NOWOŚĆ)
    if (selectedModules.Garaż && garageData) {
      let filtered = garageData;

      // Filtr daty (filtrujemy po dacie zakupu - purchaseDate)
      filtered = filtered.filter(m => isWithinRange(m.purchaseDate));

      // Filtr kategorii
      if (selectedGarageCategory !== 'all') {
        filtered = filtered.filter(m => m.category === selectedGarageCategory);
      }

      data['Garaż'] = filtered.map(m => ({
        Nazwa: m.name,
        Marka: m.brand || '-',
        Status: capitalizeFirstLetter(m.status) || 'Sprawny',
        'Data zakupu': safeFormatDate(m.purchaseDate),
        'Cena zakupu': m.price || m.purchasePrice ? `${Number(m.price || m.purchasePrice).toFixed(2)} PLN` : '-',
        'Suma kosztów napraw': m.totalRepairCost > 0 ? `${Number(m.totalRepairCost).toFixed(2)} PLN` : '0.00 PLN'
      }));
    }

    return data;
  }, [
    selectedModules, transactions, allWarehouseItems, fields, garageData, // garageData zamiast tasks
    dateRange, financeType, selectedFinanceCategory, selectedWarehouseCategory, 
    selectedGarageCategory, // Dodano filtr
    warehouseCategoriesFromHook, performanceDataMap
  ]);

  const hasData = Object.keys(preparedData).some(key => preparedData[key].length > 0);

  const handleExportExcel = () => exportToExcel(preparedData, 'Raport_Rolniczy');
  const handleExportPDF = () => exportToPDF(preparedData, 'Raport_Rolniczy');
  const handlePrint = () => exportToPDF(preparedData, 'Raport_Do_Druku');

  return (
    <div className="export-panel-container">
      <header className="export-header">
        <h3>Centrum Raportowania</h3>
        <p>Wybierz zakres dat i moduły do eksportu.</p>
      </header>

      <div className="filter-section">
        <div className="preset-container">
          <label htmlFor="datePreset">Szybki wybór okresu:</label>
          <select id="datePreset" value={datePreset} onChange={handleDatePresetChange} className="preset-select">
            <option value="custom">Własny zakres...</option>
            <option value="last30days">Ostatnie 30 dni</option>
            <option value="lastMonth">Poprzedni miesiąc</option>
            <option value="lastQuarter">Ostatnie 3 miesiące</option>
            <option value="currentYear">Bieżący rok</option>
            <option value="lastYear">Poprzedni rok</option>
            <option value="all">Wszystkie dane</option>
          </select>
        </div>
        <div className="date-inputs">
          <label>Od: <input type="date" name="start" value={dateRange.start} onChange={handleDateChange} /></label>
          <label>Do: <input type="date" name="end" value={dateRange.end} onChange={handleDateChange} /></label>
        </div>
      </div>

      <div className="selection-section">
        <h4>2. Wybierz źródła danych</h4>
        
        <div className="modules-grid">
          {Object.keys(selectedModules).map((key) => (
            <label key={key} className={`module-card ${selectedModules[key] ? 'active' : ''}`}>
              <div className="module-header-row">
                <input 
                  type="checkbox" 
                  checked={selectedModules[key]} 
                  onChange={() => handleCheckboxChange(key)} 
                />
                <span className="module-name">{key}</span>
                {selectedModules[key] && <div className="check-icon">✓</div>}
              </div>
            </label>
          ))}
        </div>

        {/* FILTRY FINANSOWE */}
        {selectedModules.Finanse && (
          <div className="finance-filters-section">
            <h5>🔍 Filtry Finansowe:</h5>
            <div className="finance-filters-row">
              <div className="filter-group">
                <label>Typ:</label>
                <select value={financeType} onChange={handleFinanceTypeChange} className="filter-select">
                  <option value="all">Wszystkie (+ / -)</option>
                  <option value="income">Tylko Przychody (+)</option>
                  <option value="expense">Tylko Wydatki (-)</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Kategoria:</label>
                <select value={selectedFinanceCategory} onChange={(e) => setSelectedFinanceCategory(e.target.value)} className="filter-select">
                  <option value="all">Wszystkie kategorie</option>
                  {availableFinanceCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* FILTRY MAGAZYNOWE */}
        {selectedModules.Magazyn && (
          <div className="finance-filters-section warehouse-filters">
            <h5>📦 Filtry Magazynowe:</h5>
            <div className="finance-filters-row">
              <div className="filter-group">
                <label>Kategoria produktu:</label>
                <select 
                  value={selectedWarehouseCategory} 
                  onChange={(e) => setSelectedWarehouseCategory(e.target.value)} 
                  className="filter-select"
                >
                  <option value="all">Wszystkie produkty</option>
                  {warehouseCategoriesFromHook.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* --- FILTRY GARAŻOWE (NOWOŚĆ) --- */}
        {selectedModules.Garaż && (
          <div className="finance-filters-section" style={{ backgroundColor: '#fff0f0', borderLeftColor: '#e74c3c' }}>
            <h5 style={{color: '#c0392b'}}>🚜 Filtry Garażowe:</h5>
            <div className="finance-filters-row">
              <div className="filter-group">
                <label>Kategoria maszyny:</label>
                <select 
                  value={selectedGarageCategory} 
                  onChange={(e) => setSelectedGarageCategory(e.target.value)} 
                  className="filter-select"
                >
                  <option value="all">Wszystkie maszyny</option>
                  {garageCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="preview-section">
        <h4>3. Podgląd danych</h4>
        {!hasData ? (
          <div className="empty-state">Brak danych dla wybranych filtrów.</div>
        ) : (
          <div className="preview-content">
            <div className="preview-tabs">
              {Object.keys(preparedData).map(category => (
                <button
                  key={category}
                  className={`tab-btn ${activePreviewTab === category ? 'active' : ''}`}
                  onClick={() => setActivePreviewTab(category)}
                  style={{ display: preparedData[category].length === 0 ? 'none' : 'flex' }}
                >
                  {category} <span className="badge">{preparedData[category].length}</span>
                </button>
              ))}
            </div>
            <div className="table-wrapper">
              {activePreviewTab && preparedData[activePreviewTab] && (
                <PreviewTable data={preparedData[activePreviewTab]} />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="actions-section">
        <button onClick={handleExportExcel} disabled={!hasData} className="btn-action excel">📥 Excel</button>
        <button onClick={handleExportPDF} disabled={!hasData} className="btn-action pdf">📄 PDF</button>
        <button onClick={handlePrint} disabled={!hasData} className="btn-action print">🖨️ Drukuj</button>
      </div>
    </div>
  );
};

const PreviewTable = ({ data }) => {
  if (!data || data.length === 0) return <p>Brak danych.</p>;
  const headers = Object.keys(data[0]);
  const previewRows = data; 
  return (
    <table className="preview-data-table">
      <thead>
        <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {previewRows.map((row, idx) => (
          <tr key={idx}>
            {headers.map(h => <td key={`${idx}-${h}`}>{row[h]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ExportPanel;