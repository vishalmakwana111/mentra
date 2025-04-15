'use client';

import React, { memo, useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useSearchStore } from '@/store/searchStore'; // Import the search store
import { useGraphStore } from '@/store/graphStore'; // Import graph store for update action
import clsx from 'clsx'; // Utility for conditional classes
// Import API service
import { updateNote } from '@/services/api'; 
// Import toast
import toast from 'react-hot-toast'; 

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
  
  // State for content editing
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState(content || '');
  
  // State for tag editing (Task 5.3)
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editedTags, setEditedTags] = useState<string>(tags?.join(', ') || ''); // Store as comma-separated string

  // Get store actions
  const updateNoteContentInStore = useGraphStore((state) => state.updateNoteContent);
  const updateNodeDataInStore = useGraphStore((state) => state.updateNodeData); // Action to update arbitrary node data

  // Get highlighted IDs from the store
  const highlightedNodeIds = useSearchStore((state) => state.highlightedNodeIds);
  const isHighlighted = highlightedNodeIds.includes(id); // Check if this node should be highlighted

  // --- Content Editing Handlers --- 
  const handleContentDoubleClick = useCallback(() => {
    setEditedContent(content || ''); 
    setIsEditingContent(true);
    console.debug(`[NoteNode ${id}] Started content editing.`);
  }, [content, id]);

  const handleContentSave = useCallback(async () => {
    if (editedContent !== content) {
      console.debug(`[NoteNode ${id}] Content changed. Saving...`);
      const originalNoteId = data.original_note_id;
      if (originalNoteId) {
        try {
          // Call store action which handles API call and state update
          await updateNoteContentInStore(originalNoteId, editedContent);
          toast.success('Content updated');
          console.debug(`[NoteNode ${id}] Content save successful.`);
        } catch (error) {
          toast.error('Failed to update content');
          console.error(`[NoteNode ${id}] Failed to save content:`, error);
          setEditedContent(content || ''); // Revert on error
        }
      } else {
        console.warn(`[NoteNode ${id}] Cannot save content, missing original_note_id.`);
      }
    } else {
      console.debug(`[NoteNode ${id}] Content unchanged. Closing edit mode.`);
    }
    setIsEditingContent(false);
  }, [editedContent, content, data.original_note_id, id, updateNoteContentInStore]);

  // --- Tag Editing Handlers (Task 5 & 6 combined) ---
  const handleTagsDoubleClick = useCallback(() => {
    // Task 5.4: Initialize local state
    setEditedTags(tags?.join(', ') || ''); 
    setIsEditingTags(true);
    console.debug(`[NoteNode ${id}] Started tag editing.`);
  }, [tags, id]);

  // Task 6.2: Save Handler (triggered onBlur)
  const handleTagsSave = useCallback(async () => {
    // Task 6.3: Get Data
    const originalNoteId = data.original_note_id;
    // Task 5.5: Parse comma-separated string from input into an array, trim, filter empty
    const newTagsList = editedTags.split(',')
                              .map(tag => tag.trim())
                              .filter(tag => tag !== '');
    const originalTagsList = tags || []; // Handle case where original tags are undefined/null

    // Task 6.4: Compare Changes (simple length and content check)
    const tagsChanged = 
      newTagsList.length !== originalTagsList.length || 
      !newTagsList.every((tag, index) => tag === originalTagsList[index]);

    if (tagsChanged) {
      console.debug(`[NoteNode ${id}] Tags changed. Saving:`, newTagsList);
      if (originalNoteId) {
        try {
          // Task 6.5: API Call
          await updateNote(originalNoteId, { tags: newTagsList });
          // Task 7.2: Update Store Manually (since updateNote API might not return full note or store action doesn't handle tags explicitly)
          // Assuming updateNodeData takes the react flow node ID and the data payload
          updateNodeDataInStore(id, { tags: newTagsList }); 
          // Task 9.2: Add Toast
          toast.success('Tags updated');
          console.debug(`[NoteNode ${id}] Tags save successful.`);
        } catch (error) {
          // Task 9.2: Add Toast
          toast.error('Failed to update tags');
          console.error(`[NoteNode ${id}] Failed to save tags:`, error);
          setEditedTags(tags?.join(', ') || ''); // Revert input on error
        }
      } else {
        console.warn(`[NoteNode ${id}] Cannot save tags, missing original_note_id.`);
        toast.error('Cannot save tags (missing ID)');
      }
    } else {
      console.debug(`[NoteNode ${id}] Tags unchanged. Closing edit mode.`);
    }
    // Task 6.6: Close/Reset UI
    setIsEditingTags(false); 
  }, [editedTags, tags, data.original_note_id, id, updateNodeDataInStore]);

  // Handle Enter key to save tags
  const handleTagsKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleTagsSave();
    }
     if (event.key === 'Escape') {
       setEditedTags(tags?.join(', ') || ''); // Revert changes
       setIsEditingTags(false);
    }
  };

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
        {isEditingContent ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            onBlur={handleContentSave} // Save when the textarea loses focus
            // onKeyDown={handleKeyDown} // Optional: Save on Enter/Escape
            className="nodrag text-xs text-gray-700 w-full h-20 p-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none bg-white"
            autoFocus // Automatically focus the textarea when it appears
          />
        ) : (
          <div onDoubleClick={handleContentDoubleClick} className="cursor-pointer min-h-[2rem]"> {/* Ensure clickable area even when empty */}
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

      {/* Tag Display/Edit Area */}
      <div 
        className="p-3 pt-1 border-t border-gray-200 min-h-[2rem]" 
        onDoubleClick={!isEditingTags ? handleTagsDoubleClick : undefined} // Only allow double-click if not already editing
      >
        {isEditingTags ? (
           // Task 5.2: Input Element
           <input 
             type="text"
             value={editedTags} 
             // Task 5.5: Update Logic
             onChange={(e) => setEditedTags(e.target.value)} 
             onBlur={handleTagsSave} // Task 6.1: Save Trigger
             onKeyDown={handleTagsKeyDown} // Save on Enter, Exit on Esc
             className="nodrag text-xs text-gray-700 w-full p-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
             placeholder="Enter tags, comma-separated"
             autoFocus
           />
        ) : (
           // Original Tag Display (Task 8.1)
           (tags && tags.length > 0) ? (
            tags.map((tag, index) => (
              <span 
                key={index} 
                className="inline-block bg-sky-100 text-sky-800 text-xs font-medium mr-1 mb-1 px-2 py-0.5 rounded cursor-pointer" // Added cursor-pointer
              >
                {tag}
              </span>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic cursor-pointer">Double-click to add tags...</p> // Prompt to add tags
          )
        )}
      </div>

      {/* Output Handle (Bottom) */}
      <Handle type="source" position={Position.Bottom} className="!bg-gray-500 w-2 h-2" />
    </div>
  );
});

NoteNode.displayName = 'NoteNode'; // Add display name for better debugging

export default NoteNode; 