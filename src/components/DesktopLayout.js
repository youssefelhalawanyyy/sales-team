import React from 'react';
import DesktopTitleBar from './DesktopTitleBar';
import DesktopSidebar from './DesktopSidebar';

export default function DesktopLayout({ children, onLogout }) {
  return (
    <div className="w-screen h-screen bg-gray-950 flex flex-col">
      {/* Title Bar */}
      <DesktopTitleBar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden pt-12">
        {/* Sidebar */}
        <DesktopSidebar onLogout={onLogout} />

        {/* Content */}
        <main className="flex-1 ml-64 overflow-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
