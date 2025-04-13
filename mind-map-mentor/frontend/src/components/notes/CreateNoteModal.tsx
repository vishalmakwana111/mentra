'use client';

import React, { useState, useEffect } from 'react';
import { NoteCreateData } from '@/types';
import toast from 'react-hot-toast';
import clsx from 'clsx'; // Import clsx for conditional classes

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: NoteCreateData) => Promise<void>; // Adjusted for creation
}

const MAX_CONTENT_LENGTH = 500; // Define the character limit

const CreateNoteModal: React.FC<CreateNoteModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentLength, setContentLength] = useState(0); // State for character count
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setContentLength(0); // Reset count when modal opens
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Update content and character count
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setContent(newContent);
      setContentLength(newContent.length);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || contentLength > MAX_CONTENT_LENGTH) return; // Check limit here too

    if (!title.trim()) {
      toast.error('Title cannot be empty.');
      return;
    }

    // Content is now optional based on latest backend changes, adjust validation?
    // Let's keep it optional for now, backend handles null if needed.
    // if (!content.trim()) {
    //     toast.error('Content cannot be empty.');
    //     return;
    // }

    setIsSubmitting(true);
    const toastId = toast.loading('Creating note...');

    const noteData: NoteCreateData = {
      title: title.trim(),
      content: content.trim() || null, // Send null if empty
    };

    try {
      await onCreate(noteData);
      toast.success('Note created successfully!', { id: toastId });
      onClose();
    } catch (error: any) {
      console.error("Create note error in modal:", error);
      toast.error(error.message || 'Failed to create note.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverLimit = contentLength > MAX_CONTENT_LENGTH;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-sm bg-black/10">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Create New Note</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            &times; {/* Close icon */}
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="note-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter note title"
            />
          </div>
          <div className="mb-1"> {/* Reduce bottom margin */} 
            <label htmlFor="note-content" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="note-content"
              value={content}
              onChange={handleContentChange} // Use new handler
              rows={4}
              className={clsx(
                  "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm",
                  isOverLimit ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300"
              )}
              placeholder="Enter note content..."
            />
          </div>
          {/* Character Counter */}
          <div className={clsx(
              "text-xs text-right mb-4", 
              isOverLimit ? "text-red-600" : "text-gray-500"
              )}>
              {contentLength}/{MAX_CONTENT_LENGTH}
          </div>
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isOverLimit} // Disable if submitting OR over limit
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNoteModal; 