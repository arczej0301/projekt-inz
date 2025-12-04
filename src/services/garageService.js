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
const repairsCollection = collection(db, 'repairs'); // Nowa kolekcja

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
    
    // Usuń również powiązane naprawy
    const repairsQuery = query(repairsCollection, where('machineId', '==', id));
    const repairsSnapshot = await getDocs(repairsQuery);
    repairsSnapshot.docs.forEach(async (repairDoc) => {
      await deleteDoc(doc(db, 'repairs', repairDoc.id));
    });
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
  },

  // =========== NOWE FUNKCJE DLA HISTORII NAPRAW ===========

  // Dodaj naprawę
  async addRepair(repairData) {
    return await addDoc(repairsCollection, {
      ...repairData,
      createdAt: new Date()
    });
  },


  // Pobierz historię napraw dla maszyny
async getRepairHistory(machineId) {
  try {
    const q = query(
      repairsCollection, 
      where('machineId', '==', machineId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const repairs = snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data 
      };
    });
    
    return repairs;
  } catch (error) {
    console.error('❌ Błąd w getRepairHistory:', error);
    return [];
  }
},

  // Usuń naprawę
  async deleteRepair(repairId) {
    const docRef = doc(db, 'repairs', repairId);
    await deleteDoc(docRef);
  },

  // Aktualizuj naprawę
  async updateRepair(repairId, repairData) {
    const docRef = doc(db, 'repairs', repairId);
    await updateDoc(docRef, {
      ...repairData,
      updatedAt: new Date()
    });
  }
};