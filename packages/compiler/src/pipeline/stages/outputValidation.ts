import type { PipelineState } from '../state.js';

/**
 * Stage 9: structural checks only (Phase 1 scope). Ensures required fields
 * are present, no orphaned RequirementItems reference a nonexistent source,
 * and domain is set. Never throws — malformed/empty input still produces a
 * valid (mostly-unresolved) CompiledPrompt.
 */
export function outputValidation(state: PipelineState): PipelineState {
  const compiled = state.compiled;

  // domain must always be set (schema requires it; createEmptyCompiledPrompt
  // guarantees this, but assert defensively without throwing).
  if (compiled.domain === undefined) {
    compiled.domain = 'unknown';
  }

  // Ensure all array sections exist (never undefined) even if empty.
  const arraySections: Array<keyof typeof compiled> = [
    'userRequirements',
    'nonNegotiables',
    'preferences',
    'constraints',
    'assumptions',
    'functionalRequirements',
  ];
  for (const key of arraySections) {
    if (!Array.isArray((compiled as any)[key])) {
      (compiled as any)[key] = [];
    }
  }

  // Check for orphaned requirement items with empty source — non-fatal,
  // just normalize so nothing renders blank in the UI.
  for (const key of arraySections) {
    for (const item of (compiled as any)[key]) {
      if (!item.source) item.source = 'unknown';
      if (typeof item.confidence !== 'number' || Number.isNaN(item.confidence)) {
        item.confidence = 0;
      }
    }
  }

  return { ...state, compiled, stagesRun: [...state.stagesRun, 'outputValidation'] };
}
