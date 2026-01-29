import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';

import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword
} from 'firebase/auth';

import { auth, db } from '../firebase';

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

/* ===============================
   CONTEXT
=============================== */

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

/* ===============================
   PROVIDER
=============================== */

export const AuthProvider = ({ children }) => {

  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const initialized = useRef(false);

  /* ===============================
     INIT
  =============================== */

  useEffect(() => {

    if (initialized.current) return;
    initialized.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      try {

        /* LOGOUT */
        if (!user) {
          setCurrentUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        /* BASIC */
        const baseUser = {
          uid: user.uid,
          email: user.email
        };

        setCurrentUser(baseUser);

        await loadUserData(user);

      } catch (err) {

        console.error(err);

        await forceLogout();
      }

    });

    return unsubscribe;

  }, []);

  /* ===============================
     LOAD USER DATA
  =============================== */

  const loadUserData = async (authUser) => {

    try {

      const ref = doc(db, 'users', authUser.uid);

      const snap = await getDoc(ref);

      /* AUTO-REPAIR MISSING USER */
      if (!snap.exists()) {

        console.warn('Auto creating user profile');

        const profile = {
          email: authUser.email,
          role: 'sales_member', // default
          isActive: true,
          createdAt: serverTimestamp()
        };

        await setDoc(ref, profile);

        setUserRole(profile.role);

        setCurrentUser(prev => ({
          ...prev,
          ...profile
        }));

        setLoading(false);

        return;
      }

      const userData = snap.data();

      /* DISABLED */
      if (userData.isActive === false) {

        alert('Account disabled');

        await forceLogout();
        return;
      }

      /* OK */
      setUserRole(userData.role);

      setCurrentUser(prev => ({
        ...prev,
        ...userData
      }));

      setLoading(false);

    } catch (err) {

      console.error('Auth error', err);

      await forceLogout();
    }
  };

  /* ===============================
     FORCE LOGOUT
  =============================== */

  const forceLogout = async () => {

    try {
      await signOut(auth);
    } catch {}

    setCurrentUser(null);
    setUserRole(null);
    setLoading(false);
  };

  /* ===============================
     LOGIN
  =============================== */

  const login = async (email, password) => {

    try {

      setError(null);

      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    } catch (err) {

      setError(err.message);
      throw err;
    }
  };

  /* ===============================
     LOGOUT
  =============================== */

  const logout = async () => {

    try {
      await signOut(auth);

      setCurrentUser(null);
      setUserRole(null);

    } catch (err) {

      setError(err.message);
      throw err;
    }
  };

  /* ===============================
     VALUE
  =============================== */

  const value = {
    currentUser,
    userRole,
    loading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
