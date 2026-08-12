# HANDOFF — TASK-082: Side-by-side mode comparison

> Note on numbering: originally briefed as "TASK-079". By the time this task
> started, `TASK-079` (Batch Compile), `TASK-080` (Prompt Library/Favorites),
> and `TASK-081` (Confidence-based export warnings) were all already DONE in
> `state/CANONICAL_STATE.md`/`tasks/TASK_QUEUE.md` and pushed to
> `origin/master`. Renumbered to `TASK-082`, the first free id, following
> this project's established renumbering convention.

## What shipped

A "Compare Modes" action next to the existing ARCHITECT/QUICK/MASTER toggle
in `App.tsx`. It runs the current raw input through all three pipelines
(`runQuickPipeline`, `runArchitectPipeline`, `runMasterPipeline` with the
app's current `maxRounds` setting) and shows a 3-column comparison of counts
— not three full `CompiledOutput` panels, which would be too dense. Each
column runs independently and shows its own loading state, then a compact
table. A "Use this" button per column persists that one result via the
existing `saveCompile`/`createPrompt` flow and makes it the app's active
compiled result — the other two runs are discarded, nothing is auto-saved.

## Files changed

- `packages/compiler/src/compareModes.ts` (new) — pure
  `summarizeForComparison(compiled: CompiledPrompt): ComparisonRow`. Counts
  per requirement category (`userRequirements`, `nonNegotiables`,
  `preferences`, `constraints`, `assumptions`, `functionalRequirements`),
  `totalRequirements` (sum), architecture-note count/presence
  (`compiled.architecture?.length`, honestly 0/false when the field is
  `undefined` — QUICK mode never populates it), critique/conflict-finding
  count/presence (scans all six category arrays for
  `source === 'critique-engine' || source === 'conflict-engine'`, the same
  source markers `critique.ts`/`conflict.ts` write), and unresolved-item
  count (`kind === 'unresolved'` across all six categories). Deliberately
  computes the critique/conflict scan identically for all three modes
  rather than special-casing MASTER — QUICK/ARCHITECT never run those
  stages so the count is honestly 0 for them, not hardcoded.
- `packages/compiler/src/index.ts` — exports `summarizeForComparison` and
  the `ComparisonRow` type from the package root.
- `packages/compiler/test/compareModes.test.ts` (new, 7 tests) — empty
  compiled prompt all-zero baseline, per-category counting +
  `totalRequirements` sum, architecture-note counting, the
  `architecture: undefined` no-crash case, critique/conflict-engine source
  counting across categories, unresolved-item counting across categories,
  and one real end-to-end check that runs `runArchitectPipeline` directly
  (no mocking) and asserts `totalRequirements` equals the sum of the six
  category counts by construction.
- `apps/desktop/src/components/CompareModes.tsx` (new) — the modal.
  Fixed-overlay/`sv-scrollpane` pattern matching `BatchCompile.tsx`/
  `VersionHistory.tsx`. On mount, kicks off all three pipeline runs, each
  deferred via its own `setTimeout(…, 0)` so React can paint all three
  columns' initial "running" state before the first (synchronous, CPU-bound)
  pipeline run blocks the main thread — this is the "your judgment" call
  from the brief on concurrent-vs-sequential: client-side JS is single-
  threaded, so true concurrency isn't available, but staggering the paint
  means the user sees all three columns start together and finish in
  whatever order they actually complete (QUICK/ARCHITECT typically well
  before MASTER's deliberation loop), rather than watching them run
  strictly one-at-a-time with no visible progress on the other two. Each
  column tracks its own `ColumnState` (`running` / `done` / `error`) so one
  mode failing (defensive — none of the three pipelines are known to throw,
  same "never throws" contract as `runArchitectPipeline` etc., but the UI
  doesn't assume that) doesn't block the other two from showing results.
  "Use this" calls `createPrompt` (only if no prompt is active yet, mirroring
  `handleCompile`'s own create-if-needed logic) then `saveCompile`, then
  hands the resulting `{prompt, mode, compiled}` back to `App.tsx` via
  `onUseResult`.
- `apps/desktop/src/App.tsx` — new `compareModesOpen` state; "Compare
  Modes" button next to the ARCHITECT/QUICK/MASTER toggle buttons
  (disabled while `running` or when `rawInput` is blank, same guard shape
  as the Compile button); `<CompareModes>` wired with the current
  `rawInput`/`maxRounds`/`activePrompt`; new `handleUseComparisonResult`
  handler that lifts the chosen prompt/mode/compiled result into
  `App.tsx`'s own state (`setActivePrompt`, `setMode`, `setCompiled`),
  closes the modal, and calls `refreshPrompts()` — parity with how
  `handleCompile`/`BatchCompile`'s `onDone` refresh the list.

No Rust/`src-tauri` changes — pure TypeScript/React feature that reuses the
existing `createPrompt`/`saveCompile` Tauri commands exactly as
`App.tsx`/`BatchCompile.tsx` already call them.

## Verification

- `packages/compiler` vitest: **430/430 passing** (423 prior + 7 new).
- `tsc --noEmit` clean on `packages/schema`, `packages/compiler`,
  `apps/desktop`.
- `vite build` clean on `apps/desktop` (659 modules; only the pre-existing
  >500 kB chunk-size advisory, unrelated to this task).
- `cargo build` not run — no Rust files touched, per the process's own
  conditional.
- Grepped every new/changed file
  (`packages/compiler/src/compareModes.ts`,
  `packages/compiler/src/index.ts`,
  `packages/compiler/test/compareModes.test.ts`,
  `apps/desktop/src/components/CompareModes.tsx`, `apps/desktop/src/App.tsx`)
  for `&amp;amp;` entity artifacts and hardcoded hex colors outside
  `--sv-*` tokens: zero matches on both.

## Known issues / judgment calls

- Layout is a fixed 3-column grid (`repeat(3, 1fr)`), not tabs — the brief
  explicitly said side-by-side is the goal and gave discretion to fall back
  to tabs "if 3 columns is too cramped." Each column holds only a compact
  count table (7 rows) plus one button, which comfortably fits at the
  modal's 920px width without feeling cramped, so tabs were not used.
- No true client-side concurrency (JS is single-threaded) — see the
  `setTimeout(…, 0)` staggering note above under `CompareModes.tsx`. This
  satisfies the brief's "don't block the whole UI waiting silently"
  requirement (all three columns show independent progress, the modal
  itself is responsive throughout) without claiming literal parallelism
  that a browser/webview JS runtime cannot provide.
- `activePrompt` is read as a snapshot prop into `CompareModes` at modal-
  open time; if the user could somehow change the active prompt while the
  modal is open (they cannot — the modal is a full overlay with no
  underlying UI reachable) this would be stale, but that path doesn't exist
  in practice.
