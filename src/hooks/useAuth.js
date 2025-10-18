// hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Sprawdzanie statusu autentykacji
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        setLastActivity(Date.now());
        setShowWarning(false);
      }
    });

    return unsubscribe;
  }, []);

  // System automatycznego wylogowania po nieaktywności
  useEffect(() => {
    if (!user) {
      setShowWarning(false);
      return;
    }

      // Przykładowe konfiguracje:
        // Dla 2 minut: INACTIVITY_TIMEOUT = 120000, WARNING_TIME = 110000
        // Dla 5 minut: INACTIVITY_TIMEOUT = 300000, WARNING_TIME = 240000
        // Dla 10 minut: INACTIVITY_TIMEOUT = 600000, WARNING_TIME = 540000

    const INACTIVITY_TIMEOUT = 600000; // 1 minuta
    const WARNING_TIME = 590000; // 50 sekund - pokaż ostrzeżenie na 10 sekund przed
    const CHECK_INTERVAL = 1000; // Sprawdzaj co 1 sekundę

    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'keydown', 'input'
    ];

    const updateActivity = () => {
      setLastActivity(Date.now());
      setShowWarning(false);
    };

    // Dodaj event listeners dla aktywności użytkownika
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    const inactivityCheck = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastActivity;
      
      // Pokazuj ostrzeżenie na 10 sekund przed wylogowaniem
      if (inactiveTime > WARNING_TIME && inactiveTime < INACTIVITY_TIMEOUT) {
        const timeLeft = Math.ceil((INACTIVITY_TIMEOUT - inactiveTime) / 1000);
        setCountdown(timeLeft);
        setShowWarning(true);
      } 
      // Wyloguj po 1 minucie nieaktywności
      else if (inactiveTime >= INACTIVITY_TIMEOUT) {
        console.log('Automatyczne wylogowanie z powodu nieaktywności');
        setShowWarning(false);
        logout();
        clearInterval(inactivityCheck);
      }
      // Ukryj ostrzeżenie jeśli użytkownik jest aktywny
      else {
        setShowWarning(false);
      }
    }, CHECK_INTERVAL);

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(inactivityCheck);
      setShowWarning(false);
    };
  }, [user, lastActivity]);

  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setLastActivity(Date.now());
      setShowWarning(false);
      return { success: true, user: result.user };
    } catch (error) {
      let errorMessage = 'Błąd logowania';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Nieprawidłowy adres email';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Użytkownik nie istnieje';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Nieprawidłowe hasło';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Zbyt wiele prób logowania. Spróbuj później';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setLastActivity(Date.now());
      setShowWarning(false);
      return { success: true, user: result.user };
    } catch (error) {
      let errorMessage = 'Błąd logowania przez Google';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Okno logowania zostało zamknięte';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setShowWarning(false);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Funkcja do ręcznej aktualizacji aktywności
  const updateUserActivity = useCallback(() => {
    if (user) {
      setLastActivity(Date.now());
      setShowWarning(false);
    }
  }, [user]);

  return {
    user,
    loading,
    loginWithEmail,
    loginWithGoogle,
    logout,
    updateUserActivity,
    showWarning,
    countdown
  };
};