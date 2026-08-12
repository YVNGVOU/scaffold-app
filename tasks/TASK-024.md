# TASK-024

- Timestamp: 2026-08-12
- Request context: part of the user-requested QoL build-out, built via `/workflow-build`.

## Requirements
- Extend the existing prompt-list search (TASK-018, `apps/desktop/src/components/PromptList.tsx`) so it also matches each prompt's raw_input text, not just its title.
- Client-side only, over the already-loaded `prompts` array — no new backend query, no new Tauri/Rust command, no new SQLite table or column.
- Case-insensitive substring match, same as the existing title match (`toLowerCase().includes(q)`).
- A prompt matches if the query is found in either its title OR its raw_input.
- Extend the existing filter logic in place; do not rewrite `PromptList.tsx`'s search implementation from scratch.

## Explicitly out of scope
- Any change to `packages/compiler` or `packages/schema` (no new pure-function helpers needed for a client-side array filter).
- Any new SQLite table, column, or Rust/Tauri command.
- Full-text search indexing, ranking/relevance scoring, or highlighting matched text in the UI.
- Search across compile history (`compiles` table) — title/raw_input on the `prompts` array only.
- Any change to TASK-019's auth gate or TASK-017's answer-merge flow.
