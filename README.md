# SPACEFIT

**Make room for better living.** A warm, architectural brand website and a working 2D home layout planner. All product copy, validation messages, documentation, and interface controls are in English. SPACEFIT is a fictional brand; no customer statistics, endorsements, or certifications are implied.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. No Firebase settings are required for guest planning. Build production assets with `npm run build`; serve them with `npm run preview`. A static host must rewrite application routes to `index.html`; `firebase.json` includes that configuration for Firebase Hosting.

## What is included

- Responsive Home, About, Templates, My Spaces, room setup, account, password reset, privacy, help, and 404 pages.
- Interactive homepage floor plan with three arrangements, furniture selection, drag movement, and continuation into an editable copy of the preview.
- Eight conceptual templates, furnished or blank, with computed areas, rooms, wall-anchored doors and windows. Apartment examples calculate approximately 35, 55, and 75 m² from their actual rectangles.
- Forty-one furniture entries across five categories. Beds, sofas, chairs, desks, tables, rugs, storage, lamps, and plants have distinct SVG footprints. All catalog sizes are illustrative; bed sizes include a sample frame rather than representing mattress-only dimensions.
- Multiple rectangular rooms; adjustable names, sizes, units, and notes. Additional rooms attach to the right of the existing layout.
- Selection, pointer/touch dragging, exact size and position inputs, quarter-turn rotation, duplication, deletion, grid snapping, zoom, pan, fit/reset, measurements, and 50-step undo/redo.
- Overlap, room boundary, and door-swing notices. Rugs can sit beneath furniture. Ordinary movement respects room boundaries; resizing a room keeps furniture and flags pieces that are now outside.
- Debounced guest autosave with revision checks, reload restoration, project search/sort, rename, duplication, confirmed deletion, JSON import/export, and PNG export.
- Configurable Firebase email/password authentication and user-owned Firestore projects, opt-in import of guest copies, owner-scoped offline caches, transaction-based revision checks, and conflict recovery choices.
- Mobile catalog and properties sheets, semantic controls, visible focus states, reduced-motion support, native modal focus management, and numeric/keyboard alternatives to dragging.

## Guest and account storage

Guest documents live in IndexedDB (`spacefit-drafts`) through Dexie. The UI identifies their location as **This browser**. Private browsing, eviction, clearing site data, changing browsers, or changing devices can remove or hide them. Export JSON backups for portable recovery. Browser storage failures appear as failures, never successful saves.

With Firebase configured, account documents use `/users/{uid}/projects/{projectId}`. Guest drafts are offered for import only after sign-in; every import receives a new project ID. Original guest drafts and existing account projects are preserved. Account caches are keyed by UID and project ID; they are separate from guest drafts. UI requests and editor state are invalidated when the active user changes.

Autosave waits 700 ms after durable edits. Each drag commits a single history entry. Save requests serialize; successful saves advance a revision. An older response cannot replace newer editor geometry. Navigating through planner links flushes pending changes first. Full-page unload warns when edits have not been saved.

Opened account projects can be edited offline. Edits are cached under the current user and marked **Offline — changes kept locally**. Reconnection retries synchronization. A stale revision exposes a conflict with **Save a copy** and **Reload latest** actions; it does not silently overwrite server changes. Offline planning assumes the app and relevant project have already loaded; this is not an installable PWA or a complete offline project browser.

## Firebase configuration

1. Create your own Firebase project and register a web application.
2. Enable Email/Password under Authentication.
3. Create a Cloud Firestore database.
4. Copy `.env.example` to `.env.local` and replace the public web configuration placeholders.
5. Add your deployed hostname to Firebase Authentication’s authorized domains.
6. Deploy the included ownership rules to your project:

```sh
npx firebase login
npx firebase deploy --only firestore:rules --project YOUR_PROJECT_ID
```

| Variable                      | Purpose                                        |
| ----------------------------- | ---------------------------------------------- |
| `VITE_FIREBASE_API_KEY`       | Firebase public web API key                    |
| `VITE_FIREBASE_AUTH_DOMAIN`   | Your Firebase authentication domain            |
| `VITE_FIREBASE_PROJECT_ID`    | Your Firebase project ID                       |
| `VITE_FIREBASE_APP_ID`        | Your Firebase web application ID               |
| `VITE_USE_FIREBASE_EMULATORS` | `true` only for the local emulator environment |

Vite public variables are bundled into the browser application; they are not secrets. Do not put service-account keys or administrator credentials in any `VITE_` variable. Without valid configuration, the account screens explain that accounts are unavailable and offer guest planning. They never simulate a successful login.

The Firestore rules enforce ownership, allowed top-level fields, collection sizes, document IDs, immutable creation timestamps, and sequential revisions. The Zod client schema additionally validates nested dimensions, coordinates, colors, IDs, room references, and document version. Rules are required even when the UI already scopes requests by UID.

## Firebase emulators

Install Java 21+ and make `java` available on PATH. The Firebase CLI is a development dependency. The checked-in `.env.emulator` contains demo-only values and connects exclusively to local Auth/Firestore emulators for the `demo-spacefit` project.

```sh
# Terminal 1
npx firebase emulators:start --only auth,firestore --project demo-spacefit

# Terminal 2: account-enabled UI at http://127.0.0.1:5175
npm run dev:emulator
```

Run the security and account browser tests together:

```sh
npm run test:firebase
```

