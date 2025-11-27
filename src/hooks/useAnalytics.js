// hooks/useAnalytics.js
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

export const useAnalytics = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({})
  const [error, setError] = useState(null)

  // Pobierz dane z wszystkich kolekcji
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true)
        
        // Pobierz transakcje finansowe
        const transactionsQuery = query(
          collection(db, 'finance_transactions'),
          orderBy('date', 'desc')
        )
        const transactionsSnapshot = await getDocs(transactionsQuery)
        const transactions = transactionsSnapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate?.() || data.date
          }
        })

        // Pobierz dane pól
        const fieldsQuery = query(collection(db, 'fields'))
        const fieldsSnapshot = await getDocs(fieldsQuery)
        const fields = fieldsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Pobierz dane zwierząt
        const animalsQuery = query(collection(db, 'animals'))
        const animalsSnapshot = await getDocs(animalsQuery)
        const animals = animalsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Pobierz dane magazynu
        const warehouseQuery = query(collection(db, 'warehouse'))
        const warehouseSnapshot = await getDocs(warehouseQuery)
        const warehouse = warehouseSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Pobierz dane zadań
        const tasksQuery = query(collection(db, 'tasks'))
        const tasksSnapshot = await getDocs(tasksQuery)
        const tasks = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        // Pobierz dane garażu
        const garageQuery = query(collection(db, 'garage'))
        const garageSnapshot = await getDocs(garageQuery)
        const garage = garageSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

        setData({
          transactions,
          fields,
          animals: animals || [],
          warehouse,
          tasks,
          garage
        })

      } catch (error) {
        console.error('Error fetching analytics data:', error)
        setError('Błąd podczas ładowania danych analitycznych')
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  // Analiza finansowa
  const financialAnalytics = useMemo(() => {
    const currentYear = new Date().getFullYear()
    
    const yearlyTransactions = data.transactions?.filter(t => {
      if (!t.date) return false
      const transactionDate = t.date?.toDate ? t.date.toDate() : new Date(t.date)
      return transactionDate.getFullYear() === currentYear
    }) || []

    const monthlyTransactions = yearlyTransactions.filter(t => {
      const transactionDate = t.date?.toDate ? t.date.toDate() : new Date(t.date)
      return transactionDate.getMonth() === new Date().getMonth()
    })

    const totalRevenue = yearlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

    const totalExpenses = yearlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

    const monthlyRevenue = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    return {
      kpis: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        monthlyRevenue,
        monthlyExpenses
      },
      trends: generateRevenueTrends(data.transactions || []),
      costStructure: analyzeCostStructure(data.transactions || []),
      categoryPerformance: analyzeCategoryPerformance(data.transactions || [])
    }
  }, [data.transactions])

  // Analiza produktywności pól
  const fieldAnalytics = useMemo(() => {
    const fields = data.fields || []
    
    return {
      totalFields: fields.length,
      totalArea: fields.reduce((sum, field) => sum + (parseFloat(field.area) || 0), 0),
      productivity: analyzeFieldProductivity(fields),
      soilEfficiency: analyzeSoilEfficiency(fields),
      cropPerformance: analyzeCropPerformance(fields),
      fieldUtilization: analyzeFieldUtilization(fields)
    }
  }, [data.fields])

  // Analiza zwierząt
  const animalAnalytics = useMemo(() => {
    const animals = data.animals || []
    
    return {
      totalAnimals: animals.length,
      productivity: analyzeAnimalProductivity(animals, data.transactions || []),
      health: analyzeAnimalHealth(animals),
      costs: analyzeAnimalCosts(data.transactions || [], animals)
    }
  }, [data.animals, data.transactions])

  // Analiza magazynu
  const warehouseAnalytics = useMemo(() => {
    const warehouse = data.warehouse || []
    
    return {
      inventoryValue: calculateInventoryValue(warehouse),
      turnover: analyzeInventoryTurnover(warehouse),
      stockLevels: analyzeStockLevels(warehouse)
    }
  }, [data.warehouse])

  // Analiza sprzętu
  const equipmentAnalytics = useMemo(() => {
    const garage = data.garage || []
    
    return {
      totalEquipment: garage.length,
      utilization: analyzeEquipmentUtilization(garage),
      maintenance: analyzeMaintenanceCosts(data.transactions || [])
    }
  }, [data.garage, data.transactions])

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

