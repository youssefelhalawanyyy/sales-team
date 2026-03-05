import React from 'react';
import { useElectron } from '../contexts/ElectronContext';
import DesktopApp from './DesktopApp';

/**
 * AppWrapper component that conditionally renders Desktop or Web layout
 * based on whether the app is running in Electron
 */
export default function AppWrapper({ children }) {
  const { isElectron } = useElectron();

  if (isElectron) {
    return (
      <DesktopApp>
        {children}
      </DesktopApp>
    );
  }

  return children;
}
