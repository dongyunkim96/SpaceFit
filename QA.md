# SPACEFIT verification record

Verification date: October 26, 2026. Tests ran locally on Windows using Node.js 20.19.3, Chromium through Playwright, and Firebase Auth/Firestore emulators for the demo project. All interface content was authored in English; a source scan found no Korean, Japanese, or Chinese content in the application, tests, or README.

## Executed checks

| Check                                | Observed result                                                                                                                                                                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Strict TypeScript / production build | Passed; Vite emitted the production application into `dist/`.                                                                                                                                                                                                    |
| ESLint                               | Passed, no lint errors.                                                                                                                                                                                                                                          |
| Vitest                               | 22 unit, component, and storage tests passed.                                                                                                                                                                                                                    |
| Guest Playwright suite               | 7 tests passed in the full run; the account test was correctly skipped because it requires emulators.                                                                                                                                                            |
| Zoom/pan pointer regression          | Passed separately, including drag movement and a single undo transaction after zoom and pan.                                                                                                                                                                     |
| Firestore rule integration tests     | 2 tests passed: ownership/anonymous isolation and revision/creation-time enforcement.                                                                                                                                                                            |
| Account browser test                 | Passed, including signup, opt-in guest import, cloud save, sign-out/sign-in restoration, offline edits, reconnect synchronization, two-tab conflict detection, save-copy recovery, and preservation of the newer original.                                       |
| Production dependency audit          | Zero known vulnerabilities reported by `npm audit --omit=dev`.                                                                                                                                                                                                   |
| Development dependency audit         | Five moderate findings remain in Firebase CLI transitive tooling (`@opentelemetry/core`, `uuid`, and their dependents). Nonbreaking patches were applied; a forced CLI downgrade was not applied. These tools are not included in the production browser bundle. |

The completed guest run covered home-to-demo entry, template creation, numeric and keyboard editing, rotation, resize, undo/redo, browser persistence after reload, JSON export/reimport with a new document ID, PNG file signature and nonempty payload, corrupt-import handling, mobile creation/editing, display-unit switching without geometry changes, immediate-navigation saving, and 100-piece editing.

The 100-piece import-and-edit operation took **857 ms** in one local development-browser run. This is a smoke measurement, not a Lighthouse result or a general performance guarantee.

## Visual and accessibility review

Screenshots were generated for Home, About, Templates, empty/populated My Spaces, sign-in, and the planner at **360, 768, and 1440 px**. The responsive suite passed its horizontal-overflow checks. Images are in the ignored `qa/` directory.

Actual screenshots reviewed include Home at 768/1440 px, About at 768 px, Templates and populated My Spaces at 1440 px, sign-in at 360 px, and selected-furniture planner states at 360/1440 px. The mobile planner exposes numeric positions, rotation, and removal in a scrollable details sheet. No clipped controls or broken image assets were observed in these reviewed states. Artwork and furniture are local SVG/CSS.

Axe scans passed with no **serious or critical** violations on Home, About, Templates, My Spaces, sign-in, room setup, and a selected-furniture planner. The scan initially found low-contrast secondary text; those colors were corrected. Keyboard movement, input focus protection, undo/redo, and modal semantics have automated coverage. Full screen-reader testing and comprehensive manual keyboard auditing were not performed; complete WCAG conformance is not claimed.

## Issues discovered and corrected

- Imperial input rounding at the smallest supported dimension could fall fractionally below the accepted range.
- The demo link’s decorative triangle affected its accessible name.
- Decorative homepage content caused a small tablet horizontal overflow.
- Immediate navigation could cancel a pending autosave; planner links now flush edits first.
- Pointer conversion needed the SVG screen transform to remain accurate under CSS padding, preview rotation, zoom, and pan.
- Account request results and editor rendering now guard against stale user sessions.
- After resolving a cloud conflict by saving a copy, a stale recovery cache could reopen the old version. Conflict-copy completion now clears the old recovery cache, and Reload latest explicitly discards that pending cache.

## Unmeasured or externally configured

Production Firebase credentials, authorized domains, live password-reset delivery, production hosting, quotas, and billing were not tested against a real Firebase project. Emulator tests use demo-only configuration. Lighthouse scores, coverage percentages, cross-browser results, and full assistive-technology certification are not claimed.

Vite emits nonfatal warnings about upstream Zod pure-comment annotations and a deferred Firestore chunk exceeding 500 kB. The build succeeds. Firebase code is deferred and is not loaded for unconfigured guest use.

Current product limitations are documented in README: conceptual 2D geometry, rooms appended to the right, fixed template openings without a custom opening editor, click/tap catalog insertion, rectangle-based overlap hints, current-view PNG exports, browser-local guest storage, and no cold-start offline PWA behavior.
