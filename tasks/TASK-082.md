# TASK-082: Side-by-side mode comparison

> Note on numbering: originally briefed as "TASK-079". `TASK-079` (Batch
> Compile) and `TASK-080` (Prompt Library/Favorites) and `TASK-081`
> (Confidence-based export warnings) were already claimed by concurrent
> batches before this task started (confirmed against both the local tree
> and `origin/master`). Renumbered to `TASK-082`, the first free id,
> following this project's established renumbering convention (see the
> TASK-078/079/080/081 notes in `state/CANONICAL_STATE.md`).

## Priority
P2

## Type
feature

## Status
DONE — see `handoffs/HANDOFF-TASK-082.md`

## Brief

Add a way to compile the same raw input in QUICK vs ARCHITECT vs MASTER and
view results side by side, so the user can see what the extra depth of each
mode actually buys them.

- New "Compare Modes" action near the existing ARCHITECT/QUICK/MASTER toggle
  in `App.tsx`.
- Runs the CURRENT raw input through all three pipelines
  (`runQuickPipeline`, `runArchitectPipeline`, `runMasterPipeline` with the
  current `maxRounds` setting).
- Shows a compact comparison view (not three full `CompiledOutput` panels):
  per mode — requirement counts per category, whether architecture notes
  exist, whether critique/conflict findings exist (MASTER only in practice,
  but computed the same honest way for all three), unresolved-item count.
- Transient — does not persist all three as saved compiles. A "Use this"
  action per column reuses the existing `saveCompile` flow to make that
  one the active compiled result.
- Runs can take real time (MASTER's deliberation loop especially) — each
  column shows its own loading/progress state as it completes; layout is
  side-by-side is the explicit goal (3-column, with per-column scrolling
  if needed — no tabs, this app's viewport comfortably fits 3 narrow
  columns of just table rows).
- Any pure comparison-summarization logic (CompiledPrompt -> comparison-row
  data) extracted as a pure function in `packages/compiler`, unit tested.

## Constraints
- Zero AI API calls.
- Dark SINVAUX/Scaffold visual language via `--sv-*` tokens only, no rounded
  corners, no new UI component libraries.
- Stay strictly in scope for this item.
- Reuse `runQuickPipeline`/`runArchitectPipeline`/`runMasterPipeline`,
  `saveCompile`, `createPrompt` exactly as `App.tsx`/`BatchCompile.tsx`
  already call them — no new Tauri commands, no Rust changes expected.

## Acceptance criteria
1. "Compare Modes" button next to the mode toggle in `App.tsx`, disabled
   while a normal compile or another comparison is running, and disabled
   when the raw input is empty.
2. Opens a modal (same fixed-overlay/`sv-scrollpane` pattern as
   `BatchCompile.tsx`/`VersionHistory.tsx`) with 3 columns: QUICK,
   ARCHITECT, MASTER.
3. Each column independently shows a loading state, then a compact table:
   counts per `RequirementCategory` (`userRequirements`, `nonNegotiables`,
   `preferences`, `constraints`, `assumptions`, `functionalRequirements`),
   architecture-notes present (count), critique/conflict findings present
   (count of items with `source: 'critique-engine'` / `'conflict-engine'`),
   unresolved-item count (`kind: 'unresolved'`).
4. A "Use this" button per column that calls the existing `saveCompile`
   flow (creating a prompt first if none is active, same as
   `handleCompile`) and updates the app's active compiled result.
5. Pure summarization function extracted to `packages/compiler` with unit
   tests (no UI/component test infra required, matching the
   `exportWarnings.ts` precedent).
6. Full vitest suite in `packages/compiler` passes (old + new).
7. `tsc --noEmit` clean on `packages/schema`, `packages/compiler`,
   `apps/desktop`; `vite build` clean on `apps/desktop`; no Rust files
   touched so `cargo build` not required.
8. No stray `&amp;amp;` entities, no hardcoded hex colors outside
   `--sv-*` tokens, in any new/changed file.

## Out of scope
- Persisting all three results automatically.
- Any change to the pipelines themselves, to `saveCompile`/`createPrompt`
  Tauri commands, or to any other item in this 5-item batch.
