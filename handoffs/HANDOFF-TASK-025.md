# HANDOFF: TASK-025 — Duplicate/fork a prompt

## Mission
Let a user duplicate an existing prompt into a new, independent prompt row seeded with the same raw input, so they can branch off an existing idea without losing the original.

## Scope
- `apps/desktop/src/components/PromptList.tsx`: add a "Duplicate" button to each `PromptRow`'s action row, alongside the existing Rename/Delete buttons.
- Reuse the existing `createPrompt(title, rawInput)` command from `apps/desktop/src/lib/api.ts` — no new Tauri/Rust command, no new SQLite table/column.
- New title: `"${p.title} (copy)"`. New raw_input: identical copy of `p.raw_input`.
- After creation: call the existing `onChanged` prop (refreshes the prompt list from SQLite) and the existing `onSelect` prop with the newly-created prompt, so it becomes the active prompt in `App.tsx` immediately.

## Requirements
1. Duplicate button visible per prompt row, consistent `--sv-*`-token styling with Rename/Delete (no rounded corners, no new component library).
2. Clicking it creates a real new `prompts` row via `createPrompt`, not a client-side-only clone.
3. New row's `raw_input` exactly matches the original at time of duplication.
4. New row's title is `"<original> (copy)"`.
5. The new prompt becomes selected/active immediately after creation (via `onSelect`), ready to edit.
6. Compile history is NOT copied — the duplicate starts with zero saved compiles, matching "fork" semantics (a new prompt, not a version-history clone).
7. Failure (e.g. Tauri invoke rejects) leaves the list as-is; no partial/inconsistent UI state.

## Acceptance criteria
- vitest suite in `packages/compiler` still passes at its pre-existing count (no new pure-function helper was needed for this feature — it's a thin UI wrapper over an existing command).
- `tsc --noEmit` clean on `packages/schema`, `packages/compiler`, `apps/desktop`.
- `vite build` clean in `apps/desktop`.
- No Rust/`src-tauri` files touched → `cargo build` not required.
- Grep of changed files clean of stray `&amp;amp;` entity artifacts and hardcoded hex colors outside `--sv-*` tokens.
- TASK-019's auth gate and TASK-017's answer-merge flow untouched.
