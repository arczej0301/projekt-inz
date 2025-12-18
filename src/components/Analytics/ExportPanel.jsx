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

// Importy hooków i serwisów
import { useFinance } from '../../hooks/useFinance';
import { useWarehouse } from '../../hooks/useWarehouse';
import { useFields } from '../../hooks/useFields';
import { useAnimals } from '../../hooks/useAnimals';
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

// --- KATEGORIE ZWIERZĄT ---
const animalTypes = [
  { value: 'krowa', label: 'Krowy' },
  { value: 'byk', label: 'Byki' },
  { value: 'świnia', label: 'Świnie' },
  { value: 'koń', label: 'Konie' },
  { value: 'owca', label: 'Owce' },
  { value: 'koza', label: 'Kozy' },
  { value: 'kura', label: 'Kury' }
];

// --- SŁOWNIK TŁUMACZEŃ (Baza -> Polski) ---
const categoryTranslations = {
  'tractor': 'Ciągnik',
  'harvester': 'Kombajn',
  'forage': 'Sieczkarnia', // To jest ta kategoria z Twojej bazy!
  'plow': 'Pług',
  'seeder': 'Siewnik',
  'sprayer': 'Opryskiwacz',
  'trailer': 'Przyczepa',
  'truck': 'Samochód',
  'other': 'Inne',
  'cultivator': 'Kultywator',
  'loader': 'Ładowarka'
};

const garageStatusDictionary = {
  'active': 'Sprawny',
  'maintenance': 'W serwisie',
  'broken': 'Awaria',
  'sold': 'Sprzedany',
  'needs_service': 'Wymaga przeglądu'
};

// Funkcja pomocnicza: Tłumaczy klucz z bazy na Polski
const getPolishCategoryName = (dbKey) => {
  if (!dbKey) return 'Inne';
  const normalized = dbKey.toString().toLowerCase().trim();
  // Jeśli mamy tłumaczenie -> zwracamy je. Jeśli nie -> zwracamy oryginał z dużej litery.
  return categoryTranslations[normalized] || (normalized.charAt(0).toUpperCase() + normalized.slice(1));
};

// Formatowanie kasy (ze spacją)
const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " PLN";
};

// --- HELPERY ---
const getCategoryName = (catId) => {
  if (!catId) return '-';
  const incomeCat = incomeCategories.find(c => c.id === catId);
  if (incomeCat) return incomeCat.name;
  const expenseCat = expenseCategories.find(c => c.id === catId);
  if (expenseCat) return expenseCat.name;
  return catId;
};

const getWarehouseCategoryNameFromHook = (catId, warehouseCategories) => {
  if (!catId) return 'Inne';
  if (warehouseCategories && warehouseCategories.length > 0) {
    const cat = warehouseCategories.find(c => c.id === catId);
    if (cat) return cat.name;
  }
  return capitalizeFirstLetter(catId);
};

