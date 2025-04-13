# Edit Note Tasks

This file tracks tasks related to implementing the note editing functionality.

- [x] Create the basic structure for the `EditNoteModal.tsx` component (including props for `note`, `isOpen`, `onClose`, `onUpdate`).
- [x] Add state variables (`editingNote: Note | null`, `isEditModalOpen: boolean`) to `SidePanel.tsx`.
- [x] Create functions in `SidePanel.tsx` to handle opening (`openEditModal(note)`) and closing (`closeEditModal()`) the modal by setting the state variables.
- [x] Pass the `openEditModal` function down through `NoteList` to `NoteItem`.
- [x] Update the `handleEdit` function in `NoteItem.tsx` to call the passed `openEditModal` function with the `note`.
- [x] Render the `EditNoteModal` conditionally in `SidePanel.tsx` based on `isEditModalOpen` and pass the required props (`note=editingNote`, `isOpen=isEditModalOpen`, `onClose=closeEditModal`, `onUpdate=handleUpdateNote`).
- [x] Implement the form logic within `EditNoteModal.tsx`:
    - [x] Use `useState` to manage local form state (title, content), initialized from the `note` prop using `useEffect`.
    - [x] Handle form input changes.
    - [x] Implement the form submission handler (`handleSubmit`).
- [x] Implement the `handleUpdateNote` function in `SidePanel.tsx` (passed as `onUpdate` to the modal):
    - [x] Call the `updateNote` API service function.
    - [x] On success, call `loadNotes()` to refresh the list and `closeEditModal()`.
    - [x] Add error handling (e.g., display error message within the modal or via toast).
- [x] Wire up the modal's `handleSubmit` to call the `onUpdate` prop. 