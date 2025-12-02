// hooks/useFinance.js
import { useState, useEffect } from 'react'
import { 
  collection, 
  doc, 
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
    { id: 'sprzedaz_plonow', name: 'Sprzedaż plonów', icon: '🌾', color: '#4caf50' },
    { id: 'sprzedaz_zwierzat', name: 'Sprzedaż zwierząt', icon: '🐄', color: '#8bc34a' },
    { id: 'produkty_zwierzece', name: 'Produkty zwierzęce', icon: '🥛', color: '#2196f3' },
    { id: 'dotacje', name: 'Dotacje', icon: '💰', color: '#ffc107' },
    { id: 'inne_przychody', name: 'Inne przychody', icon: '📈', color: '#9c27b0' }
  ]

  const expenseCategories = [
    { id: 'nasiona', name: 'Nasiona', icon: '🌱', color: '#4caf50' },
    { id: 'nawozy', name: 'Nawozy', icon: '🧪', color: '#ff9800' },
    { id: 'pasze', name: 'Pasze', icon: '🌿', color: '#8bc34a' },
    { id: 'paliwo', name: 'Paliwo', icon: '⛽', color: '#f44336' },
    { id: 'sprzet_czesci', name: 'Sprzęt i części', icon: '🛠️', color: '#607d8b' },
    { id: 'zakup_zwierzat', name: 'Zakup zwierząt', icon: '🐄', color: '#795548' },
    { id: 'naprawy_konserwacja', name: 'Naprawy i konserwacja', icon: '🔧', color: '#ff5722' },
    { id: 'podatki_oplaty', name: 'Podatki i opłaty', icon: '🏛️', color: '#3f51b5' },
    { id: 'inne_koszty', name: 'Inne koszty', icon: '📉', color: '#e91e63' }
  ]

  // Mapowanie kategorii dla budżetów
  const categoryMapping = {
    // Transakcje przychodowe → Kategorie budżetowe
    'sprzedaz_plonow': 'food',
    'sprzedaz_zwierzat': 'animals',
    'produkty_zwierzece': 'animals',
    'dotacje': 'other',
    'inne_przychody': 'other',
    
    // Transakcje wydatkowe → Kategorie budżetowe  
    'nasiona': 'food',
    'nawozy': 'supplies',
    'pasze': 'supplies',
    'paliwo': 'transport',
    'sprzet_czesci': 'tools',
    'zakup_zwierzat': 'animals',
    'naprawy_konserwacja': 'maintenance',
    'podatki_oplaty': 'taxes',
    'inne_koszty': 'other'
  }

  // Mapowanie odwrotne
  const reverseCategoryMapping = {
    'food': ['nasiona', 'sprzedaz_plonow'],
    'supplies': ['nawozy', 'pasze'],
    'transport': ['paliwo'],
    'tools': ['sprzet_czesci'],
    'animals': ['zakup_zwierzat', 'sprzedaz_zwierzat', 'produkty_zwierzece'],
    'maintenance': ['naprawy_konserwacja'],
    'taxes': ['podatki_oplaty'],
    'other': ['dotacje', 'inne_przychody', 'inne_koszty']
  }

  // Funkcja do mapowania kategorii
  const getBudgetCategory = (transactionCategory) => {
    return categoryMapping[transactionCategory] || 'other'
  }

  // Pobieranie transakcji w czasie rzeczywistym
  useEffect(() => {
    const q = query(
      collection(db, 'finance_transactions'),
      orderBy('date', 'desc')
    )
    
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
        setTransactions(transactionsData)
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
  const addTransaction = async (transactionData) => {
    try {
      // Mapuj kategorię do budżetu
      const mappedCategory = getBudgetCategory(transactionData.category) || transactionData.category
      
      const docRef = await addDoc(collection(db, 'finance_transactions'), {
        ...transactionData,
        category: transactionData.category, // Zachowaj oryginalną kategorię
        budgetCategory: mappedCategory, // Dodaj kategorię dla budżetu
        date: Timestamp.fromDate(new Date(transactionData.date)),
        createdAt: new Date(),
        amount: parseFloat(transactionData.amount)
      })
      return { success: true, id: docRef.id }
    } catch (error) {
      console.error('Błąd przy dodawaniu transakcji:', error)
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
        description: data.description,
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
    reverseCategoryMapping
  }
}