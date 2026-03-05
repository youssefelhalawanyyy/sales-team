/**
 * Utility to detect if the app is running inside Electron
 */

export const isElectron = () => {
  // Check if window.electron is available (set by preload.js)
  return !!(
    typeof window !== 'undefined' &&
    window.electron &&
    window.electron.isElectron?.()
  );
};

export const getEnvironment = () => {
  if (isElectron()) {
    return 'electron';
  }
  return 'web';
};

export const getElectronAPI = () => {
  if (typeof window !== 'undefined' && window.electron) {
    return window.electron;
  }
  return null;
};

export const getPlatform = () => {
  const electronAPI = getElectronAPI();
  if (electronAPI && electronAPI.platform) {
    return electronAPI.platform;
  }
  return null;
};

export const shouldUseDesktopLayout = () => {
  return isElectron();
};
