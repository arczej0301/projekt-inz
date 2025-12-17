import React, { useState, useMemo } from 'react';
import { format } from 'date-fns'; // Upewnij się, że masz to zainstalowane
import { exportToExcel } from '../../utils/excelExport';
import { exportToPDF } from '../../utils/pdfExport';
import './ExportPanel.css'

// Importy Twoich hooków
import { useFinance } from '../../hooks/useFinance';
import { useWarehouse } from '../../hooks/useWarehouse';
import { useFields } from '../../hooks/useFields';
import { useTasks } from '../../hooks/useTasks';

// --- FUNKCJA POMOCNICZA (NAPRAWA BŁĘDU) ---
// Ta funkcja zamienia każdy dziwny obiekt daty na ładny tekst
const safeFormatDate = (dateValue) => {
  if (!dateValue) return '-';
  
  try {
    // Przypadek 1: To obiekt Firebase Timestamp (posiada metodę toDate)
    if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
      return format(dateValue.toDate(), 'yyyy-MM-dd');
    }
    // Przypadek 2: To standardowy obiekt Date JS
    if (dateValue instanceof Date) {
      return format(dateValue, 'yyyy-MM-dd');
    }
    // Przypadek 3: To już jest string (np. "2023-01-01")
    if (typeof dateValue === 'string') {
      return dateValue.substring(0, 10); // Dla pewności ucinamy godzinę
    }
    return dateValue; // Zwróć jak jest, jeśli to nie data
  } catch (e) {
    return 'Błąd daty';
  }
};

