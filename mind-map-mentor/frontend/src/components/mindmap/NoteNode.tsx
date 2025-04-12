'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// Define the expected structure of the data prop for this node type
interface NoteNodeData {
  label: string;       // Typically the note title
  content?: string | null; // The note content
  // Add any other note properties you might want to display or use
}

// Using memo for performance optimization, as nodes might re-render often
const NoteNode: React.FC<NodeProps<NoteNodeData>> = memo(({ data }) => {
  const maxContentLength = 100; // Max characters to show initially
  const displayContent = data.content 
    ? (data.content.length > maxContentLength ? data.content.substring(0, maxContentLength) + '...' : data.content)
    : 'No content';

  return (
    <div className="react-flow__node-default custom-note-node bg-yellow-100 border border-yellow-300 rounded-md shadow-lg overflow-hidden min-w-[180px]">
      {/* Input Handle (Top) */}
      <Handle type="target" position={Position.Top} className="!bg-gray-500 w-2 h-2" />
      
      {/* Node Content */}
      <div className="p-3">
        <div className="font-bold text-sm text-gray-800 mb-1 truncate" title={data.label}>{data.label || 'Untitled Note'}</div>
        <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">
            {displayContent}
        </p>
      </div>
      
      {/* Output Handle (Bottom) */}
      <Handle type="source" position={Position.Bottom} className="!bg-gray-500 w-2 h-2" />
      {/* Add Left/Right handles if needed for different connection points */}
      {/* <Handle type="source" position={Position.Left} id="l" className="!bg-gray-500 w-2 h-2" /> */}
      {/* <Handle type="target" position={Position.Right} id="r" className="!bg-gray-500 w-2 h-2" /> */}
    </div>
  );
});

NoteNode.displayName = 'NoteNode'; // Add display name for better debugging

export default NoteNode; 