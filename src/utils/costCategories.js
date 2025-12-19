// utils/costCategories.js
export const COST_CATEGORIES = {
  // Główne kategorie
  'zwierzeta': {
    name: 'Zwierzęta',
    color: '#795548',
    icon: '🐄',
    subcategories: ['zakup_zwierzat', 'leczenia', 'pasze', 'opieka'],
    modules: ['animals', 'warehouse']
  },
  'maszyny': {
    name: 'Maszyny i sprzęt',
    color: '#607d8b',
    icon: '🚜',
    subcategories: ['zakup_maszyn', 'czesci', 'sprzet'],
    modules: ['garage', 'finance']
  },
  'zboza': {
    name: 'Plony',
    color: '#4caf50',
    icon: '🌾',
    subcategories: ['zakup_nasion', 'sadzonki'],
    modules: ['fields', 'warehouse']
  },
  'nawozy_nasiona': {
    name: 'Nawozy i nasiona',
    color: '#8bc34a',
    icon: '🌱',
    subcategories: ['nawozy', 'nasiona', 'srodki_ochrony'],
    modules: ['fields', 'warehouse']
  },
  'pasze': {
    name: 'Pasza',
    color: '#ff9800',
    icon: '🌿',
    subcategories: ['pasze_baza', 'dodatki', 'suplementy'],
    modules: ['animals', 'warehouse']
  },
  'paliwo': {
    name: 'Paliwo',
    color: '#f44336',
    icon: '⛽',
    subcategories: ['olej_napedowy', 'benzyna', 'olej_silnikowy'],
    modules: ['garage', 'finance']
  },
  'sprzet_czesci': {
    name: 'Narzędzia i części',
    color: '#ff5722',
    icon: '🛠️',
    subcategories: ['narzedzia', 'czesci_zamienne', 'akcesoria'],
    modules: ['garage', 'warehouse']
  },
  'naprawa_konserwacja': {
    name: 'Naprawa i konserwacja',
    color: '#3f51b5',
    icon: '🔧',
    subcategories: ['naprawy', 'przeglady', 'serwis'],
    modules: ['garage', 'fields']
  },
  'inne_koszty': {
    name: 'Inne koszty',
    color: '#e91e63',
    icon: '📉',
    subcategories: ['administracja', 'prace_zlecone', 'uslugi'],
    modules: ['finance']
  },
  'podatki_oplaty': {
    name: 'Podatki i opłaty',
    color: '#9c27b0',
    icon: '🏛️',
    subcategories: ['podatki', 'oplaty', 'skladki'],
    modules: ['finance']
  }
}

// Funkcja pomocnicza do tłumaczenia kategorii
export const translateCategory = (categoryKey) => {
  return COST_CATEGORIES[categoryKey]?.name || categoryKey
}

// Pobierz ikonę dla kategorii
export const getCategoryIcon = (categoryKey) => {
  return COST_CATEGORIES[categoryKey]?.icon || '💰'
}

// Pobierz kolor dla kategorii
export const getCategoryColor = (categoryKey) => {
  return COST_CATEGORIES[categoryKey]?.color || '#95a5a6'
}