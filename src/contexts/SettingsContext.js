import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState({
    theme: 'light',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    darkMode: false,
    notifications: {
      email: true,
      push: true,
      deals: true,
      tasks: true,
      commissions: true
    },
    emailDigest: 'immediate'
  });
  const [loading, setLoading] = useState(true);

  // Load settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'userSettings', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const loadedSettings = docSnap.data();
          setSettings(prev => ({ ...prev, ...loadedSettings }));
          // Apply dark mode globally
          applyDarkMode(loadedSettings.darkMode || false);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [currentUser?.uid]);

  // Apply dark mode to entire document
  const applyDarkMode = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  };

  // Update settings both locally and in Firestore
  const updateSetting = async (key, value) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      // Apply specific settings globally
      if (key === 'darkMode') {
        applyDarkMode(value);
      }

      // Save to Firestore
      if (currentUser?.uid) {
        await setDoc(doc(db, 'userSettings', currentUser.uid), newSettings, { merge: true });
        console.log('Settings saved successfully:', key, value);
      }
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  // Update nested settings (like notifications)
  const updateNestedSetting = async (category, key, value) => {
    try {
      const newSettings = {
        ...settings,
        [category]: { ...settings[category], [key]: value }
      };
      setSettings(newSettings);

      // Save to Firestore
      if (currentUser?.uid) {
        await setDoc(doc(db, 'userSettings', currentUser.uid), newSettings, { merge: true });
        console.log('Nested settings saved:', category, key, value);
      }
    } catch (err) {
      console.error('Error updating nested settings:', err);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, updateNestedSetting, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
