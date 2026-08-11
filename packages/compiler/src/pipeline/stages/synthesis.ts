import type { PipelineState } from '../state.js';
import { createEmptyCompiledPrompt } from '@lucid/schema';

/**
 * Stage 8: merge all collected requirements + architecture notes + ambiguities
 * into the final CompiledPrompt, ordering sections per the canonical schema,
 * omitting empty sections (arrays are kept as [] but optional string sections
 * are left undefined rather than empty-stringed).
 */
export function synthesis(state: PipelineState): PipelineState {
  const compiled = createEmptyCompiledPrompt(state.domain);

  for (let i = 0; i < state.requirements.length; i++) {
    const item = state.requirements[i];
    const category = state.requirementCategories[i];
    if (!item || !category) continue;
    compiled[category].push(item);
  }

  // Unresolved ambiguities are surfaced as their own assumptions-adjacent
  // section entry: they are RequirementItems with kind 'unresolved', routed
  // into functionalRequirements is wrong — they belong wherever the UI's
  // right-hand panel reads from. Per spec, "surfaced in the UI's right-hand
  // panel" — assumptions section is the closest existing canonical bucket
  // for kind !== 'user' inspectable items, so unresolved ambiguities are
  // appended there, preserving their kind: 'unresolved' tag (never silently
  // defaulted or reclassified).
  for (const amb of state.ambiguities) {
    compiled.assumptions.push(amb);
  }

  if (state.architectureNotes.length > 0) {
    compiled.architecture = [...state.architectureNotes];
  }

  if (state.taskType !== 'unknown') {
    compiled.objective = `${state.taskType} task in domain "${state.domain}"`;
  }

  return { ...state, compiled, stagesRun: [...state.stagesRun, 'synthesis'] };
}
