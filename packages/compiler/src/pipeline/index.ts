import type { PipelineState } from './state.js';
import { createInitialState } from './state.js';
import { intentAnalysis } from './stages/intentAnalysis.js';
import { domainDetection } from './stages/domainDetection.js';
import { requirementExtraction } from './stages/requirementExtraction.js';
import { ambiguityDetection } from './stages/ambiguityDetection.js';
import { architectSpecialistPass } from './stages/architectSpecialistPass.js';
import { technicalSpecialistPass } from './stages/technicalSpecialistPass.js';
import { uxSpecialistPass } from './stages/uxSpecialistPass.js';
import { securitySpecialistPass } from './stages/securitySpecialistPass.js';
import { creativeSpecialistPass } from './stages/creativeSpecialistPass.js';
import { qaSpecialistPass } from './stages/qaSpecialistPass.js';
import { constraintSpecialistPass } from './stages/constraintSpecialistPass.js';
import { critique } from './stages/critique.js';
import { conflict } from './stages/conflict.js';
import { synthesis } from './stages/synthesis.js';
import { outputValidation } from './stages/outputValidation.js';
import { requirementExpansion } from './stages/requirementExpansion.js';
import { alternativeGeneration } from './stages/alternativeGeneration.js';
import { decisionScoring } from './stages/decisionScoring.js';

export type Stage = (state: PipelineState) => PipelineState;

/**
 * The named ARCHITECT-mode pipeline stages. Originally 9 per the Phase 1
 * spec; TASK-003 (Phase 2) added `technicalSpecialistPass` as a second
 * specialist-pass stage, following the same shape as `architectSpecialistPass`,
 * so it now runs alongside ARCHITECT in the real pipeline (not just in
 * isolation). TASK-004 added `uxSpecialistPass` as a third specialist-pass
 * stage, immediately after `technicalSpecialistPass`, mirroring the same
 * pattern. TASK-005 replaced the `critiquePassthrough`/`conflictPassthrough`
 * no-ops with real deterministic logic (`critique`/`conflict`), keeping the
 * same pipeline position between the specialist passes and `synthesis`.
 * TASK-007 added `securitySpecialistPass` as a fourth specialist-pass stage,
 * immediately after `uxSpecialistPass` and before `critique`/`conflict`, so
 * those stages also reason over SECURITY's output. TASK-010 added
 * `creativeSpecialistPass` as a fifth specialist-pass stage, immediately
 * after `securitySpecialistPass` and before `critique`/`conflict`, so those
 * stages also reason over CREATIVE's output. TASK-013 added
 * `qaSpecialistPass` as a sixth specialist-pass stage, immediately after
 * `creativeSpecialistPass` and before `critique`/`conflict`, so those stages
 * also reason over QA's output. TASK-014 added `constraintSpecialistPass` as
 * the seventh and final specialist-pass stage from the original brief,
 * immediately after `qaSpecialistPass` and before `critique`/`conflict`, so
 * those stages also reason over CONSTRAINT's output.
 */
export const ARCHITECT_MODE_PIPELINE: Stage[] = [
  intentAnalysis,
  domainDetection,
  requirementExtraction,
  ambiguityDetection,
  architectSpecialistPass,
  technicalSpecialistPass,
  uxSpecialistPass,
  securitySpecialistPass,
  creativeSpecialistPass,
  qaSpecialistPass,
  constraintSpecialistPass,
  critique,
  conflict,
  synthesis,
  outputValidation,
];

export const ARCHITECT_MODE_STAGE_NAMES = [
  'intentAnalysis',
  'domainDetection',
  'requirementExtraction',
  'ambiguityDetection',
  'architectSpecialistPass',
  'technicalSpecialistPass',
  'uxSpecialistPass',
  'securitySpecialistPass',
  'creativeSpecialistPass',
  'qaSpecialistPass',
  'constraintSpecialistPass',
  'critique',
  'conflict',
  'synthesis',
  'outputValidation',
] as const;

export interface RunPipelineOptions {
  /** Optional callback invoked after each stage completes — additive, for UI stepper use. */
  onStage?: (stageName: string, index: number, state: PipelineState) => void;
}

/** Runs the ARCHITECT-mode pipeline over raw input. Never throws. */
export function runArchitectPipeline(rawInput: string, options?: RunPipelineOptions): PipelineState {
  let state = createInitialState(rawInput ?? '');
  for (let i = 0; i < ARCHITECT_MODE_PIPELINE.length; i++) {
    state = ARCHITECT_MODE_PIPELINE[i](state);
    options?.onStage?.(ARCHITECT_MODE_STAGE_NAMES[i], i, state);
  }
  return state;
}

