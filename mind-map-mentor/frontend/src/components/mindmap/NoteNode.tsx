'use client';

import React, { memo, useState, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useSearchStore } from '@/store/searchStore'; // Import the search store
import { useGraphStore } from '@/store/graphStore'; // Import graph store for update action
import clsx from 'clsx'; // Utility for conditional classes

// Define the expected structure of the data prop for this node type
interface NoteNodeData {
  label: string;       // Typically the note title
  content?: string | null; // The note content
  // Add any other note properties you might want to display or use
  // Ensure original_note_id and graph_node_id are passed if needed for updates
  original_note_id?: number;
  graph_node_id?: number;
  tags?: string[]; // Added tags property
}

// Using memo for performance optimization, as nodes might re-render often
const NoteNode: React.FC<NodeProps<NoteNodeData>> = memo(({ data, id }) => { // Destructure id from props
  const { label, content, tags } = data; // Destructure tags here
  // State for inline editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content || '');

  // Get store actions
  const updateNoteContent = useGraphStore((state) => state.updateNoteContent); // Use the new action

  // Get highlighted IDs from the store
  const highlightedNodeIds = useSearchStore((state) => state.highlightedNodeIds);
  const isHighlighted = highlightedNodeIds.includes(id); // Check if this node should be highlighted

  // Function to handle starting the edit
  const handleDoubleClick = useCallback(() => {
    setEditedContent(content || ''); 
    setIsEditing(true);
    console.debug(`[NoteNode ${id}] Started editing.`);
  }, [content]); // Dependency on content to re-initialize correctly

  // Function to handle saving the edit (on blur)
  const handleSave = useCallback(async () => {
    // Only save if content actually changed
    if (editedContent !== content) {
      console.debug(`[NoteNode ${id}] Content changed. Saving...`);
      const originalNoteId = data.original_note_id;
      
      if (originalNoteId) {
        try {
          // Call store action to update backend and graph state
          await updateNoteContent(originalNoteId, editedContent); // Use the new action
          console.debug(`[NoteNode ${id}] Save successful.`);
          // Optionally add success feedback (e.g., brief style change)
        } catch (error) {
          console.error(`[NoteNode ${id}] Failed to save content:`, error);
          // Optionally: Revert editedContent state or show error toast
          setEditedContent(content || ''); // Revert on error
        }
      } else {
        console.warn(`[NoteNode ${id}] Cannot save, missing original_note_id.`);
      }
    } else {
      console.debug(`[NoteNode ${id}] Content unchanged. Closing edit mode.`);
    }
    setIsEditing(false); // Exit edit mode regardless of save status
  }, [editedContent, content, data.original_note_id, id, updateNoteContent]); // Update dependencies

  const maxContentLength = 100; // Max characters to show initially
  const displayContent = content
    ? (content.length > maxContentLength ? content.substring(0, maxContentLength) + '...' : content)
    : ''; // Show empty string if no content

  return (
    <div
      className={clsx(
        'custom-note-node bg-yellow-100 border border-yellow-300 rounded-md shadow-lg overflow-hidden min-w-[180px] max-w-xs',
        // Apply highlighting styles conditionally
        isHighlighted && 'ring-4 ring-offset-1 ring-purple-500 border-purple-500'
      )}
    >
      {/* Input Handle (Top) */}
      <Handle type="target" position={Position.Top} className="!bg-gray-500 w-2 h-2" />
      
      {/* Node Content */}
      <div className="p-3">
        <div className="font-bold text-sm text-gray-800 mb-1 truncate" title={label}>{label || 'Untitled Note'}</div>
        
        {/* Conditionally render display text or textarea */}
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onBlur={handleSave} // Save when the textarea loses focus
            // onKeyDown={handleKeyDown} // Optional: Save on Enter/Escape
            className="nodrag text-xs text-gray-700 w-full h-20 p-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none bg-white"
            autoFocus // Automatically focus the textarea when it appears
          />
        ) : (
          <div onDoubleClick={handleDoubleClick} className="cursor-pointer min-h-[2rem]"> {/* Ensure clickable area even when empty */}
             {displayContent ? (
              <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                  {displayContent}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">Double-click to add content...</p>
            )}
          </div>
        )}
      </div>

      {/* Tag Display Area (Tasks 5.2-5.5) */}
      {tags && tags.length > 0 && (
        <div className="p-3 pt-1 border-t border-gray-200">
          {
            tags.map((tag, index) => (
              <span 
                key={index} 
                className="inline-block bg-sky-100 text-sky-800 text-xs font-medium mr-1 mb-1 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))
          }
        </div>
      )}

      {/* Output Handle (Bottom) */}
      <Handle type="source" position={Position.Bottom} className="!bg-gray-500 w-2 h-2" />
    </div>
  );
});

NoteNode.displayName = 'NoteNode'; // Add display name for better debugging

export default NoteNode; 