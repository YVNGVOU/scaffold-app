# TASK-029

- Timestamp: 2026-08-12
- Request context: part of the user-requested QoL build-out, built via `/workflow-build`.

## Requirements
- TASK-018 added `delete_prompt` (Rust command) wired to `PromptList.tsx`'s delete button, guarded only by `window.confirm()`.
- After the user confirms delete, do NOT call the `delete_prompt` Tauri command immediately.
- Hold the deletion client-side for a few seconds, showing an "Undo" toast/affordance.
- Only commit the real `delete_prompt` call if the user does not click Undo within the window.
- If the user clicks Undo, the prompt must remain fully intact (never removed from the visible list, never sent to the backend).
- Visual language: dark SINVAUX/Scaffold, `--sv-*` tokens only, no rounded corners, no new UI component libraries.

## Explicitly out of scope
- Any `packages/compiler`/`packages/schema` change (no pure-function helpers introduced by this feature).
- Any change to `delete_prompt` itself or its transaction behavior (fca2ec3's cascade-delete transaction stays as-is).
- Any new SQLite table/column or new Tauri/Rust command — this is a pure client-side timer/state feature.
- A generic/reusable toast notification framework beyond what this one feature needs.
- Undo for rename or duplicate actions.
- Persisting pending-delete state across app restarts/reloads (an in-flight undo window is lost on reload, same as other unsaved client-side state in this app).
- Any change to TASK-019's auth gate or TASK-017's answer-merge flow.
