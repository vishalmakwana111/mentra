# Session Debug and Token Lifetime Tasks

This file tracks tasks related to debugging the logout-on-refresh issue and increasing the session token lifetime.

1.  **Increase Token Lifetime (Backend)**
    - [x] Check/Update `ACCESS_TOKEN_EXPIRE_MINUTES` in `app/core/config.py` to 10080 (7 days).
    - [x] Briefly verify `create_access_token` in `app/core/security.py` uses this setting.

2.  **Verify Persistence (Frontend)**
    - [x] Check `src/store/authStore.ts` to ensure `persist` middleware is correctly configured with `localStorage`.

3.  **Debug Refresh Flow (Frontend)**
    - [x] Add logging in `AuthGuard`'s `useEffect` to show the initial token from the store.
    - [x] Add logging in the Axios request interceptor (`src/services/api.ts`) to show the token being attached to the `/users/me` request.
    - [x] Add detailed logging in `getCurrentUser` (`src/services/api.ts`) to show the response or specific error received.
    - [x] Add logging in `AuthGuard`'s `useEffect` to show the result (`userData` or `null`) from `getCurrentUser`.
    - [x] Add logging in `AuthGuard`'s `useEffect` right before calling `logout()` to indicate *why* it's being called.

4.  **Analyze and Fix**
    - [ ] Analyze the logs collected during a refresh to identify the failure point.
    - [ ] Implement necessary code corrections based on the analysis. 