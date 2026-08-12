# HANDOFF-TASK-024

## Mission
Extend TASK-018's prompt-list search so it also matches each prompt's raw_input text (not just title), client-side over the already-loaded prompts array.

## Scope
- `apps/desktop/src/components/PromptList.tsx` only:
  - The existing `filtered` `useMemo` gains an additional `p.raw_input.toLowerCase().includes(q)` OR-condition alongside the existing `p.title.toLowerCase().includes(q)` check.
  - Search input placeholder text updated to reflect that content is now searched too.
- No other file touched. No new Tauri command, no new SQLite column, no `packages/compiler`/`packages/schema` change.

## Acceptance criteria
1. Typing a substring that appears only in a prompt's raw_input (not its title) shows that prompt in the filtered list.
2. Typing a substring that appears only in a prompt's title still shows that prompt (existing behavior unchanged).
3. Match is case-insensitive, consistent with the existing title-match behavior.
4. The "No prompts match your search" empty state still renders correctly when neither field matches.
5. `packages/compiler` vitest suite: pre-existing test count unchanged (no compiler-package changes, no new pure-function helpers).
6. `tsc --noEmit` clean on `packages/schema`, `packages/compiler`, `apps/desktop`; `vite build` clean on `apps/desktop`.
7. No stray `&amp;amp;` entity artifacts or hardcoded hex colors outside `--sv-*` tokens in changed files.
8. No Rust/`src-tauri` changes; `apps/desktop/src-tauri/scaffold-updater.key` and `Scaffold-Release/`/`bundle/` untouched.

## Explicitly out of scope
See `tasks/TASK-024.md`.
