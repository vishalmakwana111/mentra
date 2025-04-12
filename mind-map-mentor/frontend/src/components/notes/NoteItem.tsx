'use client';

import React from 'react';
import { Note } from '@/types';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { deleteNote } from '@/services/api'; // Import deleteNote
import toast from 'react-hot-toast'; // Import toast

interface NoteItemProps {
  note: Note;
  onRefresh: () => void; // Add onRefresh prop
  onEdit: (note: Note) => void; // Add onEdit prop
  // Add onClick handlers later
}

const NoteItem: React.FC<NoteItemProps> = ({ note, onRefresh, onEdit }) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick for the whole item
    onEdit(note); // Call the onEdit prop with the current note
    // TODO: Implement edit functionality (e.g., open modal)
    // console.log('Edit note:', note.id); // Keep for debugging if needed
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick for the whole item
    if (window.confirm('Are you sure you want to delete this note?')) {
      // Optional: Show loading toast
      const toastId = toast.loading('Deleting note...'); 
      try {
        console.log('Attempting to delete note:', note.id);
        await deleteNote(note.id); // Call the API function
        console.log('Note deleted successfully');
        toast.success('Note deleted successfully!', { id: toastId }); // Update loading toast on success
        onRefresh(); // Call the refresh function passed from parent
      } catch (error) {
        console.error("Failed to delete note:", error);
        // Update loading toast on error, show error message
        toast.error('Failed to delete note.', { id: toastId }); 
        // alert("Failed to delete note. See console for details."); // Remove alert
      }
    }
  };

  const handleItemClick = () => {
    // TODO: Implement what happens when the item itself is clicked (e.g., load into main view)
    console.log('Clicked note:', note.id);
  };

  return (
    // Updated styling: Light background, violet hover, padding, rounded corners, flex layout
    <div
      className="bg-white p-3 rounded-md border border-gray-200 hover:bg-violet-50 hover:border-violet-200 cursor-pointer transition-colors duration-150 flex justify-between items-center"
      onClick={handleItemClick}
    >
      <div>
        <h3 className="font-medium text-gray-800 truncate">{note.title || 'Untitled Note'}</h3>
        {/* <p className="text-sm text-gray-500 truncate">{note.content || 'No content'}</p> */}
      </div>
      {/* Action Buttons */}
      <div className="flex space-x-1 ml-2">
        {/* Edit Button with Icon */}
        <button
          onClick={handleEdit}
          className="text-gray-500 hover:text-violet-600 p-1 rounded hover:bg-violet-100 transition-colors duration-150"
          aria-label="Edit note"
        >
          <FiEdit className="w-4 h-4" />
        </button>
        {/* Delete Button with Icon */}
        <button
          onClick={handleDelete}
          className="text-gray-500 hover:text-red-600 p-1 rounded hover:bg-red-100 transition-colors duration-150"
          aria-label="Delete note"
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NoteItem; 