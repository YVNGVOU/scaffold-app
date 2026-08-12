# TASK-031

- Timestamp: 2026-08-12
- Original request: "the recompile is buggy resets answers and doesnt actually recompile" — user, after testing TASK-030's Confirm & Recompile feature.
- Priority: P1 (bug, blocking a just-shipped feature)
- Status: ACTIVE
- Classification: bug

## Root cause (diagnosed before delegating — confirm this reasoning, don't re-derive from scratch)
`handleConfirmRecompile` in `App.tsx` builds `buildAugmentedInput(rawInput, answeredItems)` (original raw text + answered Q&A appended as plain sentences) and feeds it into `handleCompile`, which runs a **completely fresh** `runArchitectPipeline`/`runQuickPipeline`/`runMasterPipeline` from scratch on that synthetic text. This causes both reported symptoms:
1. **"Resets answers"** — the previous compile's `kind:'user'`/`source:'user-answered-question'` items only existed in the OLD `CompiledPrompt` object. A from-scratch pipeline run produces an entirely new `CompiledPrompt`; the old answered items are gone, replaced by whatever fresh `requirementExtraction`/NLP derives from the synthetic appended sentence (often not recognized the same way, since it's not phrased as a natural user statement — it's "{question text}: {answer text}.").
2. **"Doesn't actually recompile"** (looks unchanged) — `ambiguityDetection` re-runs its domain checklist regex/synonym matching against the whole augmented text from scratch. If the appended sentence's phrasing doesn't trip the same checklist pattern that flagged it unresolved originally, the SAME field can get flagged unresolved again, or the fresh specialist output can look superficially similar to before, making the recompile look like a no-op even though it was actually a wholly different fresh compile underneath.

## The correct fix
Do NOT re-run the pipeline from raw text. Instead, resume from the EXISTING compiled state:
1. `CompiledPrompt` already has a `domain` field (confirmed in `packages/schema/src/index.ts`) — no need to re-run `domainDetection`.
2. Reconstruct a `PipelineState`-shaped object from the current `CompiledPrompt`: `requirements` = flatten all category arrays (userRequirements/nonNegotiables/preferences/constraints/assumptions/functionalRequirements) back into one array (preserving each item's `kind`/`source`/`confidence`/`evidence`/`status` — nothing lost), `requirementCategories` = parallel array recording which category each flattened item came from (so `synthesis` can route them back correctly), `architectureNotes` = `compiled.architecture ?? []`, `domain` = `compiled.domain`, `ambiguities` = whatever's still `kind:'unresolved'` in the reconstructed requirements (already-answered ones are `kind:'user'` now, correctly excluded).
3. Do NOT re-run `intentAnalysis`/`domainDetection`/`requirementExtraction`/`ambiguityDetection` on this resume path — those already ran once; re-running them from a synthetic augmented-text string is exactly the bug. `taskType` can be reconstructed too if needed, or defaulted — check `pipeline/state.ts`'s `PipelineState` shape for what's actually required downstream.
4. DO re-run the specialists (architect/technical/ux/security/creative/qa/constraint) fresh against this fuller reconstructed state — this is the whole point, so they can react to the now-more-complete requirements pool including the user's answers. Then re-run critique/conflict (or MASTER's full deliberation loop) → synthesis → outputValidation, same as normal.
5. Build a new exported function in `packages/compiler` for this — e.g. `resumeAndRecompile(compiled: CompiledPrompt, mode: 'architect' | 'quick' | 'master', options?: { maxRounds?: number; onStage?: ... }): PipelineState`. Read `packages/compiler/src/pipeline/index.ts`'s `runArchitectPipeline`/`runMasterPipeline`/`runQuickPipeline` implementations first — the new function should reuse the same specialist-pass/critique/conflict/synthesis stage sequence those already use, just starting from the reconstructed state instead of `createInitialState(rawInput)`. You may need to refactor slightly to share stage-sequence logic between the "from scratch" and "resume" entry points rather than duplicating the stage lists — use your judgment on the cleanest shared structure, but don't break the existing `runArchitectPipeline`/`runQuickPipeline`/`runMasterPipeline` call signatures or behavior (all pre-existing tests must keep passing unchanged).
6. Wire `App.tsx`'s `handleConfirmRecompile` to call this new resume-based function instead of `handleCompile(augmented)`. `buildAugmentedInput` (TASK-030) becomes unused by this path — check whether it's still needed for anything else (probably not); if genuinely dead code after this fix, remove it and its test file, but only if you've confirmed nothing else references it.
7. The pipeline stepper animation and `saveCompile` persistence must still work for this resume path (new `compiles` row, shows up in version history) — same UX as before, just correct underlying behavior.

## Requirements
8. New tests in `packages/compiler/test/`: a test proving `resumeAndRecompile` (or whatever it's named) preserves already-answered items (they remain `kind:'user'` in the result, not lost), a test proving specialists genuinely re-run and can produce NEW output reacting to the answered content (construct a scenario where an answer changes what a specialist would flag), a test proving domain/prior architecture notes are preserved rather than re-derived from scratch.
9. Must not break any pre-existing tests (check current count first).
10. `tsc --noEmit`, `vite build`, `cargo build` (only if Rust touched, shouldn't be) must stay clean.
11. Zero AI API calls (unchanged constraint).
12. Update `state/CANONICAL_STATE.md` and task/queue status on completion — clearly document this replaces TASK-030's recompile mechanism with a correct one.
13. Commit and push to `origin/master`. Do not touch the updater signing key or release artifacts.

## Explicitly out of scope
- Any other feature work — this is a focused bug fix only.
- Changing `handleCompile`'s normal (first-time, non-recompile) behavior.
