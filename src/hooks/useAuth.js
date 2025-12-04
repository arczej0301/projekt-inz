// hooks/useAuth.js - POPRAWIONA WERSJA BEZ CONSOLE.LOG
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const lastActivityRef = useRef(Date.now());
  const showWarningRef = useRef(false);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            const defaultUserData = {
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              phone: '',
              position: '',
              language: 'pl',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), defaultUserData);
            setUserData(defaultUserData);
          }
        } catch (error) {
          // Cichy handling błędu
        }
        
        lastActivityRef.current = Date.now();
        setShowWarning(false);
        showWarningRef.current = false;
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        }
      },
      () => {
        // Cichy handling błędu
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIMEOUT = 600000;
    const WARNING_TIME = 540000;
    const CHECK_INTERVAL = 5000;

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

    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    let inactivityCheck;
    
    const startInactivityCheck = setTimeout(() => {
      inactivityCheck = setInterval(() => {
        const now = Date.now();
        const inactiveTime = now - lastActivityRef.current;
        
        if (inactiveTime > WARNING_TIME && inactiveTime < INACTIVITY_TIMEOUT) {
          const timeLeft = Math.ceil((INACTIVITY_TIMEOUT - inactiveTime) / 1000);
          setCountdown(timeLeft);
          if (!showWarningRef.current) {
            setShowWarning(true);
            showWarningRef.current = true;
          }
        } 
        else if (inactiveTime >= INACTIVITY_TIMEOUT) {
          setShowWarning(false);
          showWarningRef.current = false;
          handleLogout();
          clearInterval(inactivityCheck);
        }
        else if (showWarningRef.current && inactiveTime < WARNING_TIME) {
          setShowWarning(false);
          showWarningRef.current = false;
        }
      }, CHECK_INTERVAL);
    }, 1000);

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
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      // Cichy handling błędu
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
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

  const registerWithEmail = async (email, password, userData) => {
    try {
      // 1. Rejestracja w Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // 2. Zapis dodatkowych danych w Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        ...userData,
        uid: userCredential.user.uid,
        createdAt: serverTimestamp()
      })
      
      return { success: true }
      
    } catch (error) {
      let errorMessage = 'Wystąpił błąd podczas rejestracji'
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Adres email jest już używany'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Nieprawidłowy adres email'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Hasło jest zbyt słabe'
      }
      
      return { success: false, error: errorMessage }
    }
  }
  
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
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
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = async (profileData) => {
    if (!user) return { success: false, error: 'Brak użytkownika' };
    
    try {
      await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
      
      if (profileData.name && profileData.name !== user.displayName) {
        await updateProfile(user, {
          displayName: profileData.name
        });
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'Brak użytkownika' };
    
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      return { success: true };
    } catch (error) {
      let errorMessage = 'Błąd zmiany hasła';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Aktualne hasło jest nieprawidłowe';
          break;
        case 'auth/weak-password':
          errorMessage = 'Nowe hasło jest zbyt słabe';
          break;
        default:
          errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

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
    userData,
    loading,
    loginWithEmail,
    loginWithGoogle,
    logout,
    updateUserActivity,
    showWarning,
    countdown,
    updateUserProfile,
    changePassword,
    registerWithEmail
  };
};