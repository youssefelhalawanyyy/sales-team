import React, { createContext, useContext, useEffect, useState } from 'react';

const ElectronContext = createContext(null);

export const ElectronProvider = ({ children }) => {
  const detectedElectron = typeof window !== 'undefined' && Boolean(window.electron?.isElectron?.());
  const [isElectron, setIsElectron] = useState(detectedElectron);
  const [electronAPI, setElectronAPI] = useState(detectedElectron ? window.electron : null);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    const isElectronApp = typeof window !== 'undefined' && Boolean(window.electron?.isElectron?.());
    setIsElectron(isElectronApp);

    if (isElectronApp) {
      setElectronAPI(window.electron);
      
      // Check if window is maximized
      window.electron.app.isMaximized().then(maximized => {
        setIsMaximized(maximized);
      });

      // Listen for maximize/unmaximize events
      // These would be emitted from main process
      // For now, we check on interval
      const interval = setInterval(() => {
        window.electron.app.isMaximized().then(maximized => {
          setIsMaximized(maximized);
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, []);

  const value = {
    isElectron,
    electronAPI,
    isMaximized,
    setIsMaximized
  };

  return (
    <ElectronContext.Provider value={value}>
      {children}
    </ElectronContext.Provider>
  );
};

export const useElectron = () => {
  const context = useContext(ElectronContext);
  if (!context) {
    return {
      isElectron: false,
      electronAPI: null,
      isMaximized: false
    };
  }
  return context;
};
