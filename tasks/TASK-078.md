# TASK-078

## Status
DONE

## Title
Domain override — manual force-domain control

## Note on numbering
Originally briefed as "TASK-075". A concurrently-running 19-domain expansion
batch kept landing new domain modules while this task was in progress and
claimed TASK-075 ("Small Business Branding Kit"), TASK-076 ("Recipe /
Cookbook Content"), and TASK-077 ("Greeting Card / Personal Stationery", seen
mid-flight as uncommitted work-in-progress in the shared working tree) before
this task's implementation was complete. Renumbered to TASK-078 — confirmed
free against both the local working tree and `origin/master` at the time of
this final check — to avoid colliding with any of that already-shipped or
in-flight work.

## Mission
Let the user manually force a specific domain when auto-detection guesses
wrong, instead of having to rephrase their prompt to nudge the scorer. Builds
directly on the domain-reasoning tooltip (`compiled.domainScores`/
`domainConfidence`, surfaced in `CompiledOutput.tsx`'s domain badge tooltip)
that just shipped.

## Scope
- `packages/compiler/src/pipeline/state.ts`: add optional `forceDomain?: DomainId`
  to `PipelineState`; `createInitialState(rawInput, forceDomain?)` takes and
  stores it. Additive field, defaults to `undefined` (no behavior change when
  unset).
- `packages/compiler/src/pipeline/stages/domainDetection.ts`: when
  `state.forceDomain` is set, every domain module's real `score()` against
  `rawInput` is still computed and recorded into `domainScores` exactly as
  before (so the existing reasoning tooltip stays meaningful), but the winning
  `domain` is the forced id directly rather than the highest scorer.
  `domainConfidence` uses the forced domain's own share of the total score —
  same formula as the auto-detect path — so an override that doesn't actually
  match the input honestly shows low/zero confidence instead of a fabricated
  100%.
- `packages/compiler/src/pipeline/index.ts`: `RunPipelineOptions` gains
  `forceDomain?: DomainId`, threaded into `createInitialState` by
  `runArchitectPipeline`, `runQuickPipeline`, and `runMasterPipeline`
  (`RunMasterPipelineOptions` already extends `RunPipelineOptions`, so no
  separate change needed there).
- `packages/compiler/src/index.ts`: `compileArchitect`/`compileQuick` gain an
  optional `RunPipelineOptions` passthrough parameter for API parity with
  `compileMaster`, which already accepted options.
- `apps/desktop/src/App.tsx`: new `forceDomain` state (`DomainId | 'auto'`,
  default `'auto'`), a `<select>` next to the ARCHITECT/QUICK/MASTER mode
  toggle listing "Auto-detect domain" plus every `DOMAIN_MODULES` entry by
  label, and `handleCompile` passes `forceDomain: domainOverride` (`undefined`
  when `'auto'`) into whichever of `runArchitectPipeline`/`runQuickPipeline`/
  `runMasterPipeline` is active for the current mode.
- `packages/compiler/test/domain-force-override.test.ts` (new): proves
  `forceDomain` genuinely overrides detection (a clearly-game input forced to
  `'web'` actually produces `domain: 'web'`), proves `domainScores` still
  reflects real per-module scores (identical to the unforced run) so the
  tooltip stays meaningful, proves confidence isn't fabricated for a
  zero-scoring forced domain, and proves all three mode runners
  (`runArchitectPipeline`/`runQuickPipeline`/`runMasterPipeline`) honor the
  option.
- No Rust/`src-tauri` change — pure TypeScript/React feature, no new Tauri
  command needed (the override lives entirely in the pipeline run call, not
  persisted state).

## Acceptance criteria
1. Setting `forceDomain` to a domain id makes `PipelineState.domain` /
   `CompiledPrompt.domain` that id, regardless of what auto-detection would
   have picked, for all three modes (ARCHITECT/QUICK/MASTER).
2. Leaving the override unset (`'auto'` in the UI / `forceDomain: undefined`
   in the API) preserves the exact prior auto-detect behavior — zero change
   to existing pipeline output for any call site that doesn't pass the option.
3. `domainScores` is still populated with every domain module's real score
   against the raw input when overridden — identical to what an unforced run
   over the same input would compute — so the reasoning tooltip keeps showing
   genuine "what it would have scored" data, not empty/fabricated numbers.
4. `domainConfidence` for an overridden run reflects the forced domain's own
   real score share of the total, so a poor-fit override shows honestly low
   confidence rather than a fake 100%.
5. UI: a dropdown near the mode toggle lets the user pick "Auto-detect" or
   any specific domain from `DOMAIN_MODULES`; selecting one and compiling
   forces that domain for ARCHITECT, QUICK, and MASTER modes alike.
6. `--sv-*` tokens only, no rounded corners, no new UI component library.
7. `packages/compiler` vitest suite: all pre-existing tests still pass
   unchanged, plus new tests proving the override.
8. `tsc --noEmit` clean on `packages/schema`, `packages/compiler`,
   `apps/desktop`; `vite build` clean on `apps/desktop`.
9. No stray `&amp;amp;` entity artifacts or hardcoded hex colors outside
   `--sv-*` tokens in new/changed files.
10. No Rust/`src-tauri` changes.

## Explicitly out of scope
- Persisting the domain override as a per-prompt/global setting (it resets to
  "Auto-detect" on new prompt/reload) — a `getSetting`/`setSetting` persistence
  layer for this control is a separate, later task if wanted.
- Any change to the domain modules themselves or `DOMAIN_CONFIDENCE_FLOOR`.
- Any change to `resumeAndRecompile`/"Confirm & Recompile" — that path resumes
  from an already-compiled state and doesn't re-run `domainDetection` at all,
  so a domain override has no meaning there; left untouched.
- Any other item in this batch of 5.

## Verification
- `packages/compiler` vitest: 395/395 passing (387 pre-existing + 8 new, in
  `test/domain-force-override.test.ts`).
- `tsc --noEmit` clean on `packages/schema`, `packages/compiler`,
  `apps/desktop`.
- `vite build` clean on `apps/desktop` (pre-existing >500kB single-chunk
  warning only, unrelated to this change).
- No Rust files touched — `cargo build` not required per the process's own
  conditional ("if you touched Rust code").
- Grepped every new/changed file for `&amp;amp;` and hardcoded hex colors:
  zero matches.
