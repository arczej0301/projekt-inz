import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA0s-9GgMDLnLlhNQho5k4FX6ZCZpak6uc",
  authDomain: "agrofarm-a3e1a.firebaseapp.com",
  projectId: "agrofarm-a3e1a",
  storageBucket: "agrofarm-a3e1a.firebasestorage.app",
  messagingSenderId: "973852003521",
  appId: "1:973852003521:web:1c8d00c056f5e32fd75840",
  measurementId: "G-HGBNGK803W"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();