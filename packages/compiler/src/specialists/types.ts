import type { PipelineState, Decision } from '../pipeline/state.js';

/**
 * Shared interface for all 7 specialist engines. Each is a deterministic,
 * rule-based reviewer — never an LLM/AI-API call. Phase 1 implements only
 * ARCHITECT; the other six register here later without changing the
 * pipeline runner or synthesis stage.
 */
export type Specialist = (state: PipelineState) => Decision[];
