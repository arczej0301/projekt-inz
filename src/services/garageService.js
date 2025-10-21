
import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query,
  where,
  orderBy 
} from 'firebase/firestore';

const garageCollection = collection(db, 'garage');

export const garageService = {
  // Pobierz wszystkie maszyny
  async getAllMachines() {
    const snapshot = await getDocs(query(garageCollection, orderBy('name')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Pobierz maszynę po ID
  async getMachine(id) {
    const docRef = doc(db, 'garage', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  // Dodaj nową maszynę
  async addMachine(machine) {
    return await addDoc(garageCollection, {
      ...machine,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  },

  // Aktualizuj maszynę
  async updateMachine(id, machine) {
    const docRef = doc(db, 'garage', id);
    await updateDoc(docRef, {
      ...machine,
      updatedAt: new Date()
    });
  },

  // Usuń maszynę
  async deleteMachine(id) {
    const docRef = doc(db, 'garage', id);
    await deleteDoc(docRef);
  },

  // Pobierz maszyny wymagające przeglądu
  async getMachinesNeedingService() {
    const q = query(
      garageCollection, 
      where('nextService', '<=', new Date()),
      orderBy('nextService')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Pobierz maszyny po kategorii
  async getMachinesByCategory(category) {
    const q = query(
      garageCollection, 
      where('category', '==', category),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};