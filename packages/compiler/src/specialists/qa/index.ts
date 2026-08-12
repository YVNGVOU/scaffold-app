import type { Specialist } from '../types.js';
import type { Decision } from '../../pipeline/state.js';
import { DOMAIN_MODULES } from '../../domains/index.js';

/**
 * QA specialist — deterministic rule engine, real logic (not a stub).
 *
 * Sixth real specialist after ARCHITECT, TECHNICAL, UX, SECURITY, and
 * CREATIVE (TASK-013). Responsibilities scoped to what's inferable from
 * domain + extracted requirements + raw input: attempting to break the
 * specification, identifying missing requirements, identifying
 * contradictions, generating acceptance criteria, generating test cases,
 * and identifying failure states.
 *
 * Structurally mirrors `creativeSpecialist` exactly:
 * 1. Looks up the domain's qa-considerations table.
 * 2. Cross-references user input against each consideration's aspect to see
 *    whether it's already been addressed.
 * 3. Emits one RequirementItem per consideration, each with
 *    source: 'qa-specialist', a confidence, and evidence.
 * 4. Never emits kind: 'user' — only 'inferred' | 'default' | 'recommendation'.
 */
export const qaSpecialist: Specialist = (state) => {
  const decisions: Decision[] = [];

  const domainModule = DOMAIN_MODULES.find((d) => d.id === state.domain);
  if (!domainModule) {
    // Unknown domain: no qa-considerations table to work from.
    return decisions;
  }

  const userText = state.rawInput.toLowerCase();

  for (const consideration of domainModule.qaConsiderations) {
    const mentioned = userText.includes(consideration.aspect.toLowerCase());

    if (mentioned) {
      // Already addressed by the user — surface as an inferred QA note
      // rather than a fresh recommendation.
      decisions.push({
        type: 'requirement',
        category: consideration.category,
        item: {
          text: `QA note on "${consideration.aspect}": ${consideration.note}`,
          kind: 'inferred',
          source: 'qa-specialist',
          confidence: 0.85,
          evidence: [`domain:${domainModule.id} qa considerations`, `user input mentioned "${consideration.aspect}"`],
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
          text: `Consider QA aspect "${consideration.aspect}": ${consideration.note}`,
          kind: 'recommendation',
          source: 'qa-specialist',
          confidence: 0.6,
          evidence: [`domain:${domainModule.id} qa considerations`, `user input did not mention "${consideration.aspect}"`],
          status: 'pending',
        },
      });
    }
  }

  return decisions;
};
