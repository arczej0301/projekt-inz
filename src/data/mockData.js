// src/data/mockData.js
export const mockFinancialTrends = [
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

export const mockCostStructure = [
  { name: 'Pasze', value: 28500 },
  { name: 'Nawozy', value: 18700 },
  { name: 'Paliwo', value: 15400 },
  { name: 'Naprawy', value: 12300 },
  { name: 'Pracownicy', value: 38500 },
  { name: 'Leasing', value: 9800 },
  { name: 'Ubezpieczenie', value: 5600 },
  { name: 'Inne', value: 7200 },
];

export const mockProductivity = [
  { name: 'Pole A', efficiency: 85 },
  { name: 'Pole B', efficiency: 92 },
  { name: 'Pole C', efficiency: 78 },
  { name: 'Pole D', efficiency: 95 },
  { name: 'Pole E', efficiency: 88 },
  { name: 'Pole F', efficiency: 82 },
];

export const mockHealthData = {
  healthIndex: 87,
  commonIssues: [
    { issue: 'Choroby układu oddechowego', count: 3 },
    { issue: 'Problemy z racicami', count: 2 },
    { issue: 'Zapalenie wymienia', count: 1 },
    { issue: 'Biegunka u cieląt', count: 4 },
  ]
};

export const mockAlerts = [
  { 
    type: 'warning', 
    priority: 'high',
    title: 'Niski poziom paszy',
    message: 'Zapas paszy wystarczy tylko na 3 dni'
  },
  { 
    type: 'danger', 
    priority: 'medium',
    title: 'Awaria ciągnika',
    message: 'Ciągnik #3 wymaga pilnej naprawy'
  },
  { 
    type: 'info', 
    priority: 'low',
    title: 'Planowane szczepienia',
    message: 'Za 5 dni szczepienie przeciw BVD'
  },
];