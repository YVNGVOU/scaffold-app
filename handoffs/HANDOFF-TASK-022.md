# HANDOFF-TASK-022

## Mission
Give a new user something to click instead of a blank textarea: 2-3 example starter prompts per domain (web, game, branding), shown only when the raw-input textarea is empty, that populate the textarea with example text on click.

## Scope
- New file `apps/desktop/src/starterPrompts.ts`: a plain exported const array/object of starter prompt strings grouped by domain (web/game/branding), 2-3 each. Pure data, no logic.
- `apps/desktop/src/App.tsx`: render a small starter-prompts panel in the center pane, directly under/inside the raw-input area, conditionally shown only when `rawInput` is empty. Each starter renders as a clickable chip/button; clicking calls `setRawInput(text)`. Panel disappears once `rawInput` is non-empty (typing or having clicked one).
- Styled with `--sv-*` tokens only, no rounded corners, no new UI component libraries (plain `<button>`s).

## Acceptance criteria
1. 2-3 example prompts each for web, game, branding domains (8 total, distinct realistic one-liners).
2. Starters appear only when the textarea is empty; disappear immediately once it has any content.
3. Clicking a starter sets it as the raw input verbatim (`setRawInput`).
4. No compiler/schema changes; no pipeline/domain-detection wiring changes.
5. Dark SINVAUX/Scaffold visual language, `--sv-*` tokens only, no rounded corners, no new UI component libraries.
6. `packages/compiler` vitest suite: 136 pre-existing tests still pass unchanged (no new compiler tests needed — pure UI feature).
7. `tsc --noEmit` clean on `packages/schema`, `packages/compiler`, `apps/desktop`; `vite build` clean on `apps/desktop`.
8. No stray `&amp;amp;` entity artifacts or hardcoded hex colors outside `--sv-*` tokens in new/changed files.
9. No Rust/`src-tauri` changes; `apps/desktop/src-tauri/scaffold-updater.key` and `Scaffold-Release/`/`bundle/` untouched.

## Explicitly out of scope
See `tasks/TASK-022.md`.
