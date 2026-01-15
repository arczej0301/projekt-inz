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
  orderBy,
  limit
} from 'firebase/firestore'
import { db } from '../config/firebase'

export const useWarehouse = () => {
  const [warehouseData, setWarehouseData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Kategorie magazynu
  const categories = [
    { id: 'zboza', name: 'Zboża', icon: '🌾', color: '#4caf50' },
    // { id: 'mleko', name: 'Produkty mleczne', icon: '🥛', color: '#2196f3' },
    { id: 'nawozy', name: 'Nawozy', icon: '🧪', color: '#ff9800' },
    { id: 'pasze', name: 'Pasze', icon: '🌿', color: '#8bc34a' },
    { id: 'paliwo', name: 'Paliwa i oleje', icon: '⛽', color: '#f44336' },
    // { id: 'warzywa', name: 'Warzywa', icon: '🥔', color: '#795548' },
    // { id: 'owoce', name: 'Owoce', icon: '🍎', color: '#e91e63' },
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

      // Log history
      await addDoc(collection(db, 'warehouseHistory'), {
        productId: docRef.id,
        productName: productData.name,
        operation: 'add',
        description: `Dodano produkt: ${productData.name}`,
        timestamp: new Date(),
        source: 'manual'
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

      // Log history
      const productName = updateData.name || 'Produkt' // W idealnym świecie pobralibyśmy starą nazwę
      await addDoc(collection(db, 'warehouseHistory'), {
        productId: productId,
        productName: productName,
        operation: 'update',
        description: `Zaktualizowano dane produktu`,
        timestamp: new Date(),
        source: 'manual'
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
      // Pobierz dane produktu przed usunięciem by mieć nazwę
      const productDoc = await getDoc(doc(db, 'warehouse', productId))
      const productName = productDoc.exists() ? productDoc.data().name : 'Produkt'

      await deleteDoc(doc(db, 'warehouse', productId))

      // Log history
      await addDoc(collection(db, 'warehouseHistory'), {
        productId: productId,
        productName: 'Usunięty produkt', // Title w Dashboard: "Magazyn: Usunięto produkt"
        operation: 'delete',
        description: `Usunięto ${productName} z magazynu`,
        timestamp: new Date(),
        source: 'manual'
      })

      return { success: true }
    } catch (error) {
      console.error('Błąd przy usuwaniu produktu:', error)
      return { success: false, error: error.message }
    }
  }

  // Aktualizacja stanu magazynowego
  const updateStock = async (productId, newQuantity, operation = 'update', metadata = {}) => {
    try {
      const productRef = doc(db, 'warehouse', productId)
      const productDoc = await getDoc(productRef)

      if (!productDoc.exists()) {
        return { success: false, error: 'Produkt nie istnieje' }
      }

      const product = productDoc.data()
      const previousQuantity = product.quantity || 0

      await updateDoc(productRef, {
        quantity: newQuantity,
        lastUpdate: new Date(),
        lastOperation: operation,
        ...(metadata.updatedBy && { updatedBy: metadata.updatedBy })
      })

      // Dodaj do historii
      await addDoc(collection(db, 'warehouseHistory'), {
        productId: productId,
        productName: product.name,
        operation: operation,
        quantity: Math.abs(newQuantity - previousQuantity),
        previousQuantity: previousQuantity,
        newQuantity: newQuantity,
        timestamp: new Date(),
        source: metadata.source || 'manual',
        transactionId: metadata.transactionId,
        description: metadata.description,
        userId: metadata.userId
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


// Export subscription function outside the hook for general use
export const subscribeToWarehouseLogs = (limitCount = 20, callback) => {
  const q = query(
    collection(db, 'warehouseHistory'),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  )

  return onSnapshot(q,
    (querySnapshot) => {
      const logs = []
      querySnapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() })
      })
      callback(logs)
    },
    (error) => console.error('Error in warehouse subscription:', error)
  )
}