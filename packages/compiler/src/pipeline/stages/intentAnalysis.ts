import type { PipelineState, TaskType } from '../state.js';

const PATTERNS: Array<{ type: TaskType; regex: RegExp }> = [
  { type: 'build', regex: /\b(build|create|make|develop|design a|construct)\b/i },
  { type: 'fix', regex: /\b(fix|debug|repair|resolve|patch)\b/i },
  { type: 'write', regex: /\b(write|draft|compose)\b/i },
  { type: 'research', regex: /\b(research|investigate|analyze|find out)\b/i },
  { type: 'design', regex: /\b(design|redesign|mockup|wireframe)\b/i },
];

/** Stage 1: classify raw input into a coarse task type via keyword/pattern matching. */
export function intentAnalysis(state: PipelineState): PipelineState {
  let taskType: TaskType = 'unknown';
  for (const { type, regex } of PATTERNS) {
    if (regex.test(state.rawInput)) {
      taskType = type;
      break;
    }
  }
  return { ...state, taskType, stagesRun: [...state.stagesRun, 'intentAnalysis'] };
}
