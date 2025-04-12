'use client';

import React, { useState, useEffect } from 'react';
import { Note, NoteUpdateData } from '@/types';

interface NoteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteData: Note | null; // The note being edited (or null if none)
  onSave: (updatedData: NoteUpdateData) => Promise<void>; // Function to call on save
}

const NoteEditModal: React.FC<NoteEditModalProps> = ({ isOpen, onClose, noteData, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when noteData changes (e.g., when modal opens with a note)
  useEffect(() => {
    if (noteData) {
      setTitle(noteData.title || '');
      setContent(noteData.content || '');
      setError(null); // Clear previous errors
      setIsSaving(false);
    } else {
      // Reset form if no note data (might happen briefly)
      setTitle('');
      setContent('');
    }
  }, [noteData]);

  const handleSave = async () => {
    if (!noteData) return; // Should not happen if modal is open with data

    setIsSaving(true);
    setError(null);
    const updatedData: NoteUpdateData = {
      title: title,
      content: content,
      // We don't update position here, only title/content
    };

    try {
      await onSave(updatedData);
      onClose(); // Close modal on successful save
    } catch (err: any) {
      console.error("Failed to save note:", err);
      setError(err.message || 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !noteData) {
    return null; // Don't render anything if not open or no data
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Edit Note</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <div className="mb-4">
            <label htmlFor="noteTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title
            </label>
            <input
              type="text"
              id="noteTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              disabled={isSaving}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="noteContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Content
            </label>
            <textarea
              id="noteContent"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteEditModal; 