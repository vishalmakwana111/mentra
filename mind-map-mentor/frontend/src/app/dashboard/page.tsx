'use client'; // Dashboard needs client components

import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/layout/AuthGuard"; // Import AuthGuard
import { ReactFlowProvider } from 'reactflow';
import dynamic from 'next/dynamic';

// Dynamically import MindMapCanvas with ssr: false
const MindMapCanvasNoSSR = dynamic(() => import('@/components/mindmap/MindMapCanvas'), {
  ssr: false,
  loading: () => <p>Loading Mind Map...</p>,
});

export default function DashboardPage() {
  return (
    <AuthGuard> { /* Wrap the dashboard content */}
      <DashboardLayout>
        {/* Wrap the part of the tree using React Flow with the provider */}
        <ReactFlowProvider>
          {/* Render the dynamically imported canvas */}
          <MindMapCanvasNoSSR />
        </ReactFlowProvider>
      </DashboardLayout>
    </AuthGuard>
  );
} 