import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import * as fieldsService from '../../services/fieldsService';
import './FieldYieldChart.css';

const CROP_COLORS = {
  'kukurydza': '#FFB74D',
  'rzepak': '#FFD54F',
  'pszenica': '#81C784',
  'jęczmień': '#4DB6AC',
  'owies': '#A1887F',
  'żyto': '#7986CB',
  'buraki': '#E57373',
  'ziemniaki': '#BA68C8',
  'default': '#64B5F6'
};

const FieldYieldChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldsData, setFieldsData] = useState([]);
  const [yieldsData, setYieldsData] = useState([]);

  // GŁÓWNA FUNKCJA DO OBLICZANIA DANYCH
  const chartData = useMemo(() => {
    if (!fieldsData.length) return [];
    
    const processedFields = [];
    
    fieldsData.forEach(field => {
      // Znajdź WSZYSTKIE zbiory dla tego pola
      const fieldYields = yieldsData.filter(y => y.field_id === field.id);
      
      if (fieldYields.length > 0) {
        // OBLICZ ŚREDNIĄ wydajność ze WSZYSTKICH zbiorów
        let totalYield = 0;
        let totalArea = 0;
        let latestDate = null;
        let crops = new Set();
        let totalMoisture = 0;
        let yieldCount = 0;
        
        fieldYields.forEach(yieldItem => {
          const area = parseFloat(field.area) || parseFloat(yieldItem.field_area) || 0;
          const yieldAmount = parseFloat(yieldItem.amount) || 0;
          
          totalYield += yieldAmount;
          totalArea += area;
          crops.add(yieldItem.crop || field.crop);
          
          if (yieldItem.moisture) {
            totalMoisture += parseFloat(yieldItem.moisture);
            yieldCount++;
          }
          
          // Znajdź najnowszą datę
          const currentDate = new Date(yieldItem.date_created || yieldItem.date);
          if (!latestDate || currentDate > latestDate) {
            latestDate = currentDate;
          }
        });
        
        // ŚREDNIA wydajność (t/ha) dla tego pola
        const averageYieldPerHa = totalArea > 0 ? totalYield / totalArea : 0;
        const averageMoisture = yieldCount > 0 ? totalMoisture / yieldCount : null;
        
        // Główna uprawa (najczęstsza lub ostatnia)
        const mainCrop = field.crop || Array.from(crops)[0] || 'Nieznana uprawa';
        
        processedFields.push({
          fieldName: field.name || `Pole ${field.id.substring(0, 5)}`,
          fieldId: field.id,
          yieldPerHa: parseFloat(averageYieldPerHa.toFixed(2)), // ŚREDNIA wydajność
          area: parseFloat(field.area) || 0,
          crop: mainCrop,
          totalYield: parseFloat(totalYield.toFixed(2)), // SUMA wszystkich zbiorów
          date: latestDate ? latestDate.toLocaleDateString('pl-PL') : 'Brak daty',
          color: CROP_COLORS[mainCrop?.toLowerCase()] || CROP_COLORS.default,
          hasYieldData: true,
          moisture: averageMoisture ? parseFloat(averageMoisture.toFixed(1)) : null,
          yieldCount: fieldYields.length, // Liczba zbiorów dla tego pola
          isAverage: true // Flaga że to średnia
        });
        
      } else {
        // Pole BEZ zbiorów
        processedFields.push({
          fieldName: field.name || `Pole ${field.id.substring(0, 5)}`,
          fieldId: field.id,
          yieldPerHa: 0,
          area: parseFloat(field.area) || 0,
          crop: field.crop || 'Brak uprawy',
          totalYield: 0,
          date: 'Brak zbiorów',
          color: CROP_COLORS[field.crop?.toLowerCase()] || CROP_COLORS.default,
          hasYieldData: false,
          moisture: null,
          yieldCount: 0,
          isAverage: false
        });
      }
    });
    
    // Sortuj malejąco według wydajności (pola z plonami na górze)
    return processedFields.sort((a, b) => {
      if (a.hasYieldData !== b.hasYieldData) {
        return b.hasYieldData - a.hasYieldData; // Najpierw pola z plonami
      }
      return b.yieldPerHa - a.yieldPerHa; // Sortuj według wydajności
    });
    
  }, [fieldsData, yieldsData]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Rozpoczynam pobieranie danych pól...');
        
        // Pobierz WSZYSTKIE pola i WSZYSTKIE zbiory równolegle
        const [fields, allYields] = await Promise.all([
          fieldsService.getFields(),
          fieldsService.getAllFieldYields()
        ]);
        
        console.log('📊 Pobrano pola:', fields.length);
        console.log('📈 Pobrano zbiory:', allYields.length);
        
        // Sprawdź czy są duplikaty w zbiorach
        const uniqueFieldIds = [...new Set(allYields.map(y => y.field_id))];
        console.log('🔍 Unikalne pola ze zbiorami:', uniqueFieldIds.length);
        
        // Policz zbiory dla każdego pola
        const yieldsPerField = {};
        allYields.forEach(yieldItem => {
          const fieldId = yieldItem.field_id;
          yieldsPerField[fieldId] = (yieldsPerField[fieldId] || 0) + 1;
        });
        
        console.log('📋 Zbiory na pole:', yieldsPerField);
        
        setFieldsData(fields);
        setYieldsData(allYields);
        setLoading(false);
        
      } catch (err) {
        console.error('❌ Błąd pobierania danych pól:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  // Oblicz statystyki
  const stats = useMemo(() => {
    const fieldsWithYield = chartData.filter(item => item.hasYieldData);
    const fieldsWithoutYield = chartData.filter(item => !item.hasYieldData);
    
    const totalYield = fieldsWithYield.reduce((sum, item) => sum + item.totalYield, 0);
    const totalArea = chartData.reduce((sum, item) => sum + item.area, 0);
    const totalYieldCount = yieldsData.length;
    
    // Średnia ze WSZYSTKICH pól (zarówno z plonami jak i bez)
    let averageYieldAllFields = 0;
    if (chartData.length > 0) {
      // Suma wydajności wszystkich pól (włączając zerowe)
      const totalYieldAllFields = chartData.reduce((sum, item) => sum + (item.yieldPerHa || 0), 0);
      averageYieldAllFields = totalYieldAllFields / chartData.length;
    }
    
    // Średnia z WSZYSTKICH zbiorów (nie tylko średnich per pole) - OGÓLNA ŚREDNIA
    let overallAverageYield = 0;
    if (totalYieldCount > 0 && totalArea > 0) {
      const totalYieldAll = yieldsData.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      overallAverageYield = totalYieldAll / totalArea;
    }
    
    return {
      fieldsWithYield: fieldsWithYield.length,
      fieldsWithoutYield: fieldsWithoutYield.length,
      totalFields: chartData.length,
      averageYieldAllFields: parseFloat(averageYieldAllFields.toFixed(2)), // Średnia ze wszystkich pól
      overallAverageYield: parseFloat(overallAverageYield.toFixed(2)), // Ogólna średnia z sumy plonów
      totalYield: parseFloat(totalYield.toFixed(1)),
      totalArea: parseFloat(totalArea.toFixed(1)),
      totalYieldCount
    };
  }, [chartData, yieldsData]);

  // Funkcja do generowania legendy kolorów upraw
  const renderCropLegend = () => {
    // Zbierz unikalne uprawy z danych
    const uniqueCrops = {};
    
    chartData.forEach(item => {
      if (item.crop && item.crop !== 'Brak uprawy') {
        const cropKey = item.crop.toLowerCase();
        if (!uniqueCrops[cropKey]) {
          uniqueCrops[cropKey] = {
            name: item.crop,
            color: item.color
          };
        }
      }
    });
    
    const cropEntries = Object.values(uniqueCrops);
    
    if (cropEntries.length === 0) {
      return null;
    }
    
    return (
      <div className="crop-legend">
        <div className="legend-title">Legenda upraw:</div>
        <div className="legend-colors">
          {cropEntries.map((crop, index) => (
            <div key={index} className="crop-legend-item">
              <span 
                className="crop-color-dot" 
                style={{ backgroundColor: crop.color }}
              ></span>
              <span className="crop-name">{crop.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="field-yield-tooltip">
          <p className="tooltip-field-name">{data.fieldName}</p>
          
          <div className="tooltip-crop-info">
            <span className="crop-color-dot" style={{ backgroundColor: data.color }}></span>
            <span className="crop-name">Uprawa: <strong>{data.crop}</strong></span>
          </div>
          
          <p className="tooltip-row">
            <span className="tooltip-label">Średnia wydajność:</span>
            <strong className={`tooltip-value ${data.hasYieldData ? 'has-data' : 'no-data'}`}>
              {data.yieldPerHa} t/ha
            </strong>
            
          </p>
          
          <p className="tooltip-row">
            <span className="tooltip-label">Powierzchnia:</span>
            <strong className="tooltip-value">{data.area} ha</strong>
          </p>
          
          {data.hasYieldData && (
            <>
              <p className="tooltip-row">
                <span className="tooltip-label">Liczba zbiorów:</span>
                <span className="tooltip-value">
                  {data.yieldCount} {data.yieldCount === 1 ? 'zbiór' : data.yieldCount < 5 ? 'zbiory' : 'zbiorów'}
                </span>
              </p>
              
              <p className="tooltip-row">
                <span className="tooltip-label">Łączny plon:</span>
                <strong className="tooltip-value">{data.totalYield} t</strong>
              </p>
              
              {data.moisture !== null && (
                <p className="tooltip-row">
                  <span className="tooltip-label">Śr. wilgotność:</span>
                  <span className="tooltip-value">{data.moisture}%</span>
                </p>
              )}
              
              <p className="tooltip-date">
                Ostatni zbiór: {data.date}
              </p>
            </>
          )}
          
          {!data.hasYieldData && (
            <p className="no-yield-warning">
              ⚠️ Brak danych o zbiorach dla tego pola
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="field-yield-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Ładowanie danych pól...</p>
        <p className="loading-subtext">
          Pobieranie {fieldsData.length} pól i {yieldsData.length} zbiorów...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="field-yield-error">
        <div className="error-icon">❌</div>
        <p className="error-title">Błąd ładowania danych</p>
        <p className="error-message">{error}</p>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="field-yield-header">
        <div className="header-right">
          <div className="stat-badge total-plon">
            <span className="stat-label">Łączny plon:</span>
            <strong className="stat-value">{stats.totalYield} t</strong>
          </div>
          
          <div className="stat-badge average-plon">
            <span className="stat-label">Średni plon:</span>
            <strong className="stat-value">{stats.overallAverageYield} t/ha</strong>
          </div>
        </div>
      </div>
      
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              horizontal={true}
              vertical={false}
              stroke="#f0f0f0"
            />
            
            <XAxis 
              type="number"
              tick={{ fontSize: 11, fill: '#888' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value} t/ha`}
              domain={[0, 'dataMax + 2']}
              label={{ 
                value: 'Średnia wydajność (t/ha)', 
                position: 'insideBottom', 
                offset: -5,
                fontSize: 11,
                fill: '#666'
              }}
            />
            
            <YAxis 
              type="category"
              dataKey="fieldName"
              tick={{ fontSize: 11, fill: '#555' }}
              axisLine={false}
              tickLine={false}
              width={100}
              // Naprawa: wyświetl wszystkie etykiety (nie co drugą)
              tickMargin={5}
              minTickGap={0}
              interval={0} // To kluczowe - wyświetla wszystkie etykiety
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Bar 
              dataKey="yieldPerHa" 
              name="Średnia wydajność"
              radius={[0, 4, 4, 0]}
              maxBarSize={35}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${entry.fieldId}`} 
                  fill={entry.hasYieldData ? entry.color : '#e0e0e0'}
                  stroke={entry.hasYieldData ? 'none' : '#ccc'}
                  strokeWidth={1}
                  strokeDasharray={entry.hasYieldData ? 'none' : '3 3'}
                  opacity={entry.hasYieldData ? 1 : 0.6}
                  className={entry.hasYieldData ? 'bar-with-data' : 'bar-no-data'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="chart-footer">
          {renderCropLegend()}
      </div>
    </>
  );
};

export default FieldYieldChart;