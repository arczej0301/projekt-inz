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
const FIELD_YIELDS_COLLECTION = 'field_yields';
const FIELD_COSTS_COLLECTION = 'field_costs';

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

// FUNKCJE DLA STATUSÓW PÓL

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

// NOWE FUNKCJE DLA ZBIORÓW

export const addFieldYield = async (yieldData) => {
  try {
    const docRef = await addDoc(collection(db, FIELD_YIELDS_COLLECTION), {
      ...yieldData,
      date_created: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding field yield:', error);
    throw error;
  }
};

export const getFieldYields = async (fieldId) => {
  try {
    const q = query(
      collection(db, FIELD_YIELDS_COLLECTION),
      where("field_id", "==", fieldId),
      orderBy("date_created", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const yields = [];
    querySnapshot.forEach((doc) => {
      yields.push({ id: doc.id, ...doc.data() });
    });
    
    return yields;
  } catch (error) {
    console.error('Error getting field yields:', error);
    throw error;
  }
};

export const getLatestFieldYield = async (fieldId) => {
  try {
    const q = query(
      collection(db, FIELD_YIELDS_COLLECTION),
      where("field_id", "==", fieldId),
      orderBy("date_created", "desc"),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting latest field yield:', error);
    throw error;
  }
};

export const getAllFieldYields = async () => {
  try {
    const q = query(
      collection(db, FIELD_YIELDS_COLLECTION),
      orderBy("date_created", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const yields = [];
    querySnapshot.forEach((doc) => {
      yields.push({ id: doc.id, ...doc.data() });
    });
    
    return yields;
  } catch (error) {
    console.error('Error getting all field yields:', error);
    throw error;
  }
};

// NOWE FUNKCJE DLA KOSZTÓW

export const addFieldCost = async (costData) => {
  try {
    const docRef = await addDoc(collection(db, FIELD_COSTS_COLLECTION), {
      ...costData,
      date_created: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding field cost:', error);
    throw error;
  }
};

export const getFieldCosts = async (fieldId) => {
  try {
    const q = query(
      collection(db, FIELD_COSTS_COLLECTION),
      where("field_id", "==", fieldId),
      orderBy("date_created", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const costs = [];
    querySnapshot.forEach((doc) => {
      costs.push({ id: doc.id, ...doc.data() });
    });
    
    return costs;
  } catch (error) {
    console.error('Error getting field costs:', error);
    throw error;
  }
};

export const getFieldTotalCost = async (fieldId) => {
  try {
    const q = query(
      collection(db, FIELD_COSTS_COLLECTION),
      where("field_id", "==", fieldId)
    );
    
    const querySnapshot = await getDocs(q);
    let total = 0;
    querySnapshot.forEach((doc) => {
      const costData = doc.data();
      total += parseFloat(costData.total_cost) || 0;
    });
    
    return total;
  } catch (error) {
    console.error('Error calculating total cost:', error);
    return 0;
  }
};

export const getAllFieldCosts = async () => {
  try {
    const q = query(
      collection(db, FIELD_COSTS_COLLECTION),
      orderBy("date_created", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const costs = [];
    querySnapshot.forEach((doc) => {
      costs.push({ id: doc.id, ...doc.data() });
    });
    
    return costs;
  } catch (error) {
    console.error('Error getting all field costs:', error);
    throw error;
  }
};

// Subskrybuj zmiany w statusach
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

// Subskrybuj zmiany w zbiorach
export const subscribeToFieldYields = (callback) => {
  return onSnapshot(collection(db, FIELD_YIELDS_COLLECTION), 
    (querySnapshot) => {
      const yields = [];
      querySnapshot.forEach((doc) => {
        yields.push({ id: doc.id, ...doc.data() });
      });
      callback(yields);
    },
    (error) => {
      console.error('Error in field yields subscription:', error);
    }
  );
};

// Subskrybuj zmiany w kosztach
export const subscribeToFieldCosts = (callback) => {
  return onSnapshot(collection(db, FIELD_COSTS_COLLECTION), 
    (querySnapshot) => {
      const costs = [];
      querySnapshot.forEach((doc) => {
        costs.push({ id: doc.id, ...doc.data() });
      });
      callback(costs);
    },
    (error) => {
      console.error('Error in field costs subscription:', error);
    }
  );
};

// Dodaj to do fieldsService.js (wymagane dla osi czasu)
export const getFieldStatusHistory = async (fieldId) => {
  try {
    const q = query(
      collection(db, FIELD_STATUS_COLLECTION),
      where("field_id", "==", fieldId),
      orderBy("date_created", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const statuses = [];
    querySnapshot.forEach((doc) => {
      statuses.push({ id: doc.id, ...doc.data() });
    });
    
    return statuses;
  } catch (error) {
    console.error('Error getting field status history:', error);
    return [];
  }
};

// Nowa funkcja do pobierania surowej historii statusów (dla Dashboardu)
export const getFieldStatusLogs = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, FIELD_STATUS_COLLECTION),
      orderBy("date_created", "desc"), // Sortowanie od najnowszych
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const logs = [];
    querySnapshot.forEach((doc) => {
      logs.push({ id: doc.id, ...doc.data() });
    });
    
    return logs;
  } catch (error) {
    console.error('Error getting field status logs:', error);
    return [];
  }
};

// fieldsService.js - DODAJ NA KONIEC PLIKU

// Funkcja do analizy wydajności upraw
export const getCropPerformance = async () => {
  try {
    // 1. Pobierz wszystkie zbiory
    const yields = await getAllFieldYields();
    
    // 2. Pobierz wszystkie pola (dla powierzchni)
    const fields = await getFields();
    
    // 3. Grupuj dane według uprawy
    const cropMap = {};
    
    // Inicjalizacja dla każdej uprawy
    yields.forEach(yieldData => {
      const crop = yieldData.crop;
      if (!cropMap[crop]) {
        cropMap[crop] = {
          crop,
          totalArea: 0,
          totalYield: 0,
          yieldCount: 0,
          averageYieldPerHectare: 0,
          fields: [],
          yields: []
        };
      }
      
      cropMap[crop].totalYield += parseFloat(yieldData.amount) || 0;
      cropMap[crop].yields.push(yieldData);
    });
    
    // 4. Oblicz powierzchnię dla każdej uprawy
    fields.forEach(field => {
      const crop = field.crop;
      if (crop && cropMap[crop]) {
        cropMap[crop].totalArea += parseFloat(field.area) || 0;
        cropMap[crop].fields.push(field.id);
      }
    });
    
    // 5. Oblicz średnią wydajność
    Object.keys(cropMap).forEach(crop => {
      const cropData = cropMap[crop];
      if (cropData.totalArea > 0) {
        cropData.averageYieldPerHectare = cropData.totalYield / cropData.totalArea;
      }
      cropData.yieldCount = cropData.yields.length;
    });
    
    // 6. Przekształć na tablicę i posortuj
    const cropPerformance = Object.values(cropMap)
      .filter(crop => crop.totalArea > 0) // Tylko uprawy z przypisanymi polami
      .sort((a, b) => b.totalYield - a.totalYield); // Sortuj malejąco według plonu
    
    return cropPerformance;
    
  } catch (error) {
    console.error('Error calculating crop performance:', error);
    return [];
  }
};

// Funkcja do szczegółowej analizy pola
export const getFieldDetailedAnalytics = async (fieldId) => {
  try {
    // Pobierz dane z różnych źródeł
    const [fieldData, yields, costs, statusHistory] = await Promise.all([
      getField(fieldId), // Musisz dodać tę funkcję lub użyć getFields + find
      getFieldYields(fieldId),
      getFieldCosts(fieldId),
      getFieldStatusHistory(fieldId)
    ]);
    
    const field = fieldData || {};
    
    // Oblicz kluczowe wskaźniki
    const totalYield = yields.reduce((sum, y) => sum + (parseFloat(y.amount) || 0), 0);
    const totalCost = costs.reduce((sum, c) => sum + (parseFloat(c.total_cost) || 0), 0);
    const totalArea = parseFloat(field.area) || 1; // unikaj dzielenia przez 0
    
    // Znajdź ostatni zbiór
    const lastYield = yields.length > 0 
      ? yields.sort((a, b) => new Date(b.date_created) - new Date(a.date_created))[0]
      : null;
    
    return {
      fieldInfo: {
        id: field.id,
        name: field.name,
        area: field.area,
        crop: field.crop,
        soil: field.soil
      },
      metrics: {
        totalYield,
        totalCost,
        averageYieldPerHectare: totalArea > 0 ? totalYield / totalArea : 0,
        costPerHectare: totalArea > 0 ? totalCost / totalArea : 0,
        profitPerHectare: totalArea > 0 ? (totalYield - totalCost) / totalArea : 0
      },
      lastYield: lastYield ? {
        date: lastYield.date_created,
        amount: lastYield.amount,
        crop: lastYield.crop,
        yieldPerHectare: totalArea > 0 ? lastYield.amount / totalArea : 0
      } : null,
      history: {
        yieldCount: yields.length,
        yieldHistory: yields.slice(0, 5), // Ostatnie 5 zbiorów
        statusChanges: statusHistory.length,
        latestStatus: statusHistory[0] || null
      },
      rawData: {
        yields,
        costs: costs.slice(0, 10), // Ostatnie 10 kosztów
        statusHistory: statusHistory.slice(0, 10) // Ostatnie 10 zmian statusu
      }
    };
    
  } catch (error) {
    console.error('Error getting field analytics:', error);
    throw error;
  }
};

// Funkcja pomocnicza do pobierania pojedynczego pola
export const getField = async (fieldId) => {
  try {
    const fields = await getFields();
    return fields.find(f => f.id === fieldId) || null;
  } catch (error) {
    console.error('Error getting field:', error);
    throw error;
  }
};