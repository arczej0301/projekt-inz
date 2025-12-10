// src/hooks/useAnalytics.js - POPRAWIONA WERSJA
import { useState, useEffect, useMemo } from 'react'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'

// Stałe i konfiguracja
const COLLECTIONS = {
  TRANSACTIONS: 'finance_transactions',
  FIELDS: 'fields',
  ANIMALS: 'animals',
  WAREHOUSE: 'warehouse',
  TASKS: 'tasks',
  GARAGE: 'garage',
  FIELD_STATUS: 'field_status',  // DODANE
  FIELD_YIELDS: 'field_yields',  // DODANE
  FIELD_COSTS: 'field_costs'     // DODANE
}

const ALERT_THRESHOLDS = {
  PROFIT_MARGIN_LOW: 15,
  PROFIT_MARGIN_HIGH: 25,
  COST_TO_REVENUE_RATIO: 1.1,
  FIELD_UTILIZATION_LOW: 80,
  FIELD_UTILIZATION_HIGH: 95,
  FIELD_EFFICIENCY_LOW: 60,
  ANIMAL_HEALTH_LOW: 85,
  ANIMAL_COST_PER_ANIMAL: 500,
  LOW_STOCK_ALERT: 3
}

// W useAnalytics.js ZMIEŃ:
export const useAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({})
  const [error, setError] = useState(null)
  const [lastFetch, setLastFetch] = useState(0) // DODAJ

  // Pobierz dane z wszystkich kolekcji
  useEffect(() => {
    // DODAJ: Pobieraj maksymalnie co 30 sekund
    const now = Date.now()
    if (now - lastFetch < 30000 && lastFetch !== 0) {
      return // Nie pobieraj jeśli było pobierane w ciągu ostatnich 30s
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
          const collectionName = collections[index]
          if (result.status === 'fulfilled') {
            collectedData[collectionName] = result.value
          } else {
            console.warn(`Warning fetching ${collectionName}:`, result.reason)
            collectedData[collectionName] = []
          }
        })

        setData(collectedData)
        setLastFetch(Date.now()) // ZAPISZ CZAS OSTATNIEGO POBRANIA

      } catch (error) {
        console.error('Error fetching analytics data:', error)
        setError('Błąd podczas ładowania danych analitycznych')
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, []) // USUŃ wszystkie zależności - pobierz tylko raz przy montowaniu

  // Helper do pobierania kolekcji
  const fetchCollectionData = async (collectionName) => {
    try {
      let collectionQuery
      if (collectionName === COLLECTIONS.TRANSACTIONS) {
        collectionQuery = query(collection(db, collectionName), orderBy('date', 'desc'))
      } else {
        collectionQuery = query(collection(db, collectionName))
      }

      const snapshot = await getDocs(collectionQuery)
      return snapshot.docs.map(doc => {
        const data = doc.data()
        // Poprawne formatowanie daty
        let dateFormatted = null
        try {
          if (data.date && data.date.toDate) {
            dateFormatted = data.date.toDate()
          } else if (data.date && data.date.seconds) {
            dateFormatted = new Date(data.date.seconds * 1000)
          } else if (data.date) {
            dateFormatted = new Date(data.date)
          }
          
          // Również dla innych pól z datą
          if (data.createdAt && data.createdAt.toDate) {
            data.createdAt = data.createdAt.toDate()
          }
          if (data.updatedAt && data.updatedAt.toDate) {
            data.updatedAt = data.updatedAt.toDate()
          }
        } catch (e) {
          console.warn('Date parsing error:', e)
        }

        return {
          id: doc.id,
          ...data,
          date: dateFormatted
        }
      })
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error)
      return []
    }
  }

  // Analiza finansowa - POPRAWIONA
  const financialAnalytics = useMemo(() => {
    const transactions = data.transactions || []
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    
    const yearlyTransactions = transactions.filter(t => {
      if (!t.date) return false
      try {
        const transactionDate = t.date instanceof Date ? t.date : new Date(t.date)
        return transactionDate.getFullYear() === currentYear
      } catch {
        return false
      }
    })

    const monthlyTransactions = yearlyTransactions.filter(t => {
      try {
        const transactionDate = t.date instanceof Date ? t.date : new Date(t.date)
        return transactionDate.getMonth() === currentMonth
      } catch {
        return false
      }
    })

    const totalRevenue = calculateTotalAmount(yearlyTransactions, 'income')
    const totalExpenses = calculateTotalAmount(yearlyTransactions, 'expense')
    const monthlyRevenue = calculateTotalAmount(monthlyTransactions, 'income')
    const monthlyExpenses = calculateTotalAmount(monthlyTransactions, 'expense')
    
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    return {
      kpis: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: Math.round(profitMargin * 10) / 10, // 1 miejsce po przecinku
        monthlyRevenue,
        monthlyExpenses,
        monthlyBalance: monthlyRevenue - monthlyExpenses
      },
      trends: generateRevenueTrends(transactions),
      costStructure: analyzeCostStructure(transactions),
      categoryPerformance: analyzeCategoryPerformance(transactions)
    }
  }, [data.transactions])

  // Analiza produktywności pól - POPRAWIONA (używa rzeczywistych danych)
  const fieldAnalytics = useMemo(() => {
    const fields = data.fields || []
    const fieldStatus = data.fieldStatus || []
    const fieldYields = data.fieldYields || []
    const fieldCosts = data.fieldCosts || []
    
    return {
      totalFields: fields.length,
      totalArea: calculateTotalArea(fields),
      activeCrops: countActiveCrops(fields),
      productivity: analyzeFieldProductivity(fields, fieldYields),
      soilEfficiency: analyzeSoilEfficiency(fields),
      cropPerformance: analyzeCropPerformance(fields, fieldYields),
      fieldUtilization: analyzeFieldUtilization(fields)
    }
  }, [data.fields, data.fieldStatus, data.fieldYields, data.fieldCosts])

  // Analiza zwierząt - POPRAWIONA (używa rzeczywistych danych)
  const animalAnalytics = useMemo(() => {
    const animals = data.animals || []
    const transactions = data.transactions || []
    
    return {
      totalAnimals: animals.length,
      byType: groupAnimalsByType(animals),
      health: analyzeAnimalHealth(animals),
      costs: analyzeAnimalCosts(transactions, animals)
    }
  }, [data.animals, data.transactions])

  // Analiza magazynu
  const warehouseAnalytics = useMemo(() => {
    const warehouse = data.warehouse || []
    
    return {
      inventoryValue: calculateInventoryValue(warehouse),
      turnover: analyzeInventoryTurnover(warehouse),
      stockLevels: analyzeStockLevels(warehouse),
      lowStock: warehouse.filter(item => {
        const quantity = parseFloat(item.quantity) || 0
        const minStock = parseFloat(item.minStock) || 0
        return quantity <= minStock
      }).length
    }
  }, [data.warehouse])

  // Analiza sprzętu
  const equipmentAnalytics = useMemo(() => {
    const garage = data.garage || []
    
    return {
      totalEquipment: garage.length,
      byStatus: groupEquipmentByStatus(garage),
      maintenanceNeeded: garage.filter(item => {
        return item.status === 'maintenance' || item.status === 'needs_service'
      }).length
    }
  }, [data.garage])

  // Alerty i rekomendacje
  const alerts = useMemo(() => {
    return generateAlerts(financialAnalytics, fieldAnalytics, animalAnalytics, warehouseAnalytics)
  }, [financialAnalytics, fieldAnalytics, animalAnalytics, warehouseAnalytics])

  return {
    loading,
    error,
    data,
    financialAnalytics,
    fieldAnalytics,
    animalAnalytics,
    warehouseAnalytics,
    equipmentAnalytics,
    alerts
  }
}

