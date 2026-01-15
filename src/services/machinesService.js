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

const MACHINES_COLLECTION = 'garage';
const MACHINES_HISTORY_COLLECTION = 'machine_history';

// --- MASZYNY ---

export const getMachines = async () => {
    try {
        const q = query(collection(db, MACHINES_COLLECTION), orderBy('name'));
        const querySnapshot = await getDocs(q);
        const machines = [];
        querySnapshot.forEach((doc) => {
            machines.push({ id: doc.id, ...doc.data() });
        });
        return machines;
    } catch (error) {
        console.error('Error getting machines:', error);
        throw error;
    }
};

export const subscribeToMachines = (callback) => {
    const q = query(collection(db, MACHINES_COLLECTION), orderBy('name'));
    return onSnapshot(q,
        (querySnapshot) => {
            const machines = [];
            querySnapshot.forEach((doc) => {
                machines.push({ id: doc.id, ...doc.data() });
            });
            callback(machines);
        },
        (error) => console.error('Error machine subscription:', error)
    );
};

export const addMachine = async (machineData) => {
    try {
        const docRef = await addDoc(collection(db, MACHINES_COLLECTION), {
            ...machineData,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Log history
        await addMachineHistory(docRef.id, 'Nowa maszyna', `Dodano maszynę: ${machineData.name}`);

        return docRef.id;
    } catch (error) {
        console.error('Error adding machine:', error);
        throw error;
    }
};

export const updateMachine = async (machineId, machineData, oldMachineData = null) => {
    try {
        const machineRef = doc(db, MACHINES_COLLECTION, machineId);
        await updateDoc(machineRef, {
            ...machineData,
            updatedAt: new Date()
        });

        // Log history based on changes
        if (oldMachineData) {
            if (machineData.status && machineData.status !== oldMachineData.status) {
                await addMachineHistory(machineId, 'Zmiana statusu', `Status: ${oldMachineData.status} -> ${machineData.status}`);
            }
            if (machineData.nextService && machineData.nextService !== oldMachineData.nextService) {
                await addMachineHistory(machineId, 'Zaplanowano serwis', `Termin: ${machineData.nextService}`);
            }
        } else {
            await addMachineHistory(machineId, 'Aktualizacja', 'Zaktualizowano dane maszyny');
        }

        return true;
    } catch (error) {
        console.error('Error updating machine:', error);
        throw error;
    }
};

export const deleteMachine = async (machineId) => {
    try {
        await deleteDoc(doc(db, MACHINES_COLLECTION, machineId));
        await addMachineHistory(machineId, 'Usunięcie', 'Usunięto maszynę z systemu');
        return true;
    } catch (error) {
        console.error('Error deleting machine:', error);
        throw error;
    }
};

// --- HISTORIA ---

export const addMachineHistory = async (machineId, type, description) => {
    try {
        await addDoc(collection(db, MACHINES_HISTORY_COLLECTION), {
            machineId,
            type,
            description,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error adding machine history:', error);
        throw error; // Propagate error
    }
};

export const getMachineHistory = async (machineId) => {
    try {
        const q = query(
            collection(db, MACHINES_HISTORY_COLLECTION),
            where('machineId', '==', machineId),
            orderBy('timestamp', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const history = [];
        querySnapshot.forEach((doc) => {
            history.push({ id: doc.id, ...doc.data() });
        });
        return history;
    } catch (error) {
        console.error('Error getting machine history:', error);
        return [];
    }
};

// Subskrypcja globalna dla Dashboardu
export const subscribeToMachineLogs = (limitCount = 20, callback) => {
    const q = query(
        collection(db, MACHINES_HISTORY_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    );

    return onSnapshot(q,
        (querySnapshot) => {
            const logs = [];
            querySnapshot.forEach((doc) => {
                logs.push({ id: doc.id, ...doc.data() });
            });
            callback(logs);
        },
        (error) => console.error('Error in machine logs subscription:', error)
    );
};
