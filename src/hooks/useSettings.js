// hooks/useSettings.js
import { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './useAuth';

export const useSettings = () => {
  const { user } = useAuth();
  const [companySettings, setCompanySettings] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Domyślne ustawienia firmy
  const defaultCompanySettings = {
    name: '',
    address: '',
    nip: '',
    regon: '',
    areaUnit: 'ha',
    currency: 'PLN',
    updatedAt: new Date().toISOString()
  };

  // Domyślne ustawienia powiadomień
  const defaultNotificationSettings = {
    emailNotifications: true,
    smsNotifications: false,
    financialAlerts: true,
    taskReminders: true,
    reportAlerts: false,
    lowStockAlerts: true,
    updatedAt: new Date().toISOString()
  };

  // Pobierz ustawienia firmy
  useEffect(() => {
    if (!user) {
      setCompanySettings(defaultCompanySettings);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'companySettings', user.uid),
      (doc) => {
        if (doc.exists()) {
          setCompanySettings(doc.data());
        } else {
          setCompanySettings(defaultCompanySettings);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Błąd pobierania ustawień firmy:', error);
        setCompanySettings(defaultCompanySettings);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  // Pobierz ustawienia powiadomień
  useEffect(() => {
    if (!user) {
      setNotificationSettings(defaultNotificationSettings);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'notificationSettings', user.uid),
      (doc) => {
        if (doc.exists()) {
          setNotificationSettings(doc.data());
        } else {
          setNotificationSettings(defaultNotificationSettings);
        }
      },
      (error) => {
        console.error('Błąd pobierania ustawień powiadomień:', error);
        setNotificationSettings(defaultNotificationSettings);
      }
    );

    return unsubscribe;
  }, [user]);

  // Zapisz ustawienia firmy
  const saveCompanySettings = async (settings) => {
    if (!user) return { success: false, error: 'Brak użytkownika' };
    
    try {
      const settingsWithTimestamp = {
        ...settings,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'companySettings', user.uid), settingsWithTimestamp, { merge: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Zapisz ustawienia powiadomień
  const saveNotificationSettings = async (settings) => {
    if (!user) return { success: false, error: 'Brak użytkownika' };
    
    try {
      const settingsWithTimestamp = {
        ...settings,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'notificationSettings', user.uid), settingsWithTimestamp, { merge: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return {
    companySettings,
    notificationSettings,
    loading,
    saveCompanySettings,
    saveNotificationSettings
  };
};