// ================== POMOCNICZE FUNKCJE - POPRAWIONE ==================

const calculateTotalAmount = (transactions, type) => {
  return transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
}

const calculateTotalArea = (fields) => {
  if (!fields || !Array.isArray(fields)) return 0
  return fields.reduce((sum, field) => {
    const area = parseFloat(field.area) || 0
    return sum + area
  }, 0)
}

const countActiveCrops = (fields) => {
  if (!fields) return 0
  const crops = new Set()
  fields.forEach(field => {
    if (field.crop && field.crop !== 'Brak' && field.crop !== 'unknown') {
      crops.add(field.crop)
    }
  })
  return crops.size
}

// Poprawione: Rzeczywista analiza pól
const analyzeFieldProductivity = (fields, yields) => {
  if (!fields.length) return []
  
  return fields.map(field => {
    const fieldYields = yields.filter(y => y.field_id === field.id)
    const totalYield = fieldYields.reduce((sum, y) => sum + (parseFloat(y.yield_amount) || 0), 0)
    const area = parseFloat(field.area) || 1 // zabezpieczenie przed dzieleniem przez 0
    
    return {
      name: field.name || 'Brak nazwy',
      area: area,
      crop: field.crop || 'Brak',
      soil: field.soil || 'Nieokreślony',
      yieldPerHectare: area > 0 ? totalYield / area : 0,
      yieldCount: fieldYields.length
    }
  })
}

