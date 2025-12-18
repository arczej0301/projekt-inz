// utils/chartUtils.js

/**
 * Przygotowuje dane dla wykresów
 * @param {Array} data - Surowe dane
 * @returns {Array} - Dane przygotowane dla Recharts
 */
export const prepareChartData = (data) => {
  if (!data || !Array.isArray(data)) {
    console.warn('Invalid data passed to prepareChartData:', data);
    return [];
  }
  
  // Jeśli dane są już w dobrym formacie, zwróć je
  if (data.length > 0 && data[0].name && data[0].revenue !== undefined) {
    return data;
  }
  
  try {
    // Próba konwersji różnych formatów
    return data.map(item => {
      // Obsługa różnych formatów danych
      return {
        name: item.month || item.date?.substring(0, 7) || item.period || `Miesiąc ${Math.random().toString().substring(2, 5)}`,
        revenue: parseFloat(item.revenue || item.income || item.przychody || 0),
        expenses: parseFloat(item.expenses || item.costs || item.koszty || 0),
        revenueTrend: parseFloat(item.revenueTrend || item.trend || 0)
      };
    });
  } catch (error) {
    console.error('Error preparing chart data:', error);
    return [];
  }
};

/**
 * Generuje przykładowe dane do testów
 */
export const generateMockFinancialData = (months = 12) => {
  const monthNames = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
  const data = [];
  
  let baseRevenue = 40000;
  let baseExpenses = 25000;
  
  for (let i = 0; i < Math.min(months, monthNames.length); i++) {
    // Losowe wahania (+/- 20%)
    const revenue = baseRevenue + (Math.random() * 20000 - 10000);
    const expenses = baseExpenses + (Math.random() * 10000 - 5000);
    const trend = baseRevenue * 0.9; // Trend na poziomie 90% bazowego przychodu
    
    data.push({
      name: monthNames[i],
      revenue: Math.round(revenue),
      expenses: Math.round(expenses),
      revenueTrend: Math.round(trend)
    });
    
    // Stopniowy wzrost bazowych wartości
    baseRevenue *= 1.03; // 3% wzrost miesięcznie
    baseExpenses *= 1.02; // 2% wzrost miesięcznie
  }
  
  return data;
};

/**
 * Generuje przykładową strukturę kosztów
 */
export const generateMockCostStructure = () => {
  return [
    { name: 'Pasze', value: 28500 },
    { name: 'Nawozy', value: 18700 },
    { name: 'Paliwo', value: 15400 },
    { name: 'Naprawy', value: 12300 },
    { name: 'Pracownicy', value: 38500 },
    { name: 'Leasing', value: 9800 },
    { name: 'Ubezpieczenie', value: 5600 },
    { name: 'Inne', value: 7200 },
  ];
};