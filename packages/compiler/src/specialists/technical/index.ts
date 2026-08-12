import type { Specialist } from '../types.js';
import type { Decision } from '../../pipeline/state.js';
import { DOMAIN_MODULES } from '../../domains/index.js';

/**
 * TECHNICAL specialist — deterministic rule engine, real logic (not a stub).
 *
 * Second real specialist after ARCHITECT, proving the specialist pattern
 * generalizes. Responsibilities scoped to what's inferable from domain +
 * extracted requirements + raw input: technology choices, implementation
 * constraints, dependencies, compatibility, performance, scalability, and
 * technical risk flags.
 *
 * 1. Looks up the domain's technical-considerations table.
 * 2. Cross-references user input against each consideration's aspect to see
 *    whether it's already been addressed.
 * 3. Emits one RequirementItem per consideration, each with
 *    source: 'technical-specialist', a confidence, and evidence.
 * 4. Never emits kind: 'user' — only 'inferred' | 'default' | 'recommendation'.
 */
export const technicalSpecialist: Specialist = (state) => {
  const decisions: Decision[] = [];

  const domainModule = DOMAIN_MODULES.find((d) => d.id === state.domain);
  if (!domainModule) {
    // Unknown domain: no technical-considerations table to work from.
    return decisions;
  }

  const userText = state.rawInput.toLowerCase();

  for (const consideration of domainModule.technicalConsiderations) {
    const mentioned = userText.includes(consideration.aspect.toLowerCase());

    if (mentioned) {
      // Already addressed by the user — surface as an inferred technical
      // note rather than a fresh recommendation.
      decisions.push({
        type: 'requirement',
        category: consideration.category,
        item: {
          text: `Technical note on "${consideration.aspect}": ${consideration.note}`,
          kind: 'inferred',
          source: 'technical-specialist',
          confidence: 0.85,
          evidence: [`domain:${domainModule.id} technical considerations`, `user input mentioned "${consideration.aspect}"`],
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
          text: `Consider technical aspect "${consideration.aspect}": ${consideration.note}`,
          kind: 'recommendation',
          source: 'technical-specialist',
          confidence: 0.6,
          evidence: [`domain:${domainModule.id} technical considerations`, `user input did not mention "${consideration.aspect}"`],
          status: 'pending',
        },
      });
    }
  }

  return decisions;
};