const capitalizeFirstLetter = (string) => {
  if (!string) return '-';
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
  const { animals } = useAnimals();

  const [garageData, setGarageData] = useState([]);

  // ZMIANA: Domyślnie wszystko odznaczone (false)
  const [selectedModules, setSelectedModules] = useState({
    Finanse: false,
    Magazyn: false,
    Pola: false,
    Garaż: false,
    Zwierzęta: false
  });

  const [financeType, setFinanceType] = useState('all');
  const [selectedFinanceCategory, setSelectedFinanceCategory] = useState('all');
  const [selectedWarehouseCategory, setSelectedWarehouseCategory] = useState('all');
  const [selectedGarageCategory, setSelectedGarageCategory] = useState('all');
  const [selectedAnimalType, setSelectedAnimalType] = useState('all');

  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [datePreset, setDatePreset] = useState('custom');

  // ZMIANA: Brak domyślnej zakładki (null), bo nic nie jest zaznaczone na starcie
  const [activePreviewTab, setActivePreviewTab] = useState(null);

  const [performanceDataMap, setPerformanceDataMap] = useState({});

  // --- EFEKT 1: POBIERANIE WYDAJNOŚCI PÓL ---
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

  // --- EFEKT 2: POBIERANIE GARAŻU + KOSZTY NAPRAW ---
  useEffect(() => {
    const fetchGarageData = async () => {
      try {
        const machines = await garageService.getAllMachines();

        const machinesWithCosts = await Promise.all(machines.map(async (machine) => {
          const repairs = await garageService.getRepairHistory(machine.id);
          const totalRepairCost = repairs.reduce((sum, repair) => {
            const cost = Number(repair.cost) || Number(repair.totalCost) || Number(repair.price) || 0;
            return sum + cost;
          }, 0);

          return { ...machine, totalRepairCost };
        }));

        setGarageData(machinesWithCosts);
      } catch (error) {
        console.error("Błąd pobierania danych z garażu:", error);
      }
    };

    fetchGarageData();
  }, []);

  // --- DYNAMICZNE FILTRY NA PODSTAWIE BAZY DANYCH ---
  const availableGarageCategories = useMemo(() => {
    if (!garageData || garageData.length === 0) return [];

    // 1. Wyciągamy unikalne klucze z bazy (np. ['tractor', 'forage'])
    const uniqueRawCategories = [...new Set(garageData.map(m =>
      (m.category || 'other').toString().toLowerCase().trim()
    ))];

    // 2. Tworzymy opcje do selecta, TYLKO z tłumaczeniami (bez ikon)
    return uniqueRawCategories.map(rawCat => {
      const label = getPolishCategoryName(rawCat); // Tłumaczy na "Ciągnik", "Sieczkarnia"

      // id = to co w bazie (angielski), name = to co widzi użytkownik (polski)
      return { id: rawCat, name: label }; // BEZ ikon
    });
  }, [garageData]);

  // --- DANE POMOCNICZE ---
  const allWarehouseItems = useMemo(() => {
    if (!warehouseData) return [];
    return Object.values(warehouseData).flat();
  }, [warehouseData]);

  // --- OBSŁUGA DAT ---
  const handleDatePresetChange = (e) => {
    const preset = e.target.value;
    setDatePreset(preset);
    const today = new Date();
    let startDate = '';
    let endDate = format(today, 'yyyy-MM-dd');

    switch (preset) {
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
      // Jeśli zaznaczamy moduł, a żaden inny nie jest aktywny, ustawiamy go jako aktywny tab
      if (newState[module] && !activePreviewTab) {
        setActivePreviewTab(module);
      }
      // Jeśli odznaczamy aktywny moduł, czyścimy tab lub szukamy innego
      if (!newState[module] && activePreviewTab === module) {
        const firstActive = Object.keys(newState).find(k => newState[k] && k !== module);
        setActivePreviewTab(firstActive || null);
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

  // --- PRZYGOTOWANIE DANYCH ---
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
        Kwota: formatMoney(t.amount), // <--- UŻYCIE FUNKCJI
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
          Kategoria: getWarehouseCategoryNameFromHook(i.category, warehouseCategoriesFromHook),
          Ilość: `${quantity} ${i.unit}`,
          Wartość: formatMoney(totalValue), // <--- UŻYCIE FUNKCJI
          'Cena jedn.': formatMoney(price),
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

    // 4. GARAŻ
if (selectedModules.Garaż && garageData) {
  let filtered = garageData;
  
  // Filtrowanie po dacie
  filtered = filtered.filter(m => isWithinRange(m.purchaseDate));

  // Filtrowanie po kategorii (porównujemy klucze angielskie)
  if (selectedGarageCategory !== 'all') {
    filtered = filtered.filter(m => 
      (m.category || '').toLowerCase().trim() === selectedGarageCategory
    );
  }

  data['Garaż'] = filtered.map(m => {
    // 1. Pobieramy klucz z bazy (np. "forage")
    const catKey = (m.category || '').toLowerCase().trim();
    
    // 2. Tłumaczymy na polski (np. "Sieczkarnia")
    const categoryLabel = getPolishCategoryName(catKey);

    // 3. Tłumaczymy status (BRAKUJĄCY FRAGMENT)
    const statusKey = (m.status || 'active').toLowerCase().trim();
    const statusLabel = garageStatusDictionary[statusKey] || m.status;

    return {
      Nazwa: m.name,
      Marka: m.brand || '-',
      Kategoria: categoryLabel, // Tylko polska nazwa (bez ikon)
      Status: statusLabel, // Używamy zdefiniowanej zmiennej
      'Data zakupu': safeFormatDate(m.purchaseDate),
      'Cena zakupu': formatMoney(m.price || m.purchasePrice),
      'Suma kosztów napraw': formatMoney(m.totalRepairCost)
    };
  });
}

    // 5. ZWIERZĘTA
    if (selectedModules.Zwierzęta && animals) {
      let filtered = animals;
      if (selectedAnimalType !== 'all') {
        filtered = filtered.filter(a => a.type === selectedAnimalType);
      }
      data['Zwierzęta'] = filtered.map(a => ({
        'Imię': a.name || '-',
        'Typ': capitalizeFirstLetter(a.type),
        'Rasa': capitalizeFirstLetter(a.breed),
        'Numer kolczyka': a.earTag || '-',
        'Data urodzenia': safeFormatDate(a.birthDate),
        'Waga': a.weight ? `${a.weight} kg` : '-',
        'Status': capitalizeFirstLetter(a.status),
        'Stan zdrowia': capitalizeFirstLetter(a.health)
      }));
    }

    return data;
  }, [
    selectedModules, transactions, allWarehouseItems, fields, garageData, animals,
    dateRange, financeType, selectedFinanceCategory, selectedWarehouseCategory,
    selectedGarageCategory, selectedAnimalType,
    warehouseCategoriesFromHook, performanceDataMap, availableGarageCategories
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

        {/* FILTRY GARAŻOWE - DYNAMICZNE Z TŁUMACZENIEM */}
        {selectedModules.Garaż && (
          <div className="finance-filters-section" style={{ backgroundColor: '#fff0f0', borderLeftColor: '#e74c3c' }}>
            <h5 style={{ color: '#c0392b' }}>🚜 Filtry Garażowe:</h5>
            <div className="finance-filters-row">
              <div className="filter-group">
                <label>Kategoria maszyny:</label>
                <select
                  value={selectedGarageCategory}
                  onChange={(e) => setSelectedGarageCategory(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Wszystkie maszyny</option>
                  {availableGarageCategories.length > 0 ? (
                    availableGarageCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>Brak kategorii w danych</option>
                  )}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* FILTRY ZWIERZĄT */}
        {selectedModules.Zwierzęta && (
          <div className="finance-filters-section" style={{ backgroundColor: '#e8f6f3', borderLeftColor: '#27ae60', marginTop: '10px' }}>
            <h5 style={{ color: '#27ae60' }}>🐄 Filtry Zwierząt:</h5>
            <div className="finance-filters-row">
              <div className="filter-group">
                <label>Gatunek:</label>
                <select
                  value={selectedAnimalType}
                  onChange={(e) => setSelectedAnimalType(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Wszystkie gatunki</option>
                  {animalTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
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
          <div className="empty-state">Brak danych dla wybranych filtrów (zaznacz moduł i zakres dat).</div>
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