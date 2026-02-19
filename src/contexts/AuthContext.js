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
  serverTimestamp,
  onSnapshot
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

  const loadingTimeoutRef = useRef(null);
  const initialSafetyTimeoutRef = useRef(null);

  /* ===============================
     INIT
  =============================== */

  useEffect(() => {

    let unsubscribeUserData = null;

    // Global safety fallback so the app doesn't hang on loading forever
    if (initialSafetyTimeoutRef.current) clearTimeout(initialSafetyTimeoutRef.current);
    initialSafetyTimeoutRef.current = setTimeout(() => {
      setLoading(false);
    }, 7000);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {

      try {

        /* LOGOUT */
        if (!user) {
          setCurrentUser(null);
          setUserRole(null);
          if (unsubscribeUserData) unsubscribeUserData();
          setLoading(false);
          return;
        }

        /* BASIC */
        const baseUser = {
          uid: user.uid,
          email: user.email
        };

        setCurrentUser(baseUser);

        // Safety: ensure loading resolves even if realtime listener stalls
        if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = setTimeout(() => {
          setLoading(false);
          setUserRole(prev => prev || 'sales_member');
        }, 7000);

        if (initialSafetyTimeoutRef.current) {
          clearTimeout(initialSafetyTimeoutRef.current);
          initialSafetyTimeoutRef.current = null;
        }

        // Fetch user doc immediately (don’t rely solely on snapshot)
        loadUserData(user);

        // Set up real-time listener for user data updates
        const userRef = doc(db, 'users', user.uid);
        unsubscribeUserData = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const userData = snap.data();
            
            // Check if account is disabled
            if (userData.isActive === false) {
              alert('Account disabled');
              forceLogout();
              return;
            }

            setUserRole(userData.role);
            setCurrentUser(prev => ({
              ...prev,
              ...userData
            }));
          } else {
            // Auto-create missing profile so userRole isn't stuck null
            loadUserData(user);
          }
          setLoading(false);
        }, (error) => {
          console.error('Real-time listener error:', error);
          loadUserData(user);
        });

      } catch (err) {

        console.error(err);

        await forceLogout();
      }

    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserData) unsubscribeUserData();
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      if (initialSafetyTimeoutRef.current) clearTimeout(initialSafetyTimeoutRef.current);
    };

  }, []);

  /* ===============================
     LOAD USER DATA
  =============================== */

  const loadUserData = async (authUser) => {

    try {

      const ref = doc(db, 'users', authUser.uid);

      const snap = await getDoc(ref);

      /* AUTO-CREATE ONCE (prevent duplicates) */
      if (!snap.exists()) {

        console.warn('Auto creating user profile');

        const profile = {
          uid: authUser.uid,
          email: authUser.email,
          role: 'sales_member', // default
          isActive: true,
          createdAt: serverTimestamp()
        };

        // Use setDoc with merge to prevent duplicates
        await setDoc(ref, profile, { merge: false });

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
