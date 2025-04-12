import { create } from 'zustand';
import { Note, GraphEdge } from '@/types';
import { fetchNotes, fetchGraphEdges } from '@/services/api';

interface GraphState {
  notes: Note[];
  edges: GraphEdge[];
  isLoading: boolean;
  error: string | null;
  fetchNotesAndEdges: () => Promise<void>;
  addNote: (newNote: Note) => void;
  updateNoteInStore: (updatedNote: Note) => void;
  addEdgeToStore: (newEdge: GraphEdge) => void;
  deleteEdgeFromStore: (edgeId: number) => void;
  // Actions to modify state will be added later
}

export const useGraphStore = create<GraphState>((set) => ({
  notes: [],
  edges: [],
  isLoading: true,
  error: null,

  fetchNotesAndEdges: async () => {
    set({ isLoading: true, error: null });
    try {
      const [fetchedNotes, fetchedEdges] = await Promise.all([
        fetchNotes(),
        fetchGraphEdges(),
      ]);
      set({ notes: fetchedNotes, edges: fetchedEdges, isLoading: false });
      console.log('GraphStore: Fetched Notes:', fetchedNotes);
      console.log('GraphStore: Fetched Edges:', fetchedEdges);
    } catch (err) {
      console.error("GraphStore: Error fetching notes and edges:", err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load graph data.';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addNote: (newNote: Note) => {
    set((state) => ({
      notes: [...state.notes, newNote],
    }));
    console.log('GraphStore: Added Note:', newNote);
  },

  updateNoteInStore: (updatedNote: Note) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === updatedNote.id ? { ...note, ...updatedNote } : note
      ),
    }));
    console.log('GraphStore: Updated Note:', updatedNote);
  },

  addEdgeToStore: (newEdge: GraphEdge) => {
    set((state) => ({
      edges: [...state.edges, newEdge],
    }));
    console.log('GraphStore: Added Edge:', newEdge);
  },

  deleteEdgeFromStore: (edgeId: number) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    }));
    console.log('GraphStore: Deleted Edge with ID:', edgeId);
  },
})); 