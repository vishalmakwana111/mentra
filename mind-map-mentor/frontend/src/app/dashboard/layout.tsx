'use client'; // Needed if SidePanel or AuthGuard have client hooks

import React, { useState } from 'react';
import SidePanel from "@/components/layout/SidePanel";
import QueryPanel from "@/components/ai/QueryPanel"; // Import QueryPanel
import AuthGuard from '@/components/auth/AuthGuard'; // Corrected path
import { FiMenu, FiX } from 'react-icons/fi'; // Icons for toggle
import clsx from 'clsx'; // For conditional classes

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true); // State for right panel

  return (
    // Wrap with AuthGuard to protect dashboard routes
    <AuthGuard>
        {/* Main flex container for three columns */}
        <div className="flex h-screen overflow-hidden bg-gray-100">
            {/* Left Side Panel */}
            <div 
              className={clsx(
                'relative flex flex-col flex-shrink-0 border-r border-gray-200 bg-white transition-all duration-300 ease-in-out overflow-hidden', // Ensure overflow-hidden always
                isLeftPanelOpen ? 'w-72' : 'w-16 items-center justify-center' // Center button vertically+horizontally when collapsed
              )}
            >
              {/* Toggle Button Wrapper - Let parent center it when collapsed */} 
              <div className={clsx("sticky top-0 z-10 p-2", isLeftPanelOpen ? "self-end" : "")}>
                  <button 
                    onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
                    className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    title={isLeftPanelOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                  >
                    {isLeftPanelOpen ? <FiX className="h-5 w-5"/> : <FiMenu className="h-5 w-5"/>}
                  </button>
              </div>
              {/* Content Area: Render ONLY if panel is open */} 
              {isLeftPanelOpen && (
                  <div className={clsx('flex-grow p-4')}> 
                      <SidePanel /> 
                  </div>
              )}
            </div>

            {/* Center Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden bg-white"> 
                {children}
            </main>

            {/* Right Query Panel */}
             <div 
               className={clsx(
                 'relative flex flex-col flex-shrink-0 border-l border-gray-200 bg-white transition-all duration-300 ease-in-out overflow-hidden', // Ensure overflow-hidden always
                 isRightPanelOpen ? 'w-80' : 'w-16 items-center justify-center' // Center button vertically+horizontally when collapsed
               )}
             >
               {/* Right Toggle Button Wrapper - Let parent center it when collapsed */} 
               <div className={clsx("sticky top-0 z-10 p-2", isRightPanelOpen ? "self-start" : "")}>
                   <button 
                     onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                     className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                     title={isRightPanelOpen ? "Collapse Query Panel" : "Expand Query Panel"}
                   >
                     {isRightPanelOpen ? <FiX className="h-5 w-5"/> : <FiMenu className="h-5 w-5"/>}
                   </button>
               </div>
               {/* Content Area: Render ONLY if panel is open */}
               {isRightPanelOpen && (
                   <div className={clsx('flex-grow overflow-y-auto')}> {/* QueryPanel has its own padding */} 
                       <QueryPanel />
                   </div>
               )}
             </div>
        </div>
     </AuthGuard>
  );
} 