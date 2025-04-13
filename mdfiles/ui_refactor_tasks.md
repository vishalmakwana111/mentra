# UI Refactor Tasks

This file tracks UI improvements for the main dashboard layout and panels.

- [X] **Collapsible Left Panel (SidePanel)**
    - [X] Add state to manage open/closed status (e.g., in `DashboardLayout`).
    - [X] Add a toggle button (e.g., icon button).
    - [X] Conditionally change width/styling of the left panel container.
    - [X] Conditionally hide/show content within `SidePanel` based on state.
- [ ] **Collapsible Right Panel (QueryPanel)**
    - [X] Add state to manage open/closed status.
    - [X] Add a toggle button.
    - [X] Conditionally change width/styling of the right panel container.
    - [X] Conditionally hide/show content within `QueryPanel`.
- [ ] **Query Panel Layout Adjustment**
    - [X] Modify `QueryPanel.tsx` layout (e.g., using flexbox) to position the input form at the bottom.
- [X] **Query Panel Content Adjustment**
    - [X] Remove the section displaying the list of search results (`searchResults`) from `QueryPanel.tsx`.
- [ ] **Testing**
    - [X] Verify panels collapse and expand correctly.
    - [X] Verify Query Panel input is at the bottom.
    - [X] Verify Query Panel does not show text results list.

# Tasks for UI Refactoring (Sidebar Navigation & Separate Views)

This file tracks the steps to refactor the UI, creating separate views for notes/files and updating the sidebar navigation.

- [x] **Modals:** Create `CreateNoteModal.tsx` component.
- [x] **Modals:** Create `UploadFileModal.tsx` component.
- [x] **Routing/Layout:** Define routes/structure for Canvas, All Notes, All Files views within the dashboard.
- [x] **Sidebar:** Refactor `SidePanel.tsx`: Remove inline lists/forms, add navigation links (Canvas, All Notes, All Files), add buttons to trigger Create Note & Upload File modals.
- [x] **All Notes View:** Create page/component (`/dashboard/notes`?) to display a paginated list of all notes.
    - [x] Fetch notes with pagination parameters (`fetchNotes` service).
    - [x] Implement list/table display.
    - [x] Implement pagination controls.
- [x] **All Files View:** Create page/component (`/dashboard/files`?) to display a paginated list of all files.
    - [x] Fetch files with pagination parameters (`fetchFiles` service).
    - [x] Implement list/table display.
    - [x] Implement pagination controls.
- [x] **Modals:** Connect sidebar buttons to open `CreateNoteModal` and `UploadFileModal`.
- [x] **Data Flow:** Ensure creating/uploading via modals updates relevant views/stores (might need adjustments to refresh logic).
- [x] **Styling:** Ensure consistent and clean styling across the new views and sidebar. 