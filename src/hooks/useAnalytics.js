// src/hooks/useAnalytics.js
import { useState, useEffect, useMemo } from 'react'
import {
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  Timestamp,
  limit
} from 'firebase/firestore'
import { db } from '../config/firebase'

const COLLECTIONS = {
  TRANSACTIONS: 'finance_transactions',
  FIELDS: 'fields',
  ANIMALS: 'animals',
  WAREHOUSE: 'warehouse',
  GARAGE: 'garage',
  FIELD_YIELDS: 'field_yields',
  FIELD_COSTS: 'field_costs',
  FIELD_STATUS: 'field_status' // 1. DODANO KOLEKCJĘ STATUSÓW
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

        results.forEach((result, index) => {
          // Mapowanie nazw kolekcji na klucze
          let key = Object.keys(COLLECTIONS).find(k => COLLECTIONS[k] === collections[index]).toLowerCase()
          
          // Specyficzne mapowania kluczy dla wygody
          if (key === 'finance_transactions') key = 'transactions'
          if (key === 'field_status') key = 'field_status' // Upewniamy się, że klucz jest poprawny

          if (result.status === 'fulfilled') {
            collectedData[key] = result.value
          } else {
            console.warn(`Warning fetching ${collections[index]}:`, result.reason)
            collectedData[key] = []
          }
        })

        // Fallbacki dla kluczy
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
        monthlyExpenses: totalExpenses / 12 || 0
      },
      trends: generateRevenueTrends(transactions),
      costStructure: analyzeCostStructure(transactions),
      categoryPerformance: analyzeCategoryPerformance(transactions)
    }
  }, [data.transactions])

  const fieldAnalytics = useMemo(() => {
    const fields = data.fields || []
    const fieldYields = data.field_yields || []
    const fieldCosts = data.field_costs || []
    const fieldStatuses = data.field_status || [] // 2. Pobieramy statusy

    // Logika Crop Performance (wklejona z poprzedniej odpowiedzi)
    const cropMap = {}
    fields.forEach(field => {
      const cropName = field.crop || 'Nieprzypisane'
      if (!cropMap[cropName]) {
        cropMap[cropName] = {
          name: cropName,
          totalArea: 0,
          totalYield: 0,
          totalCost: 0,
          fieldCount: 0,
          fields: [] 
        }
      }
      cropMap[cropName].totalArea += parseFloat(field.area) || 0
      cropMap[cropName].fieldCount += 1
      cropMap[cropName].fields.push(field.id)
    })

    fieldYields.forEach(yieldData => {
      const field = fields.find(f => f.id === yieldData.field_id)
      const cropName = yieldData.crop || (field ? field.crop : 'Nieprzypisane')
      if (cropMap[cropName]) {
        cropMap[cropName].totalYield += parseFloat(yieldData.amount) || 0
      }
    })

    fieldCosts.forEach(costData => {
      const field = fields.find(f => f.id === costData.field_id)
      if (field && field.crop && cropMap[field.crop]) {
         cropMap[field.crop].totalCost += parseFloat(costData.total_cost) || parseFloat(costData.amount) || 0
      }
    })

    const cropPerformance = Object.values(cropMap)
      .filter(c => c.totalArea > 0)
      .map(c => ({
        ...c,
        yieldPerHectare: c.totalYield / c.totalArea,
        costPerHectare: c.totalCost / c.totalArea,
        costPerTon: c.totalYield > 0 ? c.totalCost / c.totalYield : 0
      }))
      .sort((a, b) => b.totalArea - a.totalArea)

    return {
      totalFields: fields.length,
      totalArea: fields.reduce((sum, f) => sum + (parseFloat(f.area) || 0), 0),
      // 3. Przekazujemy fieldStatuses do funkcji analizującej
      productivity: analyzeFieldProductivity(fields, fieldYields, fieldStatuses),
      soilEfficiency: analyzeSoilEfficiency(fields),
      cropPerformance: cropPerformance
    }
  }, [data.fields, data.field_yields, data.field_costs, data.field_status])

  const animalAnalytics = useMemo(() => {
    const animals = data.animals || []
    const transactions = data.transactions || []
    return {
      totalAnimals: animals.length,
      health: { healthIndex: 95 }, 
      costs: analyzeAnimalCosts(transactions, animals)
    }
  }, [data.animals, data.transactions])

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
    warehouseAnalytics: { stockLevels: { lowStock: 0 } },
    equipmentAnalytics: { maintenanceNeeded: 0 },
    alerts,
    data 
  }
}

// --- FUNKCJE POMOCNICZE ---

