'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ApiFile } from '@/types'; // Use ApiFile type
import { fetchFiles, deleteFile, downloadFileApi } from '@/services/api'; // Import file services
import { FiChevronLeft, FiChevronRight, FiDownload, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useGraphStore } from '@/store/graphStore'; // Import graph store

const ITEMS_PER_PAGE = 10;

export default function AllFilesPage() {
  const [files, setFiles] = useState<ApiFile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0); // Need total count for pagination
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  // Get timestamp from store
  const lastFileUploadedTimestamp = useGraphStore((state) => state.lastFileUploadedTimestamp);

  // Calculate total pages
  const totalPages = Math.ceil(totalFiles / ITEMS_PER_PAGE);

  const loadFiles = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * ITEMS_PER_PAGE;
      const limit = ITEMS_PER_PAGE;
      // Fetch data including total count
      const response = await fetchFiles(skip, limit);
      
      setFiles(response.items);
      setTotalFiles(response.total); // Use total from response

    } catch (err: any) {
      console.error("Failed to load files:", err);
      setError(err.message || 'Failed to load files.');
      toast.error(err.message || 'Failed to load files.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to load files initially and when page changes
  useEffect(() => {
    loadFiles(currentPage);
  }, [currentPage, loadFiles]);

  // Effect to reload files when a new file is uploaded via modal
  useEffect(() => {
      if (lastFileUploadedTimestamp) { // Check if timestamp is not null
        console.log("New file detected, reloading list...");
        loadFiles(currentPage);
      }
  }, [lastFileUploadedTimestamp, loadFiles, currentPage]); // Depend on timestamp

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    // Use totalPages for accurate check
    if (currentPage < totalPages) {
       setCurrentPage((prev) => prev + 1);
    }
  };

  // Handle download
  const handleDownload = async (file: ApiFile) => {
    setIsDownloading(file.id);
    const toastId = toast.loading(`Downloading ${file.filename}...`);
    try {
      const blob = await downloadFileApi(file.id);
      const link = document.createElement('a');
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', file.filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded ${file.filename}!`, { id: toastId });
    } catch (err: any) {
      console.error("File download error:", err);
      toast.error(`Download failed: ${err.message}`, { id: toastId });
    } finally {
      setIsDownloading(null);
    }
  };

  // Handle delete
  const handleDelete = async (fileId: number) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    
    const toastId = toast.loading('Deleting file...');
    try {
      await deleteFile(fileId);
      toast.success('File deleted!', { id: toastId });
      // Refresh the current page after deletion
      loadFiles(currentPage); 
      // TODO: Also need to remove node from graphStore if canvas is open?
      // Maybe call removeFileNode from graphStore here?
    } catch (err: any) {
      console.error("File delete error:", err);
      toast.error(`Deletion failed: ${err.message}`, { id: toastId });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">All Files</h1>
      
      {isLoading && <p className="text-gray-600 text-center">Loading files...</p>}
      {error && <p className="text-red-500 text-center">Error: {error}</p>}
      
      {!isLoading && !error && (
        <div className="flex-1 overflow-y-auto mb-4">
          {files.length === 0 ? (
            <p className="text-gray-500 text-center italic">No files found.</p>
          ) : (
            <ul className="space-y-2">
              {files.map((file) => (
                <li key={file.id} className="bg-white p-3 rounded-md border border-gray-200 flex justify-between items-center text-sm">
                  <span className="truncate flex-1 mr-2" title={file.filename}>{file.filename}</span>
                  <div className="flex space-x-1 ml-1 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={isDownloading === file.id}
                      className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-blue-100 transition-colors duration-150 disabled:opacity-50"
                      aria-label="Download file"
                    >
                      {isDownloading === file.id ? <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div> : <FiDownload className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)} 
                      className="text-gray-500 hover:text-red-600 p-1 rounded hover:bg-red-100 transition-colors duration-150"
                      aria-label="Delete file"
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

      {/* Pagination Controls */} 
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
    </div>
  );
} 