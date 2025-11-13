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
  orderBy,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { MagazineItem } from '../models/MagazineItem';

export const magazineService = {
  // Pobierz wszystkie przedmioty
  async getAllItems() {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'magazine'), orderBy('name'))
      );
      return querySnapshot.docs.map(doc => 
        new MagazineItem(doc.id, ...Object.values(doc.data()))
      );
    } catch (error) {
      console.error('Błąd pobierania przedmiotów:', error);
      throw error;
    }
  },

  // Pobierz przedmioty według kategorii
  async getItemsByCategory(category) {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'magazine'), 
        where('category', '==', category),
        orderBy('name'))
      );
      return querySnapshot.docs.map(doc => 
        new MagazineItem(doc.id, ...Object.values(doc.data()))
      );
    } catch (error) {
      console.error('Błąd pobierania przedmiotów:', error);
      throw error;
    }
  },

  // Dodaj nowy przedmiot
  async addItem(itemData) {
    try {
      const docRef = await addDoc(collection(db, 'magazine'), {
        ...itemData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Błąd dodawania przedmiotu:', error);
      throw error;
    }
  },

  // Aktualizuj przedmiot
  async updateItem(itemId, itemData) {
    try {
      const itemRef = doc(db, 'magazine', itemId);
      await updateDoc(itemRef, {
        ...itemData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Błąd aktualizacji przedmiotu:', error);
      throw error;
    }
  },

  // Usuń przedmiot
  async deleteItem(itemId) {
    try {
      await deleteDoc(doc(db, 'magazine', itemId));
    } catch (error) {
      console.error('Błąd usuwania przedmiotu:', error);
      throw error;
    }
  },

  // Subskrybuj zmiany w magazynie (real-time updates)
  subscribeToMagazine(callback) {
    return onSnapshot(
      query(collection(db, 'magazine'), orderBy('name')), 
      (snapshot) => {
        const items = snapshot.docs.map(doc => 
          new MagazineItem(doc.id, ...Object.values(doc.data()))
        );
        callback(items);
      }
    );
  },

  // Pobierz przedmioty z niskim stanem
  async getLowStockItems() {
    try {
      const querySnapshot = await getDocs(collection(db, 'magazine'));
      return querySnapshot.docs
        .map(doc => new MagazineItem(doc.id, ...Object.values(doc.data())))
        .filter(item => item.quantity <= item.minQuantity);
    } catch (error) {
      console.error('Błąd pobierania niskich stanów:', error);
      throw error;
    }
  }
};