const fetchCollectionData = async (collectionName) => {
  try {
    const q = query(collection(db, collectionName))
    const snapshot = await getDocs(q)
    
    if (!snapshot || !snapshot.docs) return []
    
    return snapshot.docs.map(doc => {
      const data = doc.data()
      // Proste formatowanie dat
      let formattedDate = null
      
      // Sprawdzamy różne pola daty (date, date_created, createdAt)
      const dateField = data.date || data.date_created || data.createdAt
      
      if (dateField) {
         if (dateField instanceof Timestamp) formattedDate = dateField.toDate()
         else if (dateField.toDate) formattedDate = dateField.toDate()
         else formattedDate = new Date(dateField)
      }

      return {
        id: doc.id,
        ...data,
        date: formattedDate
      }
    })
  } catch (error) {
    console.error(`Błąd pobierania kolekcji ${collectionName}:`, error)
    return []
  }
}

// 4. ZAKTUALIZOWANA FUNKCJA ANALIZY PÓL
const analyzeFieldProductivity = (fields, yields, statuses) => {
  return fields.map(f => {
    // a) Znajdź ostatni zbiór
    const fieldYields = yields.filter(y => y.field_id === f.id)
    const latestYield = fieldYields.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    
    // b) Znajdź ostatni status z kolekcji field_status
    const fieldStatuses = statuses.filter(s => s.field_id === f.id)
    const latestStatusObj = fieldStatuses.sort((a, b) => {
        const dateA = new Date(a.date_created || a.date || 0)
        const dateB = new Date(b.date_created || b.date || 0)
        return dateB - dateA
    })[0]

    // Priorytet: 1. Status z kolekcji field_status, 2. Status z dokumentu pola, 3. 'unknown'
    const finalStatus = latestStatusObj ? latestStatusObj.status : (f.status || 'unknown')

    const area = parseFloat(f.area) || 0
    const amount = latestYield ? (parseFloat(latestYield.amount) || 0) : 0

    return {
      id: f.id,
      name: f.name,
      crop: f.crop || 'Brak uprawy',
      area: area,
      soil: f.soil || f.soilType || 'Nieokreślona',
      status: finalStatus, // Tu mamy teraz poprawny status
      lastYieldDate: latestYield ? latestYield.date : null,
      lastYieldTotal: amount,
      lastYieldPerHectare: (latestYield && area > 0) ? (amount / area) : 0,
      efficiency: f.efficiency || 0 
    }
  })
}

// Pozostałe niezmienione funkcje pomocnicze...
const calculateTotalAmount = (transactions, type) => {
  return transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + (t.amount || 0), 0)
}

const generateRevenueTrends = (transactions) => {
  const trendsMap = {}
  transactions.forEach(t => {
    if (!t.date) return
    const monthKey = t.date.toISOString().slice(0, 7)
    if (!trendsMap[monthKey]) trendsMap[monthKey] = { month: monthKey, revenue: 0, expenses: 0 }
    if (t.type === 'income') trendsMap[monthKey].revenue += t.amount
    if (t.type === 'expense') trendsMap[monthKey].expenses += t.amount
  })
  return Object.values(trendsMap).sort((a, b) => a.month.localeCompare(b.month)).slice(-12)
}

const analyzeCostStructure = (transactions) => {
  const categories = {}
  const totalExpenses = calculateTotalAmount(transactions, 'expense')
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category || 'Inne'
    categories[cat] = (categories[cat] || 0) + t.amount
  })
  return Object.entries(categories).map(([category, amount]) => ({
    category, amount, percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
  })).sort((a, b) => b.amount - a.amount)
}

const analyzeCategoryPerformance = (transactions) => {
  const incomeCats = {}
  const expenseCats = {}
  transactions.forEach(t => {
    const cat = t.category || 'Inne'
    if (t.type === 'income') incomeCats[cat] = (incomeCats[cat] || 0) + t.amount
    else expenseCats[cat] = (expenseCats[cat] || 0) + t.amount
  })
  const formatList = (obj) => Object.entries(obj).map(([c, a]) => ({ category: c, amount: a })).sort((a, b) => b.amount - a.amount)
  return { income: formatList(incomeCats), expenses: formatList(expenseCats) }
}

const analyzeSoilEfficiency = (fields) => {
  const groups = {}
  fields.forEach(f => {
    const s = f.soil || 'Nieznana'
    if (!groups[s]) groups[s] = { count: 0, area: 0 }
    groups[s].count++
    groups[s].area += (parseFloat(f.area) || 0)
  })
  return Object.entries(groups).map(([soil, d]) => ({ soil, averageArea: d.area / d.count }))
}

const analyzeAnimalCosts = (transactions, animals) => {
  const feedCosts = transactions
    .filter(t => t.type === 'expense' && (t.category === 'pasze' || t.category === 'supplies'))
    .reduce((sum, t) => sum + t.amount, 0)
  return { feedCosts, totalCosts: feedCosts, costPerAnimal: animals.length ? feedCosts / animals.length : 0 }
}