/**
 * TASK-008: QUICK mode — "User prompt → improved prompt, minimal analysis,
 * fast transformation" per the original brief. Reuses `intentAnalysis`,
 * `domainDetection`, and `requirementExtraction` completely unchanged (no
 * stage logic is forked or modified — see ARCHITECT/QUICK parity note below).
 * Deliberately skips all 4 specialist passes and `critique`/`conflict` —
 * QUICK's defining trait is that it never runs multi-specialist deliberation.
 *
 * Ambiguity-handling decision (TASK-008 requirement 2): QUICK mode SKIPS
 * `ambiguityDetection` ENTIRELY rather than running it and applying light
 * `kind: 'default'` values. Reasoning:
 *   1. "Minimal analysis" in the original brief describes QUICK as doing
 *      less work than ARCHITECT, not doing the same analysis and then
 *      papering over the gaps — running ambiguity detection and then
 *      immediately overriding every unresolved field with a fabricated
 *      default would mean QUICK still pays the full analysis cost of
 *      ARCHITECT's checklist walk while presenting less-honest output.
 *   2. Every domain's `ambiguityChecklist` field descriptions
 *      (domain module index files) are written as ARCHITECT-mode-flavored
 *      structured questions ("what platform...", "what's the budget...").
 *      Synthesizing a "light default" value for each would require new
 *      per-field default-value logic never specified anywhere in the
 *      domain data — that is new stage behavior invented for QUICK, which
 *      the handoff explicitly discourages ("no new stage logic invented").
 *   3. Skipping cleanly satisfies requirement 5 (never fabricate
 *      `kind: 'user'`) and requirement 4 (QUICK must be measurably
 *      lighter) by construction — QUICK's `compiled.assumptions` section
 *      stays empty instead of being filled with synthesized filler,
 *      whereas ARCHITECT's is populated with real `kind: 'unresolved'`
 *      flags for the same input.
 *   4. This is purely additive: `ambiguityDetection` itself is not
 *      modified at all, so ARCHITECT mode's behavior is bit-for-bit
 *      unchanged — QUICK simply never calls it.
 */
export const QUICK_MODE_PIPELINE: Stage[] = [
  intentAnalysis,
  domainDetection,
  requirementExtraction,
  synthesis,
  outputValidation,
];

export const QUICK_MODE_STAGE_NAMES = [
  'intentAnalysis',
  'domainDetection',
  'requirementExtraction',
  'synthesis',
  'outputValidation',
] as const;

/** Runs the QUICK-mode pipeline over raw input. Never throws. Mirrors `runArchitectPipeline`'s signature/options. */
export function runQuickPipeline(rawInput: string, options?: RunPipelineOptions): PipelineState {
  let state = createInitialState(rawInput ?? '');
  for (let i = 0; i < QUICK_MODE_PIPELINE.length; i++) {
    state = QUICK_MODE_PIPELINE[i](state);
    options?.onStage?.(QUICK_MODE_STAGE_NAMES[i], i, state);
  }
  return state;
}

/**
 * TASK-009: MASTER mode — the flagship multi-round deliberation pipeline.
 * See `docs/superpowers/specs/2026-08-11-master-mode-design.md` for the full
 * round-to-stage mapping. Unlike ARCHITECT_MODE_PIPELINE/QUICK_MODE_PIPELINE,
 * MASTER is not representable as one static Stage[] array because rounds
 * 3-6 (critique -> conflict -> alternativeGeneration -> decisionScoring)
 * loop. `runMasterPipeline` runs the fixed stages directly plus the
 * deliberation loop, still firing `onStage` for every actual execution
 * (including repeated loop rounds, whose stage name gets a
 * ` (round N)` suffix starting at round 2 so the UI stepper and tests can
 * tell rounds apart — round 1 keeps the bare stage name for continuity with
 * ARCHITECT's naming).
 */
export interface RunMasterPipelineOptions extends RunPipelineOptions {
  /** Hard cap on deliberation-loop rounds (critique/conflict/alternativeGeneration/decisionScoring). Default 2. */
  maxRounds?: number;
}

const DEFAULT_MASTER_MAX_ROUNDS = 2;

/** Stable identity for a requirement item, used only by the deliberation loop's dry-check (not persisted, not a schema field). */
function findingIdentity(item: { source: string; text: string }): string {
  return `${item.source}::${item.text}`;
}

