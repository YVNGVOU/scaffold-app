import type { PipelineState } from '../state.js';
import type { RequirementItem } from '@lucid/schema';
import { DOMAIN_MODULES } from '../../domains/index.js';

/**
 * Stage 4: for the detected domain, check the required-fields checklist.
 * Missing fields become RequirementItems with kind: 'unresolved' — never
 * silently defaulted in ARCHITECT mode (that's MASTER-mode-only, out of scope).
 */
export function ambiguityDetection(state: PipelineState): PipelineState {
  const domainModule = DOMAIN_MODULES.find((d) => d.id === state.domain);
  if (!domainModule) {
    return { ...state, stagesRun: [...state.stagesRun, 'ambiguityDetection'] };
  }

  const ambiguities: RequirementItem[] = [];
  for (const field of domainModule.ambiguityChecklist) {
    if (!field.isResolved(state.rawInput)) {
      ambiguities.push({
        text: field.description,
        kind: 'unresolved',
        source: `domain:${domainModule.id}:ambiguity-checklist:${field.field}`,
        confidence: 0.5,
        evidence: [`required field "${field.field}" not detected in raw input`],
        status: 'pending',
      });
    }
  }

  return {
    ...state,
    ambiguities: [...state.ambiguities, ...ambiguities],
    stagesRun: [...state.stagesRun, 'ambiguityDetection'],
  };
}
