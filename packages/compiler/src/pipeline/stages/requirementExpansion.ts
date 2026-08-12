import type { PipelineState, RequirementCategory } from '../state.js';
import type { RequirementItem } from '@lucid/schema';
import { DOMAIN_MODULES } from '../../domains/index.js';

/**
 * MASTER-mode round 1 ("Proposal / expansion" per the brief). Runs
 * immediately after `requirementExtraction`, before the specialist passes.
 *
 * Expands terse user input into domain-implied ADJACENT requirement
 * categories the domain's own architecture template names but the user
 * didn't explicitly state — e.g. for a game domain input that never
 * mentions "assets" or "platform target", this surfaces those architecture
 * components as inferred functional requirements worth considering, since
 * the domain's own template says every game needs them regardless of what
 * the user typed.
 *
 * Deliberately narrow and deterministic: reads only
 * `domainModule.architectureTemplate` (already-authored, hand-curated
 * per-domain data — no new domain data invented for this stage) and only
 * emits an item for a component whose name is not already substring-present
 * in the raw input, so it never re-states something the user already said.
 *
 * Provenance discipline: always `kind: 'inferred'`, `source:
 * 'requirement-expansion'`, `status: 'pending'` — this stage infers adjacent
 * scope, it never fabricates user intent, so it must never emit `kind: 'user'`.
 */
export function requirementExpansion(state: PipelineState): PipelineState {
  const domainModule = DOMAIN_MODULES.find((d) => d.id === state.domain);
  if (!domainModule) {
    return { ...state, stagesRun: [...state.stagesRun, 'requirementExpansion'] };
  }

  const newItems: RequirementItem[] = [];
  const newCategories: RequirementCategory[] = [];
  const rawLower = state.rawInput.toLowerCase();

  for (const component of domainModule.architectureTemplate) {
    const mentioned = rawLower.includes(component.component.toLowerCase());
    if (mentioned) continue;

    newItems.push({
      text: `Adjacent requirement implied by domain "${domainModule.id}": "${component.component}" — ${component.note}`,
      kind: 'inferred',
      source: 'requirement-expansion',
      confidence: 0.5,
      evidence: [
        `domain:${domainModule.id} architecture-template component:${component.component}`,
        `dependsOn:${component.dependsOn.join(',') || 'none'}`,
        'not explicitly mentioned in raw input',
      ],
      status: 'pending',
    });
    newCategories.push('functionalRequirements');
  }

  return {
    ...state,
    requirements: [...state.requirements, ...newItems],
    requirementCategories: [...state.requirementCategories, ...newCategories],
    stagesRun: [...state.stagesRun, 'requirementExpansion'],
  };
}
