// hooks/useAuth.js - PRZEPISANA WERSJA BEZ PROBLEMÓW
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const lastActivityRef = useRef(Date.now());
  const showWarningRef = useRef(false); // Dodajemy ref dla showWarning

  // Sprawdzanie statusu autentykacji - TEN EFFECT NIE MA PROBLEMÓW
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        lastActivityRef.current = Date.now();
        setShowWarning(false);
        showWarningRef.current = false;
      }
    });

    return unsubscribe;
  }, []);

  // SYSTEM NIEAKTYWNOŚCI - UPROSZCZONY BEZ SETSTATE W EFFECT
  useEffect(() => {
    if (!user) {
      return;
    }

    const INACTIVITY_TIMEOUT = 600000; // 10 minut
    const WARNING_TIME = 540000; // 9 minut
    const CHECK_INTERVAL = 5000; // Sprawdzaj co 5 sekund (zamiast co 1s)

    const activityEvents = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 
      'touchstart', 'click', 'keydown', 'input'
    ];

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      if (showWarningRef.current) {
        setShowWarning(false);
        showWarningRef.current = false;
      }
    };

    // Dodaj event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    let inactivityCheck;
    
    // Opóźnione uruchomienie checkera (daje czas na inicjalizację)
    const startInactivityCheck = setTimeout(() => {
      inactivityCheck = setInterval(() => {
        const now = Date.now();
        const inactiveTime = now - lastActivityRef.current;
        
        // Pokazuj ostrzeżenie
        if (inactiveTime > WARNING_TIME && inactiveTime < INACTIVITY_TIMEOUT) {
          const timeLeft = Math.ceil((INACTIVITY_TIMEOUT - inactiveTime) / 1000);
          setCountdown(timeLeft);
          if (!showWarningRef.current) {
            setShowWarning(true);
            showWarningRef.current = true;
          }
        } 
        // Wyloguj po timeout
        else if (inactiveTime >= INACTIVITY_TIMEOUT) {
          console.log('Automatyczne wylogowanie z powodu nieaktywności');
          setShowWarning(false);
          showWarningRef.current = false;
          logout();
          clearInterval(inactivityCheck);
        }
        // Ukryj ostrzeżenie jeśli użytkownik jest aktywny
        else if (showWarningRef.current && inactiveTime < WARNING_TIME) {
          setShowWarning(false);
          showWarningRef.current = false;
        }
      }, CHECK_INTERVAL);
    }, 1000); // Opóźnienie 1 sekunda

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      clearTimeout(startInactivityCheck);
      if (inactivityCheck) {
        clearInterval(inactivityCheck);
      }
      setShowWarning(false);
      showWarningRef.current = false;
    };
  }, [user]); // TYLKO user w zależnościach

  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      lastActivityRef.current = Date.now();
      setShowWarning(false);
      showWarningRef.current = false;
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
      lastActivityRef.current = Date.now();
      setShowWarning(false);
      showWarningRef.current = false;
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
      showWarningRef.current = false;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Funkcja do ręcznej aktualizacji aktywności
  const updateUserActivity = useCallback(() => {
    if (user) {
      lastActivityRef.current = Date.now();
      if (showWarningRef.current) {
        setShowWarning(false);
        showWarningRef.current = false;
      }
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