import type { CompiledPrompt } from '@lucid/schema';
import { runArchitectPipeline, runQuickPipeline, runMasterPipeline, type RunMasterPipelineOptions } from './pipeline/index.js';

export { mergeAnswer } from './mergeAnswer.js';
export { formatAsMarkdown } from './formatAsMarkdown.js';
export { formatDiff } from './formatDiff.js';
export type {
  CompiledPromptDiff,
  CategoryDiff,
  ScalarFieldChange,
  ArchitectureNoteChange,
  RequirementCategoryKey,
  ScalarFieldKey,
} from './formatDiff.js';

/** Public entry point: compiles raw user input into a CompiledPrompt via ARCHITECT mode. */
export function compileArchitect(rawInput: string): CompiledPrompt {
  const state = runArchitectPipeline(rawInput);
  return state.compiled;
}

/** Public entry point: compiles raw user input into a CompiledPrompt via QUICK mode (TASK-008). */
export function compileQuick(rawInput: string): CompiledPrompt {
  const state = runQuickPipeline(rawInput);
  return state.compiled;
}

/** Public entry point: compiles raw user input into a CompiledPrompt via MASTER mode (TASK-009). */
export function compileMaster(rawInput: string, opts?: RunMasterPipelineOptions): CompiledPrompt {
  const state = runMasterPipeline(rawInput, opts);
  return state.compiled;
}

export {
  runArchitectPipeline,
  ARCHITECT_MODE_PIPELINE,
  ARCHITECT_MODE_STAGE_NAMES,
  runQuickPipeline,
  QUICK_MODE_PIPELINE,
  QUICK_MODE_STAGE_NAMES,
  runMasterPipeline,
} from './pipeline/index.js';
export type { PipelineState, TaskType, Decision, RequirementCategory, RunPipelineOptions, RunMasterPipelineOptions } from './pipeline/index.js';
export { DOMAIN_MODULES, DOMAIN_CONFIDENCE_FLOOR, webDomain, gameDomain, brandingDomain } from './domains/index.js';
export type { DomainModule } from './domains/index.js';
export { SPECIALIST_REGISTRY } from './specialists/_stubs/index.js';
export type { Specialist } from './specialists/types.js';
