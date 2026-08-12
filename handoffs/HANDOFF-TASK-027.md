# HANDOFF-TASK-027

## Mission
Replace raw `String(e)` error text shown to users with short, human-readable messages for the most common failure cases (SQLite write failure, Supabase unreachable), while keeping the raw error available behind a "details" expand for debugging.

## Scope
- New small helper in `apps/desktop/src/lib/friendlyError.ts`: classifies a caught error into a short human-readable summary (SQLite/Tauri command failure, network/Supabase-unreachable, generic fallback) plus the original raw string, unchanged.
- `apps/desktop/src/App.tsx`: all `setError(String(e))` call sites (`refreshPrompts`, `handleSelectPrompt`, `handleAnswered`, `handleCompile`) switch to storing `{ summary, raw }` and the error render block shows the summary with a `<details>` disclosure (`--sv-*` tokens, no rounded corners) containing the raw text.
- `apps/desktop/src/components/AuthGate.tsx`: the "Couldn't re-verify account — working offline" banner already reads as friendly copy — audited, left as-is unless it exposes a raw error (it doesn't). Confirmed no raw-error surface exists there beyond the offline banner.
- `apps/desktop/src/components/LoginScreen.tsx`: `friendlyError()` already maps known cases to friendly copy and falls back to the raw SDK message. Extended fallback path to also expose the raw message behind a `<details>` toggle instead of showing it directly as the primary error line.

## Acceptance criteria
1. SQLite write failures (`saveCompile`/`createPrompt`/etc. via Tauri commands) show a short human sentence like "Couldn't save your prompt." instead of a raw `Error: ...` string.
2. Supabase-unreachable/network failures show a short human sentence like "Couldn't reach the server. Check your connection and try again." instead of a raw fetch error.
3. The original raw error text is never discarded — always available via a "Details" `<details>`/expand control near the friendly message.
4. Changes are confined to the existing error-display call sites named in the brief — no new global error-boundary/toast system.
5. Dark SINVAUX/Scaffold visual language, `--sv-*` tokens only, no rounded corners, no new UI component libraries.
6. `packages/compiler` vitest suite: pre-existing tests still pass unchanged (no pure-function helper added to `packages/compiler` for this task).
7. `tsc --noEmit` clean on `packages/schema`, `packages/compiler`, `apps/desktop`; `vite build` clean on `apps/desktop`.
8. No stray `&amp;amp;` entity artifacts or hardcoded hex colors outside `--sv-*` tokens in new/changed files.
9. No Rust/`src-tauri` changes; `apps/desktop/src-tauri/scaffold-updater.key` and `Scaffold-Release/`/`bundle/` untouched.

## Explicitly out of scope
See `tasks/TASK-027.md`.
