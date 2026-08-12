# TASK-026

- Timestamp: 2026-08-12
- Request context: part of the user-requested QoL build-out, built via `/workflow-build`.

## Requirements
- Add a brief first-run explanation for new users: a small dismissible panel/overlay explaining what ARCHITECT/QUICK/MASTER modes mean and the basic input-to-output flow.
- Shown once only, tracked via the existing `settings` SQLite table (TASK-018's `get_setting`/`set_setting` mechanism — no new table/command).
- One dismiss action persists the "seen" flag so the panel never shows again.
- A few sentences of explanatory copy — not a multi-step interactive tour.
- Dark SINVAUX/Scaffold visual language, `--sv-*` tokens only, no rounded corners, no new UI component libraries.

## Explicitly out of scope
- Any change to `packages/compiler` or `packages/schema` (pure frontend feature, no new pure-function helpers).
- Multi-step interactive product tour, spotlighting/highlighting individual UI elements, or sequential steps.
- Any new SQLite table or Rust/Tauri command (reuse existing `settings` table only).
- Re-showing the panel on demand from Settings (a later task, if wanted — this task is the one-time first-run panel only).
- Any change to TASK-019's auth gate or TASK-017's answer-merge flow.
