# HANDOFF-TASK-026

## Mission
Give new users a one-time explanatory panel on first run — a few sentences covering what ARCHITECT/QUICK/MASTER modes mean and the basic input-to-output flow — dismissible once, never shown again after dismissal.

## Scope
- New file `apps/desktop/src/components/OnboardingPanel.tsx`: a small dismissible overlay/panel component, dark SINVAUX/Scaffold visual language, `--sv-*` tokens only, no rounded corners, no new UI component libraries.
- Wired into `apps/desktop/src/App.tsx`: on mount, reads a persisted "seen" flag via the existing `getSetting`/`setSetting` (TASK-018's `settings` SQLite table, no new table/command). If not seen, renders the panel over the app. Dismiss button calls `setSetting(ONBOARDING_SEEN_KEY, '1')` and hides the panel for the rest of the session and all future runs.
- Copy: a few sentences explaining ARCHITECT (deep multi-specialist compile), QUICK (fast single-pass), MASTER (deliberation loop across specialists) modes, and the basic flow (raw input to compile to structured/decisions output).

## Acceptance criteria
1. Panel appears on first run (no `onboarding_seen` setting present yet).
2. Panel explains all three modes (ARCHITECT/QUICK/MASTER) and the basic input-to-output flow in a few sentences — not a multi-step tour.
3. Single dismiss action persists a "seen" flag to the existing `settings` table; panel does not reappear on next launch once dismissed.
4. No `packages/compiler`/`packages/schema` changes, no new SQLite table/Tauri command.
5. Dark SINVAUX/Scaffold visual language, `--sv-*` tokens only, no rounded corners, no new UI component libraries.
6. `packages/compiler` vitest suite: pre-existing tests still pass unchanged (pure UI feature, no new pure-function helpers).
7. `tsc --noEmit` clean on `packages/schema`, `packages/compiler`, `apps/desktop`; `vite build` clean on `apps/desktop`.
8. No stray `&amp;amp;` entity artifacts or hardcoded hex colors outside `--sv-*` tokens in new/changed files.
9. No Rust/`src-tauri` changes; `apps/desktop/src-tauri/scaffold-updater.key` and `Scaffold-Release/`/`bundle/` untouched.

## Explicitly out of scope
See `tasks/TASK-026.md`.
