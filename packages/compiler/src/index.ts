import type { CompiledPrompt } from '@lucid/schema';
import { runArchitectPipeline } from './pipeline/index.js';

/** Public entry point: compiles raw user input into a CompiledPrompt via ARCHITECT mode. */
export function compileArchitect(rawInput: string): CompiledPrompt {
  const state = runArchitectPipeline(rawInput);
  return state.compiled;
}

export { runArchitectPipeline, ARCHITECT_MODE_PIPELINE, ARCHITECT_MODE_STAGE_NAMES } from './pipeline/index.js';
export type { PipelineState, TaskType, Decision, RequirementCategory } from './pipeline/index.js';
export { DOMAIN_MODULES, DOMAIN_CONFIDENCE_FLOOR, webDomain, gameDomain, brandingDomain } from './domains/index.js';
export type { DomainModule } from './domains/index.js';
export { SPECIALIST_REGISTRY } from './specialists/_stubs/index.js';
export type { Specialist } from './specialists/types.js';
