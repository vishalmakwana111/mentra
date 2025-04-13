# Landing Page and Theme Overhaul Tasks

This file tracks tasks related to creating a landing page and significantly refining the UI theme to match the Proton aesthetic.

## Theme Refinement (Proton-Inspired Light Theme)

- [x] Analyze Proton's color palette (backgrounds, text, accents - purples/blues) and select corresponding Tailwind colors.
- [x] Update `globals.css` or component styles with the refined color palette (e.g., lighter/cleaner backgrounds, specific accent colors).
- [x] Re-apply refined theme colors consistently across:
    - [x] `DashboardLayout.tsx`
    - [x] `SidePanel.tsx`
    - [x] `MainContent.tsx`
    - [x] `CreateNoteForm.tsx`
    - [x] `NoteList.tsx` / `NoteItem.tsx`
    - [x] `LoginForm.tsx`
    - [x] `SignupForm.tsx`
- [ ] Refine typography (fonts, sizes, weights) if needed.

## Landing Page Implementation

- [x] Decide on routing: Landing page at `/`, dashboard at `/dashboard`.
- [x] Create the landing page component (`app/page.tsx`).
- [x] Design the landing page layout (Hero section inspired by Proton).
- [x] Add content (headings, text).
- [x] Add "Login" and "Sign Up" buttons/links on the landing page.
- [x] Implement navigation from landing page buttons (Links point to `/dashboard`, AuthGuard handles showing forms).
- [x] Update `AuthGuard.tsx` routing logic:
    - [x] Ensure the landing page is publicly accessible.
    - [x] Ensure authenticated users trying to access `/` are redirected to the dashboard (`/dashboard`).
    - [x] Ensure unauthenticated users trying to access `/dashboard` see login/signup forms.

## Future Enhancements (Optional)

- [ ] Add loading indicators during auth operations (login/signup).
- [ ] Add visual feedback (e.g., toasts) for successful/failed operations. 