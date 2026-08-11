import type { PipelineState } from '../state.js';

/**
 * Stage 6: no-op passthrough. Real critique-engine logic (cross-specialist
 * review of decisions) is a future phase — see PROJECT_BLUEPRINT.md pipeline
 * item 7 ("Critique + conflict engine"). Preserves the full pipeline shape now.
 */
export function critiquePassthrough(state: PipelineState): PipelineState {
  return { ...state, stagesRun: [...state.stagesRun, 'critiquePassthrough'] };
}
