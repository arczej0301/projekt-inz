// hooks/useWarehouse.js
import { useState, useEffect } from 'react'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore'
import { db } from '../config/firebase'

export const useWarehouse = () => {
  const [warehouseData, setWarehouseData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Kategorie magazynu
  const categories = [
    { id: 'zboza', name: 'Zboża', icon: '🌾', color: '#4caf50' },
    { id: 'mleko', name: 'Produkty mleczne', icon: '🥛', color: '#2196f3' },
    { id: 'nawozy', name: 'Nawozy', icon: '🧪', color: '#ff9800' },
    { id: 'nawozy', name: 'Nasiona i Nawozy', icon: '🧪', color: '#ff9800' },
    { id: 'paliwo', name: 'Paliwa i oleje', icon: '⛽', color: '#f44336' },
    { id: 'pasze', name: 'Pasze', icon: '🌿', color: '#8bc34a' },
    { id: 'warzywa', name: 'Warzywa', icon: '🥔', color: '#795548' },
    { id: 'owoce', name: 'Owoce', icon: '🍎', color: '#e91e63' },
    { id: 'narzedzia', name: 'Narzędzia i części', icon: '🛠️', color: '#607d8b' }
  ]

  // Pobieranie danych magazynu w czasie rzeczywistym
  useEffect(() => {
    const unsubscribeFunctions = []

    const subscribeToCategory = (categoryId) => {
      const q = query(
        collection(db, 'warehouse'),
        where('category', '==', categoryId),
        orderBy('name')
      )
      
      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const items = []
          querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() })
          })
          
          setWarehouseData(prev => ({
            ...prev,
            [categoryId]: items
          }))
        },
        (error) => {
          console.error(`Błąd przy pobieraniu ${categoryId}:`, error)
          setError(`Błąd przy pobieraniu danych: ${error.message}`)
        }
      )
      
      unsubscribeFunctions.push(unsubscribe)
    }

    // Subskrybuj wszystkie kategorie
    categories.forEach(category => {
      subscribeToCategory(category.id)
    })

    setLoading(false)

    // Cleanup function
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    }
  }, [])

  // Dodawanie nowego produktu
  const addProduct = async (productData) => {
    try {
      const docRef = await addDoc(collection(db, 'warehouse'), {
        ...productData,
        createdAt: new Date(),
        lastUpdate: new Date()
      })
      return { success: true, id: docRef.id }
    } catch (error) {
      console.error('Błąd przy dodawaniu produktu:', error)
      return { success: false, error: error.message }
    }
  }

  // Aktualizacja produktu
  const updateProduct = async (productId, updateData) => {
    try {
      const productRef = doc(db, 'warehouse', productId)
      await updateDoc(productRef, {
        ...updateData,
        lastUpdate: new Date()
      })
      return { success: true }
    } catch (error) {
      console.error('Błąd przy aktualizacji produktu:', error)
      return { success: false, error: error.message }
    }
  }

  // Usuwanie produktu
  const deleteProduct = async (productId) => {
    try {
      await deleteDoc(doc(db, 'warehouse', productId))
      return { success: true }
    } catch (error) {
      console.error('Błąd przy usuwaniu produktu:', error)
      return { success: false, error: error.message }
    }
  }

  // Aktualizacja stanu magazynowego
  const updateStock = async (productId, newQuantity, operation = 'update') => {
    try {
      const productRef = doc(db, 'warehouse', productId)
      const productDoc = await getDoc(productRef)
      
      if (!productDoc.exists()) {
        return { success: false, error: 'Produkt nie istnieje' }
      }

      const product = productDoc.data()
      
      await updateDoc(productRef, {
        quantity: newQuantity,
        lastUpdate: new Date(),
        lastOperation: operation
      })

      return { success: true }
    } catch (error) {
      console.error('Błąd przy aktualizacji stanu:', error)
      return { success: false, error: error.message }
    }
  }

  // Pobieranie historii zmian produktu
  const getProductHistory = async (productId) => {
    try {
      const historyQuery = query(
        collection(db, 'warehouseHistory'),
        where('productId', '==', productId),
        orderBy('timestamp', 'desc')
      )
      
      const querySnapshot = await getDocs(historyQuery)
      const history = []
      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() })
      })
      
      return { success: true, history }
    } catch (error) {
      console.error('Błąd przy pobieraniu historii:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    warehouseData,
    categories,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    getProductHistory
  }
}