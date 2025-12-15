// src/hooks/useAnalytics.js
import { useState, useEffect, useMemo } from 'react'
import { 
  collection, 
  query, 
  orderBy, 
  getDocs 
} from 'firebase/firestore'
import { db } from '../config/firebase'

// Stałe dopasowane do Twojego useFinance
const COLLECTIONS = {
  TRANSACTIONS: 'finance_transactions',
  FIELDS: 'fields',
  ANIMALS: 'animals',
  WAREHOUSE: 'warehouse',
  GARAGE: 'garage',
  FIELD_YIELDS: 'field_yields',  
  FIELD_COSTS: 'field_costs'     
}

const ALERT_THRESHOLDS = {
  PROFIT_MARGIN_LOW: 15,
  FIELD_UTILIZATION_LOW: 80,
  LOW_STOCK_ALERT: 3
}

export const useAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({})
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(0)

  // Pobieranie danych (z cache 30s)
  useEffect(() => {
    const now = Date.now()
    if (now - lastFetch < 30000 && lastFetch !== 0) {
      return 
    }

    const fetchAllData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const collections = Object.values(COLLECTIONS)
        const dataPromises = collections.map(collectionName => 
          fetchCollectionData(collectionName)
        )

        const results = await Promise.allSettled(dataPromises)
        
        const collectedData = {}
        const collectionKeys = Object.keys(COLLECTIONS) // Klucze do mapowania wyników
        
        results.forEach((result, index) => {
          // Mapujemy nazwę kolekcji z Firebase na klucz w stanie data
          // np. 'finance_transactions' -> 'transactions'
          let key = Object.keys(COLLECTIONS).find(k => COLLECTIONS[k] === collections[index]).toLowerCase()
          if(key === 'transactions') key = 'transactions' // dla pewności
          
          if (result.status === 'fulfilled') {
            collectedData[key] = result.value
          } else {
            console.warn(`Warning fetching ${collections[index]}:`, result.reason)
            collectedData[key] = []
          }
        })
        
        // Mapowanie specyficznych kluczy jeśli automatyczne nie zadziałało idealnie
        collectedData.transactions = collectedData.finance_transactions || collectedData.transactions || []

        setData(collectedData)
        setLastFetch(Date.now())

      } catch (error) {
        console.error('Error fetching analytics data:', error)
        setError('Błąd podczas ładowania danych analitycznych')
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  const fetchCollectionData = async (collectionName) => {
    try {
      let collectionQuery
      // Sortowanie tylko dla transakcji, reszta domyślnie
      if (collectionName === COLLECTIONS.TRANSACTIONS) {
        collectionQuery = query(collection(db, collectionName), orderBy('date', 'desc'))
      } else {
        collectionQuery = query(collection(db, collectionName))
      }

      const snapshot = await getDocs(collectionQuery)
      return snapshot.docs.map(doc => {
        const docData = doc.data()
        
        // Bezpieczne parsowanie dat
        let dateFormatted = null
        try {
          if (docData.date?.toDate) {
            dateFormatted = docData.date.toDate()
          } else if (docData.date instanceof Timestamp) { // Import Timestamp z firebase/firestore
             dateFormatted = docData.date.toDate()
          } else if (docData.date) {
            dateFormatted = new Date(docData.date)
          }
        } catch (e) {
          console.warn('Date parsing warning:', e)
        }

        return {
          id: doc.id,
          ...docData,
          date: dateFormatted,
          amount: parseFloat(docData.amount) || 0 // Upewniamy się, że kwota to liczba
        }
      })
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error)
      return []
    }
  }

  // --- MEMOIZED ANALYTICS ---

  const financialAnalytics = useMemo(() => {
    const transactions = data.transactions || []
    
    const totalRevenue = calculateTotalAmount(transactions, 'income')
    const totalExpenses = calculateTotalAmount(transactions, 'expense')
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    return {
      kpis: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: parseFloat(profitMargin.toFixed(1)),
        // Miesięczne szacunki (średnia)
        monthlyExpenses: totalExpenses / 12 || 0 
      },
      // TUTAJ BYŁY PUSTE TABLICE - TERAZ SĄ WYPEŁNIONE:
      trends: generateRevenueTrends(transactions),
      costStructure: analyzeCostStructure(transactions),
      categoryPerformance: analyzeCategoryPerformance(transactions)
    }
  }, [data.transactions])

  const fieldAnalytics = useMemo(() => {
    const fields = data.fields || []
    const fieldYields = data.field_yields || [] 
    
    return {
      totalFields: fields.length,
      totalArea: fields.reduce((sum, f) => sum + (parseFloat(f.area) || 0), 0),
      productivity: analyzeFieldProductivity(fields, fieldYields),
      soilEfficiency: analyzeSoilEfficiency(fields)
    }
  }, [data.fields, data.field_yields])

  const animalAnalytics = useMemo(() => {
    const animals = data.animals || []
    const transactions = data.transactions || []
    
    return {
      totalAnimals: animals.length,
      health: { healthIndex: 95 }, // Placeholder - do rozbudowy jeśli masz statusy zdrowia
      costs: analyzeAnimalCosts(transactions, animals)
    }
  }, [data.animals, data.transactions])

  // Proste alerty
  const alerts = useMemo(() => {
    const newAlerts = []
    if (financialAnalytics.kpis.netProfit < 0) {
      newAlerts.push({ type: 'danger', priority: 'critical', title: 'Strata finansowa', message: 'Wydatki przewyższają przychody.' })
    }
    return newAlerts
  }, [financialAnalytics])

  return {
    loading,
    error,
    financialAnalytics,
    fieldAnalytics,
    animalAnalytics,
    warehouseAnalytics: { stockLevels: { lowStock: 0 } }, // Placeholder
    equipmentAnalytics: { maintenanceNeeded: 0 }, // Placeholder
    alerts,
    data // Przekazujemy surowe dane do tabel szczegółowych
  }
}

