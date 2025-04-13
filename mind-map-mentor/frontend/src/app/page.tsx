'use client'; // For hooks and dynamic imports

import React from 'react';
import dynamic from 'next/dynamic';
import { ReactFlowProvider } from 'reactflow';

import DashboardLayout from '@/components/layout/DashboardLayout';
import AuthGuard from '@/components/auth/AuthGuard'; // Import AuthGuard

// Dynamically import MindMapCanvas to avoid SSR issues
const MindMapCanvas = dynamic(
  () => import('@/components/mindmap/MindMapCanvas'),
  { ssr: false, loading: () => <p className='flex justify-center items-center h-full'>Loading Canvas...</p> } // Prevent SSR
);

export default function DashboardPage() {
  return (
    <AuthGuard> { /* Wrap content with AuthGuard */ }
        <DashboardLayout>
            <ReactFlowProvider> { /* Provider needed by React Flow hooks */}
                <MindMapCanvas />
            </ReactFlowProvider>
        </DashboardLayout>
    </AuthGuard>
  );
}
