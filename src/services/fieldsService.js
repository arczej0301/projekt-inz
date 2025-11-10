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
  where,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

const FIELDS_COLLECTION = 'fields';
const FIELD_STATUS_COLLECTION = 'field_status';

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

// NOWE FUNKCJE DLA STATUSÓW PÓL - POPRAWIONE

// Pobierz status dla konkretnego pola - BEZ ZŁOŻONEGO ZAPYTania
export const getFieldStatus = async (fieldId) => {
  try {
    const querySnapshot = await getDocs(collection(db, FIELD_STATUS_COLLECTION));
    let latestStatus = null;
    let latestDate = null;

    querySnapshot.forEach((doc) => {
      const statusData = doc.data();
      if (statusData.field_id === fieldId) {
        const statusDate = new Date(statusData.date_created || statusData.date_updated);
        if (!latestDate || statusDate > latestDate) {
          latestDate = statusDate;
          latestStatus = {
            id: doc.id,
            ...statusData
          };
        }
      }
    });

    return latestStatus;
  } catch (error) {
    console.error('Error getting field status:', error);
    throw error;
  }
};

// Pobierz wszystkie statusy dla wszystkich pól
export const getAllFieldStatuses = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, FIELD_STATUS_COLLECTION));
    const statuses = {};
    
    querySnapshot.forEach((doc) => {
      const statusData = doc.data();
      const fieldId = statusData.field_id;
      
      if (fieldId) {
        const currentStatus = statuses[fieldId];
        const currentDate = currentStatus ? new Date(currentStatus.date_created || currentStatus.date_updated) : null;
        const newDate = new Date(statusData.date_created || statusData.date_updated);
        
        if (!currentDate || newDate > currentDate) {
          statuses[fieldId] = {
            id: doc.id,
            ...statusData
          };
        }
      }
    });
    
    return statuses;
  } catch (error) {
    console.error('Error getting all field statuses:', error);
    throw error;
  }
};

// Dodaj nowy status pola
export const addFieldStatus = async (statusData) => {
  try {
    const docRef = await addDoc(collection(db, FIELD_STATUS_COLLECTION), {
      ...statusData,
      date_created: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding field status:', error);
    throw error;
  }
};

// Aktualizuj status pola
export const updateFieldStatus = async (statusId, statusData) => {
  try {
    await updateDoc(doc(db, FIELD_STATUS_COLLECTION, statusId), {
      ...statusData,
      date_updated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating field status:', error);
    throw error;
  }
};

// Subskrybuj zmiany w statusach - POPRAWIONE
export const subscribeToFieldStatus = (callback) => {
  return onSnapshot(collection(db, FIELD_STATUS_COLLECTION), 
    (querySnapshot) => {
      const statuses = {};
      
      querySnapshot.forEach((doc) => {
        const statusData = doc.data();
        const fieldId = statusData.field_id;
        
        if (fieldId) {
          const currentStatus = statuses[fieldId];
          const currentDate = currentStatus ? new Date(currentStatus.date_created || currentStatus.date_updated) : null;
          const newDate = new Date(statusData.date_created || statusData.date_updated);
          
          if (!currentDate || newDate > currentDate) {
            statuses[fieldId] = {
              id: doc.id,
              ...statusData
            };
          }
        }
      });
      
      callback(statuses);
    },
    (error) => {
      console.error('Error in field status subscription:', error);
    }
  );
};