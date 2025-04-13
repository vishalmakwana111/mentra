'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { FileNodeData } from '@/types'; // Import the specific data type
import { useSearchStore } from '@/store/searchStore'; // Import the search store
import clsx from 'clsx'; // Utility for conditional classes

// Using memo for performance optimization
const FileNode: React.FC<NodeProps<FileNodeData>> = memo(({ data, id }) => { // Destructure id
  // Get highlighted IDs from the store
  const highlightedNodeIds = useSearchStore((state) => state.highlightedNodeIds);
  const isHighlighted = highlightedNodeIds.includes(id); // Check if this node should be highlighted

  return (
    // Apply same styling as NoteNode, plus highlighting
    <div 
      className={clsx(
        'custom-file-node bg-blue-100 border border-blue-300 rounded-md shadow-lg overflow-hidden min-w-[180px]',
        // Apply highlighting styles conditionally
        isHighlighted && 'ring-4 ring-offset-1 ring-purple-500 border-purple-500'
      )}
    >
      {/* Input Handle (Top) - Styled like NoteNode */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="file-target" 
        className="!bg-gray-500 w-2 h-2" // Style from NoteNode
      />
      {/* Node Content */}
      <div className="p-3">
         {/* Use same title styling, display file icon and filename */}
        <div className="font-bold text-sm text-gray-800 mb-1 truncate" title={data.label || data.filename}>
             📄 {data.label || data.filename}
        </div>
         {/* Optional: Add file type or size here if desired, styled similarly */}
         {/* <p className="text-xs text-gray-600">{data.mime_type}</p> */}
      </div>
      {/* Output Handle (Bottom) - Styled like NoteNode */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="file-source" 
        className="!bg-gray-500 w-2 h-2" // Style from NoteNode
      />
    </div>
  );
});

FileNode.displayName = 'FileNode'; // Add display name

export default FileNode; // Use default export 