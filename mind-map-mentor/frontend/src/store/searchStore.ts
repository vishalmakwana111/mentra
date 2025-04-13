import { create } from 'zustand';
import { SearchMatch } from '@/types'; // Assuming types are defined here
import { searchNotesApi } from '@/services/api'; // Import the API function
import { useGraphStore } from './graphStore'; // Import graph store to access nodes

interface SearchState {
  searchResults: SearchMatch[];
  highlightedNodeIds: string[];
  isLoading: boolean;
  error: string | null;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  searchResults: [],
  highlightedNodeIds: [],
  isLoading: false,
  error: null,

  performSearch: async (query: string) => {
    set({ isLoading: true, error: null, searchResults: [], highlightedNodeIds: [] }); // Reset on new search
    try {
      const response = await searchNotesApi(query); // Call the API function
      const results = response.results || [];
      
      // Get current nodes from graphStore
      const allNodes = useGraphStore.getState().nodes;
      
      // Map search results (metadata.note_id) to actual graph node IDs
      const nodeIdsToHighlight = results.reduce((acc: string[], match) => {
        const targetNoteId = match.metadata.note_id;
        // Find the graph node corresponding to this original note ID
        const foundNode = allNodes.find(node => node.data.original_note_id === targetNoteId);
        if (foundNode) {
          acc.push(foundNode.id); // Push the actual React Flow node ID
        }
        return acc;
      }, []);

      console.log("SearchStore: Original Note IDs from search:", results.map(m => m.metadata.note_id));
      console.log("SearchStore: Mapped Graph Node IDs to highlight:", nodeIdsToHighlight);
      
      set({
        searchResults: results,
        highlightedNodeIds: nodeIdsToHighlight, // Store the correct IDs
        isLoading: false,
      });
    } catch (err: any) {
      console.error("Search store error:", err);
      set({ error: err.message || 'Failed to perform search.', isLoading: false });
    }
  },

  clearSearch: () => {
    set({ searchResults: [], highlightedNodeIds: [], error: null, isLoading: false });
  },
})); 