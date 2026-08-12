import type { PipelineState, RequirementCategory } from '../state.js';
import type { RequirementItem } from '@lucid/schema';

/**
 * MASTER-mode round 5 ("Alternative generation" per the brief). Runs after
 * `conflict` in the deliberation loop.
 *
 * For each still-`status: 'pending'` conflict finding (source:
 * 'conflict-engine') that doesn't already have a generated alternative
 * (tracked via evidence tag `addresses-conflict:<conflict-text>`, so this
 * stage is safe to re-run across loop rounds without duplicating the same
 * alternative), generates a single named alternative resolution as a new
 * `kind: 'recommendation'`, `status: 'pending'` RequirementItem. It never
 * flips the original conflict's own status — auto-resolution is explicitly
 * out of scope; a human still has to accept either the conflict-as-is or the
 * generated alternative.
 *
 * The alternative text is deliberately generic/structural rather than
 * conflict-specific hardcoded prose: it names both conflicting sides (read
 * back out of the conflict's own evidence array, which the conflict stage
 * always populates as `<source>: <text>`) and proposes the two standard
 * structural resolutions for a two-sided requirement conflict — "scope one
 * side out" or "make both configurable/conditional" — which are always
 * evidence-honest since they name the real sides from the real conflict.
 */
export function alternativeGeneration(state: PipelineState): PipelineState {
  const newItems: RequirementItem[] = [];
  const newCategories: RequirementCategory[] = [];

  const pendingConflicts = state.requirements.filter(
    (item) => item.source === 'conflict-engine' && item.status === 'pending'
  );

  const alreadyAddressed = new Set(
    state.requirements
      .filter((item) => item.source === 'alternative-generation')
      .flatMap((item) => item.evidence)
      .filter((e) => e.startsWith('addresses-conflict:'))
  );

  for (const conflictItem of pendingConflicts) {
    const marker = `addresses-conflict:${conflictItem.text}`;
    if (alreadyAddressed.has(marker)) continue;

    const sides = conflictItem.evidence.filter((e) => e.includes(': ') && !e.startsWith('trigger:'));
    const sideLabels = sides.map((s) => s.split(':')[0]).join(' vs. ') || 'the conflicting specialists';

    newItems.push({
      text:
        `Alternative resolution for conflict (${sideLabels}): either (a) scope one side out explicitly ` +
        `(pick which concern takes priority and document the tradeoff), or (b) make both sides ` +
        `conditional/configurable so they coexist without contradiction. Neither option is applied ` +
        `automatically — this conflict still requires an explicit decision.`,
      kind: 'recommendation',
      source: 'alternative-generation',
      confidence: 0.55,
      evidence: [marker, ...sides],
      status: 'pending',
    });
    newCategories.push('constraints');
  }

  return {
    ...state,
    requirements: [...state.requirements, ...newItems],
    requirementCategories: [...state.requirementCategories, ...newCategories],
    stagesRun: [...state.stagesRun, 'alternativeGeneration'],
  };
}
