import type { PipelineState } from '../state.js';
import { DOMAIN_MODULES, DOMAIN_CONFIDENCE_FLOOR } from '../../domains/index.js';

/** Stage 2: run every domain module's scoring function, pick the highest scorer above the floor. */
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
