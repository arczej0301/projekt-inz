// hooks/useCosts.js
import { useState, useCallback } from 'react'

// Tymczasowa funkcja - później zastąpisz prawdziwym service
const mockGetAllCosts = async () => {
  // Tymczasowe dane mock
  return [
    {
      category: 'paliwo',
      total: 15000,
      count: 45,
      sources: [
        { source: 'finance', amount: 10000 },
        { source: 'garage', amount: 5000 }
      ],
      details: [
        { description: 'Olej napędowy', amount: 500, date: new Date(), source: 'finance' },
        { description: 'Benzyna do maszyn', amount: 300, date: new Date(), source: 'garage' }
      ]
    },
    {
      category: 'pasze',
      total: 25000,
      count: 60,
      sources: [
        { source: 'animals', amount: 15000 },
        { source: 'warehouse', amount: 10000 }
      ],
      details: [
        { description: 'Pasza dla bydła', amount: 800, date: new Date(), source: 'animals' },
        { description: 'Dodatki paszowe', amount: 400, date: new Date(), source: 'warehouse' }
      ]
    }
  ]
}

export const useCosts = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Pobierz wszystkie koszty
  const getAllCosts = useCallback(async (startDate, endDate) => {
    try {
      setLoading(true)
      setError(null)
      
      // Tymczasowo używamy mock danych
      const costs = await mockGetAllCosts()
      return costs
    } catch (error) {
      console.error('Error in getAllCosts:', error)
      setError('Błąd podczas pobierania kosztów')
      return []
    } finally {
      setLoading(false)
    }
  }, [])
  
  return {
    getAllCosts,
    loading,
    error
  }
}