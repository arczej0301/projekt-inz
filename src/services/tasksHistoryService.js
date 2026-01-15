import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    limit,
    Timestamp
} from 'firebase/firestore';

const TASKS_HISTORY_COLLECTION = 'task_history';

/**
 * Log a task history event.
 * @param {string} taskId - The ID of the task.
 * @param {string} type - Event type: 'create', 'update', 'status_change', 'complete'.
 * @param {string} description - Description of the event.
 * @param {string} taskTitle - Title of the task for easier display.
 */
export const addTaskLog = async (taskId, type, description, taskTitle) => {
    try {
        await addDoc(collection(db, TASKS_HISTORY_COLLECTION), {
            taskId,
            type,
            description,
            taskTitle: taskTitle || 'Zadanie',
            timestamp: Timestamp.now()
        });
    } catch (error) {
        console.error('Error adding task log:', error);
    }
};

/**
 * Subscribe to task history logs for dashboard.
 * @param {number} limitCount - Number of logs to fetch.
 * @param {function} callback - Callback function with logs.
 */
export const subscribeToTaskLogs = (limitCount = 20, callback) => {
    const q = query(
        collection(db, TASKS_HISTORY_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    );

    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(logs);
    });
};