// Funkcje pomocnicze do analizy danych
const generateRevenueTrends = (transactions) => {
  const monthlyData = {}
  
  transactions.forEach(transaction => {
    if (!transaction.date) return
    
    const transactionDate = transaction.date?.toDate ? transaction.date.toDate() : new Date(transaction.date)
    const monthKey = `${transactionDate.getFullYear()}-${(transactionDate.getMonth() + 1).toString().padStart(2, '0')}`
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { revenue: 0, expenses: 0 }
    }
    
    if (transaction.type === 'income') {
      monthlyData[monthKey].revenue += parseFloat(transaction.amount) || 0
    } else {
      monthlyData[monthKey].expenses += parseFloat(transaction.amount) || 0
    }
  })
  
  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12) // Ostatnie 12 miesięcy
    .map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.revenue - data.expenses
    }))
}

const analyzeCostStructure = (transactions) => {
  const costsByCategory = {}
  
  transactions
    .filter(t => t.type === 'expense')
    .forEach(transaction => {
      const category = transaction.category || 'other'
      if (!costsByCategory[category]) {
        costsByCategory[category] = 0
      }
      costsByCategory[category] += parseFloat(transaction.amount) || 0
    })
  
  return Object.entries(costsByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)
}

const analyzeCategoryPerformance = (transactions) => {
  const incomeByCategory = {}
  const expensesByCategory = {}
  
  transactions.forEach(transaction => {
    const category = transaction.category || 'other'
    const amount = parseFloat(transaction.amount) || 0
    
    if (transaction.type === 'income') {
      if (!incomeByCategory[category]) {
        incomeByCategory[category] = 0
      }
      incomeByCategory[category] += amount
    } else {
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0
      }
      expensesByCategory[category] += amount
    }
  })
  
  return {
    income: Object.entries(incomeByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount),
    expenses: Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }
}

const analyzeFieldProductivity = (fields) => {
  if (!fields.length) return []
  
  return fields.map(field => ({
    name: field.name || 'Brak nazwy',
    area: parseFloat(field.area) || 0,
    crop: field.crop || 'Brak',
    soil: field.soil || 'Nieokreślony',
    efficiency: calculateFieldEfficiency(field)
  }))
}

const calculateFieldEfficiency = (field) => {
  // Symulacja obliczania efektywności - zastąp prawdziwymi danymi
  const baseEfficiency = 70 // Podstawowa efektywność
  const soilBonus = {
    'gliniasta': 15,
    'ilasta': 10,
    'mada': 12,
    'piaszczysta': -5,
    'torfowa': 8
  }
  
  const bonus = soilBonus[field.soil] || 0
  return Math.min(baseEfficiency + bonus + (Math.random() * 20 - 10), 100)
}

const analyzeSoilEfficiency = (fields) => {
  const soilData = {}
  
  fields.forEach(field => {
    const soil = field.soil || 'unknown'
    if (!soilData[soil]) {
      soilData[soil] = { totalArea: 0, count: 0, totalEfficiency: 0 }
    }
    soilData[soil].totalArea += parseFloat(field.area) || 0
    soilData[soil].count += 1
    soilData[soil].totalEfficiency += calculateFieldEfficiency(field)
  })
  
  return Object.entries(soilData).map(([soil, data]) => ({
    soil,
    totalArea: data.totalArea,
    averageArea: data.totalArea / data.count,
    averageEfficiency: data.totalEfficiency / data.count
  }))
}

const analyzeCropPerformance = (fields) => {
  const cropData = {}
  
  fields.forEach(field => {
    const crop = field.crop || 'unknown'
    if (!cropData[crop]) {
      cropData[crop] = { totalArea: 0, count: 0, totalEfficiency: 0 }
    }
    cropData[crop].totalArea += parseFloat(field.area) || 0
    cropData[crop].count += 1
    cropData[crop].totalEfficiency += calculateFieldEfficiency(field)
  })
  
  return Object.entries(cropData).map(([crop, data]) => ({
    crop,
    totalArea: data.totalArea,
    fieldCount: data.count,
    averageEfficiency: data.totalEfficiency / data.count
  }))
}

