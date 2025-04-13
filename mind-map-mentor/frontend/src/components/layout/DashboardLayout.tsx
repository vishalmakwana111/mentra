import React from 'react';
import SidePanel from './SidePanel';
import MainContent from './MainContent';
// import QueryPanel from '../ai/QueryPanel'; // Keep QueryPanel import commented for now

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Left Side Panel */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <SidePanel />
      </div>

      {/* Center Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainContent>
          {children}
        </MainContent>
      </div>

      {/* Right Query Panel (Placeholder Text) */}
      <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto p-4">
        {/* Replace placeholder with simple text */}
        <p className="text-red-500 font-bold">RIGHT PANEL TEST</p>
        <p>Some content here.</p>
      </div>
    </div>
  );
};

export default DashboardLayout; 