# Plan: Clock-In / Clock-Out Workflow

## Summary
Build a shared clock-in and clock-out workflow for the Lunch Check feature: student lookup with debounced live search, student selection, and a primary action button whose label and behavior are driven by the active route. A single `LunchCheckClockActionComponent` handles both flows, parameterized via Angular route data (`checkingIn: boolean`). Reusable sub-components (`StudentListComponent`, `CreateStudentComponent`) are shared across both directions. Requires a new backend endpoint for `StudentLunchCheck` config (contractSigned) and a new frontend service.

## Decisions
- Clock-in and clock-out share one component — `LunchCheckClockActionComponent` — parameterized by `checkingIn` route data
- "Create New Student" form accessible from both clock-in and clock-out routes — a student may need to be created before being clocked out for the first time
- After creating a student → return to search results so user can select and complete the action
- Search behavior → AND (all non-empty fields must match, consistent with backend)
- Debounced search: 400ms debounce using RxJS Subject/switchMap (appropriate for streams)
- `StudentLunchCheck` config (contractSigned) needs a new backend endpoint: `POST /api/lunch-check/student-lunch-check`
- Routing module stays as NgModule (hybrid is valid); both child routes updated

---

## Phase 1: Backend — StudentLunchCheck Config Endpoint

### Step 1 — `shared/kinds.ts`
Add two new interfaces:
```
SaveStudentLunchCheckConfigRequest { studentID, contractSigned, note? }
SaveStudentLunchCheckConfigResponse { studentLunchCheck: StudentLunchCheck }
```

### Step 2 — `backend/src/daos/lunch-check-dao.ts`
Add `saveStudentLunchCheckConfig(studentLunchCheck: StudentLunchCheck)` method:
- key: `datastore.key([STUDENT_LUNCH_CHECK_KIND, studentLunchCheck.studentID])`
- saves entity, returns it

### Step 3 — `backend/src/managers/lunch-check-manager.ts`
Add `saveStudentLunchCheckConfig(requestContext, data: SaveStudentLunchCheckConfigRequest)`:
- validate student exists via `studentDAO.getStudent`
- build `StudentLunchCheck` object with `tenantID`
- call `lunchCheckDAO.saveStudentLunchCheckConfig`
- return `SaveStudentLunchCheckConfigResponse`

### Step 4 — `backend/src/routers/lunch-check-router.ts`
Add `.post("/student-lunch-check", ...)` handler:
- validate `studentID` and `contractSigned` (boolean) are present
- call `lunchCheckManager.saveStudentLunchCheckConfig`
- return `sendSuccess` with response

---

## Phase 2: Frontend Service

### Step 5 — Create `lunch-check.service.ts`
Location: `frontend/projects/school-hub/src/app/lunch-check/lunch-check.service.ts`
Injectable service with 4 methods (all return Observables via ApiService):
- `searchStudents(filters)` → POST `lunch-check/student-lunch-check-records`
- `clockStudent(studentID, lunchDate, checkingIn: boolean)` → PUT `lunch-check/student-lunch-check-record` — single method handles both directions
- `createStudent(data)` → POST `students`
- `saveStudentLunchCheckConfig(data)` → POST `lunch-check/student-lunch-check`

---

## Phase 3: Shared Clock Action Component

### Step 6a — Create `StudentListComponent` (reusable sub-component)
`frontend/projects/school-hub/src/app/lunch-check/student-list/student-list.ts` — standalone component
`frontend/projects/school-hub/src/app/lunch-check/student-list/student-list.html`
`frontend/projects/school-hub/src/app/lunch-check/student-list/student-list.scss`

**Inputs:**
- `records` — `InputSignal<StudentLunchCheckCompositeRecord[]>` — the list to display
- `selectedRecord` — `InputSignal<StudentLunchCheckCompositeRecord | null>` — currently selected item (for highlight)
- `isLoading` — `InputSignal<boolean>` — shows spinner while a search is in flight

**Outputs:**
- `recordSelected` — `OutputEmitterRef<StudentLunchCheckCompositeRecord>` — emits when the user clicks a student card

**Template:** scrollable list of student cards (name, school ID, contract status badge, **current clock status badge**); loading spinner when `isLoading()` is true; empty-state message when `records()` is empty and `isLoading()` is false

**Clock status logic (pure helper function, co-located in the same file):**
Derives a student's current status from their `lunchCheckRecords` for today:
```
function getClockStatus(records: LunchCheckRecord[]): 'clocked-in' | 'clocked-out' | 'not-clocked-in'
  - sort records by createdDate ascending
  - most recent record has checkInTime but no checkOutTime  → 'clocked-in'
  - most recent record has both checkInTime and checkOutTime → 'clocked-out'
  - no records                                              → 'not-clocked-in'
```
Each card computes and displays a status badge using this function:
- `clocked-in` → green badge "Clocked In"
- `clocked-out` → grey badge "Clocked Out"
- `not-clocked-in` → grey badge "Not Clocked In"

