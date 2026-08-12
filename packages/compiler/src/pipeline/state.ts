import type { CompiledPrompt, DomainId, RequirementItem, ArchitectureNote } from '@lucid/schema';
import { createEmptyCompiledPrompt } from '@lucid/schema';

export type TaskType = 'build' | 'research' | 'write' | 'design' | 'fix' | 'unknown';

export type RequirementCategory =
  | 'userRequirements'
  | 'nonNegotiables'
  | 'preferences'
  | 'constraints'
  | 'assumptions'
  | 'functionalRequirements';

/** A specialist's decision output before it is merged into the CompiledPrompt by synthesis. */
export type Decision =
  | { type: 'requirement'; category: 'nonNegotiables' | 'preferences' | 'constraints' | 'assumptions' | 'functionalRequirements' | 'userRequirements'; item: RequirementItem }
  | { type: 'architectureNote'; note: ArchitectureNote };

/**
 * State threaded through every pipeline stage. Stages return a new state object
 * (or the same reference for no-op passthroughs) — never mutate fields of the
 * incoming state's arrays in place across stage boundaries.
 */
export interface PipelineState {
  rawInput: string;
  taskType: TaskType;
  domain: DomainId | 'unknown';
  domainConfidence: number;
  domainScores: Record<string, number>;
  /**
   * TASK-078: when set, `domainDetection` skips its own best-scorer pick and
   * uses this domain directly instead — the user manually overriding a
   * wrong auto-detected domain instead of rephrasing the prompt to nudge the
   * scorer. `domainScores` is still populated from every module's real score
   * against `rawInput` (what detection WOULD have picked) so the existing
   * domain-reasoning tooltip (TASK-074) stays meaningful even when overridden.
   * Not user-facing state that mutates during a run — set once at pipeline
   * start via `createInitialState`/`RunPipelineOptions.forceDomain` and left
   * untouched by every other stage.
   */
  forceDomain?: DomainId;
  /** Requirements collected so far (from extraction + specialists). Append-only. */
  requirements: RequirementItem[];
  /**
   * Parallel-indexed target section for each entry in `requirements`
   * (same length/order as `requirements`), consumed by synthesis to route
   * each RequirementItem into the correct CompiledPrompt section.
   */
  requirementCategories: RequirementCategory[];
  /** Architecture notes collected so far. Append-only. */
  architectureNotes: ArchitectureNote[];
  /** Ambiguity flags surfaced (unresolved required fields). */
  ambiguities: RequirementItem[];
  /** Accumulated specialist decisions, in the order specialists ran. */
  decisions: Decision[];
  /** The in-progress / final compiled prompt, populated by synthesis. */
  compiled: CompiledPrompt;
  /** Names of stages that have run, in order — useful for the UI pipeline stepper and tests. */
  stagesRun: string[];
}

export function createInitialState(rawInput: string, forceDomain?: DomainId): PipelineState {
  return {
    rawInput,
    taskType: 'unknown',
    domain: 'unknown',
    domainConfidence: 0,
    domainScores: {},
    forceDomain,
    requirements: [],
    requirementCategories: [],
    architectureNotes: [],
    ambiguities: [],
    decisions: [],
    compiled: createEmptyCompiledPrompt('unknown'),
    stagesRun: [],
  };
}
