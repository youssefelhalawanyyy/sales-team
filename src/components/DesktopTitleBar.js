import React from 'react';
import { Minimize2, Maximize2, X } from 'lucide-react';
import { useElectron } from '../contexts/ElectronContext';

export default function DesktopTitleBar() {
  const { electronAPI, isMaximized } = useElectron();

  const handleMinimize = () => {
    electronAPI?.app.minimize();
  };

  const handleMaximize = () => {
    electronAPI?.app.maximize();
  };

  const handleClose = () => {
    electronAPI?.app.close();
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 h-12 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 flex items-center justify-between px-4 select-none z-50"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* Logo/Title */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' }}>
        <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">ST</span>
        </div>
        <span className="text-gray-100 font-semibold text-sm">Sales Team</span>
      </div>

      {/* Window Controls */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={handleMinimize}
          className="w-9 h-9 flex items-center justify-center hover:bg-gray-700 rounded transition-colors"
          title="Minimize"
        >
          <Minimize2 className="w-4 h-4 text-gray-300" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-9 h-9 flex items-center justify-center hover:bg-gray-700 rounded transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          <Maximize2 className="w-4 h-4 text-gray-300" />
        </button>
        <button
          onClick={handleClose}
          className="w-9 h-9 flex items-center justify-center hover:bg-red-600 rounded transition-colors"
          title="Close"
        >
          <X className="w-4 h-4 text-gray-300" />
        </button>
      </div>
    </div>
  );
}
