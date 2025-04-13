# Notifications (Toasts) Tasks

This file tracks tasks related to implementing toast notifications for user feedback.

1.  **Install Library**
    - [x] Install `react-hot-toast` library.

2.  **Integrate Provider**
    - [x] Import `Toaster` component from `react-hot-toast`.
    - [x] Add the `<Toaster />` component to the root layout (`app/layout.tsx`) so toasts can appear anywhere.

3.  **Implement Initial Toasts (Note Deletion)**
    - [x] In `NoteItem.tsx` -> `handleDelete`:
        - [x] Import `toast` from `react-hot-toast`.
        - [x] Replace the `alert()` in the `catch` block with `toast.error('Failed to delete note.')`.
        - [x] Add `toast.success('Note deleted successfully!')` after successful deletion and refresh.

4.  **Implement Toasts for Other Operations**
    - [x] **Note Creation:**
        - [x] In `SidePanel.tsx` -> `handleCreateNote`: Add `toast.success` on success and `toast.error` in the `catch` block.
    - [x] **Note Update:**
        - [x] In `EditNoteModal.tsx` -> `handleSubmit`: Modify error handling to show `toast.error` (or potentially pass the error up to `SidePanel` to show it there). Add `toast.success` in `SidePanel.tsx` -> `handleUpdateNote` after successful update.
    - [x] **Login:**
        - [x] In `LoginForm.tsx` -> `handleSubmit`: Add `toast.error` in the `catch` block. (Success redirect is usually enough feedback, but could add `toast.success` before redirect).
    - [x] **Signup:**
        - [x] In `SignupForm.tsx` -> `handleSubmit`: Add `toast.error` in the `catch` block. Keep the success message/redirect as is or replace/augment with `toast.success`.

5.  **Customize Toasts (Optional)**
    - [ ] Explore `react-hot-toast` options for customizing appearance (position, style, duration, icons) via the `<Toaster />` props or `toast()` options if desired. 