import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// DANE PRZYKŁADOWE - używaj gdy API nie zwraca danych
const fallbackData = [
  { name: 'Sty', revenue: 42000, expenses: 28000, revenueTrend: 41000 },
  { name: 'Lut', revenue: 52000, expenses: 32000, revenueTrend: 45000 },
  { name: 'Mar', revenue: 48000, expenses: 30000, revenueTrend: 47000 },
  { name: 'Kwi', revenue: 62000, expenses: 38000, revenueTrend: 52000 },
  { name: 'Maj', revenue: 71000, expenses: 42000, revenueTrend: 61000 },
  { name: 'Cze', revenue: 85000, expenses: 45000, revenueTrend: 75000 },
  { name: 'Lip', revenue: 92000, expenses: 50000, revenueTrend: 85000 },
  { name: 'Sie', revenue: 88000, expenses: 48000, revenueTrend: 82000 },
  { name: 'Wrz', revenue: 76000, expenses: 43000, revenueTrend: 72000 },
  { name: 'Paź', revenue: 68000, expenses: 39000, revenueTrend: 65000 },
  { name: 'Lis', revenue: 59000, expenses: 35000, revenueTrend: 58000 },
  { name: 'Gru', revenue: 95000, expenses: 52000, revenueTrend: 88000 },
];

// Prosta funkcja przygotowująca dane jeśli nie ma prepareChartData
const simplePrepareChartData = (data) => {
  if (!data || data.length === 0) {
    return fallbackData;
  }
  
  // Jeśli dane mają już dobrą strukturę
  if (data[0] && data[0].name && data[0].revenue !== undefined) {
    return data;
  }
  
  // Próba konwersji jeśli struktura jest inna
  try {
    return data.map(item => ({
      name: item.month || item.date || item.period || 'Miesiąc',
      revenue: item.revenue || item.income || item.przychody || 0,
      expenses: item.expenses || item.costs || item.koszty || 0,
      revenueTrend: item.revenueTrend || item.trend || 0
    }));
  } catch (error) {
    console.warn('Nie udało się przetworzyć danych, używam przykładowych');
    return fallbackData;
  }
};

const FinancialTrendChart = ({ data, formatCurrency }) => {
  // Bezpieczne formatowanie waluty
  const safeFormatCurrency = (value) => {
    if (formatCurrency) return formatCurrency(value);
    
    if (value === null || value === undefined || isNaN(value)) {
      return '0,00 zł';
    }
    
    const numValue = parseFloat(value);
    const formatted = numValue.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} zł`;
  };

  const chartData = useMemo(() => {
    console.log('Raw data received:', data);
    
    // Jeśli nie ma prepareChartData, użyj naszej prostej funkcji
    try {
      // Spróbuj zaimportować prepareChartData, ale nie crashuj jeśli nie istnieje
      const prepareChartData = require('../../utils/chartUtils').prepareChartData;
      if (prepareChartData) {
        const prepared = prepareChartData(data);
        return prepared && prepared.length > 0 ? prepared : fallbackData;
      }
    } catch (error) {
      console.log('prepareChartData nie dostępne, używam simplePrepareChartData');
    }
    
    // Użyj prostej funkcji
    return simplePrepareChartData(data);
  }, [data]);

  // Niestandardowy tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <p style={{ 
            fontWeight: '600', 
            marginBottom: '8px', 
            color: '#2c3e50',
            fontSize: '0.9rem'
          }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              color: entry.color || entry.stroke,
              marginBottom: '4px',
              fontSize: '0.85rem'
            }}>
              <span style={{ 
                display: 'inline-block',
                width: '10px',
                height: '10px',
                backgroundColor: entry.color || entry.stroke,
                borderRadius: '50%',
                marginRight: '8px'
              }}></span>
              {entry.name}: {safeFormatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        padding: '0 10px'
      }}>
        <h4 style={{ margin: 0, fontSize: '1rem', color: '#2c3e50' }}>
          Trend przychodów i kosztów
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#7f8c8d', 
            marginLeft: '10px',
            fontWeight: 'normal'
          }}>
            {data && data.length > 0 ? '(dane rzeczywiste)' : '(dane przykładowe)'}
          </span>
        </h4>
      </div>
      
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 11, fill: '#888' }}
            tickMargin={10}
            axisLine={false}
            tickLine={false}
          />
          
          <YAxis 
            tick={{ fontSize: 11, fill: '#888' }} 
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k zł`}
            axisLine={false}
            tickLine={false}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            verticalAlign="top" 
            height={36}
            iconSize={12}
            iconType="circle"
          />

          <Line 
            type="monotone" 
            dataKey="revenue" 
            name="Przychody" 
            stroke="#2ecc71" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
          />
          
          <Line 
            type="monotone" 
            dataKey="expenses" 
            name="Koszty" 
            stroke="#e74c3c" 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
          />
          
          <Line 
            type="linear" 
            dataKey="revenueTrend" 
            name="Trend" 
            stroke="#3498db" 
            strokeWidth={2} 
            strokeDasharray="5 5" 
            dot={false} 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FinancialTrendChart;