# TASK-079

## Status
DONE

## Title
Batch compile — compile multiple prompts in one pass

## Note on numbering
Originally briefed as "TASK-076". A concurrently-running domain-expansion
batch had already claimed TASK-076 ("Recipe / Cookbook Content") before this
task's implementation began (confirmed via `tasks/TASK-076.md` / commit
`4181de3`). Renumbered to TASK-079 — the next free id against both the local
working tree and `TASK_QUEUE.md` at the time of this check (TASK-078 was the
highest existing id).

## Mission
Let the user paste/import a newline-delimited list of prompts and compile
all of them in one pass, using the currently-selected mode, without having
to run Compile once per line by hand.

## Scope
- `packages/compiler/src/batchCompile.ts` (new): pure `splitBatchLines(raw)`
  helper — splits a textarea value into one prompt per non-blank line,
  trims each line, skips blank/whitespace-only lines, handles `\n`/`\r\n`/`\r`.
  No dedup. Exported from `packages/compiler/src/index.ts`.
- `apps/desktop/src/components/BatchCompile.tsx` (new): a modal (same
  fixed-overlay/`sv-scrollpane` pattern as `VersionHistory.tsx`) with a
  multi-line textarea, live line count, and a "Compile N prompts" button.
  Running the batch calls `splitBatchLines`, then for each line reuses the
  exact same pipeline call `App.tsx`'s `handleCompile` already uses
  (`runArchitectPipeline`/`runQuickPipeline`/`runMasterPipeline`, selected by
  the current `mode`, `maxRounds` passed through for MASTER) followed by the
  same `createPrompt`/`saveCompile` Tauri command pair — one new prompt row
  + one new compile row per input line. Each line runs in its own
  try/catch so one bad line cannot abort the rest of the batch; a
  "X of Y compiled" progress indicator updates after every line, and a
  final per-line success/failure summary is rendered (failures show
  `toFriendlyError(e).summary`, the existing TASK-027 pattern) once the
  batch finishes.
- `apps/desktop/src/components/PromptList.tsx`: new "Batch Compile…" button
  next to "+ New Prompt", wired via a new `onOpenBatchCompile` prop (mirrors
  the existing `onOpenSettings` prop pattern).
- `apps/desktop/src/App.tsx`: new `batchCompileOpen` state; renders
  `<BatchCompile>` when open, passing the current `mode`/`maxRounds` and
  wiring `onDone={refreshPrompts}` so every newly-created prompt appears in
  the list immediately after the batch finishes (same `refreshPrompts` call
  a normal compile already uses).
- `packages/compiler/test/batchCompile.test.ts` (new): 7 tests for
  `splitBatchLines` (basic split, blank-line skipping, per-line trimming,
  `\r\n`/`\r` handling, empty/all-blank input, no dedup, internal whitespace
  preserved).
- No Rust/`src-tauri` change — no new Tauri command needed, batch mode reuses
  `create_prompt`/`save_compile` exactly as they already exist.

## Explicitly out of scope
- Cancelling an in-flight batch partway through (out of scope per the brief;
  `running` disables Close/re-submit but does not add a stop button).
- Persisting the batch-compile textarea content as a draft (unlike the
  single-prompt textarea's TASK-023 auto-save).
- Any change to `handleCompile`'s normal single-prompt behavior — it is
  read, not modified, and `BatchCompile.tsx` calls the same underlying
  pipeline functions directly rather than importing `handleCompile` itself
  (which is tied to `App.tsx`'s stepper-animation/error/draft state and
  isn't a reusable standalone function).
- Any other item in this batch of 5.

## Acceptance criteria
1. A "Batch Compile…" entry point exists in the UI near "+ New Prompt".
2. Pasting/typing multi-line text, one prompt per line, and running the
   batch produces one `CompiledPrompt` + one saved prompt/compile row per
   non-blank input line, using the currently-selected mode.
3. Blank lines are skipped, not compiled as empty prompts.
4. A progress indicator ("N of M compiled") is visible while the batch runs.
5. One failing line does not abort the rest of the batch; a final summary
   distinguishes successes from failures per item.
6. The prompt list refreshes after the batch completes so all newly-created
   prompts appear without a manual reload.
7. `--sv-*` tokens only, no rounded corners, no new UI component library.
8. `packages/compiler` vitest suite: all pre-existing tests still pass
   unchanged, plus new tests for the line-splitting helper.
9. `tsc --noEmit` clean on `packages/schema`, `packages/compiler`,
   `apps/desktop`; `vite build` clean on `apps/desktop`.
10. No stray `&amp;amp;` entity artifacts or hardcoded hex colors outside
    `--sv-*` tokens in new/changed files.
11. No Rust/`src-tauri` changes; zero AI API calls.

## Verification
- `packages/compiler` vitest: 417/417 passing (410 pre-existing + 7 new, in
  `test/batchCompile.test.ts`).
- `tsc --noEmit` clean on `packages/schema`, `packages/compiler`,
  `apps/desktop`.
- `vite build` clean on `apps/desktop` (pre-existing >500kB single-chunk
  warning only, unrelated to this change).
- No Rust files touched — `cargo build` not required per the process's own
  conditional ("if you touched Rust code").
- Grepped every new/changed file for `&amp;amp;` and hardcoded hex colors:
  zero matches.
