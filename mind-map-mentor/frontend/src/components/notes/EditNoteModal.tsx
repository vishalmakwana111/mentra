'use client';

import React, { useState, useEffect } from 'react';
import { Note, NoteUpdateData } from '@/types';
import toast from 'react-hot-toast';

interface EditNoteModalProps {
  note: Note | null; // The note to edit, or null if none
  isOpen: boolean;
  onClose: () => void; // Function to close the modal
  onUpdate: (noteId: number, data: NoteUpdateData) => Promise<void>; // Function to call when update is submitted
}

const EditNoteModal: React.FC<EditNoteModalProps> = ({ 
  note,
  isOpen,
  onClose,
  onUpdate 
}) => {
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form state when the note prop changes or modal opens
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setError(null); // Clear previous errors when modal opens/note changes
    } else {
      // Reset form if note is null (e.g., modal closed)
      setTitle('');
      setContent('');
      setError(null);
    }
  }, [note, isOpen]); // Dependency array includes isOpen to reset on close/reopen

  // Early return if the modal is not open or no note is selected
  if (!isOpen || !note) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!note) return; // Should not happen if modal is open, but safety check

    if (!title.trim()) {
        setError('Title cannot be empty.');
        return;
    }

    setIsLoading(true);
    try {
      const updateData: NoteUpdateData = { title, content };
      await onUpdate(note.id, updateData); // Call the onUpdate prop passed from SidePanel
      // onClose(); // Closing is handled by SidePanel after successful update
    } catch (err: any) {
      console.error("EditNoteModal update error:", err);
      toast.error(err.message || 'Failed to update note.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Modal Overlay - Use bg-black/50 for semi-transparent background
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ease-in-out">
      {/* Modal Content */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Edit Note (ID: {note.id})</h2>
        
        {/* Form Inputs */}
        <div className="space-y-4">
          <div>
            <label htmlFor="edit-note-title" className="block text-sm font-medium text-gray-700">Title</label>
            <input
              id="edit-note-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <div>
             <label htmlFor="edit-note-content" className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              id="edit-note-content"
              rows={4} // Increased rows slightly
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
           {error && (
             <p className="text-sm text-red-600">{error}</p>
           )}
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button" // Important: Prevent default form submission
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition duration-150"
          >
            Cancel
          </button>
          <button
            type="submit" // This button submits the form
            disabled={isLoading}
            className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition duration-150 disabled:opacity-50"
          >
             {isLoading ? 'Saving...' : 'Save Changes'} 
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditNoteModal; 