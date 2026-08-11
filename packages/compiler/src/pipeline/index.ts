import type { PipelineState } from './state.js';
import { createInitialState } from './state.js';
import { intentAnalysis } from './stages/intentAnalysis.js';
import { domainDetection } from './stages/domainDetection.js';
import { requirementExtraction } from './stages/requirementExtraction.js';
import { ambiguityDetection } from './stages/ambiguityDetection.js';
import { architectSpecialistPass } from './stages/architectSpecialistPass.js';
import { critiquePassthrough } from './stages/critiquePassthrough.js';
import { conflictPassthrough } from './stages/conflictPassthrough.js';
import { synthesis } from './stages/synthesis.js';
import { outputValidation } from './stages/outputValidation.js';

export type Stage = (state: PipelineState) => PipelineState;

/**
 * The 9 named ARCHITECT-mode pipeline stages, exactly as listed in the spec.
 * Do not add stages not listed here.
 */
export const ARCHITECT_MODE_PIPELINE: Stage[] = [
  intentAnalysis,
  domainDetection,
  requirementExtraction,
  ambiguityDetection,
  architectSpecialistPass,
  critiquePassthrough,
  conflictPassthrough,
  synthesis,
  outputValidation,
];

export const ARCHITECT_MODE_STAGE_NAMES = [
  'intentAnalysis',
  'domainDetection',
  'requirementExtraction',
  'ambiguityDetection',
  'architectSpecialistPass',
  'critiquePassthrough',
  'conflictPassthrough',
  'synthesis',
  'outputValidation',
] as const;

/** Runs the ARCHITECT-mode pipeline over raw input. Never throws. */
export function runArchitectPipeline(rawInput: string): PipelineState {
  let state = createInitialState(rawInput ?? '');
  for (const stage of ARCHITECT_MODE_PIPELINE) {
    state = stage(state);
  }
  return state;
}

export { createInitialState } from './state.js';
export type { PipelineState, TaskType, Decision, RequirementCategory } from './state.js';
