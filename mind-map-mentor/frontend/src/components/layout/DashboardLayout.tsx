import React from 'react';
import SidePanel from './SidePanel';
import MainContent from './MainContent';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <SidePanel />
      <MainContent>
        {children}
      </MainContent>
    </div>
  );
};

export default DashboardLayout; 