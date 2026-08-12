# TASK-030

- Timestamp: 2026-08-12
- Original request: "after filling in answers on the right, the user should be able to confirm recomile and it will fill those answers into the missing slots then user can confirm it looks good and app outputs a full prompt as well as folder setup for that project" — clarified through dialogue: "recompile" means a full re-run through the specialists/critique/conflict engine with the answers folded in as real context (not just the existing merge-only behavior from TASK-017), and "folder setup" means a handoff folder containing the compiled prompt (Markdown + JSON + a short README) — not actual code/project scaffolding.
- Priority: P1
- Dependencies: TASK-001 through TASK-029 (all done). Directly builds on TASK-017 (mergeAnswer/DecisionsPanel answer flow), TASK-018 (Tauri dialog/fs plugins, formatAsMarkdown), TASK-021 (output profiles, if it exists — check).
- Status: ACTIVE
- Classification: feature

## Part A — Confirm & Recompile

1. After the user has answered one or more unresolved items (via TASK-017's existing inline answer flow in `DecisionsPanel.tsx`), surface a "Confirm & Recompile" action — visible once at least one answer exists for the current compiled result, placed somewhere sensible (e.g. near the SummaryStrip, or as a prominent action once the "Answered" section is non-empty).
2. On click, this does a REAL full re-run of the currently-selected pipeline mode (ARCHITECT/QUICK/MASTER, whichever the user has selected) — not just re-applying `mergeAnswer` to the existing result. Build an augmented raw input: take the ORIGINAL `rawInput` text and append the answered Q&A pairs as additional plain-English sentences (e.g. for each answered item, something like `" ${originalUnresolvedQuestionText}: ${answerText}."`), so `intentAnalysis`/`domainDetection`/`requirementExtraction`/all specialists see the fuller picture from scratch, not just a bolted-on item.
3. Read `App.tsx`'s existing `handleCompile` function and `DecisionsPanel.tsx`'s `isAnswered()`/answer-tracking logic first — reuse the same run/persist/animate pattern `handleCompile` already uses (pipeline stepper animation, `saveCompile`, `refreshPrompts`) rather than duplicating it; consider refactoring `handleCompile` to accept an optional override raw-input string so both the normal Compile button and this new Confirm & Recompile action share one code path.
4. The recompile produces a genuinely new compiled result (specialists re-run, critique/conflict re-run, MASTER's deliberation loop re-runs if in MASTER mode) — this is intentionally NOT free/instant, same cost as a normal compile, and should show the same pipeline stepper animation so the user sees it actually happening.
5. Persist the recompiled result via the existing `saveCompile` SQLite flow (new append-only `compiles` row, same as any other compile) so the answered-then-recompiled version is in the prompt's version history (TASK-020's diff/history feature should show it as a new version).
6. Where should the extracted "original unresolved question text + answer text" pairs come from? The answered items already carry this: `mergeAnswer`-created items have `evidence: [originalUnresolvedItem.text]` and their own `.text` is the answer content — read `packages/compiler/src/mergeAnswer.ts` to confirm the exact shape before writing the augmentation logic, and put the augmentation function itself in `packages/compiler` (e.g. `buildAugmentedInput(rawInput, answeredItems): string`) as a pure, tested helper — not inline in the React component — consistent with this project's established pattern (`mergeAnswer`, `formatAsMarkdown`, `formatDiff` are all `packages/compiler` pure helpers with their own tests).

## Part B — Export Project Handoff Folder

7. Add an "Export Project Folder" action (separate from the existing inline copy/`.md`/`.json` export buttons from TASK-018/021) that: opens a folder-picker via the existing `@tauri-apps/plugin-dialog` dependency (`open({ directory: true })`), then writes three files into a new subfolder named after the prompt's title (sanitized to a safe filename) inside the chosen directory:
   - `prompt.md` — the compiled prompt formatted via the existing `formatAsMarkdown` helper (and output-profile selection from TASK-021, if that task exists and is wired up — check `tasks/TASK_QUEUE.md` for it; if it doesn't exist yet, just use the default Markdown formatting).
   - `prompt.json` — the raw `CompiledPrompt` object, `JSON.stringify(compiled, null, 2)`.
   - `README.md` — a short handoff readme: project/prompt title, generation date, one sentence of context ("Compiled by Scaffold — paste prompt.md into your AI system of choice to begin."), and a note of which mode (ARCHITECT/QUICK/MASTER) produced it.
8. Use the existing `@tauri-apps/plugin-fs` dependency (already added in TASK-018) to create the directory and write the files — check `apps/desktop/src/components/CompiledOutput.tsx`'s `ExportToolbar` for the established pattern of calling these plugins, follow it rather than inventing a new approach.
9. This action should only be enabled when `compiled` is non-null (same gating as the existing export toolbar).
10. Handle the case where the user cancels the folder picker (no-op, no error) and where the write fails (friendly error via the existing `toFriendlyError`/`ErrorNote` mechanism from TASK-027).

## Cross-cutting requirements
11. New pure helpers in `packages/compiler` (`buildAugmentedInput` and anything else genuinely reusable/testable) get their own tests, following the existing test file conventions.
12. All pre-existing tests must still pass (check the current count first, likely 136, confirm old-count-plus-new after).
13. `tsc --noEmit`, `vite build`, `cargo build` (only if Rust is touched, which it shouldn't be for this task — both plugins are already wired) must all stay clean.
14. Visual language: dark SINVAUX/Scaffold theme via `--sv-*` tokens only, no rounded corners, no new UI component libraries.
15. Zero AI API calls anywhere — the "recompile" is the existing deterministic pipeline re-run, nothing new or AI-driven.
16. Update `state/CANONICAL_STATE.md` and task/queue status on completion.
17. Commit and push to `origin/master`. Do not touch the updater signing key or release artifacts.

## Explicitly out of scope
- Actual code/project scaffolding (src/ folders, package.json, boilerplate files) — the folder output is a prompt handoff package only, per the clarified scope.
- Auto-recompiling without an explicit user click — this stays a deliberate, user-triggered action, never automatic.
- Changing how normal (first-time) compiles work — this only adds a new post-answer recompile path and a new export action.