**Note:** Purely presentational — no service dependencies. Selection state is owned by the parent and passed back in via `selectedRecord` so the parent can react to it.

---

### Step 6b — Create `CreateStudentComponent` (reusable sub-component)
`frontend/projects/school-hub/src/app/lunch-check/create-student/create-student.ts` — standalone component
`frontend/projects/school-hub/src/app/lunch-check/create-student/create-student.html`
`frontend/projects/school-hub/src/app/lunch-check/create-student/create-student.scss`

**Inputs:**
- `isSaving` — `InputSignal<boolean>` — disables form while a save is in flight

**Outputs:**
- `studentCreated` — `OutputEmitterRef<{ schoolStudentID: string; firstName: string; lastName: string; contractSigned: boolean }>` — emits the validated form data when the user submits
- `cancelled` — `OutputEmitterRef<void>` — optional; emits if the host wants to close the form on cancel

**Internal state (signals):**
- `schoolStudentID`, `firstName`, `lastName` — `signal<string>`
- `contractSigned` — `signal<boolean>`
- `validationError` — `signal<string | null>`

**Methods:**
- `onSubmit()` — validates all fields are filled, emits `studentCreated`; sets `validationError` if invalid
- `onReset()` — clears all fields and `validationError`

**Template:** School ID, First Name, Last Name inputs + contract-signed toggle + "Create Student" button (disabled while `isSaving()`) + inline validation/error message

**Note:** This component is purely presentational — it holds no service dependencies. The parent (clock-in) handles the actual API calls and passes `isSaving` down.

---

### Step 6c — Create shared clock action component
`frontend/projects/school-hub/src/app/lunch-check/clock-action/lunch-check-clock-action.ts` — standalone component
`frontend/projects/school-hub/src/app/lunch-check/clock-action/lunch-check-clock-action.html`
`frontend/projects/school-hub/src/app/lunch-check/clock-action/lunch-check-clock-action.scss`

**Route data:** Both the `clock-in` and `clock-out` routes point to this same component. Each route passes `data: { checkingIn: true }` / `data: { checkingIn: false }`. The component reads this via `inject(ActivatedRoute).snapshot.data['checkingIn'] as boolean`.

**Component state (signals):**
- `checkingIn` — `signal<boolean>` — set from route data on init; drives labels and feature visibility
- `searchSchoolStudentID`, `searchFirstName`, `searchLastName` — `signal<string>`
- `results` — toSignal from debounced search pipeline
- `selectedRecord` — `signal<StudentLunchCheckCompositeRecord | null>`
- `isSearching` — `signal<boolean>`
- `searchError` — `signal<string | null>`
- `createFormVisible` — `signal<boolean>`
- `isSaving` — `signal<boolean>`
- `saveError` — `signal<string | null>`

**Derived (computed):**
- `actionLabel` — `computed(() => checkingIn() ? 'Clock In' : 'Clock Out')`
- `pageTitle` — `computed(() => checkingIn() ? 'Clock In Student' : 'Clock Out Student')`
- `showCreateForm` — `computed(() => createFormVisible())` — create-student section available on both clock-in and clock-out
- `selectedStudentStatus` — `computed(() => selectedRecord() ? getClockStatus(selectedRecord()!.lunchCheckRecords) : null)` — reuses the same `getClockStatus` helper from `StudentListComponent`
- `statusWarning` — `computed<string | null>(() => {
    const status = selectedStudentStatus();
    if (!status) return null;
    if (checkingIn() && status === 'clocked-in')
      return 'This student is currently clocked in. They will be clocked in again.';
    if (!checkingIn() && status !== 'clocked-in')
      return 'This student does not appear to be currently clocked in. They will be clocked out anyway.';
    return null;
  })` — non-blocking warning; action button stays enabled regardless

**Sub-components used:**
- `<app-student-list [records]="results()" [selectedRecord]="selectedRecord()" [isLoading]="isSearching()" (recordSelected)="onSelectStudent($event)" />`
- `@if (showCreateForm()) { <app-create-student [isSaving]="isSaving()" (studentCreated)="onStudentCreated($event)" /> }`

**Search pipeline:**
- `searchTrigger$` subject (fires when any search signal changes)
- `ngOnInit`: set up `searchTrigger$.pipe(debounceTime(400), distinctUntilChanged(deep compare), switchMap → lunchCheckService.searchStudents(...))`
- `effect()` watches the three search signals → pushes to `searchTrigger$`
- Today's date used as `lunchDate` (computed from `new Date().toISOString().split('T')[0]`)

**Methods:**
- `onSelectStudent(record)` → set `selectedRecord`
- `onConfirm()` → calls `clockStudent(studentID, lunchDate, checkingIn())`, on success `router.navigate(['/lunch-check'])`
- `onToggleCreateForm()` → flip `createFormVisible` (available on both clock-in and clock-out routes)
- `onStudentCreated(data)` → calls `createStudent` then `saveStudentLunchCheckConfig` (sequential); on success calls `createStudentRef.onReset()` via `viewChild`, re-triggers search

