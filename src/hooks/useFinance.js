// hooks/useFinance.js
import { useState, useEffect } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'

export const useFinance = () => {
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Kategorie transakcji - ZMIENIONE NA POLSKIE IDENTYFIKATORY
  const incomeCategories = [
    { id: 'sprzedaz_plonow', name: 'Plony', icon: '🌾', color: '#4caf50' },
    { id: 'sprzedaz_zwierzat', name: 'Zwierzęta', icon: '🐄', color: '#8bc34a' },
    { id: 'sprzedaz_maszyn', name: 'Maszyny', icon: '🚜', color: '#607d8b' },
    { id: 'dotacje', name: 'Dotacje', icon: '💰', color: '#ffc107' },
    { id: 'inne_przychody', name: 'Inne przychody', icon: '📈', color: '#9c27b0' },
    {
  id: 'warehouse_operations',
  name: 'Operacje magazynowe',
  type: 'both', // zarówno przychody jak i wydatki
  color: '#4caf50',
  subcategories: [
    { id: 'warehouse_stock', name: 'Stan magazynowy', color: '#81c784' },
    { id: 'warehouse_adjustment', name: 'Korekty magazynowe', color: '#a5d6a7' },
    { id: 'warehouse_usage', name: 'Zużycie', color: '#ff9800' }
  ]
}
  ]

  const expenseCategories = [
    { id: 'zwierzeta', name: 'Zwierzęta', icon: '🐄', color: '#795548' },
    { id: 'maszyny', name: 'Maszyny', icon: '🚜', color: '#607d8b' },
    { id: 'zboza', name: 'Plony', icon: '🌾', color: '#4caf50' },
    { id: 'nawozy_nasiona', name: 'Nawozy i nasiona', icon: '🌱', color: '#8bc34a' },
    { id: 'pasze', name: 'Pasza', icon: '🌿', color: '#ff9800' },
    { id: 'paliwo', name: 'Paliwo', icon: '⛽', color: '#f44336' },
    { id: 'sprzet_czesci', name: 'Narzędzia i części', icon: '🛠️', color: '#ff5722' },
    { id: 'naprawy_konserwacja', name: 'Naprawa i konserwacja', icon: '🔧', color: '#3f51b5' },
    { id: 'inne_koszty', name: 'Inne koszty', icon: '📉', color: '#e91e63' }
  ]

  
  // Mapowanie kategorii dla budżetów - ZAKTUALIZOWANE
  const categoryMapping = {
    // Transakcje wydatkowe → Kategorie budżetowe  
    'zwierzeta': 'animals',
    'maszyny': 'tools',
    'zboza': 'food',
    'nawozy_nasiona': 'supplies',
    'pasze': 'supplies',
    'paliwo': 'transport',
    'sprzet_czesci': 'tools',
    'naprawa_konserwacja': 'maintenance',
    'inne_koszty': 'other',
    'sprzedaz_maszyn': 'tools',
    
    // Transakcje przychodowe (pozostają bez zmian)
    'sprzedaz_plonow': 'food',
    'sprzedaz_zwierzat': 'animals',
    'produkty_zwierzece': 'animals',
    'dotacje': 'other',
    'inne_przychody': 'other',
    'maszyny': 'tools'
  }

  // Mapowanie odwrotne - ZAKTUALIZOWANE
  const reverseCategoryMapping = {
    'food': ['zboza', 'sprzedaz_plonow'],
    'supplies': ['nawozy_nasiona', 'pasze'],
    'transport': ['paliwo'],
    'tools': ['maszyny', 'sprzet_czesci'],
    'animals': ['zwierzeta', 'sprzedaz_zwierzat', 'produkty_zwierzece', 'zakup_zwierzat'],
    'maintenance': ['naprawa_konserwacja'],
    'taxes': ['podatki_oplaty'],
    'other': ['dotacje', 'inne_przychody', 'inne_koszty'],
    'tools': ['maszyny', 'sprzet_czesci', 'sprzedaz_maszyn'],
  }

  // Funkcja do mapowania kategorii
  const getBudgetCategory = (transactionCategory) => {
    return categoryMapping[transactionCategory] || 'other'
  }

  // Pobieranie transakcji w czasie rzeczywistym
  useEffect(() => {
  const q = query(collection(db, 'finance_transactions'))

  const unsubscribe = onSnapshot(q,
  (querySnapshot) => {
    const transactionsData = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      transactionsData.push({
        id: doc.id,
        ...data,
        date: data.date?.toDate?.() || data.date
      })
    })

    // DODAJ sortowanie od najnowszych
    const sortedTransactions = transactionsData.sort((a, b) => {
      const getDate = (t) => {
        if (t.date?.toDate) return t.date.toDate()
        if (t.date instanceof Date) return t.date
        return new Date(t.date || 0)
      }
      return getDate(b).getTime() - getDate(a).getTime()
    })
    
    setTransactions(sortedTransactions)
    setLoading(false)
  },
      (error) => {
        console.error('Błąd przy pobieraniu transakcji:', error)
        setError(`Błąd przy pobieraniu danych: ${error.message}`)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Pobieranie budżetów
  useEffect(() => {
    const q = query(collection(db, 'finance_budgets'))

    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        const budgetsData = []
        querySnapshot.forEach((doc) => {
          budgetsData.push({ id: doc.id, ...doc.data() })
        })
        setBudgets(budgetsData)
      },
      (error) => {
        console.error('Błąd przy pobieraniu budżetów:', error)
      }
    )

    return () => unsubscribe()
  }, [])

  // Dodawanie transakcji z automatycznym mapowaniem kategorii
  const deleteAnimalAfterSale = async (animalId, transactionId, description) => {
    try {
      // Tu użyj swojej istniejącej funkcji do usuwania zwierząt
      await deleteDoc(doc(db, 'animals', animalId))

      // Możesz też dodać do historii
      await addDoc(collection(db, 'animalsHistory'), {
        animalId: animalId,
        operation: 'sale',
        timestamp: new Date(),
        transactionId: transactionId,
        description: description || 'Sprzedaż zwierzęcia'
      })

      console.log(`✅ Zwierzę usunięte po sprzedaży: ${animalId}`)
      return { success: true }
    } catch (error) {
      console.error('Błąd przy usuwaniu zwierzęcia:', error)
      return { success: false, error: error.message }
    }
  }

  // Dodawanie transakcji z automatycznym mapowaniem kategorii
  const addTransaction = async (transactionData) => {
  try {
    // Mapuj kategorię do budżetu
    const mappedCategory = getBudgetCategory(transactionData.category) || transactionData.category

    // Dla transakcji z magazynu, ustaw odpowiednie pola
    const transactionToAdd = {
      ...transactionData,
      category: transactionData.category,
      budgetCategory: mappedCategory,
      date: Timestamp.fromDate(new Date(transactionData.date)),
      createdAt: Timestamp.now(), 
      amount: parseFloat(transactionData.amount),
      
      // Dodaj pole sourceType dla lepszego rozróżnienia
      sourceType: transactionData.source === 'warehouse' ? 'warehouse_add' : 'manual',
      
      // Jeśli to transakcja z magazynu, dodaj specjalne pola
      ...(transactionData.source === 'warehouse' && {
        warehouseProductId: transactionData.warehouseProductId,
        warehouseCategory: transactionData.warehouseCategory,
        isAutomatic: true
      })
    }

    const docRef = await addDoc(collection(db, 'finance_transactions'), transactionToAdd)
    return { success: true, id: docRef.id }
  } catch (error) {
    console.error('Błąd przy dodawaniu transakcji:', error)
    return { success: false, error: error.message }
  }
}

  const updateMachineStatusAfterSale = async (machineId, transactionId, description) => {
  try {
    // Tu potrzebujesz garageService lub bezpośredniego Firestore
    await updateDoc(doc(db, 'garage', machineId), {
      status: 'sold',
      soldDate: new Date(),
      soldTransactionId: transactionId,
      lastUpdate: new Date()
    })

    // Możesz też dodać do historii
    await addDoc(collection(db, 'garageHistory'), {
      machineId: machineId,
      operation: 'sale',
      timestamp: new Date(),
      transactionId: transactionId,
      description: description || 'Sprzedaż maszyny'
    })

    console.log(`✅ Maszyna oznaczona jako sprzedana: ${machineId}`)
    return { success: true }
  } catch (error) {
    console.error('Błąd przy aktualizacji statusu maszyny:', error)
    return { success: false, error: error.message }
  }
}
  // DODAJ NOWĄ FUNKCJĘ DO ZMNIEJSZANIA STANU MAGAZYNOWEGO
  const updateWarehouseAfterSale = async (productId, soldQuantity, transactionId, description) => {
    try {
      const productRef = doc(db, 'warehouse', productId)
      const productDoc = await getDoc(productRef)

      if (!productDoc.exists()) {
        console.error('Produkt nie istnieje w magazynie:', productId)
        return { success: false, error: 'Produkt nie istnieje' }
      }

      const product = productDoc.data()
      const currentQuantity = product.quantity || 0
      const quantity = parseFloat(soldQuantity)
      const newQuantity = Math.max(0, currentQuantity - quantity)

      // Aktualizuj stan magazynowy
      await updateDoc(productRef, {
        quantity: newQuantity,
        lastUpdate: new Date(),
        lastOperation: 'sale'
      })

      // Dodaj do historii magazynu
      await addDoc(collection(db, 'warehouseHistory'), {
        productId: productId,
        productName: product.name,
        operation: 'sale',
        quantity: quantity,
        previousQuantity: currentQuantity,
        newQuantity: newQuantity,
        timestamp: new Date(),
        source: 'finance_sale',
        transactionId: transactionId,
        description: description || `Sprzedaż produktu`,
        category: product.category,
        unit: product.unit,
        unitPrice: product.price || 0
      })

      console.log(`✅ Magazyn zaktualizowany: ${product.name} -${quantity} ${product.unit}`)
      return { success: true }
    } catch (error) {
      console.error('Błąd przy aktualizacji magazynu:', error)
      return { success: false, error: error.message }
    }
  }

  // Automatyczne dodawanie transakcji z innych modułów
  const addAutoTransaction = async (type, data) => {
    try {
      // Mapuj kategorię do budżetu
      const mappedCategory = getBudgetCategory(data.category) || data.category

      const transactionData = {
        type: type, // 'income' lub 'expense'
        category: data.category,
        budgetCategory: mappedCategory,
        amount: parseFloat(data.amount),

         description: `${data.machineName || ''}`,
         operationType: `${data.operationType || ''}`,
        source: data.source, // 'fields', 'animals', 'warehouse', 'garage'
        sourceId: data.sourceId,
        date: Timestamp.fromDate(new Date()),
        autoGenerated: true,
        createdAt: new Date()
      }

      const docRef = await addDoc(collection(db, 'finance_transactions'), transactionData)
      return { success: true, id: docRef.id }
    } catch (error) {
      console.error('Błąd przy automatycznym dodawaniu transakcji:', error)
      return { success: false, error: error.message }
    }
  }

  // Aktualizacja transakcji
  const updateTransaction = async (transactionId, updateData) => {
    try {
      const transactionRef = doc(db, 'finance_transactions', transactionId)

      // Jeśli zmieniono kategorię, zaktualizuj też budgetCategory
      if (updateData.category) {
        const mappedCategory = getBudgetCategory(updateData.category) || updateData.category
        updateData.budgetCategory = mappedCategory
      }

      await updateDoc(transactionRef, {
        ...updateData,
        lastUpdate: new Date(),
        amount: parseFloat(updateData.amount)
      })
      return { success: true }
    } catch (error) {
      console.error('Błąd przy aktualizacji transakcji:', error)
      return { success: false, error: error.message }
    }
  }

  // Usuwanie transakcji
  const deleteTransaction = async (transactionId) => {
    try {
      await deleteDoc(doc(db, 'finance_transactions', transactionId))
      return { success: true }
    } catch (error) {
      console.error('Błąd przy usuwaniu transakcji:', error)
      return { success: false, error: error.message }
    }
  }

  // Zarządzanie budżetami
  const addBudget = async (budgetData) => {
    try {
      const docRef = await addDoc(collection(db, 'finance_budgets'), {
        ...budgetData,
        createdAt: new Date(),
        amount: parseFloat(budgetData.amount),
        spent: 0
      })
      return { success: true, id: docRef.id }
    } catch (error) {
      console.error('Błąd przy dodawaniu budżetu:', error)
      return { success: false, error: error.message }
    }
  }

  const updateBudget = async (budgetId, updateData) => {
    try {
      const budgetRef = doc(db, 'finance_budgets', budgetId)
      await updateDoc(budgetRef, {
        ...updateData,
        lastUpdate: new Date()
      })
      return { success: true }
    } catch (error) {
      console.error('Błąd przy aktualizacji budżetu:', error)
      return { success: false, error: error.message }
    }
  }

  // Obliczenia finansowe
  const getFinancialSummary = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    const monthlyIncome = transactions
      .filter(t => t.type === 'income' &&
        t.date?.getMonth?.() === currentMonth &&
        t.date?.getFullYear?.() === currentYear)
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense' &&
        t.date?.getMonth?.() === currentMonth &&
        t.date?.getFullYear?.() === currentYear)
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    return {
      monthlyIncome,
      monthlyExpenses,
      monthlyBalance: monthlyIncome - monthlyExpenses,
      totalIncome,
      totalExpenses,
      totalBalance: totalIncome - totalExpenses
    }
  }

  // OBLICZANIE STANU BUDŻETÓW NA PODSTAWIE TRANSAKCJI
  const getBudgetsWithStatus = () => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    return budgets.map(budget => {
      // Wydatki dla tego budżetu (według kategorii budżetowej)
      const expensesForBudget = transactions
        .filter(t => t.type === 'expense' &&
          t.budgetCategory === budget.category &&
          t.date?.getMonth?.() === currentMonth &&
          t.date?.getFullYear?.() === currentYear)
        .reduce((sum, t) => sum + (t.amount || 0), 0)

      // Przychody dla tego budżetu
      const incomeForBudget = transactions
        .filter(t => t.type === 'income' &&
          t.budgetCategory === budget.category &&
          t.date?.getMonth?.() === currentMonth &&
          t.date?.getFullYear?.() === currentYear)
        .reduce((sum, t) => sum + (t.amount || 0), 0)

      const spent = expensesForBudget
      const budgetAmount = parseFloat(budget.amount) || 0
      const remaining = Math.max(0, budgetAmount - spent)
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0

      // Znajdź powiązane transakcje
      const relatedTransactions = transactions
        .filter(t => t.budgetCategory === budget.category)
        .slice(0, 5) // Tylko 5 ostatnich

      return {
        ...budget,
        spent,
        remaining,
        percentage: Math.min(percentage, 100), // Maksymalnie 100%
        income: incomeForBudget,
        relatedTransactions,
        status: percentage > 100 ? 'exceeded' :
          percentage > 80 ? 'warning' : 'good',
        // Dodaj info o powiązanych kategoriach transakcji
        relatedCategories: reverseCategoryMapping[budget.category] || []
      }
    })
  }

  return {
    transactions,
    budgets,
    incomeCategories,
    expenseCategories,
    loading,
    error,
    addTransaction,
    addAutoTransaction,
    updateTransaction,
    deleteTransaction,
    addBudget,
    updateBudget,
    getFinancialSummary,
    getBudgetsWithStatus,
    getBudgetCategory,
    categoryMapping,
    reverseCategoryMapping,
    updateMachineStatusAfterSale,
  }
}