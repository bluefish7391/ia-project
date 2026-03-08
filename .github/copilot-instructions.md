# GitHub Copilot Instructions

## Project Overview

This is **ia-project**, an early-stage school management platform built for educators. It consists of a Firebase-hosted Angular frontend (multi-app workspace) and a Google Cloud Functions backend, all deployed via Firebase.

The primary product vision (from `school-hub`) is a suite of 10 school tools:
1. Math Test Grader
2. Math Team Organization Tool
3. Late Work Tracker
4. TV Slides Player
5. Stand-up display slides player
6. IT Closet Inventory System
7. Curriculum Overlap Identifying Tool
8. Tool for tracking students who leave the building for lunch
9. Volunteer Hours Automatic Email Verification System
10. English Writing Assignment Feedback Generator

---

## Repository Structure

```
ia-project/
├── .github/
│   └── copilot-instructions.md   ← this file
├── firebase.json                 ← Firebase hosting + functions config
├── package.json                  ← Root build scripts (school-hub build)
├── backend/                      ← Google Cloud Functions (Node 24, TypeScript)
│   ├── src/index.ts              ← Cloud Function entry point
│   ├── lib/                      ← Compiled JS output (gitignored)
│   └── package.json
└── frontend/                     ← Angular multi-project workspace
    ├── angular.json              ← Workspace config (3 apps defined)
    ├── package.json
    ├── src/                      ← Default "cstutors" app (root)
    └── projects/
        ├── school-hub/           ← Main hub app listing all school tools
        └── slides-player/        ← TV slideshow display app
```

---

## Technology Stack

### Frontend
- **Framework:** Angular 21 (standalone components only — no NgModules)
- **Language:** TypeScript ~5.9 (strict mode)
- **State:** Angular Signals (`signal()`, `computed()`, `effect()`)
- **Routing:** `@angular/router` with `provideRouter()`
- **Styling:** SCSS
- **Testing:** Vitest + jsdom
- **Formatting:** Prettier
- **Build:** `@angular/build:application` (esbuild-based)

### Backend
- **Runtime:** Node 24
- **Framework:** Firebase Functions v7 (`firebase-functions/v2` preferred for new functions)
- **Language:** TypeScript 5.7 (strict mode, `NodeNext` modules)
- **SDK:** Firebase Admin 13
- **Linting:** ESLint with Google config + `@typescript-eslint`
- **Compiled output:** `lib/` directory (TypeScript → ES2017)

### Infrastructure
- **Platform:** Firebase (Hosting + Cloud Functions)
- **Hosting:** Serves from `dist/`, SPA mode — all routes rewrite to `index.html`
- **Emulation:** Firebase Emulator Suite for local development

---

## Angular Conventions

### Component Style
Always use **standalone components**. Never use NgModules.

```typescript
@Component({
  selector: 'app-example',
  imports: [RouterOutlet, CommonModule],  // import what you need directly
  templateUrl: './example.html',
  styleUrl: './example.scss',
})
export class ExampleComponent { }
```

### State Management
Prefer **Angular Signals** over RxJS for local component state:

```typescript
export class MyComponent {
  protected readonly count = signal(0);
  protected readonly doubled = computed(() => this.count() * 2);

  increment() {
    this.count.update(v => v + 1);
  }
}
```

Use RxJS only when dealing with streams, HTTP observables, or cases where signals are insufficient.

### Dependency Injection
Use the `inject()` function instead of constructor injection:

```typescript
export class MyComponent {
  private readonly router = inject(Router);
  private readonly myService = inject(MyService);
}
```

### Routing
Define routes in `app.routes.ts`. Use lazy loading for feature routes:

```typescript
export const routes: Routes = [
  {
    path: 'math-grader',
    loadComponent: () => import('./math-grader/math-grader.component')
      .then(m => m.MathGraderComponent)
  }
];
```

### Service Pattern
Use `providedIn: 'root'` injectable services:

```typescript
@Injectable({ providedIn: 'root' })
export class MyService {
  private readonly http = inject(HttpClient);
}
```

### File Naming
Follow Angular CLI conventions:
- Components: `feature-name.component.ts` / `.html` / `.scss`
- Services: `feature-name.service.ts`
- Guards: `feature-name.guard.ts`
- Models/interfaces: `feature-name.model.ts`

### Template Style
- Prefer the new `@if`, `@for`, `@switch` control flow syntax over `*ngIf`, `*ngFor`
- Use `@for` with `track` for all list rendering

```html
@for (item of items(); track item.id) {
  <li>{{ item.name }}</li>
}

@if (isVisible()) {
  <div>Content</div>
}
```

---

## Backend (Cloud Functions) Conventions

### Function Style
Prefer **Firebase Functions v2** HTTP handlers for new functions. Use `onRequest` from `firebase-functions/v2/https`:

```typescript
import { onRequest } from 'firebase-functions/v2/https';

export const myFunction = onRequest(async (req, res) => {
  // implementation
});
```

### TypeScript Rules
- Strict mode is enforced (`noImplicitReturns`, `noUnusedLocals`, strict null checks)
- Use `NodeNext` module resolution
- Never use `any` — type all request/response objects explicitly

### Error Handling
Always handle errors and return appropriate HTTP status codes:

```typescript
export const myFunction = onRequest(async (req, res) => {
  try {
    // logic
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Security
- Validate all inputs at the function boundary
- Never expose internal error details to clients
- Use Firebase Admin SDK for server-side Firestore/Auth operations

---

## Angular Projects

### `cstutors` (root / default app)
- Located in `frontend/src/`
- Root/default application — currently a scaffold
- Selector: `app-root`

### `school-hub`
- Located in `frontend/projects/school-hub/`
- **Primary app** — the hub listing all 10 planned school tools
- Output path: `../dist` (one level up from `frontend/`)
- Selector: `app-root`

### `slides-player`
- Located in `frontend/projects/slides-player/`
- Displays slides on school TVs; allows online slide management
- Selector: `app-root`

---

## Build & Development Commands

### Frontend
```bash
# Serve default app
cd frontend && ng serve

# Serve a specific app
cd frontend && ng serve school-hub
cd frontend && ng serve slides-player

# Build school-hub (output lands in dist/ at repo root)
npm run build:school-hub:full

# Run tests
cd frontend && ng test
```

### Backend
```bash
# Build functions
cd backend && npm run build

# Local development with emulator
cd backend && npm run serve

# Deploy functions only
cd backend && npm run deploy

# Lint
cd backend && npm run lint
```

### Firebase
```bash
# Deploy everything
firebase deploy

# Deploy hosting only
firebase deploy --only hosting

# Deploy functions only
firebase deploy --only functions
```

---

## Testing

- Frontend uses **Vitest** (not Jest/Karma). Test files are `*.spec.ts`.
- Keep tests co-located with the component/service they test.
- Use `jsdom` for DOM-dependent tests.
- Backend uses `firebase-functions-test` for unit testing Cloud Functions.

---

## Code Quality

- **Prettier** is configured for the frontend — format on save.
- **ESLint** (Google config) is enforced on the backend and runs as a pre-deploy step.
- TypeScript `strict` mode is on in both frontend and backend — no `any`, no implicit returns.

---

## Key Patterns to Follow

1. **Always use standalone Angular components** — never introduce NgModules.
2. **Signals-first** for reactive state — reach for RxJS only when signals can't solve the problem.
3. **Lazy-load all feature routes** to keep initial bundle sizes small.
4. **Keep Cloud Functions focused** — one function, one responsibility.
5. **SCSS for all styles** — no inline styles, no plain CSS files.
6. **Co-locate tests** — `foo.component.spec.ts` lives next to `foo.component.ts`.
7. **Use `inject()`** for DI — not constructor injection.
8. **New control flow syntax** (`@if`, `@for`) in all Angular templates.