**Template sections:**
1. Back link header ("← Lunch Check")
2. Page title + subtitle (driven by `pageTitle()`)
3. Search section: three text inputs (School ID, First Name, Last Name)
4. `<app-student-list>` — handles loading spinner, results, empty state, and per-card clock-status badges internally
5. `@if (statusWarning())` — amber/yellow warning banner between the list and the action bar: displays `statusWarning()` message; action button remains enabled
6. Sticky bottom action bar: "Cancel" button + action button labelled `actionLabel()` (disabled unless student selected)
7. "Create New Student" collapsible section (visible on both routes):
   - Toggle shown on both clock-in and clock-out routes
   - `@if (showCreateForm()) { <app-create-student [isSaving]="isSaving()" (studentCreated)="onStudentCreated($event)" /> }`
   - API-level `saveError` displayed above the sub-component

**Styling (matches home SCSS):**
- Background: #f5f7fa; clock-in accent green #2e7d32; clock-out accent orange #e65100 (driven by `checkingIn()` CSS class on host)
- Sticky bottom bar with shadow

---

## Phase 4: Update Routing

### Step 7 — `lunch-check-routing-module.ts`
Update both child routes to lazy-load `LunchCheckClockActionComponent` instead of `LunchCheckHomeComponent`, passing route `data` to distinguish the two directions:
```typescript
{ path: 'clock-in',  data: { checkingIn: true },  loadComponent: () => import('./clock-action/lunch-check-clock-action').then(m => m.LunchCheckClockActionComponent) },
{ path: 'clock-out', data: { checkingIn: false }, loadComponent: () => import('./clock-action/lunch-check-clock-action').then(m => m.LunchCheckClockActionComponent) },
```

---

## Relevant Files

- `shared/kinds.ts` — add two new interfaces
- `backend/src/daos/lunch-check-dao.ts` — add saveStudentLunchCheckConfig
- `backend/src/managers/lunch-check-manager.ts` — add saveStudentLunchCheckConfig method
- `backend/src/routers/lunch-check-router.ts` — add POST /student-lunch-check
- `shared/kinds.ts` — add two new interfaces
- `backend/src/daos/lunch-check-dao.ts` — add saveStudentLunchCheckConfig
- `backend/src/managers/lunch-check-manager.ts` — add saveStudentLunchCheckConfig method
- `backend/src/routers/lunch-check-router.ts` — add POST /student-lunch-check
- `frontend/projects/school-hub/src/app/lunch-check/lunch-check.service.ts` — CREATE
- `frontend/projects/school-hub/src/app/lunch-check/student-list/student-list.ts` — CREATE (reusable)
- `frontend/projects/school-hub/src/app/lunch-check/student-list/student-list.html` — CREATE
- `frontend/projects/school-hub/src/app/lunch-check/student-list/student-list.scss` — CREATE
- `frontend/projects/school-hub/src/app/lunch-check/create-student/create-student.ts` — CREATE (reusable)
- `frontend/projects/school-hub/src/app/lunch-check/create-student/create-student.html` — CREATE
- `frontend/projects/school-hub/src/app/lunch-check/create-student/create-student.scss` — CREATE
- `frontend/projects/school-hub/src/app/lunch-check/clock-action/lunch-check-clock-action.ts` — CREATE (shared by clock-in and clock-out)
- `frontend/projects/school-hub/src/app/lunch-check/clock-action/lunch-check-clock-action.html` — CREATE
- `frontend/projects/school-hub/src/app/lunch-check/clock-action/lunch-check-clock-action.scss` — CREATE
- `frontend/projects/school-hub/src/app/lunch-check/lunch-check-routing-module.ts` — update clock-in and clock-out routes

---

## Verification
1. Backend builds: `cd backend && npm run build` — no TS errors
2. Navigate to `/lunch-check/clock-in` — component renders with green accent and "Clock In" title
3. Navigate to `/lunch-check/clock-out` — same component renders with orange accent, "Clock Out" title, and no "Create New Student" section
4. Type in any search field on either route — results appear after ~400ms debounce; each student card shows a clock-status badge ("Clocked In", "Clocked Out", or "Not Clocked In")
5. Select a student — card highlights, action button enables with correct label
6. Select a student who is currently clocked in while on the clock-in route — amber warning banner appears; action button remains enabled
7. Select a student who is not currently clocked in while on the clock-out route — amber warning banner appears; action button remains enabled
8. Select a student whose status matches the action (e.g. not clocked in on clock-in) — no warning banner shown
9. Click action button → backend PUT called with correct `checkingIn` value → navigates back to `/lunch-check`
10. On clock-in: open "Create New Student" → fill in all fields → submit → form clears → new student appears in search results
11. `cd frontend && ng build school-hub` — no TS/template errors
