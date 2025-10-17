import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';

const ANIMALS_COLLECTION = 'animals';

// Zmienne cache w module (globalne dla tego pliku)
let animalsCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // 30 sekund cache

// Funkcja do czyszczenia cache (może być używana w różnych funkcjach)
const clearCache = () => {
  animalsCache = null;
  lastFetchTime = 0;
};

export const getAnimals = async () => {
  // Zwróć dane z cache jeśli są świeże
  if (animalsCache && Date.now() - lastFetchTime < CACHE_DURATION) {
    return animalsCache;
  }

  try {
    const querySnapshot = await getDocs(collection(db, ANIMALS_COLLECTION));
    const animals = [];
    querySnapshot.forEach((doc) => {
      animals.push({ id: doc.id, ...doc.data() });
    });
    
    // Zapisz w cache
    animalsCache = animals;
    lastFetchTime = Date.now();
    
    return animals;
  } catch (error) {
    console.error('Error getting animals:', error);
    throw error;
  }
};

export const subscribeToAnimals = (callback) => {
  const q = query(collection(db, ANIMALS_COLLECTION), orderBy('name'));
  
  return onSnapshot(q, 
    (querySnapshot) => {
      const animals = [];
      querySnapshot.forEach((doc) => {
        animals.push({ id: doc.id, ...doc.data() });
      });
      
      // Aktualizuj cache
      animalsCache = animals;
      lastFetchTime = Date.now();
      
      callback(animals);
    },
    (error) => {
      console.error('Error in animals subscription:', error);
    }
  );
};

export const addAnimal = async (animalData) => {
  try {
    const docRef = await addDoc(collection(db, ANIMALS_COLLECTION), {
      ...animalData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Wyczyść cache po dodaniu nowego zwierzęcia
    clearCache();
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding animal:', error);
    throw error;
  }
};

export const updateAnimal = async (animalId, animalData) => {
  try {
    const animalRef = doc(db, ANIMALS_COLLECTION, animalId);
    await updateDoc(animalRef, {
      ...animalData,
      updatedAt: new Date()
    });
    
    // Wyczyść cache po aktualizacji
    clearCache();
    
  } catch (error) {
    console.error('Error updating animal:', error);
    throw error;
  }
};

export const deleteAnimal = async (animalId) => {
  try {
    await deleteDoc(doc(db, ANIMALS_COLLECTION, animalId));
    
    // Wyczyść cache po usunięciu
    clearCache();
    
  } catch (error) {
    console.error('Error deleting animal:', error);
    throw error;
  }
};

// Opcjonalnie: funkcja do ręcznego czyszczenia cache
export const clearAnimalsCache = () => {
  clearCache();
};