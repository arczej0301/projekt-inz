// hooks/useInventory.js
import { useState, useEffect } from 'react'

export const useInventory = () => {
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)

  // Przykładowe dane magazynowe
  useEffect(() => {
    const mockInventory = [
      { id: 1, name: 'Laptop Dell', category: 'electronics', quantity: 5, minStock: 3, unitCost: 2500 },
      { id: 2, name: 'Myszka bezprzewodowa', category: 'electronics', quantity: 2, minStock: 5, unitCost: 120 },
      { id: 3, name: 'Kartki A4', category: 'office', quantity: 10, minStock: 20, unitCost: 15 },
      { id: 4, name: 'Długopisy', category: 'office', quantity: 50, minStock: 30, unitCost: 2 },
      { id: 5, name: 'Kawa', category: 'supplies', quantity: 3, minStock: 10, unitCost: 25 }
    ]
    
    setInventory(mockInventory)
    setLoading(false)
  }, [])

  // Produkty wymagające uzupełnienia
  const lowStockItems = inventory.filter(item => item.quantity < item.minStock)

  return {
    inventory,
    lowStockItems,
    loading
  }
}