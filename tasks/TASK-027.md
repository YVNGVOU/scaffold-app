# TASK-027

- Timestamp: 2026-08-12
- Request context: part of the user-requested QoL build-out, built via `/workflow-build`.

## Requirements
- Improve the most common failure cases (SQLite write failure, Supabase unreachable) so they show a short, clear, human-readable message instead of a raw `String(e)` error string.
- Keep the raw error available via a "details" expand/disclosure for debugging — never discard it, just don't show it by default.
- Target the existing error-display call sites in `apps/desktop/src/App.tsx` (`error` state / `setError(String(e))` sites) and `apps/desktop/src/components/AuthGate.tsx`/`LoginScreen.tsx`.
- Dark SINVAUX/Scaffold visual language, `--sv-*` tokens only, no rounded corners, no new UI component libraries.

## Explicitly out of scope
- Any change to `packages/compiler`/`packages/schema` (this is a pure frontend presentation change — no new pure-function helper is needed for a small message-lookup/classification function unless it's trivially local to `apps/desktop`; if a helper is added it stays inside `apps/desktop`, not `packages/compiler`).
- A full error-boundary system, global toast/notification framework, or app-wide error taxonomy.
- Any change to TASK-019's auth gate/offline-grace logic itself (only its user-facing message presentation may change) or TASK-017's answer-merge flow.
- Retry/auto-recovery logic for failed operations.
