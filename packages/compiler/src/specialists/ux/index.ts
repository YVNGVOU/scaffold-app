import type { Specialist } from '../types.js';
import type { Decision } from '../../pipeline/state.js';
import { DOMAIN_MODULES } from '../../domains/index.js';

/**
 * UX specialist — deterministic rule engine, real logic (not a stub).
 *
 * Third real specialist after ARCHITECT and TECHNICAL, proving the specialist
 * pattern generalizes to N=3. Responsibilities scoped to what's inferable
 * from domain + extracted requirements + raw input: user flow, interaction
 * hierarchy, accessibility, usability, information architecture, and edge
 * cases.
 *
 * 1. Looks up the domain's ux-considerations table.
 * 2. Cross-references user input against each consideration's aspect to see
 *    whether it's already been addressed.
 * 3. Emits one RequirementItem per consideration, each with
 *    source: 'ux-specialist', a confidence, and evidence.
 * 4. Never emits kind: 'user' — only 'inferred' | 'default' | 'recommendation'.
 */
export const uxSpecialist: Specialist = (state) => {
  const decisions: Decision[] = [];

  const domainModule = DOMAIN_MODULES.find((d) => d.id === state.domain);
  if (!domainModule) {
    // Unknown domain: no ux-considerations table to work from.
    return decisions;
  }

  const userText = state.rawInput.toLowerCase();

  for (const consideration of domainModule.uxConsiderations) {
    const mentioned = userText.includes(consideration.aspect.toLowerCase());

    if (mentioned) {
      // Already addressed by the user — surface as an inferred UX note
      // rather than a fresh recommendation.
      decisions.push({
        type: 'requirement',
        category: consideration.category,
        item: {
          text: `UX note on "${consideration.aspect}": ${consideration.note}`,
          kind: 'inferred',
          source: 'ux-specialist',
          confidence: 0.85,
          evidence: [`domain:${domainModule.id} ux considerations`, `user input mentioned "${consideration.aspect}"`],
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
          text: `Consider UX aspect "${consideration.aspect}": ${consideration.note}`,
          kind: 'recommendation',
          source: 'ux-specialist',
          confidence: 0.6,
          evidence: [`domain:${domainModule.id} ux considerations`, `user input did not mention "${consideration.aspect}"`],
          status: 'pending',
        },
      });
    }
  }

  return decisions;
};
