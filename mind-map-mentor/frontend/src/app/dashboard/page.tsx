'use client'; // Dashboard needs client components

// Remove DashboardLayout import
// import DashboardLayout from "@/components/layout/DashboardLayout";
// Remove AuthGuard import (handled by layout)
// import AuthGuard from "@/components/layout/AuthGuard"; 
import { ReactFlowProvider } from 'reactflow';
import dynamic from 'next/dynamic';

// Dynamically import MindMapCanvas with ssr: false
const MindMapCanvasNoSSR = dynamic(() => import('@/components/mindmap/MindMapCanvas'), {
  ssr: false,
  loading: () => <p>Loading Mind Map...</p>,
});

export default function DashboardPage() {
  return (
    // AuthGuard is applied by the layout.tsx file
    // DashboardLayout is applied by the layout.tsx file
    <ReactFlowProvider>
      <MindMapCanvasNoSSR />
    </ReactFlowProvider>
  );
} 