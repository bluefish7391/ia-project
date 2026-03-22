# Authentication Plan: Google Identity Platform — Email/Password

## Overview

Add Firebase Auth with email/password sign-in to the school-hub app. Only `/admin` routes will be protected. Users can self-register. All authenticated users are global admins (no tenant scoping).

## Decisions
- Only `/admin` routes require authentication
- Self-registration page included in the app
- No tenant scoping — all authenticated users are global admins

---

## Phase 1 — Firebase Console Setup *(manual prerequisite)*

1. In Firebase Console → Authentication → Sign-in providers, enable **Email/Password**
2. Copy the Firebase client config object (apiKey, authDomain, projectId, appId, etc.) — needed in Phase 2

---

## Phase 2 — Frontend Dependencies & Firebase Config

3. `npm install firebase @angular/fire` inside `frontend/`
4. Create `environments/environment.ts` and `environments/environment.prod.ts` under `frontend/projects/school-hub/src/` containing the Firebase config object
5. Add `fileReplacements` in `angular.json` (school-hub production build config) to swap env files at build time
6. Update `app.config.ts` — add `provideFirebaseApp(() => initializeApp(environment.firebase))` and `provideAuth(() => getAuth())`

---

## Phase 3 — Auth Infrastructure *(steps 7–9 are independent, can run in parallel)*

7. **`AuthService`** at `app/auth/auth.service.ts`
   - Wraps AngularFire `Auth`
   - `signIn(email, password)` via `signInWithEmailAndPassword()`
   - `signUp(email, password)` via `createUserWithEmailAndPassword()`
   - `signOut()` via `signOut()` from `@angular/fire/auth`
   - `currentUser` signal derived from `authState()` observable

8. **`authGuard`** at `app/auth/auth.guard.ts`
   - Functional `CanActivateFn`
   - Redirects to `/login` when user is null

9. **`authInterceptor`** at `app/auth/auth.interceptor.ts`
   - Functional `HttpInterceptorFn`
   - Only intercepts requests to `/api/*`
   - Appends `Authorization: Bearer <token>` using `user.getIdToken()`
   - Registered in `app.config.ts` via `provideHttpClient(withInterceptors([authInterceptor]))`

---

## Phase 4 — Login & Register UI *(parallel with each other; depends on Phase 3)*

10. **`LoginComponent`** at `app/auth/login/`
    - Standalone component, reactive form (email + password)
    - Calls `AuthService.signIn()`, navigates to `/admin` on success
    - Shows inline error message on failure

11. **`RegisterComponent`** at `app/auth/register/`
    - Standalone component, reactive form (email + password + confirm-password)
    - Calls `AuthService.signUp()`, navigates to `/admin` on success
    - Shows inline error message on failure

12. **`ForgotPasswordComponent`** at `app/auth/forgot-password/`
    - Standalone component, single email field
    - Calls `sendPasswordResetEmail()` from `@angular/fire/auth`
    - Shows confirmation message on success; inline error on failure
    - Link to this page appears on the `LoginComponent` form

---

## Phase 5 — Route Wiring *(depends on Phases 3 & 4)*

13. Update `app.routes.ts`:
    - Add lazy `login` route → `LoginComponent`
    - Add lazy `register` route → `RegisterComponent`
    - Add lazy `forgot-password` route → `ForgotPasswordComponent`
    - Add `canActivate: [authGuard]` to the `admin` route
    - Add default `''` → `'/admin'` redirect

---

## Phase 6 — Admin UI: Sign-out Button *(depends on Phase 3)*

14. Add a **logout button** to the admin layout/shell component
    - Calls `AuthService.signOut()`
    - Navigates to `/login` on completion
    - Button should be visible on all admin pages (e.g. in a top nav or sidebar)

---

## Phase 7 — Backend Token Verification *(independent; can run in parallel with Phases 2–6)*

15. Create `backend/src/middleware/auth-middleware.ts`
    - Express middleware reading `Authorization: Bearer <token>` header
    - Calls `admin.auth().verifyIdToken(token)` (firebase-admin already installed)
    - Attaches decoded user to `req`
    - Returns `401 Unauthorized` if token is missing or invalid

16. Apply middleware in `backend/src/index.ts`
    - Insert `authMiddleware` before `TenantRouter` and `OrganizationRouter`

---

## Relevant Files

| File | Change |
|------|--------|
| `frontend/projects/school-hub/src/app/app.config.ts` | Add Firebase + Auth providers |
| `frontend/projects/school-hub/src/app/app.routes.ts` | Add login/register routes, add canActivate to admin |
| `frontend/angular.json` | Add fileReplacements for environment files |
| `backend/src/index.ts` | Apply auth middleware to all routes |
| `frontend/projects/school-hub/src/app/auth/` | New directory: service, guard, interceptor, login, register, forgot-password |
| `frontend/projects/school-hub/src/environments/` | New directory: environment.ts, environment.prod.ts |
| `backend/src/middleware/auth-middleware.ts` | New file |

---

## Verification

1. `ng build school-hub` — no TypeScript errors
2. `cd backend && npm run build` — compiles cleanly
3. Navigate to `/admin` unauthenticated → redirected to `/login`
4. Register a new account → lands on `/admin`, API calls return 200
5. Log in with wrong password → inline error shown
6. Click "Forgot password?" → confirmation message shown, reset email arrives
7. Click logout button → redirected to `/login`, subsequent `/admin` navigation redirects back to `/login`
8. Call `/api/tenants` directly without token → `401` returned by Cloud Function
9. `cd backend && npm run lint` — passes
