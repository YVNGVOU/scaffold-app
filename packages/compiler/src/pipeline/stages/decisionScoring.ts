import type { PipelineState, RequirementCategory } from '../state.js';
import type { RequirementItem } from '@lucid/schema';

/**
 * MASTER-mode round 6 ("Decision scoring" per the brief). Runs after
 * `alternativeGeneration` in the deliberation loop.
 *
 * Uses only existing schema fields (`confidence`, `evidence`, `status`,
 * `risk`) — no new RequirementItem/ArchitectureNote fields, per handoff
 * requirement 4 and the TASK-005 precedent of preferring not to extend
 * schema. Never mutates an existing item's `kind` or `risk` in place
 * (provenance is permanent, per `packages/schema`'s own doc comment on
 * `RequirementItem`) — instead it appends new `source:
 * 'decision-scoring'` summary items that carry the computed `risk` level
 * themselves, one per flagged high-risk item, so the flag has its own
 * independent provenance trail rather than silently rewriting history.
 *
 * "Highest-risk" here means: still `status: 'pending'` (never accepted or
 * rejected by a human) AND confidence below the high-risk floor. This
 * reuses critique's own low-confidence floor concept but sets a stricter
 * bar (0.55, below critique's 0.65) so decision-scoring only re-flags the
 * genuinely worst items, not everything critique already flagged — keeping
 * this stage's findings additive rather than pure noise duplication.
 *
 * Idempotent-safe within a single pipeline run: dedupes against items this
 * stage has already flagged (evidence marker `scores-item:<text>`), so
 * re-running it in a later loop round only reports genuinely new
 * high-risk items, not the same one every round.
 */
const HIGH_RISK_CONFIDENCE_FLOOR = 0.55;

export function decisionScoring(state: PipelineState): PipelineState {
  const newItems: RequirementItem[] = [];
  const newCategories: RequirementCategory[] = [];

  const alreadyScored = new Set(
    state.requirements
      .filter((item) => item.source === 'decision-scoring')
      .flatMap((item) => item.evidence)
      .filter((e) => e.startsWith('scores-item:'))
  );

  for (const item of state.requirements) {
    if (item.source === 'decision-scoring' || item.source === 'alternative-generation') continue;
    if (item.status !== 'pending') continue;
    if (item.confidence >= HIGH_RISK_CONFIDENCE_FLOOR) continue;

    const marker = `scores-item:${item.text}`;
    if (alreadyScored.has(marker)) continue;

    newItems.push({
      text: `High-risk unresolved decision flagged by scoring: "${item.text}" (confidence ${item.confidence.toFixed(2)}, source: ${item.source}, status: ${item.status})`,
      kind: 'recommendation',
      source: 'decision-scoring',
      confidence: item.confidence,
      evidence: [marker, `scored-item-source:${item.source}`, `scored-item-confidence:${item.confidence}`, `floor:${HIGH_RISK_CONFIDENCE_FLOOR}`],
      risk: 'high',
      status: 'pending',
    });
    newCategories.push('assumptions');
  }

  return {
    ...state,
    requirements: [...state.requirements, ...newItems],
    requirementCategories: [...state.requirementCategories, ...newCategories],
    stagesRun: [...state.stagesRun, 'decisionScoring'],
  };
}
