// hooks/useGarage.js
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
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db, storage } from '../config/firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'

export const useGarage = () => {
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pobieranie maszyn w czasie rzeczywistym
  useEffect(() => {
    const q = query(
      collection(db, 'garage'),
      orderBy('name')
    )
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const machinesList = []
        querySnapshot.forEach((doc) => {
          machinesList.push({ id: doc.id, ...doc.data() })
        })
        setMachines(machinesList)
        setLoading(false)
      },
      (error) => {
        console.error('Błąd przy pobieraniu maszyn:', error)
        setError(`Błąd przy pobieraniu danych: ${error.message}`)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  // Dodawanie nowej maszyny
  const addMachine = async (machineData, imageFile = null) => {
    try {
      let imageUrl = ''
      
      // Upload obrazka jeśli został dodany
      if (imageFile) {
        const imageRef = ref(storage, `garage/${Date.now()}_${imageFile.name}`)
        const snapshot = await uploadBytes(imageRef, imageFile)
        imageUrl = await getDownloadURL(snapshot.ref)
      }

      const docRef = await addDoc(collection(db, 'garage'), {
        ...machineData,
        imageUrl,
        createdAt: Timestamp.now(),
        lastUpdate: Timestamp.now()
      })
      
      return { success: true, id: docRef.id }
    } catch (error) {
      console.error('Błąd przy dodawaniu maszyny:', error)
      return { success: false, error: error.message }
    }
  }

  // Aktualizacja maszyny
  const updateMachine = async (machineId, updateData, imageFile = null) => {
    try {
      let imageUrl = updateData.imageUrl

      // Upload nowego obrazka jeśli został zmieniony
      if (imageFile) {
        const imageRef = ref(storage, `garage/${Date.now()}_${imageFile.name}`)
        const snapshot = await uploadBytes(imageRef, imageFile)
        imageUrl = await getDownloadURL(snapshot.ref)
        
        // Usuń stary obrazek jeśli istnieje
        if (updateData.imageUrl) {
          try {
            const oldImageRef = ref(storage, updateData.imageUrl)
            await deleteObject(oldImageRef)
          } catch (deleteError) {
            console.warn('Nie udało się usunąć starego obrazka:', deleteError)
          }
        }
      }

      const machineRef = doc(db, 'garage', machineId)
      await updateDoc(machineRef, {
        ...updateData,
        imageUrl,
        lastUpdate: Timestamp.now()
      })
      
      return { success: true }
    } catch (error) {
      console.error('Błąd przy aktualizacji maszyny:', error)
      return { success: false, error: error.message }
    }
  }

  // Usuwanie maszyny
  const deleteMachine = async (machineId, imageUrl = null) => {
    try {
      // Usuń obrazek jeśli istnieje
      if (imageUrl) {
        try {
          const imageRef = ref(storage, imageUrl)
          await deleteObject(imageRef)
        } catch (deleteError) {
          console.warn('Nie udało się usunąć obrazka:', deleteError)
        }
      }

      // Usuń maszynę z Firestore
      await deleteDoc(doc(db, 'garage', machineId))
      
      return { success: true }
    } catch (error) {
      console.error('Błąd przy usuwaniu maszyny:', error)
      return { success: false, error: error.message }
    }
  }

  // Dodawanie naprawy do maszyny
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
        date: Timestamp.now(),
        createdAt: Timestamp.now()
      }
      
      repairs.unshift(newRepair) // Dodaj na początku
      
      await updateDoc(machineRef, {
        repairs,
        lastUpdate: Timestamp.now(),
        status: repairData.status // Aktualizuj status maszyny
      })
      
      return { success: true }
    } catch (error) {
      console.error('Błąd przy dodawaniu naprawy:', error)
      return { success: false, error: error.message }
    }
  }

  // Usuwanie naprawy
  const deleteRepair = async (machineId, repairId) => {
    try {
      const machineRef = doc(db, 'garage', machineId)
      const machineDoc = await getDoc(machineRef)
      
      if (!machineDoc.exists()) {
        return { success: false, error: 'Maszyna nie istnieje' }
      }

      const machine = machineDoc.data()
      const repairs = machine.repairs || []
      const filteredRepairs = repairs.filter(repair => repair.id !== repairId)
      
      await updateDoc(machineRef, {
        repairs: filteredRepairs,
        lastUpdate: Timestamp.now()
      })
      
      return { success: true }
    } catch (error) {
      console.error('Błąd przy usuwaniu naprawy:', error)
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
    addRepair,
    deleteRepair
  }
}