# HANDOFF-TASK-079

## Numbering note
Briefed as "TASK-076". A concurrently-running domain-expansion batch had
already claimed TASK-076 ("Recipe / Cookbook Content", commit `4181de3`)
before this task's implementation began. Renumbered to TASK-079 — the next
free id, since TASK-078 (Domain override) was the highest id landed at the
time of this check.

## Mission
Let the user compile multiple prompts in one pass instead of running Compile
once per line by hand: paste/import a newline-delimited list of prompts,
compile each one through the currently-selected mode, and end up with one
new prompt + one saved compile row per input line.

## Scope
- `packages/compiler/src/batchCompile.ts` (new): pure `splitBatchLines(raw)`
  — one prompt per non-blank line, trimmed, blank/whitespace-only lines
  skipped, handles `\n`/`\r\n`/`\r`, no dedup. Exported from
  `packages/compiler/src/index.ts`.
- `apps/desktop/src/components/BatchCompile.tsx` (new): modal (same
  fixed-overlay/`sv-scrollpane` pattern as `VersionHistory.tsx`) with a
  textarea, a "Compile N prompts" button, an "X of Y compiled" progress line
  while running, and a final per-line success/failure summary. For each
  line it calls the exact same pipeline functions `App.tsx`'s
  `handleCompile` already uses — `runArchitectPipeline`/`runQuickPipeline`/
  `runMasterPipeline`, selected by the current `mode` prop, `maxRounds`
  passed through for MASTER — then the same `createPrompt`/`saveCompile`
  Tauri command pair. Each line runs in its own try/catch (via
  `toFriendlyError`, the existing TASK-027 helper) so one bad line can't
  abort the batch.
- `apps/desktop/src/components/PromptList.tsx`: new "Batch Compile…" button
  under "+ New Prompt", wired through a new `onOpenBatchCompile` prop
  (mirrors the existing `onOpenSettings` prop).
- `apps/desktop/src/App.tsx`: new `batchCompileOpen` state; renders
  `<BatchCompile mode maxRounds onClose onDone={refreshPrompts}>` when open
  — `onDone` reuses the same `refreshPrompts` call a normal compile already
  makes, so every newly-created prompt shows up in the list immediately.
- `packages/compiler/test/batchCompile.test.ts` (new, 7 tests): basic split,
  blank-line skipping, per-line trim, `\r\n`/`\r` handling, empty/all-blank
  input, no dedup, internal whitespace preserved.
- No Rust/`src-tauri` change — batch mode reuses `create_prompt`/
  `save_compile` exactly as they already exist; no new Tauri command needed.

## Acceptance criteria
Same as `tasks/TASK-079.md`'s Acceptance criteria section — mirrored there in
full; not duplicated twice here.

## Explicitly out of scope
- Cancelling an in-flight batch partway through.
- Persisting the batch textarea content as a draft (unlike the single-prompt
  textarea's TASK-023 auto-save).
- Any change to `handleCompile`'s normal single-prompt behavior — read but
  not modified; `BatchCompile.tsx` calls the underlying pipeline functions
  directly since `handleCompile` itself is tightly coupled to `App.tsx`'s
  stepper-animation/error/draft state and isn't a standalone reusable
  function to import.
- Items 1, 3, 4, 5 of this 5-item batch.

## Verification (real output)
- `packages/compiler` vitest: **417/417 passing** (410 pre-existing + 7 new).
- `tsc --noEmit`: clean on `packages/schema`, `packages/compiler`,
  `apps/desktop`.
- `vite build` (apps/desktop): clean build, only the pre-existing >500kB
  single-chunk size warning (unrelated to this change).
- No Rust files touched this task — `cargo build` not run, per the process's
  own conditional.
- Grep of every new/changed file for `&amp;amp;` entity artifacts and
  hardcoded hex colors outside `--sv-*` tokens: zero matches.

## Files changed
- `packages/compiler/src/batchCompile.ts` (new)
- `packages/compiler/src/index.ts`
- `packages/compiler/test/batchCompile.test.ts` (new)
- `apps/desktop/src/components/BatchCompile.tsx` (new)
- `apps/desktop/src/components/PromptList.tsx`
- `apps/desktop/src/App.tsx`
- `tasks/TASK-079.md` (new)
- `handoffs/HANDOFF-TASK-079.md` (new, this file)
- `tasks/TASK_QUEUE.md` (updated)
- `state/CANONICAL_STATE.md` (updated)
