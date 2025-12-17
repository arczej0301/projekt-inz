import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  onSnapshot,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

const ANIMALS_COLLECTION = 'animals';

let animalsCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000;

const clearCache = () => {
  animalsCache = null;
  lastFetchTime = 0;
};

export const getAnimals = async () => {
  if (animalsCache && Date.now() - lastFetchTime < CACHE_DURATION) {
    return animalsCache;
  }
  try {
    const querySnapshot = await getDocs(collection(db, ANIMALS_COLLECTION));
    const animals = [];
    querySnapshot.forEach((doc) => {
      animals.push({ id: doc.id, ...doc.data() });
    });
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
      animalsCache = animals;
      lastFetchTime = Date.now();
      callback(animals);
    },
    (error) => console.error('Error subscription:', error)
  );
};

export const addAnimal = async (animalData) => {
  try {
    const docRef = await addDoc(collection(db, ANIMALS_COLLECTION), {
      ...animalData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    clearCache();
    return docRef.id;
  } catch (error) {
    console.error('Error adding animal:', error);
    throw error;
  }
};

// --- NOWOŚĆ: Funkcja do dodawania wpisu w historii ---
export const addAnimalHistory = async (animalId, type, description) => {
  try {
    await addDoc(collection(db, 'animal_history'), {
      animalId,
      type,
      description,
      date: new Date()
    });
  } catch (error) {
    console.error('Błąd dodawania historii:', error);
    throw error; // Rzucamy błąd, aby UI mogło pokazać alert
  }
};

// --- ZMODYFIKOWANO: Automatyczne dodawanie historii przy edycji ---
export const updateAnimal = async (animalId, animalData, oldAnimalData = null) => {
  try {
    const animalRef = doc(db, ANIMALS_COLLECTION, animalId);
    await updateDoc(animalRef, {
      ...animalData,
      updatedAt: new Date()
    });

    // Detekcja zmian
    if (oldAnimalData) {
      if (animalData.status && animalData.status !== oldAnimalData.status) {
        await addAnimalHistory(animalId, 'Zmiana statusu', `Status zmieniony z "${oldAnimalData.status}" na "${animalData.status}"`);
      }
      if (animalData.health && animalData.health !== oldAnimalData.health) {
        await addAnimalHistory(animalId, 'Zmiana zdrowia', `Stan zdrowia: ${oldAnimalData.health} -> ${animalData.health}`);
      }
      // Porównujemy wagi jako liczby
      const newWeight = parseFloat(animalData.weight || 0);
      const oldWeight = parseFloat(oldAnimalData.weight || 0);
      if (newWeight !== oldWeight && newWeight > 0) {
        await addAnimalHistory(animalId, 'Ważenie', `Nowa waga: ${newWeight} kg (było: ${oldWeight} kg)`);
      }
      // Jeśli zmieniono notatki
      if (animalData.notes && animalData.notes !== oldAnimalData.notes) {
        await addAnimalHistory(animalId, 'Notatka', 'Zaktualizowano notatki');
      }
    } else {
      // Fallback
      await addAnimalHistory(animalId, 'Edycja', 'Zaktualizowano dane zwierzęcia');
    }
    
    clearCache();
  } catch (error) {
    console.error('Error updating animal:', error);
    throw error;
  }
};

export const deleteAnimal = async (animalId) => {
  try {
    await deleteDoc(doc(db, ANIMALS_COLLECTION, animalId));
    clearCache();
  } catch (error) {
    console.error('Error deleting animal:', error);
    throw error;
  }
};

export const getAnimalHistory = async (animalId) => {
  try {
    const historyQuery = query(
      collection(db, 'animal_history'),
      where('animalId', '==', animalId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(historyQuery);
    const history = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() });
    });
    return history;
  } catch (error) {
    console.error('Error getting history:', error);
    throw error;
  }
};

export const clearAnimalsCache = () => clearCache();