'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Note } from '@/types';
import { fetchNotes, deleteNote, updateNote } from '@/services/api'; // Import fetchNotes, deleteNote, and updateNote services
import { FiChevronLeft, FiChevronRight, FiEdit, FiTrash2 } from 'react-icons/fi'; // Icons for pagination + edit/delete
import toast from 'react-hot-toast';
import { useGraphStore } from '@/store/graphStore'; // Import graph store
import NoteEditModal from '@/components/modals/NoteEditModal'; // Import NoteEditModal component

const ITEMS_PER_PAGE = 10; // Define how many notes per page

export default function AllNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalNotes, setTotalNotes] = useState(0); // Need total count for pagination
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // State for Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  // Get timestamp from store
  const lastNoteCreatedTimestamp = useGraphStore((state) => state.lastNoteCreatedTimestamp);

  // Calculate total pages
  const totalPages = Math.ceil(totalNotes / ITEMS_PER_PAGE);

  const loadNotes = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * ITEMS_PER_PAGE;
      const limit = ITEMS_PER_PAGE;
      // Fetch data including total count
      const response = await fetchNotes(skip, limit); 
      
      setNotes(response.items);
      setTotalNotes(response.total); // Use total from response

      // Adjust currentPage if deletion made the current page empty and it's not page 1
      if (response.items.length === 0 && page > 1) {
        setCurrentPage(page - 1); // Go back one page
      }

    } catch (err) {
      console.error("Failed to load notes:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notes.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to load notes initially and when page changes
  useEffect(() => {
    loadNotes(currentPage);
  }, [currentPage, loadNotes]);

  // Effect to reload notes when a new note is created via modal
  useEffect(() => {
      if (lastNoteCreatedTimestamp) { // Check if timestamp is not null
        console.log("New note detected, reloading list...");
        // Go back to page 1 or stay on current page? For simplicity, reload current page.
        loadNotes(currentPage); 
      }
      // Note: This might trigger on initial load if timestamp is set then.
      // Add checks if needed to prevent initial double load.
  }, [lastNoteCreatedTimestamp, loadNotes, currentPage]); // Depend on timestamp

  // Edit Handlers
  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingNote(null);
  };

  const handleUpdateSuccess = () => {
    closeEditModal();
    // Refresh the current page of notes
    loadNotes(currentPage);
    toast.success('Note updated successfully!'); // Add feedback
  };

  // Delete Handler
  const handleDeleteNote = async (noteId: number) => {
    // Confirmation dialog
    if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    const toastId = toast.loading('Deleting note...');
    try {
      await deleteNote(noteId); // Call API service
      toast.success('Note deleted successfully!', { id: toastId });
      // Reload notes after deletion
      // The loadNotes function already handles adjusting the page if needed
      loadNotes(currentPage); 
    } catch (err) {
      console.error("Failed to delete note:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note.';
      toast.error(errorMessage, { id: toastId });
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    // Use totalPages for accurate check
    if (currentPage < totalPages) { 
       setCurrentPage((prev) => prev + 1);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">All Notes</h1>
      
      {isLoading && <p className="text-gray-600 text-center">Loading notes...</p>}
      {error && <p className="text-red-500 text-center">Error: {error}</p>}
      
      {!isLoading && !error && (
        <div className="flex-1 overflow-y-auto mb-4 pr-2"> {/* Added padding-right */}
          {notes.length === 0 ? (
            <p className="text-gray-500 text-center italic">No notes found.</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li key={note.id} className="bg-white p-4 rounded-md border border-gray-200 shadow-sm flex justify-between items-start">
                  <div className="flex-1 mr-4 overflow-hidden"> {/* Added overflow hidden */}
                      <h3 className="font-medium text-gray-800 truncate mb-1">{note.title || 'Untitled Note'}</h3>
                      <p className="text-sm text-gray-600 line-clamp-1">{note.content || <span className="italic text-gray-400">No content</span>}</p> 
                      <p className="text-xs text-gray-400 mt-2">Created: {new Date(note.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex-shrink-0 flex space-x-2 mt-1"> 
                    <button
                      onClick={() => openEditModal(note)}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="Edit Note"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete Note"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Basic Pagination Controls */} 
      {!isLoading && !error && totalPages > 0 && (
        <div className="flex justify-center items-center space-x-4 mt-auto pt-4 border-t border-gray-200">
          <button 
            onClick={handlePreviousPage} 
            disabled={currentPage === 1}
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft className="mr-1 h-4 w-4" /> Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages} {/* Now accurate */}
          </span>
          <button 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages} // Disable if on last page
            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next <FiChevronRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      )}

      {/* Render Edit Modal */}
      {editingNote && (
          <NoteEditModal 
              noteData={editingNote} 
              isOpen={isEditModalOpen} 
              onClose={closeEditModal}
              onSave={async (updatedData) => { 
                  await updateNote(editingNote.id, updatedData);
                  handleUpdateSuccess(); // Close modal and refresh list on success
              }}
          />
      )}

    </div>
  );
} 