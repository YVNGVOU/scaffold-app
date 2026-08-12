import type { PipelineState } from '../state.js';
import type { RequirementItem } from '@lucid/schema';
import { DOMAIN_MODULES } from '../../domains/index.js';
import { PLATFORM_LEXICON, matchesConcept, type Lexicon } from '../../nlp/lexicon.js';

/**
 * Maps an ambiguity-checklist field key to a lexicon whose synonyms also
 * count as resolving that field, even when none of the domain module's own
 * literal-string checklist regex matches. E.g. "for iPhone" resolves the
 * "platform" field via PLATFORM_LEXICON's "mobile" synonym list, even though
 * no domain's `isResolved` regex contains the literal string "iphone".
 */
const FIELD_LEXICON_MAP: Record<string, Lexicon> = {
  platform: PLATFORM_LEXICON,
};

function synonymResolvesField(fieldKey: string, input: string): boolean {
  const lexicon = FIELD_LEXICON_MAP[fieldKey];
  if (!lexicon) return false;
  return Object.keys(lexicon).some((canonical) => matchesConcept(input, canonical, lexicon));
}

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
    const resolved = field.isResolved(state.rawInput) || synonymResolvesField(field.field, state.rawInput);
    if (!resolved) {
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
