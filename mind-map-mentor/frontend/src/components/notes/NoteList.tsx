'use client';

import React from 'react';
import { Note } from '@/types'; // Import from our types file
import NoteItem from './NoteItem';

interface NoteListProps {
  notes: Note[];
  onRefresh: () => void; // Add prop for refreshing
  onEdit: (note: Note) => void; // Add prop for editing
  // Add functions for selecting/editing/deleting notes later
}

const NoteList: React.FC<NoteListProps> = ({ notes, onRefresh, onEdit }) => {
  console.log('NoteList received notes:', notes); // Log received notes

  if (!notes || notes.length === 0) {
    return <p className="text-center text-gray-400 italic mt-4">No notes yet.</p>;
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <NoteItem key={note.id} note={note} onRefresh={onRefresh} onEdit={onEdit} />
      ))}
    </div>
  );
};

export default NoteList; 