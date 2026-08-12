# HANDOFF-TASK-081

## Numbering note
Briefed as "TASK-078" (item 4 of 5 in this batch). That id was already
claimed twice before this task started — by
`TASK-078: add manual domain-override control` (`be030f7`) and by the
concurrent 19-domain expansion batch's
`TASK-078: add personal-website-portfolio domain module`
(`ebad112`/`bab3eef`, already on `origin/master`). Renumbered to TASK-081,
the next id confirmed free against both the local tree and
`origin/master` (highest prior id: TASK-080, "prompt library / favorites",
`c86756e`).

## Mission
Add a non-blocking warning in the export toolbar (`CompiledOutput.tsx`'s
`ExportToolbar`) flagging unresolved items and/or low domain-classification
confidence on the compiled prompt, so the user sees the risk right where
they're about to export/hand it off — without ever blocking the export
itself.

## Scope
- `packages/compiler/src/exportWarnings.ts` (new): pure
  `getExportWarnings(compiled)` helper — `unresolvedCount` (from
  `compiled.assumptions` filtered `kind === 'unresolved'`, the same source
  field `CompiledOutput.tsx` already uses for its own unresolved section)
  and `lowDomainConfidence` (`domainConfidence !== undefined &&
  domainConfidence < EXPORT_LOW_CONFIDENCE_THRESHOLD`, new exported
  constant = `0.5`). Kept deliberately distinct from
  `DOMAIN_CONFIDENCE_FLOOR` (raw score-point floor for domain detection
  itself, not a 0-1 fraction).
- `packages/compiler/src/index.ts`: exports `getExportWarnings`,
  `EXPORT_LOW_CONFIDENCE_THRESHOLD`, `ExportWarnings` type.
- `apps/desktop/src/components/CompiledOutput.tsx`: `ExportToolbar` renders
  a `--sv-alert`-bordered/colored banner above the button row when
  `getExportWarnings(compiled).hasWarnings` is true — `⚠ N unresolved
  item(s)` and/or `⚠ Low domain-classification confidence`. No button is
  disabled or hidden; the banner is purely informational (`role="status"`).
- `packages/compiler/test/exportWarnings.test.ts` (new, 6 tests): clean
  state has no warnings; unresolved items are counted correctly (and
  non-unresolved assumption items are excluded); low confidence flags
  strictly below threshold; no flag at/above threshold; no flag when
  `domainConfidence` is `undefined`; `hasWarnings` true with only one
  condition met.

## Acceptance criteria
Mirrored in full in `tasks/TASK-081.md`'s Acceptance/Scope sections; not
duplicated twice here.

## Explicitly out of scope
- Blocking export in any way (visibility only, per the brief).
- Any change to `domainDetection.ts` / `DOMAIN_CONFIDENCE_FLOOR` /
  how `domainConfidence`/`domainScores` are computed.
- Any change to `DecisionsPanel.tsx`'s unresolved-item answer flow.
- Items 1-3 and 5 of this 5-item batch.

## Verification (real output)
- `packages/compiler` vitest: **423/423 passing** (417 pre-existing + 6
  new). One pre-existing perf-timing test flaked once under full-suite
  parallel load (1009ms vs. its 1000ms budget) — reran it in isolation
  (1308ms suite time, passed) and reran the full suite clean (423/423) to
  confirm this task didn't cause it; nothing in this task touches the
  pipeline hot path.
- `tsc --noEmit`: clean on `packages/schema`, `packages/compiler`,
  `apps/desktop`.
- `vite build` (apps/desktop): clean, 657 modules, only the pre-existing
  >500kB single-chunk size warning (unrelated).
- No Rust files touched — `cargo build` not run, per the process's own
  conditional.
- Grep of every new/changed file for `&amp;amp;` entity artifacts and
  hardcoded hex colors outside `--sv-*` tokens: zero matches.

## Files changed
- `packages/compiler/src/exportWarnings.ts` (new)
- `packages/compiler/src/index.ts`
- `apps/desktop/src/components/CompiledOutput.tsx`
- `packages/compiler/test/exportWarnings.test.ts` (new)
- `tasks/TASK-081.md` (new)
- `handoffs/HANDOFF-TASK-081.md` (new, this file)
- `tasks/TASK_QUEUE.md` (updated)
- `state/CANONICAL_STATE.md` (updated)
