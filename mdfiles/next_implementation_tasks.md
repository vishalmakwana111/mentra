# Mind Map Mentor - Next Implementation Tasks

This file outlines the next set of tasks after completing the initial backend and frontend setup.

---

## 1. Backend - User/Auth Implementation

- [x] Review/Refine `app/crud/crud_user.py` functions (add validation/error handling if needed).
- [x] Implement the `GET /users/me` endpoint in `app/api/api_v1/endpoints/users.py` to fetch the currently logged-in user details.

---

## 2. Frontend - Auth UI & API Connection

- [x] Create `LoginForm.tsx` component in `src/components/auth/`.
- [x] Create `SignupForm.tsx` component in `src/components/auth/`.
- [x] Set up Zustand store (`src/store/authStore.ts`) for managing auth state (token, user info, isLoggedIn status).
- [x] Create API service functions in `src/services/api.ts` (or similar) for:
  - [x] `loginUser(email, password)` -> calls `POST /api/v1/login/access-token`
  - [x] `signupUser(email, password)` -> calls `POST /api/v1/users/`
  - [x] `getCurrentUser()` -> calls `GET /api/v1/users/me` (requires token)
- [x] Connect `LoginForm` to `loginUser` API function and update Zustand store on success.
- [x] Connect `SignupForm` to `signupUser` API function.
- [x] Configure `axios` instance to automatically attach the JWT token from the store to Authorization headers.
- [x] Implement basic conditional rendering or routing:
  - [x] Show Login/Signup forms if user is not authenticated.
  - [x] Show the main `DashboardLayout` if user is authenticated.
  - [x] Attempt to fetch current user on initial app load if a token exists.

---

## 3. Backend - Notes CRUD Implementation

- [x] Create `app/crud/crud_note.py` with functions for:
  - [x] `create_note_for_user(db, note, user_id)`
  - [x] `get_notes_for_user(db, user_id)`
  - [x] `get_note(db, note_id, user_id)`
  - [x] `update_note(db, note_id, note_update, user_id)`
  - [x] `delete_note(db, note_id, user_id)`
- [x] Implement the actual logic in the placeholder endpoints in `app/api/api_v1/endpoints/notes.py` using the new CRUD functions.
- [x] Ensure all Note operations correctly check ownership against `current_user.id`.

---

## 4. Frontend - Basic Notes UI

- [x] Create `NoteList.tsx` component in `src/components/notes/`.
- [x] Create `NoteItem.tsx` component in `src/components/notes/`.
- [x] Create `CreateNoteForm.tsx` component in `src/components/notes/`.
- [x] Add API service functions for Notes CRUD operations:
  - [x] `fetchNotes()` -> calls `GET /api/v1/notes/`
  - [x] `createNote(noteData)` -> calls `POST /api/v1/notes/`
  - [ ] (Add Get/Update/Delete later)
- [x] In a suitable part of the UI (e.g., Side Panel or a dedicated Notes section), use `fetchNotes` to get and display notes using `NoteList` and `NoteItem`.
- [x] Integrate `CreateNoteForm` to allow users to create new notes via the API.
- [x] Update the displayed note list when a new note is created.

---