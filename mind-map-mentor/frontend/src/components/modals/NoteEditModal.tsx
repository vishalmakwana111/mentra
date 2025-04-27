'use client';

import React, { useState, useEffect } from 'react';
import { Note, NoteUpdateData } from '@/types';
import { useGraphStore } from '@/store/graphStore';
import { updateNote } from '@/services/api';
import { FiInfo, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface NoteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteData: Note | null; // The note being edited (or null if none)
  onUpdateNoteDetails: (updatedData: NoteUpdateData) => Promise<void>; // Function to call on save
}

const NoteEditModal: React.FC<NoteEditModalProps> = ({ isOpen, onClose, noteData, onUpdateNoteDetails }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [userSummary, setUserSummary] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const graphNodes = useGraphStore((state) => state.nodes);
  const updateNodeDataInStore = useGraphStore((state) => state.updateNodeData);

  const correspondingGraphNode = noteData 
    ? graphNodes.find(n => n.data.type === 'note' && n.data.original_note_id === noteData.id) 
    : null;

  const displayTags = (correspondingGraphNode?.data?.type === 'note') 
    ? correspondingGraphNode.data.tags || [] 
    : [];

  useEffect(() => {
    if (noteData) {
      setTitle(noteData.title || '');
      setContent(noteData.content || '');
      setUserSummary(noteData.userSummary || '');
      setError(null);
      setIsSaving(false);
    } else {
      setTitle('');
      setContent('');
      setUserSummary('');
    }
  }, [noteData, correspondingGraphNode]);

  const handleUpdateDetails = async () => {
    if (!noteData?.id) return;

    setIsSaving(true);
    setError(null);
    const updatedData: NoteUpdateData = {
      title: title,
      content: content,
      userSummary: userSummary,
    };

    try {
      await onUpdateNoteDetails(updatedData);
      onClose();
    } catch (err) {
      console.error("Failed to save note details:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save note. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTag = async (tagToDelete: string) => {
    if (!noteData?.id || !correspondingGraphNode?.id) return;

    const originalNoteId = noteData.id;
    const graphNodeId = correspondingGraphNode.id;
    const currentTags = displayTags;

    const newTagsList = currentTags.filter(tag => tag !== tagToDelete);

    const toastId = toast.loading('Deleting tag...');
    try {
      await updateNote(originalNoteId, { tags: newTagsList });

      updateNodeDataInStore(graphNodeId, { tags: newTagsList });

      toast.success('Tag deleted', { id: toastId });

    } catch (error) {
      console.error('Failed to delete tag:', error);
      const message = error instanceof Error ? error.message : 'Could not delete tag.';
      toast.error(message, { id: toastId });
    }
  };

  if (!isOpen || !noteData) {
    return null;
  }

  const summaryMaxLength = 30;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-sm bg-black/10" 
    >
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Edit Note</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Close">
                &times;
            </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleUpdateDetails(); }}>
          <div className="mb-4">
            <label htmlFor="noteTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="noteTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-900"
              disabled={isSaving}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="noteSummary" className="flex items-center text-sm font-medium text-gray-700 mb-1">
              Summary (for Linking)
              <span 
                className="ml-1.5 text-gray-400 hover:text-gray-600 cursor-help" 
                title="Provide 1-5 core keywords (max 30 chars). This helps automatically link this note to similar notes based *only* on this summary."
              >
                <FiInfo className="h-4 w-4" />
              </span>
            </label>
            <textarea
              id="noteSummary"
              rows={2}
              maxLength={summaryMaxLength}
              value={userSummary}
              onChange={(e) => setUserSummary(e.target.value)}
              placeholder="Core keywords for linking... (max 30 chars)"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-900 resize-none"
              disabled={isSaving}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {userSummary.length}/{summaryMaxLength}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="noteContent" className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              id="noteContent"
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter note content..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-900 resize-none"
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2 min-h-[2rem] items-center">
            {(displayTags && displayTags.length > 0) ? (
              displayTags.map((tag: string, index: number) => (
                <span 
                  key={`${tag}-${index}`}
                  className="inline-flex items-center bg-sky-100 text-sky-800 text-xs font-medium pl-2.5 pr-1 py-0.5 rounded"
                >
                  {tag}
                  <button 
                    onClick={() => handleDeleteTag(tag)}
                    className="ml-1.5 text-sky-600 hover:text-sky-800 hover:bg-sky-200 rounded-full p-0.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">No tags assigned.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditModal; 