/**
 * Runs the MASTER-mode pipeline over raw input. Never throws.
 *
 * Stage sequence: intentAnalysis -> domainDetection -> requirementExtraction
 * -> requirementExpansion (round 1: proposal/expansion) -> ambiguityDetection
 * -> 6 specialist passes (round 2: independent specialist analysis) ->
 * [critique -> conflict -> alternativeGeneration -> decisionScoring]
 * (rounds 3-6, looped) -> synthesis (round 7) -> outputValidation (round 8)
 * -> the returned PipelineState.compiled IS round 9 (MASTER COMPILE), same
 * shape as ARCHITECT/QUICK, just richer content plus a stagesRun history
 * showing the full round trail (including repeats if the loop ran more than
 * once).
 *
 * Deliberation-loop stopping condition (handoff requirement 5/6): critique.ts
 * and conflict.ts were read carefully before writing this loop and are NOT
 * naturally idempotent-safe when re-run on an already-processed state —
 * critique re-scans the FULL accumulated `state.requirements` every call and
 * will re-flag the exact same still-pending low-confidence item every single
 * round (nothing about running critique once changes that item's confidence
 * or status), and conflict re-evaluates the same raw-input/decision match
 * every round too, re-appending the identical finding text again. That means
 * a naive "did requirements.length grow this round" check would NEVER detect
 * dryness — the array grows every round even once nothing genuinely new is
 * being found, because the same finding gets re-appended as a new array
 * entry each time. Both alternativeGeneration and decisionScoring were
 * deliberately written to dedupe against their own prior output within one
 * pipeline run (evidence markers `addresses-conflict:<text>` /
 * `scores-item:<text>`), but critique/conflict themselves are NOT modified
 * to do this — modifying them was avoidable, so per the handoff's stop
 * condition they were left exactly as ARCHITECT/QUICK use them (verified via
 * `git diff` scope; this task made zero edits to critique.ts or conflict.ts).
 * Instead, dryness is detected entirely in THIS loop: a `Set` of
 * `source::text` identities already seen at any point in this call is
 * tracked, and a round only counts as "produced something new" if at least
 * one requirement item appears whose identity was not already in that set —
 * so critique/conflict re-appending the same identical finding text is
 * correctly recognized as "nothing new" even though the underlying array
 * length still grew. `maxRounds` (default 2) is a hard backstop regardless
 * of what the dry-check concludes, enforced by the loop's own bound
 * (`round <= maxRounds`) — even a hypothetical bug in the identity-tracking
 * logic cannot produce more than `maxRounds` iterations, since the loop
 * counter itself is the only thing that can keep it running.
 */
export function runMasterPipeline(rawInput: string, options?: RunMasterPipelineOptions): PipelineState {
  let state = createInitialState(rawInput ?? '');
  let stageIndex = 0;

  const runStage = (stage: Stage, name: string) => {
    state = stage(state);
    options?.onStage?.(name, stageIndex, state);
    stageIndex++;
  };

  // Round 1: proposal / expansion.
  runStage(intentAnalysis, 'intentAnalysis');
  runStage(domainDetection, 'domainDetection');
  runStage(requirementExtraction, 'requirementExtraction');
  runStage(requirementExpansion, 'requirementExpansion');
  runStage(ambiguityDetection, 'ambiguityDetection');

  // Round 2: independent specialist analysis (7 specialists, run in sequence
  // — "independent" in the sense that none of them read each other's output,
  // not literal concurrency, same as ARCHITECT mode).
  runStage(architectSpecialistPass, 'architectSpecialistPass');
  runStage(technicalSpecialistPass, 'technicalSpecialistPass');
  runStage(uxSpecialistPass, 'uxSpecialistPass');
  runStage(securitySpecialistPass, 'securitySpecialistPass');
  runStage(creativeSpecialistPass, 'creativeSpecialistPass');
  runStage(qaSpecialistPass, 'qaSpecialistPass');
  runStage(constraintSpecialistPass, 'constraintSpecialistPass');

  // Rounds 3-6: loop-until-dry deliberation cycle, hard-capped at maxRounds.
  const maxRounds = options?.maxRounds ?? DEFAULT_MASTER_MAX_ROUNDS;
  const seenFindingIdentities = new Set<string>(state.requirements.map(findingIdentity));

  for (let round = 1; round <= maxRounds; round++) {
    const suffix = round === 1 ? '' : ` (round ${round})`;
    runStage(critique, `critique${suffix}`);
    runStage(conflict, `conflict${suffix}`);
    runStage(alternativeGeneration, `alternativeGeneration${suffix}`);
    runStage(decisionScoring, `decisionScoring${suffix}`);

    let foundNew = false;
    for (const item of state.requirements) {
      const id = findingIdentity(item);
      if (!seenFindingIdentities.has(id)) {
        seenFindingIdentities.add(id);
        foundNew = true;
      }
    }

    if (!foundNew) break; // dry round — stop looping early rather than padding to maxRounds
  }

  // Round 7: synthesis. Round 8: quality validation.
  runStage(synthesis, 'synthesis');
  runStage(outputValidation, 'outputValidation');

  // Round 9 (MASTER COMPILE) is state.compiled itself, returned below.
  return state;
}

export { createInitialState } from './state.js';
export type { PipelineState, TaskType, Decision, RequirementCategory } from './state.js';
