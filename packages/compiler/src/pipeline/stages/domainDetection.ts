import type { PipelineState } from '../state.js';
import { DOMAIN_MODULES, DOMAIN_CONFIDENCE_FLOOR } from '../../domains/index.js';

/**
 * Stage 2: run every domain module's scoring function, pick the highest
 * scorer above the floor.
 *
 * TASK-078: if `state.forceDomain` is set, every module's real score against
 * `rawInput` is still computed and recorded in `domainScores` (so the
 * domain-reasoning tooltip stays meaningful — it shows what detection WOULD
 * have picked), but the winning `domain` is the forced one directly, not
 * whatever scored highest. `domainConfidence` uses the forced domain's own
 * share of the total score (same formula as the auto-detect path), which
 * naturally comes out low/zero when the forced domain wasn't a strong match
 * for the input — an honest signal, not a fabricated 100%.
 */
export function domainDetection(state: PipelineState): PipelineState {
  const domainScores: Record<string, number> = {};
  let best: { id: string; score: number } | null = null;

  for (const mod of DOMAIN_MODULES) {
    const score = mod.score(state.rawInput);
    domainScores[mod.id] = score;
    if (!best || score > best.score) {
      best = { id: mod.id, score };
    }
  }

  if (state.forceDomain) {
    const totalScore = Object.values(domainScores).reduce((a, b) => a + b, 0);
    const forcedScore = domainScores[state.forceDomain] ?? 0;
    const confidence = totalScore > 0 ? forcedScore / totalScore : 0;

    return {
      ...state,
      domain: state.forceDomain,
      domainConfidence: confidence,
      domainScores,
      stagesRun: [...state.stagesRun, 'domainDetection'],
    };
  }

  if (!best || best.score < DOMAIN_CONFIDENCE_FLOOR) {
    return {
      ...state,
      domain: 'unknown',
      domainConfidence: 0,
      domainScores,
      stagesRun: [...state.stagesRun, 'domainDetection'],
    };
  }

  const totalScore = Object.values(domainScores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? best.score / totalScore : 0;

  return {
    ...state,
    domain: best.id as PipelineState['domain'],
    domainConfidence: confidence,
    domainScores,
    stagesRun: [...state.stagesRun, 'domainDetection'],
  };
}
