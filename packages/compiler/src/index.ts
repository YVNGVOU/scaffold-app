import type { CompiledPrompt } from '@lucid/schema';
import { runArchitectPipeline, runQuickPipeline, runMasterPipeline, type RunMasterPipelineOptions, type RunPipelineOptions } from './pipeline/index.js';

export { mergeAnswer } from './mergeAnswer.js';
// TASK-031: `buildAugmentedInput` (TASK-030) was removed — its only caller,
// `App.tsx`'s `handleConfirmRecompile`, was the buggy augmented-text-into-a-
// fresh-pipeline-run path this task replaces with `resumeAndRecompile`.
export { resumeAndRecompile, reconstructStateFromCompiled } from './resumeAndRecompile.js';
export type { ResumeMode, ResumePipelineOptions } from './resumeAndRecompile.js';
export { formatAsMarkdown } from './formatAsMarkdown.js';
export type { PromptProfile } from './formatAsMarkdown.js';
export { formatDiff } from './formatDiff.js';
export { splitBatchLines } from './batchCompile.js';
export { getExportWarnings, EXPORT_LOW_CONFIDENCE_THRESHOLD } from './exportWarnings.js';
export type { ExportWarnings } from './exportWarnings.js';
export type {
  CompiledPromptDiff,
  CategoryDiff,
  ScalarFieldChange,
  ArchitectureNoteChange,
  RequirementCategoryKey,
  ScalarFieldKey,
} from './formatDiff.js';

/** Public entry point: compiles raw user input into a CompiledPrompt via ARCHITECT mode. */
export function compileArchitect(rawInput: string, opts?: RunPipelineOptions): CompiledPrompt {
  const state = runArchitectPipeline(rawInput, opts);
  return state.compiled;
}

/** Public entry point: compiles raw user input into a CompiledPrompt via QUICK mode (TASK-008). */
export function compileQuick(rawInput: string, opts?: RunPipelineOptions): CompiledPrompt {
  const state = runQuickPipeline(rawInput, opts);
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
