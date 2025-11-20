// hooks/useGarage.js - WERSJA BEZ STORAGE
import { useState, useEffect } from 'react'
import { 
  collection, 
  doc, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db } from '../config/firebase' // 👈 TYLKO db, BEZ storage

export const useGarage = () => {
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pobieranie maszyn w czasie rzeczywistym
  useEffect(() => {
    try {
      console.log('🔄 Rozpoczynanie pobierania maszyn...')
      
      const q = query(collection(db, 'garage'), orderBy('name'))
      
      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          console.log('✅ Otrzymano dane:', querySnapshot.size, 'maszyn')
          const machinesList = []
          querySnapshot.forEach((doc) => {
            const data = doc.data()
            machinesList.push({ 
              id: doc.id, 
              name: data.name || 'Brak nazwy',
              brand: data.brand || 'Brak marki',
              type: data.type || 'ciągnik',
              year: data.year || new Date().getFullYear(),
              registration: data.registration || '',
              status: data.status || 'sprawna',
              imageUrl: data.imageUrl || '',
              lastService: data.lastService || '',
              notes: data.notes || '',
              repairs: data.repairs || [],
              createdAt: data.createdAt,
              lastUpdate: data.lastUpdate
            })
          })
          setMachines(machinesList)
          setLoading(false)
          setError(null)
        },
        (error) => {
          console.error('❌ Błąd pobierania:', error)
          setError(`Błąd: ${error.message}`)
          setLoading(false)
        }
      )

      return unsubscribe
    } catch (error) {
      console.error('❌ Błąd inicjalizacji:', error)
      setError(`Błąd inicjalizacji: ${error.message}`)
      setLoading(false)
    }
  }, [])

  // Dodawanie maszyny (bez zdjęć)
  const addMachine = async (machineData) => {
    try {
      const docRef = await addDoc(collection(db, 'garage'), {
        ...machineData,
        year: parseInt(machineData.year),
        repairs: [],
        createdAt: Timestamp.now(),
        lastUpdate: Timestamp.now()
      })
      return { success: true, id: docRef.id }
    } catch (error) {
      console.error('Błąd dodawania:', error)
      return { success: false, error: error.message }
    }
  }

  // Aktualizacja maszyny (bez zdjęć)
  const updateMachine = async (machineId, updateData) => {
    try {
      const machineRef = doc(db, 'garage', machineId)
      await updateDoc(machineRef, {
        ...updateData,
        year: parseInt(updateData.year),
        lastUpdate: Timestamp.now()
      })
      return { success: true }
    } catch (error) {
      console.error('Błąd aktualizacji:', error)
      return { success: false, error: error.message }
    }
  }

  // Usuwanie maszyny
  const deleteMachine = async (machineId) => {
    try {
      await deleteDoc(doc(db, 'garage', machineId))
      return { success: true }
    } catch (error) {
      console.error('Błąd usuwania:', error)
      return { success: false, error: error.message }
    }
  }

  // Dodawanie naprawy
  const addRepair = async (machineId, repairData) => {
    try {
      const machineRef = doc(db, 'garage', machineId)
      const machineDoc = await getDoc(machineRef)
      
      if (!machineDoc.exists()) {
        return { success: false, error: 'Maszyna nie istnieje' }
      }

      const machine = machineDoc.data()
      const repairs = machine.repairs || []
      
      const newRepair = {
        id: Date.now().toString(),
        ...repairData,
        cost: parseFloat(repairData.cost),
        date: Timestamp.fromDate(new Date(repairData.date)),
        createdAt: Timestamp.now()
      }
      
      repairs.unshift(newRepair)
      
      await updateDoc(machineRef, {
        repairs,
        lastUpdate: Timestamp.now(),
        status: repairData.status
      })
      
      return { success: true }
    } catch (error) {
      console.error('Błąd dodawania naprawy:', error)
      return { success: false, error: error.message }
    }
  }

  return {
    machines,
    loading,
    error,
    addMachine,
    updateMachine,
    deleteMachine,
    addRepair
  }
}