'use client';

import React, { useState } from 'react';
import { useSearchStore } from '@/store/searchStore'; // Import the store
import { FiX } from 'react-icons/fi'; // Import an icon for the clear button

const QueryPanel: React.FC = () => {
  // State for the query input
  const [query, setQuery] = useState<string>('');
  // Get state and actions from the store
  const {
    searchResults,
    isLoading,
    error,
    performSearch,
    clearSearch
  } = useSearchStore();

  const handleQuerySubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim() || isLoading) return; // Ignore empty or if loading
    performSearch(query);
  };

  const handleClear = () => {
      setQuery(''); // Clear input field
      clearSearch(); // Clear store state
  }

  return (
    <div className="p-4 h-full flex flex-col bg-white">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex-shrink-0">Ask Mentra</h2>
      
      {/* Results Area: Takes remaining space, scrolls */}
      <div className="flex-1 overflow-y-auto mb-4">
        {isLoading && <p className="text-sm text-gray-500 italic">Searching...</p>}
        {error && <p className="text-sm text-red-600">Error: {error}</p>}
        {!isLoading && !error && searchResults.length === 0 && (
          <p className="text-sm text-gray-500">Ask a question or describe a topic to find related notes.</p>
        )}
        {!isLoading && !error && searchResults.length > 0 && (
          <p className="text-sm text-green-600">Found {searchResults.length} relevant note(s). Check the highlighted nodes on the canvas.</p>
        )}
      </div>

      {/* Query Input Area: At the bottom, doesn't grow/shrink */}
      <form onSubmit={handleQuerySubmit} className="mt-auto flex-shrink-0 border-t pt-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-2 bg-white disabled:bg-gray-100"
          placeholder="Ask a question about your notes..."
          disabled={isLoading}
        />
        <div className="flex space-x-2">
            <button 
              type="submit"
              className="flex-grow px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!query.trim() || isLoading}
            >
              {isLoading ? 'Searching...' : 'Ask AI'}
            </button>
            {(searchResults.length > 0 || query || error) && ( // Show clear if results, query, or error exist
                <button
                    type="button"
                    onClick={handleClear}
                    title="Clear search"
                    className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 rounded-md disabled:opacity-50"
                    disabled={isLoading}
                    aria-label="Clear search"
                >
                    <FiX className="h-5 w-5" />
                </button>
            )}
        </div>
      </form>

    </div>
  );
};

export default QueryPanel; 