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

const FIELDS_COLLECTION = 'fields';

// Cache dla pól
let fieldsCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000;

const clearCache = () => {
  fieldsCache = null;
  lastFetchTime = 0;
};

export const getFields = async () => {
  if (fieldsCache && Date.now() - lastFetchTime < CACHE_DURATION) {
    return fieldsCache;
  }

  try {
    const querySnapshot = await getDocs(collection(db, FIELDS_COLLECTION));
    const fields = [];
    querySnapshot.forEach((doc) => {
      fields.push({ id: doc.id, ...doc.data() });
    });
    
    fieldsCache = fields;
    lastFetchTime = Date.now();
    
    return fields;
  } catch (error) {
    console.error('Error getting fields:', error);
    throw error;
  }
};

export const subscribeToFields = (callback) => {
  const q = query(collection(db, FIELDS_COLLECTION), orderBy('name'));
  
  return onSnapshot(q, 
    (querySnapshot) => {
      const fields = [];
      querySnapshot.forEach((doc) => {
        fields.push({ id: doc.id, ...doc.data() });
      });
      
      fieldsCache = fields;
      lastFetchTime = Date.now();
      
      callback(fields);
    },
    (error) => {
      console.error('Error in fields subscription:', error);
    }
  );
};

export const addField = async (fieldData) => {
  try {
    const docRef = await addDoc(collection(db, FIELDS_COLLECTION), {
      ...fieldData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    clearCache();
    return docRef.id;
  } catch (error) {
    console.error('Error adding field:', error);
    throw error;
  }
};

export const updateField = async (fieldId, fieldData) => {
  try {
    const fieldRef = doc(db, FIELDS_COLLECTION, fieldId);
    await updateDoc(fieldRef, {
      ...fieldData,
      updatedAt: new Date()
    });
    
    clearCache();
  } catch (error) {
    console.error('Error updating field:', error);
    throw error;
  }
};

export const deleteField = async (fieldId) => {
  try {
    await deleteDoc(doc(db, FIELDS_COLLECTION, fieldId));
    clearCache();
  } catch (error) {
    console.error('Error deleting field:', error);
    throw error;
  }
};