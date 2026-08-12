# IMPLEMENTATION HANDOFF — TASK-009

## Mission
Build MASTER mode: the flagship multi-round deliberation pipeline, per the authoritative design at `docs/superpowers/specs/2026-08-11-master-mode-design.md`. Read that file in full before starting — it explains the round-to-stage mapping and why the loop mechanism is designed the way it is.

## Canonical context
- Read first, in order: `state/CANONICAL_STATE.md`, `tasks/TASK-009.md`, `docs/superpowers/specs/2026-08-11-master-mode-design.md` (the design), this handoff.
- Existing stages to reuse unchanged: `packages/compiler/src/pipeline/stages/{architectSpecialistPass,technicalSpecialistPass,uxSpecialistPass,securitySpecialistPass,critique,conflict,synthesis,outputValidation}.ts`
- Existing pipeline runners to follow the pattern of: `packages/compiler/src/pipeline/index.ts` (`runArchitectPipeline`, `runQuickPipeline`)
- Existing conflict scenario to build the "richer than ARCHITECT" test around: the horror+multiplayer game conflict rule and the web no-login-required conflict rule, both in `packages/compiler/src/pipeline/stages/conflict.ts`

## User intent
> "keep going, design and build MASTER mode" — explicit authorization to design and implement autonomously while the user is offline.

## Objective
`runMasterPipeline("Make a horror game in Unity with multiplayer and a boss fight")` produces a `CompiledPrompt` that is genuinely richer than `runArchitectPipeline`'s output for the same input: it includes everything ARCHITECT produces, PLUS round-1 expanded requirements, PLUS round-5 alternative resolutions for the detected multiplayer/pacing conflict, PLUS round-6 decision-scoring flags — and the loop only ran as many times as it needed to (verified by `stagesRun`), not a padded fixed count.

## Scope

### In scope
- Three new stages: `requirementExpansion.ts`, `alternativeGeneration.ts`, `decisionScoring.ts`.
- `runMasterPipeline` in `pipeline/index.ts`, implementing the loop-until-dry deliberation cycle with `maxRounds` cap.
- `compileMaster` convenience export.
- Tests per handoff requirement list below.
- Optional MASTER option in the desktop mode toggle (mirrors TASK-008's QUICK toggle risk profile — implementer's judgment).

### Explicitly out of scope
- New specialists, UI round-count control, conflict auto-resolution, round-by-round SQLite history.

## Current-state findings
- `synthesis.ts` and `outputValidation.ts` are generic over whatever's accumulated in `PipelineState` — expect them to work unchanged for MASTER mode too, same as they did for QUICK mode, but verify directly rather than assuming.
- `critique.ts`'s existing rules (low-confidence pending recommendations, near-duplicate detection, unresolved ambiguity-checklist fields) will need to be callable more than once in a loop — check whether `critique.ts` is safely idempotent-ish when re-run on an already-critiqued state (i.e., does it re-flag the same low-confidence item every round, which would break "stop on zero new items"? If so, the loop-until-dry comparison must dedupe against items already flagged in a prior round of THIS pipeline run, not just compare raw counts — read `critique.ts` and `conflict.ts` carefully before implementing the loop's stopping condition).
- `PipelineState.decisions`/`requirements`/`architectureNotes` are append-only arrays — the loop's "did this round produce anything new" check should compare array lengths (or a set of item texts/sources) before vs. after each round pass, not assume any particular stage's internal behavior.