const analyzeFieldUtilization = (fields) => {
  const totalArea = fields.reduce((sum, field) => sum + (parseFloat(field.area) || 0), 0)
  const utilizedArea = fields.filter(field => field.crop && field.crop !== 'Brak')
    .reduce((sum, field) => sum + (parseFloat(field.area) || 0), 0)
  
  return {
    totalArea,
    utilizedArea,
    utilizationRate: totalArea > 0 ? (utilizedArea / totalArea) * 100 : 0,
    unusedArea: totalArea - utilizedArea
  }
}

const analyzeAnimalProductivity = (animals, transactions) => {
  // Symulacja danych - zastąp prawdziwymi danymi z bazy
  const milkTransactions = transactions.filter(t => 
    t.category === 'animal_products' && t.description?.includes('mleko')
  )
  
  const totalMilkRevenue = milkTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  
  return {
    milkYield: {
      dailyAverage: 24.5,
      monthlyTotal: 7350,
      revenue: totalMilkRevenue,
      trend: 2.3
    },
    reproduction: {
      pregnancyRate: 78.3,
      successRate: 85.6,
      averageCalvingInterval: 385
    },
    growth: {
      averageDailyGain: 1.2,
      feedConversionRatio: 2.8
    }
  }
}

const analyzeAnimalHealth = (animals) => {
  // Symulacja danych zdrowotnych
  return {
    healthIndex: 92.5,
    commonIssues: [
      { issue: 'Mastitis', count: 12, trend: -5 },
      { issue: 'Kulawizny', count: 8, trend: 2 },
      { issue: 'Problemy metaboliczne', count: 5, trend: 0 },
      { issue: 'Problemy rozrodcze', count: 3, trend: -1 }
    ],
    vaccinationRate: 95.2,
    treatmentCosts: 12500
  }
}