This starts Auth and Firestore, verifies unauthorized reads/writes and revision enforcement, tests signup, cloud saving, sign-out/sign-in restoration and guest import, and then shuts down the emulators. No production credentials or real user accounts are needed. For this Windows workspace a portable Java runtime was downloaded into the ignored `.tools/java` directory for testing; it is not part of the source or production build.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run test:firebase
npm run build
```

- Unit/component/storage tests cover measurement parsing, unit display round trips, pointer coordinate conversion, snapping, rotated bounds, collisions, valid template geometry, schema rejection, deep copies, history, filters, accessible dialogs, IndexedDB persistence, revision conflicts, and account-cache isolation.
- Guest browser tests cover demo entry, create/edit/save/reload, keyboard actions, size and rotation edits, undo/redo, JSON round trips, nonempty PNG signature/size validation, mobile editing, invalid imports, immediate-navigation saving, and a 100-piece editing case.
- Axe scans cover public routes and a selected-furniture planner. Automated checks do not establish complete WCAG conformance.
- Visual tests write screenshots for Home, About, Templates, account forms, empty/populated dashboards, and the planner at 360, 768, and 1440 px into the ignored `qa/` directory.
- The account browser test is intentionally skipped in the guest-only suite; `test:firebase` runs it with real emulated authentication and Firestore.

See [QA.md](QA.md) for the actual run results and verification limits. In restricted Windows environments, test runners and browsers may need execution outside the sandbox because of temporary-file and process restrictions.

## Architecture

| Location                     | Responsibility                                                     |
| ---------------------------- | ------------------------------------------------------------------ |
| `src/pages/`                 | Marketing, setup, dashboard, account and planner routes            |
| `src/components/PlanSvg.tsx` | Shared room/furniture renderer and transient pointer interaction   |
| `src/components/Brand.tsx`   | Navigation, logo, footer, final CTA                                |
| `src/components/Dialog.tsx`  | Native modal focus and dismissal behavior                          |
| `src/data/catalog.ts`        | Stable furniture IDs, shapes, example sizes, colors and layers     |
| `src/data/templates.ts`      | Eight layouts, demo geometry and editable-copy factories           |
| `src/lib/model.ts`           | Versioned project types and Zod import schema                      |
| `src/lib/geometry.ts`        | Pure unit, bounds, pointer, overlap and room utilities             |
| `src/lib/editor.ts`          | Zustand durable editing, selection and history                     |
| `src/lib/persistence.ts`     | Dexie transactions, conflict detection and file exports            |
| `src/lib/firebase.ts`        | Deferred Firebase initialization and account repository            |
| `src/lib/useProject.ts`      | Session-scoped loading, autosave queue, offline cache and recovery |
| `firestore.rules`            | Server-enforced ownership and revision policy                      |
| `tests/`                     | Vitest, Testing Library, emulator and Playwright tests             |

React + strict TypeScript + Vite, Tailwind CSS v4’s Vite plugin, React Router, Zustand, React Hook Form + Zod, Dexie, Firebase, Vitest, Testing Library, Playwright and axe are used. Planner and secondary routes load lazily. Firebase is deferred until configured account functionality is needed. Drag movement uses local renderer state and only commits durable state on pointer release.

## Measurement, geometry and schema rules

All stored coordinates and dimensions use millimeters. Feet/inches and centimeters are presentation/input units; switching the display does not mutate geometry. Imperial input accepts `12' 6"` or total inches; metric input accepts centimeters. Rooms permit 100–30,000 mm and furniture 100–6,000 mm. Projects are limited to 30 rooms, 200 openings and 500 furniture pieces. Keyboard movement uses 50 mm or 250 mm with Shift. Grid snap uses 50 mm. Rotations are 0°, 90°, 180° and 270°.

Door/window positions are wall-relative and their visible width/offset is clamped when rooms shrink. Collision hints use rotated axis-aligned rectangles. Floor items are excluded from solid-furniture conflicts. Door swing hints use a conservative square envelope. These are conceptual planning hints, not clearance certification or safety checks.

Project schema version is **1**. The document includes its ID, name, rooms, openings, furniture, units, ISO timestamps and revision. Selection, drag, pan, zoom, menus and panels are transient. IndexedDB version 2 adds a separate owner-scoped cache. Future project-schema upgrades must add explicit migrations and fixture tests; unsupported versions are currently rejected with a useful import error rather than silently altered. Files larger than 2 MB are rejected before parsing.

## Current limits

- This is a conceptual 2D planner, not a construction, structural, 3D or building-code tool.
- Added rooms attach on the right. Arbitrary room repositioning and custom door/window editing are not implemented.
- Furniture is added by click/tap; dragging from the catalog into the canvas is not implemented. Placed furniture supports pointer dragging.
- PNG export captures the current canvas view, including zoom and selected-item annotations. Use Fit before exporting a complete plan.
- Storage is local unless your own Firebase project is configured. Production Firebase email delivery, quota/billing behavior and deployment-domain configuration require your account and were not tested against a live project.
- Offline caches are owner-scoped but are not encrypted at rest. The app does not pre-cache itself for cold-start offline use.
- Overlap analysis is rectangle-based and may flag an intentional arrangement. No clearance or accessibility certification is provided.
- Marketing and planner Lighthouse scores have not been measured. No performance score or coverage percentage is claimed.

## Assets and reference documentation

All room diagrams, furniture footprints, floor textures, logo linework and editorial artwork are local SVG/CSS authored for this project. No stock photos, external image services, or remote fonts are used. Georgia and Arial use the visitor’s licensed system installation and are not redistributed. Lucide icons are provided by `lucide-react` under the ISC license; dependency licenses remain with their respective packages.

Implementation references: [Vite setup](https://vite.dev/guide/), [Tailwind’s Vite integration](https://tailwindcss.com/docs/installation/using-vite), [Dexie React guidance](https://dexie.org/docs/Tutorial/React), [Firebase Auth emulator](https://firebase.google.com/docs/emulator-suite/connect_auth), and [Firebase Emulator Suite setup](https://firebase.google.com/docs/emulator-suite/install_and_configure).