const analyzeSoilEfficiency = (fields) => {
  const soilData = {}
  
  fields.forEach(field => {
    const soil = field.soil || 'unknown'
    if (!soilData[soil]) {
      soilData[soil] = { totalArea: 0, count: 0 }
    }
    soilData[soil].totalArea += parseFloat(field.area) || 0
    soilData[soil].count += 1
  })
  
  return Object.entries(soilData).map(([soil, data]) => ({
    soil,
    totalArea: data.totalArea,
    fieldCount: data.count,
    averageArea: data.totalArea / data.count
  }))
}

const analyzeCropPerformance = (fields, yields) => {
  const cropData = {}
  
  fields.forEach(field => {
    const crop = field.crop || 'unknown'
    if (!cropData[crop]) {
      cropData[crop] = { totalArea: 0, count: 0, totalYield: 0 }
    }
    cropData[crop].totalArea += parseFloat(field.area) || 0
    cropData[crop].count += 1
    
    // Dodaj zbiory dla tego pola
    const fieldYields = yields.filter(y => y.field_id === field.id)
    const fieldTotalYield = fieldYields.reduce((sum, y) => sum + (parseFloat(y.yield_amount) || 0), 0)
    cropData[crop].totalYield += fieldTotalYield
  })
  
  return Object.entries(cropData).map(([crop, data]) => ({
    crop,
    totalArea: data.totalArea,
    fieldCount: data.count,
    totalYield: data.totalYield,
    yieldPerHectare: data.totalArea > 0 ? data.totalYield / data.totalArea : 0
  }))
}

const analyzeFieldUtilization = (fields) => {
  if (!fields.length) {
    return {
      totalArea: 0,
      utilizedArea: 0,
      utilizationRate: 0,
      unusedArea: 0
    }
  }
  
  const totalArea = calculateTotalArea(fields)
  const utilizedArea = fields
    .filter(field => field.crop && field.crop !== 'Brak' && field.crop !== 'unknown')
    .reduce((sum, field) => sum + (parseFloat(field.area) || 0), 0)
  
  return {
    totalArea,
    utilizedArea,
    utilizationRate: totalArea > 0 ? (utilizedArea / totalArea) * 100 : 0,
    unusedArea: totalArea - utilizedArea
  }
}

// Poprawione: Rzeczywista analiza zwierząt
const groupAnimalsByType = (animals) => {
  const types = {}
  animals.forEach(animal => {
    const type = animal.type || animal.species || 'unknown'
    types[type] = (types[type] || 0) + 1
  })
  return types
}

