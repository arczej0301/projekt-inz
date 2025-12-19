// services/costService.js
import { 
  collection, 
  query, 
  where, 
  getDocs,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'

class CostService {
  // Pobierz wszystkie koszty z całej aplikacji
  async getAllCosts(startDate = null, endDate = null) {
    try {
      const allCosts = []
      
      // 1. Koszty z transakcji finansowych
      const financeCosts = await this.getFinanceCosts(startDate, endDate)
      allCosts.push(...financeCosts)
      
      // 2. Koszty pól (field_costs)
      const fieldCosts = await this.getFieldCosts(startDate, endDate)
      allCosts.push(...fieldCosts)
      
      // 3. Koszty zwierząt (animal_costs)
      const animalCosts = await this.getAnimalCosts(startDate, endDate)
      allCosts.push(...animalCosts)
      
      // 4. Koszty garażu (garage_costs / maintenance)
      const garageCosts = await this.getGarageCosts(startDate, endDate)
      allCosts.push(...garageCosts)
      
      // 5. Koszty magazynu (warehouse_costs)
      const warehouseCosts = await this.getWarehouseCosts(startDate, endDate)
      allCosts.push(...warehouseCosts)
      
      return this.aggregateCostsByCategory(allCosts)
    } catch (error) {
      console.error('Error fetching all costs:', error)
      return []
    }
  }
  
  // Koszty z modułu finansów
  async getFinanceCosts(startDate, endDate) {
    const costs = []
    const q = query(
      collection(db, 'finance_transactions'),
      where('type', '==', 'expense')
    )
    
    const snapshot = await getDocs(q)
    snapshot.forEach(doc => {
      const data = doc.data()
      const transactionDate = data.date?.toDate?.() || data.date
      
      // Filtruj po dacie jeśli podano
      if (this.isDateInRange(transactionDate, startDate, endDate)) {
        costs.push({
          id: doc.id,
          source: 'finance',
          category: data.category,
          amount: parseFloat(data.amount) || 0,
          description: data.description,
          date: transactionDate,
          details: {
            type: 'transaction',
            budgetCategory: data.budgetCategory
          }
        })
      }
    })
    
    return costs
  }
  
  // Koszty z modułu pól
  async getFieldCosts(startDate, endDate) {
    const costs = []
    const q = query(collection(db, 'field_costs'))
    
    const snapshot = await getDocs(q)
    snapshot.forEach(doc => {
      const data = doc.data()
      const costDate = data.date?.toDate?.() || data.date_created?.toDate?.() || data.date
      
      if (this.isDateInRange(costDate, startDate, endDate)) {
        costs.push({
          id: doc.id,
          source: 'fields',
          category: data.category || 'field_costs',
          amount: parseFloat(data.total_cost || data.amount || 0),
          description: `${data.description || 'Koszt pola'}${data.field_id ? ` (Pole: ${data.field_id})` : ''}`,
          date: costDate,
          details: {
            type: 'field_cost',
            fieldId: data.field_id,
            category: data.category
          }
        })
      }
    })
    
    return costs
  }
  
  // Koszty z modułu zwierząt
  async getAnimalCosts(startDate, endDate) {
    const costs = []
    const q = query(collection(db, 'animal_costs'))
    
    const snapshot = await getDocs(q)
    snapshot.forEach(doc => {
      const data = doc.data()
      const costDate = data.date?.toDate?.() || data.date_created?.toDate?.() || data.date
      
      if (this.isDateInRange(costDate, startDate, endDate)) {
        costs.push({
          id: doc.id,
          source: 'animals',
          category: 'zwierzeta',
          amount: parseFloat(data.amount || data.cost || 0),
          description: `${data.description || 'Koszt zwierząt'}${data.animal_id ? ` (Zwierzę: ${data.animal_id})` : ''}`,
          date: costDate,
          details: {
            type: 'animal_cost',
            animalId: data.animal_id,
            costType: data.cost_type || 'other'
          }
        })
      }
    })
    
    return costs
  }
  
  // Koszty z modułu garażu
  async getGarageCosts(startDate, endDate) {
    const costs = []
    const q = query(collection(db, 'garage_costs'))
    
    const snapshot = await getDocs(q)
    snapshot.forEach(doc => {
      const data = doc.data()
      const costDate = data.date?.toDate?.() || data.date_created?.toDate?.() || data.date
      
      if (this.isDateInRange(costDate, startDate, endDate)) {
        costs.push({
          id: doc.id,
          source: 'garage',
          category: 'naprawy_konserwacja',
          amount: parseFloat(data.amount || data.cost || 0),
          description: `${data.description || 'Koszt maszyny'}${data.machine_id ? ` (Maszyna: ${data.machine_id})` : ''}`,
          date: costDate,
          details: {
            type: 'maintenance',
            machineId: data.machine_id,
            maintenanceType: data.maintenance_type
          }
        })
      }
    })
    
    return costs
  }
  
  // Koszty z modułu magazynu
  async getWarehouseCosts(startDate, endDate) {
    const costs = []
    const q = query(collection(db, 'warehouse_transactions'), where('type', '==', 'outgoing'))
    
    const snapshot = await getDocs(q)
    snapshot.forEach(doc => {
      const data = doc.data()
      const costDate = data.date?.toDate?.() || data.timestamp?.toDate?.() || data.date
      
      if (this.isDateInRange(costDate, startDate, endDate)) {
        // Tylko transakcje, które są kosztami (np. wydania na pola, zwierzęta)
        if (data.reason && ['field_use', 'animal_feed', 'consumption'].includes(data.reason)) {
          const totalCost = parseFloat(data.total_cost || 
            (data.quantity * data.unit_price) || 0)
          
          costs.push({
            id: doc.id,
            source: 'warehouse',
            category: this.mapWarehouseCategory(data.product_category),
            amount: totalCost,
            description: `${data.product_name || 'Produkt'} - ${data.quantity} ${data.unit}`,
            date: costDate,
            details: {
              type: 'warehouse_usage',
              productId: data.product_id,
              reason: data.reason,
              quantity: data.quantity
            }
          })
        }
      }
    })
    
    return costs
  }
  
  // Agregacja kosztów według kategorii
  aggregateCostsByCategory(costs) {
    const categories = {}
    
    costs.forEach(cost => {
      const category = cost.category
      if (!categories[category]) {
        categories[category] = {
          category: category,
          total: 0,
          count: 0,
          sources: {},
          details: []
        }
      }
      
      categories[category].total += cost.amount
      categories[category].count += 1
      
      // Grupowanie według źródła
      if (!categories[category].sources[cost.source]) {
        categories[category].sources[cost.source] = 0
      }
      categories[category].sources[cost.source] += cost.amount
      
      // Zapisz przykładowe szczegóły (max 3)
      if (categories[category].details.length < 3) {
        categories[category].details.push({
          description: cost.description,
          amount: cost.amount,
          date: cost.date,
          source: cost.source
        })
      }
    })
    
    // Konwersja do tablicy i sortowanie
    return Object.values(categories)
      .map(cat => ({
        ...cat,
        sources: Object.entries(cat.sources)
          .map(([source, amount]) => ({ source, amount }))
          .sort((a, b) => b.amount - a.amount)
      }))
      .sort((a, b) => b.total - a.total)
  }
  
  // Mapowanie kategorii magazynu na standardowe kategorie
  mapWarehouseCategory(productCategory) {
    const mapping = {
      'seeds': 'nawozy_nasiona',
      'fertilizers': 'nawozy_nasiona',
      'feed': 'pasze',
      'tools': 'sprzet_czesci',
      'spare_parts': 'sprzet_czesci',
      'fuel': 'paliwo',
      'chemicals': 'nawozy_nasiona'
    }
    
    return mapping[productCategory] || 'inne_koszty'
  }
  
  // Sprawdzenie czy data jest w zakresie
  isDateInRange(date, startDate, endDate) {
    if (!startDate && !endDate) return true
    
    const checkDate = date ? new Date(date) : new Date()
    if (startDate && checkDate < new Date(startDate)) return false
    if (endDate && checkDate > new Date(endDate)) return false
    
    return true
  }
  
  // Pobierz koszty dla konkretnego modułu
  async getCostsByModule(module, options = {}) {
    switch (module) {
      case 'fields':
        return this.getFieldCosts(options.startDate, options.endDate)
      case 'animals':
        return this.getAnimalCosts(options.startDate, options.endDate)
      case 'garage':
        return this.getGarageCosts(options.startDate, options.endDate)
      case 'warehouse':
        return this.getWarehouseCosts(options.startDate, options.endDate)
      default:
        return this.getFinanceCosts(options.startDate, options.endDate)
    }
  }
}

const costService = new CostService()
export default costService