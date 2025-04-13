# Tasks for Dashboard Views (Sidebar & Data Loading)

This file tracks tasks related to fixing sidebar visibility and implementing full data loading with pagination for the All Notes and All Files views.

- [x] **Sidebar Visibility:** Verify `/app/dashboard/` route structure and ensure `SidePanel.tsx` links point to `/dashboard/notes` and `/dashboard/files`.
- [x] **Backend Pagination:** Modify `GET /api/v1/notes/` endpoint to return total note count along with the notes list.
- [x] **Backend Pagination:** Modify `GET /api/v1/files/` endpoint to return total file count along with the files list.
- [x] **Frontend API:** Update `fetchNotes` in `api.ts` to handle the new paginated response structure (items + total).
- [x] **Frontend API:** Update `fetchFiles` in `api.ts` to handle the new paginated response structure (items + total).
- [x] **Frontend Notes View:** Update `AllNotesPage` to use the total count for accurate pagination.
- [x] **Frontend Files View:** Update `AllFilesPage` to use the total count for accurate pagination.
- [ ] **Testing:** Verify sidebar is only visible on dashboard routes and pagination works correctly. 