const analyzeAnimalHealth = (animals) => {
  // Jeśli masz dane zdrowotne w animals, dodaj je tutaj
  // Na razie symulacja na podstawie statusu
  const healthy = animals.filter(a => a.status === 'healthy' || a.health_status === 'good').length
  const total = animals.length || 1
  
  return {
    healthIndex: Math.round((healthy / total) * 100),
    totalAnimals: total,
    healthyCount: healthy,
    needsAttention: total - healthy
  }
}

const analyzeAnimalCosts = (transactions, animals) => {
  const feedCosts = transactions
    .filter(t => t.category === 'pasze' || t.category === 'zwierzeta')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  
  const vetCosts = transactions
    .filter(t => t.description?.toLowerCase().includes('weterynarz') || 
                t.category === 'naprawy_konserwacja')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  
  const totalAnimals = animals.length || 1
  
  return {
    feedCosts,
    vetCosts,
    totalCosts: feedCosts + vetCosts,
    costPerAnimal: totalAnimals > 0 ? (feedCosts + vetCosts) / totalAnimals : 0
  }
}

const calculateInventoryValue = (warehouse) => {
  return warehouse.reduce((total, item) => {
    const quantity = parseFloat(item.quantity) || 0
    const price = parseFloat(item.price) || 0
    return total + (quantity * price)
  }, 0)
}

const analyzeInventoryTurnover = (warehouse) => {
  // Symplifikacja - w rzeczywistości potrzebujesz danych sprzedaży
  const totalValue = calculateInventoryValue(warehouse)
  const itemCount = warehouse.length
  
  return {
    totalValue,
    itemCount,
    averageValuePerItem: itemCount > 0 ? totalValue / itemCount : 0
  }
}

const analyzeStockLevels = (warehouse) => {
  const lowStock = warehouse.filter(item => {
    const quantity = parseFloat(item.quantity) || 0
    const minStock = parseFloat(item.minStock) || 0
    return quantity <= minStock
  })
  
  return {
    lowStock: lowStock.length,
    lowStockItems: lowStock.map(item => item.name),
    totalItems: warehouse.length
  }
}

const groupEquipmentByStatus = (garage) => {
  const statuses = {}
  garage.forEach(item => {
    const status = item.status || 'unknown'
    statuses[status] = (statuses[status] || 0) + 1
  })
  return statuses
}

// Pozostałe funkcje pozostają podobne ale bez losowości
const generateRevenueTrends = (transactions) => {
  // Implementacja jak wcześniej, ale bez fikcyjnych danych
  return [] // Tymczasowo puste
}

const analyzeCostStructure = (transactions) => {
  // Implementacja jak wcześniej
  return []
}

const analyzeCategoryPerformance = (transactions) => {
  // Implementacja jak wcześniej
  return { income: [], expenses: [] }
}

const generateAlerts = (financial, fields, animals, warehouse) => {
  const alerts = []
  
  // Rzeczywiste alerty finansowe
  if (financial.kpis && financial.kpis.profitMargin < ALERT_THRESHOLDS.PROFIT_MARGIN_LOW) {
    alerts.push({
      type: 'warning',
      title: 'Niska marża zysku',
      message: `Marża zysku wynosi ${financial.kpis.profitMargin.toFixed(1)}%.`,
      priority: 'high'
    })
  }
  
  // Rzeczywiste alerty pól
  if (fields.fieldUtilization && fields.fieldUtilization.utilizationRate < 50) {
    alerts.push({
      type: 'warning',
      title: 'Niskie wykorzystanie pól',
      message: `Tylko ${fields.fieldUtilization.utilizationRate.toFixed(1)}% pól jest uprawianych.`,
      priority: 'medium'
    })
  }
  
  // Rzeczywiste alerty magazynu
  if (warehouse.stockLevels && warehouse.stockLevels.lowStock > 0) {
    alerts.push({
      type: 'warning',
      title: 'Niski stan magazynowy',
      message: `${warehouse.stockLevels.lowStock} produktów wymaga uzupełnienia.`,
      priority: 'medium'
    })
  }
  
  return alerts
}

export default useAnalytics