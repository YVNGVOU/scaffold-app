import type { Specialist } from '../types.js';
import type { Decision } from '../../pipeline/state.js';
import { DOMAIN_MODULES } from '../../domains/index.js';

/**
 * CREATIVE specialist — deterministic rule engine, real logic (not a stub).
 *
 * Fifth real specialist after ARCHITECT, TECHNICAL, UX, and SECURITY
 * (TASK-010). Responsibilities scoped to what's inferable from domain +
 * extracted requirements + raw input: visual direction, originality,
 * consistency, composition, style, and creative opportunities.
 *
 * 1. Looks up the domain's creative-considerations table.
 * 2. Cross-references user input against each consideration's aspect to see
 *    whether it's already been addressed.
 * 3. Emits one RequirementItem per consideration, each with
 *    source: 'creative-specialist', a confidence, and evidence.
 * 4. Never emits kind: 'user' — only 'inferred' | 'default' | 'recommendation'.
 */
export const creativeSpecialist: Specialist = (state) => {
  const decisions: Decision[] = [];

  const domainModule = DOMAIN_MODULES.find((d) => d.id === state.domain);
  if (!domainModule) {
    // Unknown domain: no creative-considerations table to work from.
    return decisions;
  }

  const userText = state.rawInput.toLowerCase();

  for (const consideration of domainModule.creativeConsiderations) {
    const mentioned = userText.includes(consideration.aspect.toLowerCase());

    if (mentioned) {
      // Already addressed by the user — surface as an inferred creative note
      // rather than a fresh recommendation.
      decisions.push({
        type: 'requirement',
        category: consideration.category,
        item: {
          text: `Creative note on "${consideration.aspect}": ${consideration.note}`,
          kind: 'inferred',
          source: 'creative-specialist',
          confidence: 0.85,
          evidence: [`domain:${domainModule.id} creative considerations`, `user input mentioned "${consideration.aspect}"`],
          status: 'pending',
        },
      });
    } else {
      // Not addressed — flag as a recommendation, never a fabricated user
      // requirement.
      decisions.push({
        type: 'requirement',
        category: consideration.category,
        item: {
          text: `Consider creative aspect "${consideration.aspect}": ${consideration.note}`,
          kind: 'recommendation',
          source: 'creative-specialist',
          confidence: 0.6,
          evidence: [`domain:${domainModule.id} creative considerations`, `user input did not mention "${consideration.aspect}"`],
          status: 'pending',
        },
      });
    }
  }

  return decisions;
};
