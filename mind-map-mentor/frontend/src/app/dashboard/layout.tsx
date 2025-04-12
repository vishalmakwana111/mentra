'use client'; // Needed if SidePanel or AuthGuard have client hooks

import React from 'react';
import SidePanel from "@/components/layout/SidePanel";
// Import AuthGuard from correct path
import AuthGuard from '@/components/layout/AuthGuard'; // Corrected path

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Wrap with AuthGuard to protect dashboard routes
    <AuthGuard>
        <div className="flex h-screen bg-slate-100">
          <SidePanel /> 
          <main className="flex-1 overflow-y-auto bg-white"> {/* Add bg-white to content area */}
            {children}
          </main>
        </div>
     </AuthGuard>
  );
} 