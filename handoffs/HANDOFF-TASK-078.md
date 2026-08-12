# HANDOFF-TASK-078

## Numbering note
Briefed as "TASK-075". A concurrently-running 19-domain expansion batch kept
landing new domain-module tasks against the same task-id sequence while this
feature was in progress — TASK-075 ("Small Business Branding Kit"), TASK-076
("Recipe / Cookbook Content"), and TASK-077 ("Greeting Card / Personal
Stationery") were all claimed or mid-flight in the shared working tree before
this task's code was finished. Renumbered to TASK-078 — the next id confirmed
free against both the local working tree and `origin/master` — rather than
overwrite or collide with any of that work.

## Mission
Give the user a manual domain-override control so a wrong auto-detected
domain can be fixed with a dropdown pick instead of rephrasing the prompt to
nudge the scorer. Builds on the just-shipped domain-reasoning tooltip
(`CompiledOutput.tsx`'s domain badge hover, backed by `compiled.domainScores`/
`domainConfidence`).

## Scope
- `packages/compiler/src/pipeline/state.ts`: add optional `forceDomain?: DomainId`
  to `PipelineState`; `createInitialState(rawInput, forceDomain?)` accepts and
  stores it (defaults `undefined`, additive, zero behavior change when unset).
- `packages/compiler/src/pipeline/stages/domainDetection.ts`: when
  `state.forceDomain` is set, still run every domain module's real `score()`
  against `rawInput` and populate `domainScores` exactly as the unforced path
  does (so the tooltip stays meaningful), but set `domain` to the forced id
  directly instead of the highest scorer. `domainConfidence` for the forced
  path = `domainScores[forceDomain] / totalScore` — same formula as
  auto-detect, so a poor-fit override shows honest low/zero confidence rather
  than a fabricated 100%.
- `packages/compiler/src/pipeline/index.ts`: `RunPipelineOptions.forceDomain?: DomainId`,
  threaded into `createInitialState` by all three of `runArchitectPipeline`,
  `runQuickPipeline`, `runMasterPipeline` (`RunMasterPipelineOptions` already
  extends `RunPipelineOptions`).
- `packages/compiler/src/index.ts`: `compileArchitect`/`compileQuick` gained
  an optional options passthrough param for parity with `compileMaster`.
- `apps/desktop/src/App.tsx`: new `forceDomain` state (`DomainId | 'auto'`,
  default `'auto'`); a `<select aria-label="Domain override">` next to the
  ARCHITECT/QUICK/MASTER toggle, listing "Auto-detect domain" plus every
  `DOMAIN_MODULES` entry by `.label`; `handleCompile` computes
  `domainOverride = forceDomain === 'auto' ? undefined : forceDomain` and
  passes `forceDomain: domainOverride` into whichever runner the active mode
  uses (all three, so ARCHITECT/QUICK/MASTER all respect it).
- New test file `packages/compiler/test/domain-force-override.test.ts` (8
  tests): stage-level auto-vs-forced behavior, `domainScores` parity between
  forced and unforced runs over the same input (transparency requirement),
  honest zero-confidence for a non-matching forced domain, and all three mode
  runners honoring the option end to end.
- No Rust/`src-tauri` change — the override is a per-call pipeline option, not
  persisted app state, so no new Tauri command was needed.

## Acceptance criteria
Same as `tasks/TASK-078.md`'s Acceptance criteria section — mirrored there in
full; not duplicated twice here.

## Explicitly out of scope
- Persisting the dropdown selection across prompts/reloads — resets to
  "Auto-detect" each time; a settings-table persistence layer for it is a
  separate future task if desired.
- Any change to individual domain modules' scoring or `DOMAIN_CONFIDENCE_FLOOR`.
- `resumeAndRecompile`/"Confirm & Recompile" — that path never re-runs
  `domainDetection` (it resumes from an already-compiled state), so a domain
  override has no meaning there and was left untouched.
- Items 2-5 of this 5-item batch.

## Verification (real output)
- `packages/compiler` vitest: **395/395 passing** (387 pre-existing + 8 new).
- `tsc --noEmit`: clean on `packages/schema`, `packages/compiler`,
  `apps/desktop`.
- `vite build` (apps/desktop): clean build, only the pre-existing >500kB
  single-chunk size warning (unrelated to this change).
- No Rust files touched this task — `cargo build` not run, per the process's
  own conditional.
- Grep of every new/changed file for `&amp;amp;` entity artifacts and
  hardcoded hex colors outside `--sv-*` tokens: zero matches.

## Files changed
- `packages/compiler/src/pipeline/state.ts`
- `packages/compiler/src/pipeline/stages/domainDetection.ts`
- `packages/compiler/src/pipeline/index.ts`
- `packages/compiler/src/index.ts`
- `apps/desktop/src/App.tsx`
- `packages/compiler/test/domain-force-override.test.ts` (new)
- `tasks/TASK-078.md` (new)
- `handoffs/HANDOFF-TASK-078.md` (new, this file)
- `tasks/TASK_QUEUE.md` (updated)
- `state/CANONICAL_STATE.md` (updated)