// --- FUNKCJE POMOCNICZE (UZUPEŁNIONE) ---

const calculateTotalAmount = (transactions, type) => {
  return transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + (t.amount || 0), 0)
}

// 1. Generowanie trendów (Wykres liniowy)
const generateRevenueTrends = (transactions) => {
  const trendsMap = {}
  
  // Grupuj transakcje z ostatnich 6-12 miesięcy
  transactions.forEach(t => {
    if (!t.date) return
    const monthKey = t.date.toISOString().slice(0, 7) // "2023-11"
    
    if (!trendsMap[monthKey]) {
      trendsMap[monthKey] = { month: monthKey, revenue: 0, expenses: 0 }
    }
    
    if (t.type === 'income') trendsMap[monthKey].revenue += t.amount
    if (t.type === 'expense') trendsMap[monthKey].expenses += t.amount
  })

  // Sortuj i zamień na tablicę
  return Object.values(trendsMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12) // Ostatnie 12 miesięcy
}

// 2. Struktura kosztów (Wykres kołowy)
const analyzeCostStructure = (transactions) => {
  const categories = {}
  const totalExpenses = calculateTotalAmount(transactions, 'expense')

  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const cat = t.category || 'Inne'
      categories[cat] = (categories[cat] || 0) + t.amount
    })

  return Object.entries(categories)
    .map(([category, amount]) => ({
      category: formatCategoryName(category), // Opcjonalnie formatowanie nazwy
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.amount - a.amount)
}

// 3. Wydajność kategorii (Listy top/bottom)
const analyzeCategoryPerformance = (transactions) => {
  const incomeCats = {}
  const expenseCats = {}

  transactions.forEach(t => {
    const cat = t.category || 'Inne'
    if (t.type === 'income') incomeCats[cat] = (incomeCats[cat] || 0) + t.amount
    else expenseCats[cat] = (expenseCats[cat] || 0) + t.amount
  })

  const formatList = (obj) => Object.entries(obj)
    .map(([category, amount]) => ({ category: formatCategoryName(category), amount }))
    .sort((a, b) => b.amount - a.amount)

  return {
    income: formatList(incomeCats),
    expenses: formatList(expenseCats)
  }
}

// Pozostałe funkcje z Twojego pliku (niezmienione logiki, tylko upewnienie się co do nazw)
const analyzeFieldProductivity = (fields, yields) => {
  return fields.map(f => ({
    name: f.name,
    crop: f.crop || 'Brak',
    area: f.area,
    efficiency: f.efficiency || 0 // Jeśli nie masz tego pola w bazie, zwróci 0
  }))
}

const analyzeSoilEfficiency = (fields) => {
  const groups = {}
  fields.forEach(f => {
    const s = f.soil || 'Nieznana'
    if(!groups[s]) groups[s] = { count: 0, area: 0 }
    groups[s].count++
    groups[s].area += (parseFloat(f.area) || 0)
  })
  return Object.entries(groups).map(([soil, d]) => ({
    soil,
    averageArea: d.area / d.count
  }))
}

const analyzeAnimalCosts = (transactions, animals) => {
  // Szukamy kosztów w transakcjach o kategoriach związanych ze zwierzętami
  const feedCosts = transactions
    .filter(t => t.type === 'expense' && (t.category === 'pasze' || t.category === 'supplies'))
    .reduce((sum, t) => sum + t.amount, 0)
    
  return {
    feedCosts,
    totalCosts: feedCosts, // Tu można dodać weterynarza itp.
    costPerAnimal: animals.length ? feedCosts / animals.length : 0
  }
}

// Helper do ładnych nazw kategorii (możesz go rozbudować)
const formatCategoryName = (key) => {
  const names = {
    'sprzedaz_plonow': 'Sprzedaż plonów',
    'paliwo': 'Paliwo',
    'nawozy_nasiona': 'Nawozy i nasiona',
    'zwierzeta': 'Zwierzęta',
    'maszyny': 'Maszyny'
  }
  return names[key] || key
}