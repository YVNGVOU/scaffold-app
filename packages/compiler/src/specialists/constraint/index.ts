import type { Specialist } from '../types.js';
import type { Decision } from '../../pipeline/state.js';
import { DOMAIN_MODULES } from '../../domains/index.js';

/**
 * CONSTRAINT specialist — deterministic rule engine, real logic (not a stub).
 *
 * Seventh and final specialist from the original brief, after ARCHITECT,
 * TECHNICAL, UX, SECURITY, CREATIVE, and QA. Responsibilities: identify
 * impossible/high-risk combinations, detect conflicting requirements,
 * identify assumptions, and distinguish hard requirements from preferences.
 *
 * IMPORTANT distinction from `pipeline/stages/conflict.ts` (read in full
 * before writing this file): `conflict.ts` runs after all specialists (round
 * 4 in MASTER terms) and looks at OTHER SPECIALISTS' DECISIONS
 * (`state.decisions`) to find cross-specialist contradictions (e.g.
 * TECHNICAL's multiplayer-networking decision vs. UX's horror-pacing
 * decision). CONSTRAINT runs as a specialist pass alongside the other six
 * (round 2) and looks at RAW INPUT + the domain's own `constraintConsiderations`
 * table for INFEASIBILITY signals that don't depend on any other specialist
 * having run first — it would fire identically even if it were the only
 * specialist registered. Its data table (`constraintConsiderations`) is also
 * structurally different from every other specialist's per-domain table:
 * where TECHNICAL/UX/SECURITY/CREATIVE/QA each check one aspect against
 * "did the user mention this," CONSTRAINT's considerations are pairs of
 * signals (`triggerA`/`triggerB`) checked against raw input together,
 * because infeasibility is inherently about a COMBINATION of two things
 * being true at once (e.g. "no budget" + "custom engine"), not about a
 * single unaddressed aspect. This file makes zero changes to conflict.ts and
 * does not duplicate its multiplayer/horror or no-auth rules.
 *
 * Two independent behaviors, both emitting `source: 'constraint-specialist'`,
 * never `kind: 'user'`:
 *
 * 1. Impossible/high-risk combination detection: for each of the domain's
 *    `constraintConsiderations`, if BOTH `triggerA` and `triggerB` match the
 *    raw input, emit a `kind: 'recommendation'` flag naming the tension.
 *    This also serves "detect conflicting requirements" and "identify
 *    assumptions" (an unaddressed infeasibility is itself an unstated
 *    assumption that the two things can coexist).
 *
 * 2. Hard-requirement-vs-preference reclassification: scans the requirements
 *    already extracted/routed by earlier stages (`state.requirements` /
 *    `state.requirementCategories`, parallel arrays) for any item routed to
 *    the `preferences` section whose own text reads like a non-negotiable
 *    ("must", "required", "cannot", "mandatory", etc.). Per the append-only
 *    provenance discipline used everywhere in this codebase (see
 *    `RequirementItem`'s doc comment in packages/schema), the original item
 *    is NEVER mutated or reclassified in place — instead a brand-new
 *    `RequirementItem` is emitted, routed to `nonNegotiables`, whose
 *    `evidence` explicitly references the original item's source and text.
 *    `source` stays `'constraint-specialist'` (per this task's requirement 7)
 *    rather than a `supersedes:` value, with the reference carried in
 *    `evidence` instead — the original item is left completely untouched in
 *    `state.requirements`.
 */
const HARD_REQUIREMENT_LANGUAGE = /\b(must|required|mandatory|non-negotiable|cannot|has to|no exceptions|need(?:s)? to)\b/i;

export const constraintSpecialist: Specialist = (state) => {
  const decisions: Decision[] = [];

  const domainModule = DOMAIN_MODULES.find((d) => d.id === state.domain);

  // 1. Impossible/high-risk combination detection (domain-scoped).
  if (domainModule) {
    for (const consideration of domainModule.constraintConsiderations) {
      if (consideration.triggerA.test(state.rawInput) && consideration.triggerB.test(state.rawInput)) {
        decisions.push({
          type: 'requirement',
          category: consideration.category,
          item: {
            text: `Potential infeasible/high-risk combination ("${consideration.aspect}"): ${consideration.note}`,
            kind: 'recommendation',
            source: 'constraint-specialist',
            confidence: 0.7,
            evidence: [
              `domain:${domainModule.id} constraint considerations`,
              `trigger: both signals for "${consideration.aspect}" present in raw input`,
            ],
            status: 'pending',
          },
        });
      }
    }
  }

  // 2. Distinguish hard requirements from preferences: flag preference-routed
  // items that read like non-negotiables, via a new referencing item —
  // never mutate the original.
  for (let i = 0; i < state.requirements.length; i++) {
    const item = state.requirements[i];
    const category = state.requirementCategories[i];
    if (!item || category !== 'preferences') continue;
    if (item.source === 'constraint-specialist') continue; // never re-flag our own output
    if (!HARD_REQUIREMENT_LANGUAGE.test(item.text)) continue;

    decisions.push({
      type: 'requirement',
      category: 'nonNegotiables',
      item: {
        text: `Item extracted as a preference reads like a non-negotiable and may need reclassification: "${item.text}"`,
        kind: 'recommendation',
        source: 'constraint-specialist',
        confidence: 0.65,
        evidence: [
          `references: ${item.source}: ${item.text}`,
          'trigger: preference-routed item text contains hard-requirement language',
        ],
        status: 'pending',
      },
    });
  }

  return decisions;
};
