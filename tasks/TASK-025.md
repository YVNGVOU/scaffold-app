# TASK-025: Duplicate/fork a prompt

- Timestamp: 2026-08-12
- Request context: part of the user-requested QoL build-out, built via `/workflow-build`

## Requirements
- Add a "Duplicate" action per prompt row in `PromptList.tsx`.
- Duplicating creates a new prompt row via the existing `createPrompt` command (no new backend command).
- The new prompt has the same `raw_input` as the original.
- The new prompt's title is `"<original title> (copy)"`.
- The new prompt becomes the selected/active prompt afterward, ready to edit independently.
- Styled with `--sv-*` tokens only, no rounded corners, no new UI component libraries (reuse existing row-action button style).

## Explicitly out of scope
- Copying compile history (`compiles` rows) — a duplicate starts fresh with no saved compiles.
- Any `packages/compiler`/`packages/schema` change (pure UI wiring over an existing command).
- Any new SQLite table or Rust/Tauri command.
- Any change to TASK-019's auth gate or TASK-017's answer-merge flow.
- Bulk/multi-select duplication.
