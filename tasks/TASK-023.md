# TASK-023

- Timestamp: 2026-08-12
- Request context: part of the user-requested QoL build-out, built via `/workflow-build`.

## Requirements
- Persist the current draft raw-input text (debounced) so switching prompts in the left nav mid-typing no longer loses unsaved text.
- Reuse the existing settings SQLite mechanism (`get_setting`/`set_setting`, TASK-018) — no second persistence mechanism.
- Key the draft per-prompt-id (`draft_prompt_<id>`) for existing prompts, plus a single shared key (`draft_new_prompt`) for text typed before a prompt has been created/saved.
- Debounce the save (fires ~500ms after the last change) rather than writing on every keystroke.
- Restore the saved draft when navigating back to a prompt (`handleSelectPrompt`) or back to New Prompt (`handleNewPrompt`), preferring the draft over the prompt's last-compiled `raw_input` if a draft exists.
- Clear the draft entry once its text is durably saved as a real compile/prompt (after a successful `handleCompile`), so a stale draft can't shadow future edits.

## Explicitly out of scope
- Any change to `packages/compiler` or `packages/schema` (pure frontend/state-persistence feature, no new pure-function helpers needed).
- Any new SQLite table or Rust/`src-tauri` command — reuses `get_setting`/`set_setting` exactly as they exist from TASK-018.
- Draft conflict resolution across multiple app instances/windows.
- Any change to TASK-019's auth gate or TASK-017's answer-merge flow.
- Auto-saving as an actual compiled version (drafts are raw-input-only, not a `compiles` row).
