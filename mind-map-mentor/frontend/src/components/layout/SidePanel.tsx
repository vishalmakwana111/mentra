'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; // Import Link for navigation
import { Node } from 'reactflow'; // Import Node from reactflow
import { createNote, updateNote, uploadFile, deleteFile, downloadFileApi } from '@/services/api';
import { Note, NoteUpdateData, ApiFile, GraphNodeData, NoteCreateData } from '@/types'; // Removed FileNodeData, Node
import { useAuthStore } from '@/store/authStore';
import { useGraphStore } from '@/store/graphStore';
import EditNoteModal from '@/components/notes/EditNoteModal';
import toast from 'react-hot-toast';
import { FiDownload, FiTrash2, FiPlusCircle, FiUpload, FiLogOut, FiGrid, FiFileText, FiFolder } from 'react-icons/fi';

// Import Modals
import CreateNoteModal from '@/components/notes/CreateNoteModal';
import UploadFileModal from '@/components/files/UploadFileModal';

const SidePanel: React.FC = () => {
  const {
    nodes: graphNodes, // Use nodes from store
    isLoading: isLoadingGraph,
    error: graphError, 
    fetchGraphData,
    addNoteNode, 
    addFileNode,
    removeFileNode, 
    // updateNodeData // Removed as it wasn't used after refactor
  } = useGraphStore();
  
  // Derive notes list from graphNodes
  // NOTE: Ensure Node type from reactflow is imported or defined if not global
  const notes = graphNodes
    .filter((node): node is Node<GraphNodeData & { original_note_id: number, label: string, content: string, position_x?: number, position_y?: number, created_at: string, updated_at: string }> => 
        node.data.type === 'note' && typeof (node.data as any).original_note_id === 'number'
    )
    .map(node => {
        const noteData = node.data;
        return {
            id: noteData.original_note_id,
            user_id: useAuthStore.getState().user?.id ?? 0,
            title: noteData.label,
            content: noteData.content,
            position_x: noteData.position_x,
            position_y: noteData.position_y,
            created_at: noteData.created_at,
            updated_at: noteData.updated_at,
        } as Note;
    });

  // Derive files list from graphNodes
  const filesForPanel = graphNodes
      .filter((node): node is Node<GraphNodeData & { original_file_id: number, filename: string, mime_type: string, size: number, created_at: string }> => 
          node.data.type === 'file' && typeof (node.data as any).original_file_id === 'number'
      )
      .map(node => {
          const fileData = node.data;
          // Map back to ApiFile structure for the panel components
          return {
              id: fileData.original_file_id,
              user_id: useAuthStore.getState().user?.id ?? 0,
              filename: fileData.filename, 
              mime_type: fileData.mime_type,
              size: fileData.size,
              created_at: fileData.created_at,
              // Add graph_node_id if needed by panel components, though maybe not
              // graph_node_id: fileData.id 
          } as ApiFile;
      });

  // Local state for create form loading and modal
  // const [isLoadingCreate, setIsLoadingCreate] = useState(false); // Removed, handled by modal
  const { isLoggedIn, user, logout } = useAuthStore();
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State for file input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState<number | null>(null); // Keep download state

  // State for modals
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [isUploadFileModalOpen, setIsUploadFileModalOpen] = useState(false);
  const [isLoadingCreateNote, setIsLoadingCreateNote] = useState(false);
  const [isLoadingUploadFile, setIsLoadingUploadFile] = useState(false);

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

  // Update Note - TODO: Adapt if necessary to use updateNodeData from store
  const handleUpdateNote = async (noteId: number, data: NoteUpdateData) => {
    console.log("SidePanel: handleUpdateNote called", { noteId, data });
    const toastId = toast.loading('Updating note...');
    try {
      await updateNote(noteId, data); 
      console.log("SidePanel: Note updated successfully via API");
      // TODO: Optionally update store directly using updateNodeData if API doesn't return updated node
      // Or rely on fetchGraphData re-fetching after modal close
      fetchGraphData(); // Re-fetch graph data to get updated note
      closeEditModal();
      toast.success('Note updated successfully!', { id: toastId });
    } catch (error: any) {
      console.error("SidePanel: Failed to update note:", error);
      toast.error(error.message || 'Failed to update note', { id: toastId });
      // Don't throw here if the modal isn't handling it
    } 
  };

  // Fetch initial data using store action when logged in
  useEffect(() => {
    if (isLoggedIn) {
      console.log("SidePanel: Calling fetchGraphData from store.");
      fetchGraphData(); // Use the combined fetch action
    }
  }, [isLoggedIn, fetchGraphData]);

  // Handle downloading a file
  const handleDownloadFile = async (file: ApiFile) => {
    console.log("Attempting to download file:", file.filename, "ID:", file.id);
    setIsDownloading(file.id); // Set downloading state for this file
    const toastId = toast.loading(`Downloading ${file.filename}...`);
    try {
      const blob = await downloadFileApi(file.id); // Call API service
      
      // Create a link element
      const link = document.createElement('a');
      
      // Create an object URL for the blob
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      
      // Set the download attribute with the original filename
      link.setAttribute('download', file.filename);
      
      // Append the link to the body (required for Firefox)
      document.body.appendChild(link);
      
      // Programmatically click the link
      link.click();
      
      // Clean up: remove the link and revoke the object URL
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${file.filename}!`, { id: toastId });
    } catch (err: any) {
      console.error("File download error:", err);
      toast.error(`Download failed: ${err.message}`, { id: toastId });
    } finally {
      setIsDownloading(null); // Reset downloading state
    }
  };

  // Handle deleting a file - uses removeFileNode which now uses original_file_id
  const handleDeleteFile = async (fileId: number) => {
      if (!window.confirm("Are you sure you want to delete this file?")) {
          return;
      }
      console.log("Attempting to delete file (original ID):", fileId);
      const toastId = toast.loading('Deleting file...');
      try {
          await deleteFile(fileId); // API call still uses original ID
          removeFileNode(fileId); // Store action uses original ID
          toast.success('File deleted successfully!', { id: toastId });
      } catch (err: any) {
          console.error("File deletion error:", err);
          toast.error(`Deletion failed: ${err.message}`, { id: toastId });
      }
  };

  // --- Modal Trigger Functions ---
  const openCreateNoteModal = () => setIsCreateNoteModalOpen(true);
  const closeCreateNoteModal = () => setIsCreateNoteModalOpen(false);
  const openUploadFileModal = () => setIsUploadFileModalOpen(true);
  const closeUploadFileModal = () => setIsUploadFileModalOpen(false);
  // --- End Modal Triggers ---

  // Handle Note Creation (called by modal's onCreate prop)
  const handleCreateNoteSubmit = async (data: NoteCreateData) => {
    setIsLoadingCreateNote(true);
    // No toast here, modal handles it
    try {
      const newNote = await createNote(data); // Use data from modal
      addNoteNode(newNote); // Update graph store
      // Optionally: If on /notes page, trigger a refresh?
      closeCreateNoteModal(); // Close modal on success
    } catch (err: any) {
      console.error('Create note error from SidePanel via modal:', err);
      // Re-throw error for the modal to display via toast
      throw err; 
    } finally {
      setIsLoadingCreateNote(false);
    }
  };

  // Handle File Upload (called by modal's onUpload prop)
  const handleFileUploadSubmit = async (file: File) => {
    setIsLoadingUploadFile(true);
    // No toast here, modal handles it
    try {
      const uploadedFileRecord = await uploadFile(file); // Use file from modal
      addFileNode(uploadedFileRecord); // Add file node to store
      closeUploadFileModal(); // Close modal on success
    } catch (err: any) {
      console.error('File upload error from SidePanel via modal:', err);
       // Re-throw error for the modal to display via toast
      throw err;
    } finally {
      setIsLoadingUploadFile(false);
    }
  };

  // TODO: Add loading states for notes and files lists?
  // TODO: Add error states for notes and files lists?

  return (
    // Main container: flex column, full height, padding, spacing
    <div className="flex flex-col h-full p-4 space-y-4">

      {/* Header Section: Title, Buttons (fixed top) */}
      <div className="space-y-4 flex-shrink-0">
        <h2 className="text-2xl font-semibold text-indigo-600">Mentra</h2>
        <div className="space-y-2">
          <button
            onClick={openCreateNoteModal}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isLoadingCreateNote}
          >
            <FiPlusCircle className="mr-2 h-5 w-5" />
            Create Note
          </button>
          <button
            onClick={openUploadFileModal}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isLoadingUploadFile}
          >
            <FiUpload className="mr-2 h-5 w-5" />
            Upload File
          </button>
        </div>
      </div>

      {/* Separator */}
      <hr className="border-gray-200 flex-shrink-0" />

      {/* Middle Section: Navigation Links (scrollable) */}
      <div className="flex-grow overflow-y-auto space-y-2 pr-2"> {/* Scrollable area */}
          <nav className="space-y-1">
            <Link href="/dashboard" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-50">
              <FiGrid className="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-500" />
              Canvas
            </Link>
            <Link href="/dashboard/notes" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-50">
              <FiFileText className="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-500" />
              All Notes
            </Link>
             <Link href="/dashboard/files" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-50">
              <FiFolder className="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-500" />
              All Files
            </Link>
        </nav>
        {/* Consider adding Files List here if desired */}
      </div>

      {/* Footer Section: User Info, Logout (fixed bottom) */}
      <div className="mt-auto flex-shrink-0 pt-4 border-t border-gray-200">
         {user && (
          <div className="mb-2 px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded truncate">
            Logged in as: {user.email}
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <FiLogOut className="mr-2 h-5 w-5" />
          Logout
        </button>
      </div>

      {/* Modals */}
      {isCreateNoteModalOpen && (
        <CreateNoteModal
          isOpen={isCreateNoteModalOpen}
          onClose={closeCreateNoteModal}
          onCreate={handleCreateNoteSubmit}
        />
      )}

      {isUploadFileModalOpen && (
        <UploadFileModal
          isOpen={isUploadFileModalOpen}
          onClose={closeUploadFileModal}
          onUpload={handleFileUploadSubmit}
        />
      )}

      {isEditModalOpen && editingNote && (
        <EditNoteModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          note={editingNote}
          onUpdate={handleUpdateNote}
        />
      )}
    </div>
  );
};

export default SidePanel; 