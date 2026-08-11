import type { PipelineState, RequirementCategory } from '../state.js';
import { architectSpecialist } from '../../specialists/architect/index.js';
import type { ArchitectureNote } from '@lucid/schema';
import type { RequirementItem } from '@lucid/schema';

/** Stage 5: run the one implemented specialist (ARCHITECT) and merge its decisions into state. */
export function architectSpecialistPass(state: PipelineState): PipelineState {
  const decisions = architectSpecialist(state);

  const newRequirements: RequirementItem[] = [];
  const newCategories: RequirementCategory[] = [];
  const newNotes: ArchitectureNote[] = [];

  for (const decision of decisions) {
    if (decision.type === 'requirement') {
      newRequirements.push(decision.item);
      newCategories.push(decision.category);
    } else {
      newNotes.push(decision.note);
    }
  }

  return {
    ...state,
    requirements: [...state.requirements, ...newRequirements],
    requirementCategories: [...state.requirementCategories, ...newCategories],
    architectureNotes: [...state.architectureNotes, ...newNotes],
    decisions: [...state.decisions, ...decisions],
    stagesRun: [...state.stagesRun, 'architectSpecialistPass'],
  };
}
