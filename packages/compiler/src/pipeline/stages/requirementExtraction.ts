import type { PipelineState, RequirementCategory } from '../state.js';
import type { RequirementItem } from '@lucid/schema';
import { DOMAIN_MODULES } from '../../domains/index.js';

const EXPLICIT_PATTERNS = [
  /[^.!?\n]*\bmust\b[^.!?\n]*/gi,
  /[^.!?\n]*\bneeds? to\b[^.!?\n]*/gi,
  /[^.!?\n]*\bshould\b[^.!?\n]*/gi,
  /[^.!?\n]*\brequires?\b[^.!?\n]*/gi,
];

const DEFAULT_CATEGORY_MAP: Record<'functional' | 'constraint' | 'preference', RequirementCategory> = {
  functional: 'functionalRequirements',
  constraint: 'constraints',
  preference: 'preferences',
};

/** Stage 3: pull explicit user requirements out of raw text, plus domain defaults. */
export function requirementExtraction(state: PipelineState): PipelineState {
  const newItems: RequirementItem[] = [];
  const newCategories: RequirementCategory[] = [];
  const seen = new Set<string>();

  for (const pattern of EXPLICIT_PATTERNS) {
    const matches = state.rawInput.match(pattern) ?? [];
    for (const raw of matches) {
      const text = raw.trim();
      if (!text || seen.has(text.toLowerCase())) continue;
      seen.add(text.toLowerCase());
      newItems.push({
        text,
        kind: 'user',
        source: 'user-input',
        confidence: 1,
        evidence: ['matched explicit requirement phrase in raw input'],
        status: 'accepted',
      });
      newCategories.push('userRequirements');
    }
  }

  const domainModule = DOMAIN_MODULES.find((d) => d.id === state.domain);
  if (domainModule) {
    for (const def of domainModule.defaultRequirements) {
      newItems.push({
        text: def.text,
        kind: 'default',
        source: `domain:${domainModule.id}`,
        confidence: 0.6,
        evidence: [`domain:${domainModule.id} default requirement category:${def.category}`],
        status: 'pending',
      });
      newCategories.push(DEFAULT_CATEGORY_MAP[def.category]);
    }
  }

  return {
    ...state,
    requirements: [...state.requirements, ...newItems],
    requirementCategories: [...state.requirementCategories, ...newCategories],
    stagesRun: [...state.stagesRun, 'requirementExtraction'],
  };
}