const ExportPanel = () => {
  // 1. Pobieranie danych
  const { transactions } = useFinance();
  const { inventory } = useWarehouse();
  const { fields } = useFields();
  const { tasks } = useTasks();

  // 2. Stan wyboru modułów
  const [selectedModules, setSelectedModules] = useState({
    Finanse: true,
    Magazyn: false,
    Pola: false,
    Zadania: false,
  });

  // 3. Stan filtrów dat (NOWOŚĆ)
  // Domyślnie ustawiamy zakres na ostatnie 30 dni, ale można zostawić puste
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const [activePreviewTab, setActivePreviewTab] = useState('Finanse');

  const handleCheckboxChange = (module) => {
    setSelectedModules(prev => {
      const newState = { ...prev, [module]: !prev[module] };
      if (!newState[module] && activePreviewTab === module) {
        const firstActive = Object.keys(newState).find(k => newState[k]);
        setActivePreviewTab(firstActive || null);
      }
      if (!prev[module] && !activePreviewTab) {
        setActivePreviewTab(module);
      }
      return newState;
    });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  // --- PRZYGOTOWANIE DANYCH (Z NAPRAWĄ I FILTROWANIEM) ---
  const preparedData = useMemo(() => {
    const data = {};

    // Funkcja filtrująca po dacie (uniwersalna)
    const isWithinRange = (itemDate) => {
      if (!dateRange.start && !dateRange.end) return true; // Brak filtrów = pokaż wszystko
      
      const targetDate = new Date(itemDate);
      const start = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01');
      const end = dateRange.end ? new Date(dateRange.end) : new Date('2100-01-01');
      
      // Ustawiamy godziny na 00:00 i 23:59 dla pewności
      end.setHours(23, 59, 59);

      return targetDate >= start && targetDate <= end;
    };

    if (selectedModules.Finanse && transactions) {
      // Filtrujemy PRZED mapowaniem
      const filtered = transactions.filter(t => isWithinRange(t.date));
      
      data['Finanse'] = filtered.map(t => ({
        Data: safeFormatDate(t.date), // <--- TU BYŁ BŁĄD, TERAZ JEST OK
        Typ: t.type === 'income' ? 'Przychód' : 'Wydatek',
        Kategoria: t.category,
        Kwota: `${Number(t.amount).toFixed(2)} PLN`,
        Opis: t.description || '-'
      }));
    }

    if (selectedModules.Magazyn && inventory) {
      // Magazyn rzadko ma daty, ale jeśli ma "lastUpdated", można dodać filtr
      data['Magazyn'] = inventory.map(i => ({
        Produkt: i.name,
        Ilość: `${i.quantity} ${i.unit}`,
        Wartość: `${Number(i.value || 0).toFixed(2)} PLN`,
        Magazyn: i.location || 'Główny'
      }));
    }

    if (selectedModules.Pola && fields) {
      data['Pola'] = fields.map(f => ({
        Nazwa: f.name,
        Powierzchnia: `${f.area} ha`,
        Uprawa: f.cropType || 'Brak',
        Status: f.status
      }));
    }

    if (selectedModules.Zadania && tasks) {
      const filtered = tasks.filter(t => isWithinRange(t.dueDate));
      
      data['Zadania'] = filtered.map(t => ({
        Zadanie: t.title,
        Termin: safeFormatDate(t.dueDate), // <--- TU TEŻ BEZPIECZNE FORMATOWANIE
        Priorytet: t.priority,
        Status: t.completed ? 'Wykonane' : 'Do zrobienia'
      }));
    }

    return data;
  }, [selectedModules, transactions, inventory, fields, tasks, dateRange]);

  const handleExportExcel = () => exportToExcel(preparedData, 'Raport_Rolniczy');
  const handleExportPDF = () => exportToPDF(preparedData, 'Raport_Rolniczy');
  const handlePrint = () => exportToPDF(preparedData, 'Raport_Do_Druku');

  const hasData = Object.keys(preparedData).some(key => preparedData[key].length > 0);

  return (
    <div className="export-panel-container">
      <header className="export-header">
        <h3>Centrum Raportowania</h3>
        <p>Wybierz zakres dat i moduły do eksportu.</p>
      </header>

      {/* --- KROK 0: FILTR DAT (NOWY) --- */}
      <div className="filter-section">
        <div className="date-inputs">
          <label>
            Od:
            <input 
              type="date" 
              name="start" 
              value={dateRange.start} 
              onChange={handleDateChange} 
            />
          </label>
          <label>
            Do:
            <input 
              type="date" 
              name="end" 
              value={dateRange.end} 
              onChange={handleDateChange} 
            />
          </label>
        </div>
      </div>

      <div className="selection-section">
        <h4>1. Wybierz źródła danych</h4>
        <div className="modules-grid">
          {Object.keys(selectedModules).map((key) => (
            <label key={key} className={`module-card ${selectedModules[key] ? 'active' : ''}`}>
              <input 
                type="checkbox" 
                checked={selectedModules[key]} 
                onChange={() => handleCheckboxChange(key)} 
              />
              <span className="module-name">{key}</span>
              {selectedModules[key] }
            </label>
          ))}
        </div>
      </div>

      <div className="preview-section">
        <h4>2. Podgląd danych do eksportu</h4>
        
        {!hasData ? (
          <div className="empty-state">
             Brak danych dla wybranych filtrów lub modułów.
          </div>
        ) : (
          <div className="preview-content">
            <div className="preview-tabs">
              {Object.keys(preparedData).map(category => (
                <button
                  key={category}
                  className={`tab-btn ${activePreviewTab === category ? 'active' : ''}`}
                  onClick={() => setActivePreviewTab(category)}
                  // Ukrywamy taby które są puste po filtrowaniu
                  style={{ display: preparedData[category].length === 0 ? 'none' : 'block' }}
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
            
            <p className="preview-note">
              * Widzisz podgląd 5 pierwszych wyników.
            </p>
          </div>
        )}
      </div>

      <div className="actions-section">
        <button onClick={handleExportExcel} disabled={!hasData} className="btn-action excel">
          📥 Excel
        </button>
        <button onClick={handleExportPDF} disabled={!hasData} className="btn-action pdf">
          📄 PDF
        </button>
        <button onClick={handlePrint} disabled={!hasData} className="btn-action print">
          🖨️ Drukuj
        </button>
      </div>
    </div>
  );
};

const PreviewTable = ({ data }) => {
  if (!data || data.length === 0) return <p>Brak danych.</p>;

  // Bierzemy klucze z pierwszego elementu
  const headers = Object.keys(data[0]);
  const previewRows = data.slice(0, 5);

  return (
    <table className="preview-data-table">
      <thead>
        <tr>
          {headers.map(h => <th key={h}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {previewRows.map((row, idx) => (
          <tr key={idx}>
            {headers.map(h => (
              <td key={`${idx}-${h}`}>
                 {/* Tutaj React już nie wybuchnie, bo data została zamieniona na string w preparedData */}
                 {row[h]} 
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ExportPanel;