const analyzeAnimalCosts = (transactions, animals) => {
  const feedCosts = transactions
    .filter(t => t.category === 'animal_feed')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  
  const vetCosts = transactions
    .filter(t => t.category === 'maintenance' && t.description?.toLowerCase().includes('weterynarz'))
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  
  const totalAnimals = animals.length || 1 // Zabezpieczenie przed dzieleniem przez zero
  
  return {
    feedCosts,
    vetCosts,
    totalCosts: feedCosts + vetCosts,
    costPerAnimal: totalAnimals > 0 ? (feedCosts + vetCosts) / totalAnimals : 0,
    feedCostPerAnimal: totalAnimals > 0 ? feedCosts / totalAnimals : 0
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
  // Symulacja wskaźników rotacji
  const categories = {}
  
  warehouse.forEach(item => {
    const category = item.category || 'other'
    if (!categories[category]) {
      categories[category] = { items: 0, value: 0 }
    }
    categories[category].items++
    categories[category].value += (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0)
  })
  
  return Object.entries(categories).map(([category, data]) => ({
    category,
    itemCount: data.items,
    totalValue: data.value,
    turnoverRate: Math.random() * 12 // Rotacja na rok
  }))
}

const analyzeStockLevels = (warehouse) => {
  const lowStock = warehouse.filter(item => {
    const quantity = parseFloat(item.quantity) || 0
    const minStock = parseFloat(item.minStock) || 0
    return quantity <= minStock
  })
  
  const overStock = warehouse.filter(item => {
    const quantity = parseFloat(item.quantity) || 0
    const maxStock = parseFloat(item.maxStock) || Infinity
    return quantity > maxStock * 1.5
  })
  
  return {
    lowStock: lowStock.length,
    overStock: overStock.length,
    optimalStock: warehouse.length - lowStock.length - overStock.length,
    lowStockItems: lowStock.map(item => item.name),
    overStockItems: overStock.map(item => item.name)
  }
}

const analyzeEquipmentUtilization = (garage) => {
  if (!garage.length) return {}
  
  const totalEquipment = garage.length
  const activeEquipment = garage.filter(item => item.status === 'active').length
  const underMaintenance = garage.filter(item => item.status === 'maintenance').length
  
  return {
    totalEquipment,
    activeEquipment,
    underMaintenance,
    utilizationRate: totalEquipment > 0 ? (activeEquipment / totalEquipment) * 100 : 0,
    maintenanceRate: totalEquipment > 0 ? (underMaintenance / totalEquipment) * 100 : 0
  }
}

const analyzeMaintenanceCosts = (transactions) => {
  const maintenanceCosts = transactions
    .filter(t => t.category === 'maintenance')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  
  const fuelCosts = transactions
    .filter(t => t.category === 'fuel')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
  
  return {
    maintenanceCosts,
    fuelCosts,
    totalEquipmentCosts: maintenanceCosts + fuelCosts,
    monthlyAverage: (maintenanceCosts + fuelCosts) / 12
  }
}

const generateAlerts = (financial, fields, animals, warehouse) => {
  const alerts = []
  
  // Alerty finansowe
  if (financial.kpis.profitMargin < 15) {
    alerts.push({
      type: 'warning',
      title: 'Niska marża zysku',
      message: `Marża zysku wynosi ${financial.kpis.profitMargin.toFixed(1)}%. Rozważ redukcję kosztów lub zwiększenie przychodów.`,
      priority: 'high',
      category: 'financial'
    })
  }
  
  if (financial.kpis.monthlyExpenses > financial.kpis.monthlyRevenue * 1.1) {
    alerts.push({
      type: 'danger',
      title: 'Wysokie koszty operacyjne',
      message: 'Koszty przekraczają przychody o ponad 10%. Wymagana natychmiastowa interwencja.',
      priority: 'critical',
      category: 'financial'
    })
  }
  
  // Alerty produkcyjne - pola
  if (fields.fieldUtilization && fields.fieldUtilization.utilizationRate < 80) {
    alerts.push({
      type: 'warning',
      title: 'Niskie wykorzystanie pól',
      message: `Tylko ${fields.fieldUtilization.utilizationRate.toFixed(1)}% powierzchni jest wykorzystywane. Rozważ dodatkowe uprawy.`,
      priority: 'medium',
      category: 'production'
    })
  }
  
  const lowEfficiencyFields = fields.productivity.filter(f => f.efficiency < 60)
  if (lowEfficiencyFields.length > 0) {
    alerts.push({
      type: 'warning',
      title: 'Niska wydajność pól',
      message: `${lowEfficiencyFields.length} pole(a) ma wydajność poniżej 60%. Sprawdź stan gleby i nawożenie.`,
      priority: 'medium',
      category: 'production'
    })
  }
  
  // Alerty zwierzęce
  if (animals.health && animals.health.healthIndex < 85) {
    alerts.push({
      type: 'warning',
      title: 'Obniżony wskaźnik zdrowia stada',
      message: `Wskaźnik zdrowia stada: ${animals.health.healthIndex}%. Wymagana kontrola weterynaryjna.`,
      priority: 'high',
      category: 'animals'
    })
  }
  
  if (animals.costs && animals.costs.costPerAnimal > 500) {
    alerts.push({
      type: 'warning',
      title: 'Wysokie koszty utrzymania zwierząt',
      message: `Koszt utrzymania na zwierzę: ${animals.costs.costPerAnimal.toFixed(2)} zł. Sprawdź efektywność żywienia.`,
      priority: 'medium',
      category: 'animals'
    })
  }
  
  // Alerty magazynowe
  if (warehouse.stockLevels && warehouse.stockLevels.lowStock > 3) {
    alerts.push({
      type: 'warning',
      title: 'Niski stan magazynowy',
      message: `${warehouse.stockLevels.lowStock} produktów ma niski stan. Uzupełnij zapasy.`,
      priority: 'medium',
      category: 'warehouse'
    })
  }
  
  // Alerty pozytywne
  if (financial.kpis.profitMargin > 25) {
    alerts.push({
      type: 'info',
      title: 'Doskonała rentowność',
      message: `Marża zysku na poziomie ${financial.kpis.profitMargin.toFixed(1)}% - doskonałe wyniki!`,
      priority: 'low',
      category: 'financial'
    })
  }
  
  if (fields.fieldUtilization && fields.fieldUtilization.utilizationRate > 95) {
    alerts.push({
      type: 'info',
      title: 'Optymalne wykorzystanie pól',
      message: `Wykorzystanie pól na poziomie ${fields.fieldUtilization.utilizationRate.toFixed(1)}% - doskonałe zarządzanie!`,
      priority: 'low',
      category: 'production'
    })
  }
  
  return alerts.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

export default useAnalytics