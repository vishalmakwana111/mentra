import React from 'react';

interface MainContentProps {
  children: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <div className="flex-1 h-screen p-4 overflow-auto bg-white">
      {/* Main application content (e.g., mind map canvas) goes here */}
      {children}
    </div>
  );
};

export default MainContent; 