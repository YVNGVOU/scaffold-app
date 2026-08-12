# TASK-081

## Status
DONE

## Title
Confidence-based export warnings

## Note on numbering
Briefed as "TASK-078" (item 4 of 5 in this batch). That id was already
claimed twice in the working tree before this task started: once by
`TASK-078: add manual domain-override control` (commit `be030f7`) and again
by the concurrently-running 19-domain expansion batch's
`TASK-078: add personal-website-portfolio domain module` (commits
`ebad112`/`bab3eef`, both already on `origin/master`). Renumbered to
TASK-081 — the next id confirmed free against both the local working tree
and `origin/master` (`tasks/TASK-080.md` / commit `c86756e` "add prompt
library / favorites" is the highest prior id on either side) — to avoid
colliding with any already-shipped or in-flight work.

## Mission
Warn the user, non-blockingly, in the export toolbar when the compiled
prompt they're about to hand off still has unresolved items or a weak
domain-classification confidence, so an incomplete/uncertain compile isn't
exported without the user noticing.

## Scope
- `packages/compiler/src/exportWarnings.ts` (new): pure function
  `getExportWarnings(compiled: CompiledPrompt): ExportWarnings` —
  `{ unresolvedCount, lowDomainConfidence, hasWarnings }`. Counts
  `compiled.assumptions` items with `kind: 'unresolved'` (same field
  `CompiledOutput.tsx` already reads for its own "Unresolved — needs your
  input" section) and flags `domainConfidence !== undefined &&
  domainConfidence < EXPORT_LOW_CONFIDENCE_THRESHOLD`. New exported constant
  `EXPORT_LOW_CONFIDENCE_THRESHOLD = 0.5` — deliberately distinct from
  `DOMAIN_CONFIDENCE_FLOOR` (`packages/compiler/src/domains/index.ts`),
  which is a raw score-point floor gating whether detection picks a domain
  at all, not a 0-1 confidence fraction comparable to `domainConfidence`.
- `packages/compiler/src/index.ts`: export `getExportWarnings`,
  `EXPORT_LOW_CONFIDENCE_THRESHOLD`, and the `ExportWarnings` type.
- `apps/desktop/src/components/CompiledOutput.tsx`: `ExportToolbar` calls
  `getExportWarnings(compiled)` and, when `hasWarnings` is true, renders a
  small `--sv-alert`-colored banner directly above the Copy/Export button
  row reading `⚠ N unresolved item(s)` and/or `⚠ Low domain-classification
  confidence` as applicable. Purely informational (`role="status"`) — never
  disables or hides any export button.
- `packages/compiler/test/exportWarnings.test.ts` (new): 6 tests covering
  clean/no-warning state, unresolved counting (ignoring non-unresolved
  assumption items), low-confidence flagging strictly below threshold,
  no-flag at/above threshold, no-flag when `domainConfidence` is
  `undefined`, and `hasWarnings` true when only one condition holds.

## Explicitly out of scope
- Blocking or gating export in any way — this is visibility only.
- Any change to `domainDetection.ts`, `DOMAIN_CONFIDENCE_FLOOR`, or how
  `domainConfidence`/`domainScores` are computed.
- Any change to `DecisionsPanel.tsx`'s own unresolved-item UI/answer flow.
- Any other item in this 5-item batch.

## Verification
- `packages/compiler` vitest: 423/423 passing (417 pre-existing + 6 new, in
  `test/exportWarnings.test.ts`). One pre-existing perf-timing test
  (`50k+ character input completes sub-second end to end`) flaked once
  under full-suite parallel load (1009ms vs. the 1000ms budget) and passed
  cleanly (1308ms total suite time) when re-run in isolation — a known
  timing-sensitive test, not a regression caused by this task (nothing in
  this task touches the pipeline hot path); confirmed by an isolated re-run
  and a full clean re-run of the whole suite passing 423/423.
- `tsc --noEmit` clean on `packages/schema`, `packages/compiler`,
  `apps/desktop`.
- `vite build` clean on `apps/desktop` (657 modules; pre-existing >500kB
  single-chunk size warning only, unrelated to this change).
- No Rust files touched — `cargo build` not required per the process's own
  conditional.
- Grepped every new/changed file for `&amp;amp;` and hardcoded hex colors
  outside `--sv-*` tokens: zero matches.
