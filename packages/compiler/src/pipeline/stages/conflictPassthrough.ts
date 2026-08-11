import type { PipelineState } from '../state.js';

/**
 * Stage 7: no-op passthrough. Real conflict detection/resolution logic is a
 * future phase — see PROJECT_BLUEPRINT.md pipeline items 8-9. Contradictory
 * input (e.g. "no budget" + "AAA game engine") is allowed through unflagged
 * in Phase 1; the pipeline must simply not crash on it.
 */
export function conflictPassthrough(state: PipelineState): PipelineState {
  return { ...state, stagesRun: [...state.stagesRun, 'conflictPassthrough'] };
}