## Requirements
1. New stages follow the exact `(state: PipelineState) => PipelineState` shape as every other stage.
2. `requirementExpansion` never emits `kind: 'user'`.
3. `alternativeGeneration` only acts on `status: 'pending'` conflicts, never auto-resolves (no flipping a conflict to `'accepted'`/`'rejected'` itself), evidence names the conflict it addresses.
4. `decisionScoring` uses existing schema fields only — no new `RequirementItem`/`ArchitectureNote` fields unless genuinely unavoidable (prefer not extending schema, consistent with TASK-005's precedent).
5. Loop-until-dry: compare state before/after each critique→conflict→alternativeGeneration→decisionScoring round; stop if nothing new appeared; hard-cap at `maxRounds` regardless (default 2) as a safety backstop.
6. `onStage` fires for every actual stage execution, including repeated rounds — round 2's critique execution should be distinguishable in the stage name/index from round 1's (e.g. `critique`, then `critique:2` or similar — implementer's choice of naming convention, just make it distinguishable and document it).
7. All 71 pre-existing tests still pass, completely unchanged expected values — verify ARCHITECT and QUICK pipelines are untouched (same check as TASK-008 required).
8. No AI API/network calls; no unbounded loops (the `maxRounds` cap is non-negotiable even if the dry-detection logic has a bug — this is a safety requirement, not just an optimization).
9. If schema is touched, `apps/desktop` must still typecheck/build.

## Decisions
| Decision | Choice | Reason |
|---|---|---|
| Round-to-stage mapping | Per the design doc's table | Already reasoned through; don't re-derive |
| Loop mechanism | Loop-until-dry with hard `maxRounds` cap, default 2 | Matches "configurable" from the brief while staying safe and not padding fake rounds |
| Stage naming for repeated rounds | Implementer's choice, must be distinguishable in `stagesRun`/`onStage` | UI stepper and tests need to tell rounds apart; exact naming convention isn't load-bearing |

## Implementation phases

### Phase A — New stages
- Work: implement `requirementExpansion.ts`, `alternativeGeneration.ts`, `decisionScoring.ts` in isolation, with direct unit tests for each.
- Files/systems: `packages/compiler/src/pipeline/stages/{requirementExpansion,alternativeGeneration,decisionScoring}.ts`.
- Verification: isolated tests pass for each new stage.
- Exit criteria: each stage produces sensible, provenance-correct output when called directly on a hand-constructed `PipelineState`.

### Phase B — Master pipeline runner + loop + entry points
- Work: implement `runMasterPipeline` with the deliberation loop, `compileMaster`, wire everything together.
- Files/systems: `packages/compiler/src/pipeline/index.ts`, `packages/compiler/src/index.ts`.
- Verification: full vitest suite (71 existing + new) passes; the "richer than ARCHITECT," "stops early on dry round," and "respects maxRounds cap" tests all pass with real evidence.
- Exit criteria: `compileMaster(...)` works correctly end-to-end and demonstrably does more than a single ARCHITECT pass for a conflict-bearing input.

## Acceptance criteria
- [ ] Three new stages implemented, correct provenance discipline.
- [ ] `runMasterPipeline`/`compileMaster` implemented, loop-until-dry with `maxRounds` cap.
- [ ] `onStage` distinguishes repeated-round executions.
- [ ] MASTER output demonstrably richer than ARCHITECT for a conflict-bearing input (test evidence).
- [ ] Loop stops early on a dry round (test evidence, not just "doesn't crash").
- [ ] `maxRounds` cap respected even under adversarial/pathological input (test evidence).
- [ ] All 71 pre-existing tests still pass; ARCHITECT/QUICK bit-for-bit unchanged.
- [ ] `tsc --noEmit` clean; `apps/desktop` still builds.
- [ ] `state/CANONICAL_STATE.md` and `tasks/TASK_QUEUE.md` updated.

## Verification plan
- [ ] Build/compile (`tsc --noEmit`)
- [ ] Automated tests (full vitest suite)
- [ ] Static/type/lint checks
- [ ] Runtime/manual verification (confirm `apps/desktop` still typechecks/builds)
- [ ] Artifact inspection (test output as evidence)

## Risks and mitigations
- Risk: loop-until-dry never actually terminates early because critique/conflict aren't idempotent-safe across re-runs on the same state (re-flagging identical items every round).
  - Mitigation: requirement 5 + Current-state findings note — read critique.ts/conflict.ts's actual re-run behavior before implementing the stopping condition, don't assume.
- Risk: `maxRounds` cap has an off-by-one or is bypassable under some code path.
  - Mitigation: requirement 8, explicit adversarial test.
- Risk: scope creep into building a UI round-count control or new specialists "while in here."
  - Mitigation: stay to the explicitly-out-of-scope list.

## Stop conditions
Stop and report instead of expanding scope if:
- critique/conflict turn out to require modification to work correctly in a loop (would violate "reuse unchanged" — if truly unavoidable, document exactly why and what minimal change is needed, don't guess past it)
- a new requirement materially changes architecture or scope

## Final report format
- Summary:
- Files changed:
- Verification:
- Results:
- Known issues:
- Canonical state updated:
- Next task:
