# HANDOFF-TASK-029

## Mission
Give prompt deletion a brief grace period: after the user confirms delete (existing `window.confirm()` guard from TASK-018), don't call the real `delete_prompt` Tauri command right away — hold it client-side for a few seconds behind an "Undo" affordance, and only commit the actual delete if the user doesn't undo in time.

## Scope
- `apps/desktop/src/components/PromptList.tsx`: move delete handling up from `PromptRow` into `PromptList` (parent) so pending-delete state can be shared with the row-filtering and the undo toast. On confirm, the prompt is optimistically hidden from the list (filtered out client-side) and a pending-delete entry is scheduled; a `setTimeout` (a few seconds) actually calls `deletePrompt(id)` + `onPromptsChanged()` when it fires. An "Undo" toast/bar appears while a delete is pending, naming the prompt; clicking Undo clears the timeout and un-hides the prompt (no backend call ever made for that delete).
- Multiple pending deletes can coexist (each prompt gets its own timer); each shows its own toast entry.
- Toast styling: `--sv-*` tokens only, no rounded corners, no new UI component library, no new runtime dependency (plain `setTimeout`/React state).
- No `packages/compiler`/`packages/schema` change — pure UI/state feature, no new pure-function helper.
- No Rust/`src-tauri` change — `delete_prompt` itself is untouched; this is purely a client-side delay before calling the existing command.

## Acceptance criteria
1. Clicking Delete and confirming the `window.confirm()` dialog does not immediately remove the prompt from the backend — the prompt disappears from the visible list right away, but the real `delete_prompt` command only fires after the undo window elapses.
2. An "Undo" toast/button is visible during the pending window, identifying which prompt is about to be deleted.
3. Clicking Undo during the window restores the prompt to the visible list and guarantees `delete_prompt` is never called for that deletion.
4. If the user does not click Undo, the prompt is actually deleted (via the existing `delete_prompt` command) once the window elapses, and the list reflects that via `onPromptsChanged`.
5. Deleting multiple prompts in quick succession works independently — each has its own timer/undo entry.
6. `--sv-*` tokens only, no rounded corners, no new UI component library.
7. `packages/compiler` vitest suite: pre-existing tests still pass unchanged.
8. `tsc --noEmit` clean on `packages/schema`, `packages/compiler`, `apps/desktop`; `vite build` clean on `apps/desktop`.
9. No stray `&amp;amp;` entity artifacts or hardcoded hex colors outside `--sv-*` tokens in new/changed files.
10. No Rust/`src-tauri` changes; `apps/desktop/src-tauri/scaffold-updater.key` and `Scaffold-Release/`/`bundle/` untouched.

## Explicitly out of scope
See `tasks/TASK-029.md`.
