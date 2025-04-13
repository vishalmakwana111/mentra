# Routing Refactor Tasks

This file tracks tasks related to implementing dedicated login/signup routes.

1.  **Create Login Page Component**
    - [x] Create `app/login/page.tsx`.
    - [x] Import and render the `LoginForm` component within this page.
    - [x] Add basic centering/layout styling.

2.  **Create Signup Page Component**
    - [x] Create `app/signup/page.tsx`.
    - [x] Import and render the `SignupForm` component within this page.
    - [x] Add basic centering/layout styling.

3.  **Update Landing Page Links**
    - [x] Modify `app/page.tsx` to point the Login link to `/login` and the Sign Up link to `/signup`.

4.  **Refactor AuthGuard Logic**
    - [x] Remove the rendering of `LoginForm` and `SignupForm` from `AuthGuard.tsx`.
    - [x] Modify `AuthGuard.tsx` redirection logic:
        - [x] If NOT authenticated and trying to access a protected route (e.g., `/dashboard`), redirect to `/login`.
        - [x] If authenticated and trying to access `/login` or `/signup`, redirect to `/dashboard`.
        - [x] Keep existing redirect for authenticated users on `/` -> `/dashboard`.

5.  **Refactor Login/Signup Success Handling**
    - [x] Modify `LoginForm.tsx` `handleSubmit` to redirect to `/dashboard` on successful login.
    - [x] Modify `SignupForm.tsx` `handleSubmit` to redirect to `/login` on successful signup. 