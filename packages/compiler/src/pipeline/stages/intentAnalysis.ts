import type { PipelineState, TaskType } from '../state.js';
import { parseSentences, getMainVerbPhrase } from '../../nlp/index.js';

const PATTERNS: Array<{ type: TaskType; regex: RegExp }> = [
  { type: 'build', regex: /\b(build|create|make|develop|design a|construct)\b/i },
  { type: 'fix', regex: /\b(fix|debug|repair|resolve|patch)\b/i },
  { type: 'write', regex: /\b(write|draft|compose)\b/i },
  { type: 'research', regex: /\b(research|investigate|analyze|find out)\b/i },
  { type: 'design', regex: /\b(design|redesign|mockup|wireframe)\b/i },
];

/**
 * Maps a verb's infinitive/root form (as identified by the nlp layer) to a
 * TaskType. This is grammar-driven: it fires on any inflection of the verb
 * ("constructing", "built", "constructs") because getMainVerbPhrase resolves
 * to the infinitive first — unlike the PATTERNS keyword regexes below, which
 * only match the literal listed word forms.
 */
const VERB_TASKTYPE_MAP: Record<string, TaskType> = {
  build: 'build', create: 'build', make: 'build', develop: 'build', construct: 'build',
  fix: 'fix', debug: 'fix', repair: 'fix', resolve: 'fix', patch: 'fix',
  write: 'write', draft: 'write', compose: 'write',
  research: 'research', investigate: 'research', analyze: 'research',
  design: 'design', redesign: 'design',
};

/**
 * Stage 1: classify raw input into a coarse task type.
 * Primary signal: grammar-aware main-verb extraction (nlp layer). Falls back
 * to keyword/pattern matching if the parser yields nothing usable or the
 * verb isn't recognized — never throws, never regresses below the old
 * keyword-only behavior.
 */
export function intentAnalysis(state: PipelineState): PipelineState {
  let taskType: TaskType = 'unknown';

  try {
    const sentences = parseSentences(state.rawInput);
    const firstSentence = sentences[0] ?? state.rawInput;
    const verbPhrase = getMainVerbPhrase(firstSentence);
    if (verbPhrase && VERB_TASKTYPE_MAP[verbPhrase.verb]) {
      taskType = VERB_TASKTYPE_MAP[verbPhrase.verb];
    }
  } catch {
    // fall through to keyword fallback below
  }

  if (taskType === 'unknown') {
    for (const { type, regex } of PATTERNS) {
      if (regex.test(state.rawInput)) {
        taskType = type;
        break;
      }
    }
  }

  return { ...state, taskType, stagesRun: [...state.stagesRun, 'intentAnalysis'] };
}
