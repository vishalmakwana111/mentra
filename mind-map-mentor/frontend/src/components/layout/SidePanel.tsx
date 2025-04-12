'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createNote, updateNote } from '@/services/api';
import { Note, NoteUpdateData } from '@/types';
import NoteList from '@/components/notes/NoteList';
import CreateNoteForm from '@/components/notes/CreateNoteForm';
import { useAuthStore } from '@/store/authStore';
import { useGraphStore } from '@/store/graphStore';
import EditNoteModal from '@/components/notes/EditNoteModal';
import toast from 'react-hot-toast';

const SidePanel: React.FC = () => {
  // Read notes, loading, error, and fetch action from graphStore
  const {
    notes,
    isLoading: isLoadingNotes, // Rename for consistency
    error: graphError, // Rename to avoid conflict
    fetchNotesAndEdges,
    addNote // Get addNote action
  } = useGraphStore();
  
  // Local state for create form loading and modal
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const { isLoggedIn, user, logout } = useAuthStore();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // --- Modal Handling Functions ---
  const openEditModal = (noteToEdit: Note) => {
    setEditingNote(noteToEdit);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingNote(null);
  };
  // --- End Modal Handling Functions ---

  // Update Note - Keep API call, but will update store via canvas later
  // Ideally, this update should also update the store directly, but
  // for now, rely on the canvas updating the store.
  const handleUpdateNote = async (noteId: number, data: NoteUpdateData) => {
    console.log("SidePanel: handleUpdateNote called", { noteId, data });
    const toastId = toast.loading('Updating note...');
    try {
      await updateNote(noteId, data); 
      console.log("SidePanel: Note updated successfully");
      // We don't need loadNotes() here anymore, store will update
      closeEditModal();
      toast.success('Note updated successfully!', { id: toastId });
    } catch (error) {
      console.error("SidePanel: Failed to update note:", error);
      toast.dismiss(toastId);
      throw error; 
    } 
  };

  // Fetch initial data using store action when logged in
  // This might be redundant if canvas already calls it, but safe to keep
  useEffect(() => {
    if (isLoggedIn) {
      console.log("SidePanel: Calling fetchNotesAndEdges from store.");
      fetchNotesAndEdges();
    }
  }, [isLoggedIn, fetchNotesAndEdges]);

  // Handle note creation
  const handleCreateNote = async (title: string, content: string) => {
    setIsLoadingCreate(true);
    const toastId = toast.loading('Creating note...');
    try {
      // Call API
      const newNote = await createNote({ title, content });
      console.log("SidePanel: Created note via API:", newNote);
      
      // Update the global store state
      addNote(newNote);

      toast.success('Note created successfully!', { id: toastId });
    } catch (err: any) {
      console.error('Create note error from SidePanel:', err);
      toast.error(err.message || 'Failed to create note.', { id: toastId });
    } finally {
      setIsLoadingCreate(false);
    }
  };

  return (
    <div className="w-72 h-screen bg-slate-50 border-r border-slate-200 p-4 flex flex-col overflow-y-auto">
      <div className="flex-1 mb-4">
        <h2 className="text-xl font-semibold mb-4 border-b border-violet-200 pb-2 text-gray-900">Notes</h2>
        <div className="mb-4 border-b border-violet-200 pb-4">
          <CreateNoteForm onCreate={handleCreateNote} isLoading={isLoadingCreate} />
        </div>
        <div className="overflow-y-auto">
          {isLoadingNotes ? (
            <p className="text-gray-600">Loading notes...</p>
          ) : graphError ? (
            <p className="text-red-500">{graphError}</p>
          ) : (
            // Pass notes from store, onEdit still works locally
            <NoteList notes={notes} onRefresh={fetchNotesAndEdges} onEdit={openEditModal} />
          )}
        </div>
      </div>

      {/* Bottom part for User Info and Logout */}
      <div className="mt-auto border-t border-violet-200 pt-4">
        {user && (
          <div className="mb-3 text-sm text-gray-700">
            Logged in as: <span className="font-medium text-gray-900">{user.email}</span>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
        >
          Logout
        </button>
      </div>

      {/* Render Edit Modal Conditionally */}
      <EditNoteModal 
        note={editingNote}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onUpdate={handleUpdateNote} 
      />
    </div>
  );
};

export default SidePanel; 