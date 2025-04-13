'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useSearchStore } from '@/store/searchStore'; // Import the search store
import clsx from 'clsx'; // Utility for conditional classes

// Define the expected structure of the data prop for this node type
interface NoteNodeData {
  label: string;       // Typically the note title
  content?: string | null; // The note content
  // Add any other note properties you might want to display or use
}

// Using memo for performance optimization, as nodes might re-render often
const NoteNode: React.FC<NodeProps<NoteNodeData>> = memo(({ data, id }) => { // Destructure id from props
  // Get highlighted IDs from the store
  const highlightedNodeIds = useSearchStore((state) => state.highlightedNodeIds);
  const isHighlighted = highlightedNodeIds.includes(id); // Check if this node should be highlighted

  const maxContentLength = 100; // Max characters to show initially
  const displayContent = data.content 
    ? (data.content.length > maxContentLength ? data.content.substring(0, maxContentLength) + '...' : data.content)
    : ''; // Show empty string if no content, as it's required now

  return (
    <div 
      className={clsx(
        'custom-note-node bg-yellow-100 border border-yellow-300 rounded-md shadow-lg overflow-hidden min-w-[180px]',
        // Apply highlighting styles conditionally
        isHighlighted && 'ring-4 ring-offset-1 ring-purple-500 border-purple-500'
      )}
    >
      {/* Input Handle (Top) */}
      <Handle type="target" position={Position.Top} className="!bg-gray-500 w-2 h-2" />
      
      {/* Node Content */}
      <div className="p-3">
        <div className="font-bold text-sm text-gray-800 mb-1 truncate" title={data.label}>{data.label || 'Untitled Note'}</div>
        {displayContent && (
          <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">
              {displayContent}
          </p>
        )}
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