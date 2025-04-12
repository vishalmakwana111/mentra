'use client';

import React, { useState } from 'react';

interface CreateNoteFormProps {
  onCreate: (title: string, content: string) => Promise<void>; // Function to call on submit
  isLoading: boolean;
}

const CreateNoteForm: React.FC<CreateNoteFormProps> = ({ onCreate, isLoading }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!title.trim()) {
        setError('Title cannot be empty.');
        return;
    }
    try {
      await onCreate(title, content);
      // Clear form on successful creation (handled by parent potentially)
      // setTitle('');
      // setContent('');
    } catch (err: any) {
      setError(err.message || 'Failed to create note.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-lg font-medium text-gray-700">Create New Note</h3>
      <div>
        <label htmlFor="note-title" className="sr-only">Title</label>
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 sm:text-sm bg-white text-gray-900"
          placeholder="Note Title"
        />
      </div>
      <div>
        <label htmlFor="note-content" className="sr-only">Content</label>
        <textarea
          id="note-content"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 sm:text-sm bg-white text-gray-900"
          placeholder="Note content (optional)"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating...' : 'Create Note'}
      </button>
    </form>
  );
};

export default CreateNoteForm; 