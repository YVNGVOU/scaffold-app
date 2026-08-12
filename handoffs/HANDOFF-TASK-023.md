# HANDOFF-TASK-023

## Mission
Stop losing unsaved raw-input text when the user switches prompts in the left nav mid-typing, by auto-saving the current draft (debounced) into the existing settings SQLite mechanism and restoring it on return.

## Scope
- `apps/desktop/src/App.tsx` only:
  - New debounced `useEffect` keyed on `[rawInput, activePrompt]` that calls `setSetting(draftKey(...), rawInput)` ~500ms after the last change.
  - `draftKey(promptId)` helper: `draft_prompt_<id>` for a saved prompt, `draft_new_prompt` (`NEW_DRAFT_KEY`) for text typed before any prompt exists.
  - `handleSelectPrompt` reads the draft for the target prompt via `getSetting` and uses it in place of `p.raw_input` when present and non-empty; falls back to `p.raw_input` otherwise (or on read failure).
  - `handleNewPrompt` (now async) reads `NEW_DRAFT_KEY` and restores it instead of always clearing to `''`.
  - `handleCompile` clears the relevant draft key(s) via `setSetting(key, '')` after a successful `saveCompile`/`createPrompt`, since the text is now durably persisted as the prompt's own `raw_input`.
- Reuses `get_setting`/`set_setting` (TASK-018) exactly as-is — no new SQLite table, no new Tauri command, no Rust changes.

## Acceptance criteria
1. Typing in the raw-input textarea, switching to a different prompt, then switching back restores the unsaved text (not the last-compiled `raw_input`), after the debounce window has elapsed.
2. The save is debounced (~500ms), not fired on every keystroke.
3. Typing with no active prompt yet ("New Prompt" state), navigating to an existing prompt and back to New Prompt, restores that in-progress text.
4. After a successful compile, the draft for that prompt is cleared (no longer shadows a subsequent edit or reload) — verified by code inspection (`setSetting(key, '')` calls in `handleCompile`).
5. No new SQLite table or Tauri command; `get_setting`/`set_setting` reused unchanged.
6. Dark SINVAUX/Scaffold visual language unaffected (no new UI surface — this is a state-persistence change only).
7. `packages/compiler` vitest suite: 136 pre-existing tests still pass unchanged (no compiler-package changes, no new pure-function helpers).
8. `tsc --noEmit` clean on `packages/schema`, `packages/compiler`, `apps/desktop`; `vite build` clean on `apps/desktop`.
9. No stray `&amp;amp;` entity artifacts or hardcoded hex colors outside `--sv-*` tokens in changed files.
10. No Rust/`src-tauri` changes; `apps/desktop/src-tauri/scaffold-updater.key` and `Scaffold-Release/`/`bundle/` untouched.

## Explicitly out of scope
See `tasks/TASK-023.md`.
