import type { CompiledPrompt, RequirementItem } from '@lucid/schema';
import type { PipelineState, RequirementCategory, TaskType } from './pipeline/state.js';
import { architectSpecialistPass } from './pipeline/stages/architectSpecialistPass.js';
import { technicalSpecialistPass } from './pipeline/stages/technicalSpecialistPass.js';
import { uxSpecialistPass } from './pipeline/stages/uxSpecialistPass.js';
import { securitySpecialistPass } from './pipeline/stages/securitySpecialistPass.js';
import { creativeSpecialistPass } from './pipeline/stages/creativeSpecialistPass.js';
import { qaSpecialistPass } from './pipeline/stages/qaSpecialistPass.js';
import { constraintSpecialistPass } from './pipeline/stages/constraintSpecialistPass.js';
import { critique } from './pipeline/stages/critique.js';
import { conflict } from './pipeline/stages/conflict.js';
import { synthesis } from './pipeline/stages/synthesis.js';
import { outputValidation } from './pipeline/stages/outputValidation.js';
import { alternativeGeneration } from './pipeline/stages/alternativeGeneration.js';
import { decisionScoring } from './pipeline/stages/decisionScoring.js';

export type ResumeMode = 'architect' | 'quick' | 'master';

export interface ResumePipelineOptions {
  /** Optional callback invoked after each stage completes — additive, for UI stepper use. Mirrors RunPipelineOptions. */
  onStage?: (stageName: string, index: number, state: PipelineState) => void;
  /** MASTER mode only — hard cap on deliberation-loop rounds. Default 2, same as runMasterPipeline. */
  maxRounds?: number;
}

const CATEGORY_KEYS: RequirementCategory[] = [
  'userRequirements',
  'nonNegotiables',
  'preferences',
  'constraints',
  'assumptions',
  'functionalRequirements',
];

const KNOWN_TASK_TYPES: TaskType[] = ['build', 'research', 'write', 'design', 'fix'];

/**
 * TASK-083: an unresolved item counts as "answered" when some item already
 * in `userRequirements` was produced by `mergeAnswer` (`source:
 * 'user-answered-question'`) and its `evidence` references this unresolved
 * item's exact text — i.e. `mergeAnswer` recorded `evidence: [unresolvedItem.text]`
 * when the answer was merged. This is intentionally the EXACT same check as
 * `isAnswered()` in `apps/desktop/src/components/DecisionsPanel.tsx` (not a
 * re-derived heuristic) so the UI's "answered" classification and the
 * recompile's "exclude from ambiguities" behavior never disagree.
 */
function isAnswered(item: RequirementItem, userRequirements: RequirementItem[]): boolean {
  return userRequirements.some(
    (r) => r.source === 'user-answered-question' && r.evidence.includes(item.text)
  );
}

/** Recovers the TaskType synthesis previously encoded into `compiled.objective` (`"${taskType} task in domain "${domain}""`). */
function reconstructTaskType(objective: string | undefined): TaskType {
  if (!objective) return 'unknown';
  const match = /^(\w+) task in domain/.exec(objective);
  if (!match) return 'unknown';
  const candidate = match[1] as TaskType;
  return KNOWN_TASK_TYPES.includes(candidate) ? candidate : 'unknown';
}

/**
 * TASK-031: reconstructs a `PipelineState` from an EXISTING `CompiledPrompt`
 * (the output of a prior compile, possibly with some previously-unresolved
 * items now answered via `mergeAnswer`) WITHOUT re-running
 * `intentAnalysis`/`domainDetection`/`requirementExtraction`/
 * `ambiguityDetection` — those already ran once against the original raw
 * input; re-running them against a synthetic augmented-text string was
 * TASK-030's bug (it silently discarded/misclassified the prior compile's
 * answered items).
 *
 * - `requirements`/`requirementCategories`: every category array in
 *   `compiled` is flattened back into one parallel pair, EXCEPT items whose
 *   `kind` is still `'unresolved'` — those are routed into `ambiguities`
 *   instead (mirroring `ambiguityDetection`'s original output shape, which
 *   `synthesis`/`critique` both expect ambiguities to live in, not
 *   `requirements`). Already-answered items are `kind: 'user'` at this point
 *   (set by `mergeAnswer`), so they naturally flow into `requirements` and
 *   are preserved — never dropped.
 * - TASK-083: an unresolved item is further excluded from `ambiguities`
 *   entirely (not carried forward at all) when a matching answer already
 *   exists in `compiled.userRequirements` — matched with the exact same
 *   `isAnswered()` check `DecisionsPanel.tsx` uses (a `user-answered-question`
 *   item whose `evidence` includes the unresolved item's text). Without this,
 *   an answered item stayed in `ambiguities`/`compiled.assumptions` forever
 *   on every subsequent recompile, growing without bound. The ORIGINAL
 *   unresolved item is never mutated in `compiled` itself — this only
 *   affects what the resume path carries forward into the NEW state.
 * - `domain`/`architectureNotes`: reused directly from `compiled.domain` /
 *   `compiled.architecture ?? []` — never re-derived.
 * - `taskType`: recovered from `compiled.objective` if `synthesis` encoded
 *   one previously, defaulting to `'unknown'` otherwise (harmless — nothing
 *   downstream of this resume path other than `synthesis`'s own objective
 *   string reads `taskType`).
 */
export function reconstructStateFromCompiled(compiled: CompiledPrompt, rawInput: string): PipelineState {
  const requirements: RequirementItem[] = [];
  const requirementCategories: RequirementCategory[] = [];
  const ambiguities: RequirementItem[] = [];

  const userRequirements = compiled.userRequirements ?? [];

  for (const category of CATEGORY_KEYS) {
    const items = compiled[category] ?? [];
    for (const item of items) {
      if (item.kind === 'unresolved') {
        // TASK-083: an unresolved item with a matching answer already in
        // userRequirements is superseded by that answer — exclude it from
        // the reconstructed ambiguities pool going forward. The original
        // item itself is never mutated (still sits untouched in
        // `compiled.assumptions`/etc, per the append-only provenance
        // discipline); this only affects what the RESUME path carries
        // forward into the new state's `ambiguities` array.
        if (!isAnswered(item, userRequirements)) {
          ambiguities.push(item);
        }
      } else {
        requirements.push(item);
        requirementCategories.push(category);
      }
    }
  }

  return {
    rawInput,
    taskType: reconstructTaskType(compiled.objective),
    domain: compiled.domain,
    domainConfidence: 1,
    domainScores: {},
    requirements,
    requirementCategories,
    architectureNotes: compiled.architecture ? [...compiled.architecture] : [],
    ambiguities,
    decisions: [],
    compiled,
    stagesRun: [],
  };
}

const SPECIALIST_STAGES: Array<{ name: string; run: (s: PipelineState) => PipelineState }> = [
  { name: 'architectSpecialistPass', run: architectSpecialistPass },
  { name: 'technicalSpecialistPass', run: technicalSpecialistPass },
  { name: 'uxSpecialistPass', run: uxSpecialistPass },
  { name: 'securitySpecialistPass', run: securitySpecialistPass },
  { name: 'creativeSpecialistPass', run: creativeSpecialistPass },
  { name: 'qaSpecialistPass', run: qaSpecialistPass },
  { name: 'constraintSpecialistPass', run: constraintSpecialistPass },
];

function findingIdentity(item: { source: string; text: string }): string {
  return `${item.source}::${item.text}`;
}

const DEFAULT_MASTER_MAX_ROUNDS = 2;

/**
 * TASK-031: the correct "Confirm & Recompile" implementation. Resumes from
 * an existing `CompiledPrompt` (reconstructing the fuller pipeline state via
 * `reconstructStateFromCompiled`, which reuses the prior domain/architecture
 * notes/answered items rather than re-deriving them) and then genuinely
 * re-runs the specialists + critique/conflict (or MASTER's full
 * deliberation loop) + synthesis + outputValidation fresh, so they can react
 * to the now-more-complete requirements pool (including the user's answers)
 * — this is the whole point of a recompile. Never throws. Never makes an AI
 * API call (pure, deterministic, same as every other pipeline entry point).
 *
 * Deliberately does NOT re-run `intentAnalysis`/`domainDetection`/
 * `requirementExtraction`/`ambiguityDetection` — see
 * `reconstructStateFromCompiled`'s doc comment for why.
 */
/**
 * TASK-083 investigation note (requirement 3): specialists/critique/conflict
 * were empirically tested against a generic free-text answer ("Whatever
 * seems reasonable, no strong preference either way.") vs. a keyword-loaded
 * one ("Must support offline mode and must comply with GDPR, needs OAuth2
 * authentication.") merged via `mergeAnswer` into the same base compile. The
 * resulting specialist-sourced output sets were byte-for-byte IDENTICAL
 * between the two runs, and zero items in either run had `evidence`
 * referencing the answer text at all. Root cause: `mergeAnswer` always
 * places answers in `userRequirements`, and every specialist/critique rule
 * in this codebase scans fixed domain checklists or specific OTHER
 * categories (e.g. constraint-specialist's hard-requirement-language rule
 * only scans `preferences`) — none scan `userRequirements` content. So an
 * answer's actual text is currently inert to every downstream stage; only
 * its presence (satisfying `isAnswered()`/removing the stale ambiguity, per
 * the fix above) has any effect on recompiled output. Reclassifying answers
 * into content-scanned categories or adding text-scanning rules would be a
 * genuine specialist/NLP redesign — explicitly out of scope for this
 * bug-fix task (see TASK-083's "Explicitly out of scope" section). This is a
 * real, known, deterministic-system limitation: recompiling after a generic
 * free-text answer will look the same as before in the specialist findings,
 * even though the answer itself is preserved and its stale unresolved entry
 * is now correctly cleared.
 */
export function resumeAndRecompile(
  compiled: CompiledPrompt,
  rawInput: string,
  mode: ResumeMode,
  options?: ResumePipelineOptions
): PipelineState {
  let state = reconstructStateFromCompiled(compiled, rawInput);
  let stageIndex = 0;

  const runStage = (stage: (s: PipelineState) => PipelineState, name: string) => {
    state = stage(state);
    options?.onStage?.(name, stageIndex, state);
    stageIndex++;
  };

  if (mode === 'quick') {
    // QUICK mode never runs specialists/critique/conflict even on a fresh
    // compile (see runQuickPipeline's doc comment) — the resume path mirrors
    // that: just re-synthesize + re-validate over the fuller requirements
    // pool.
    runStage(synthesis, 'synthesis');
    runStage(outputValidation, 'outputValidation');
    return state;
  }

  for (const { name, run } of SPECIALIST_STAGES) {
    runStage(run, name);
  }

  if (mode === 'master') {
    const maxRounds = options?.maxRounds ?? DEFAULT_MASTER_MAX_ROUNDS;
    const seenFindingIdentities = new Set<string>(state.requirements.map(findingIdentity));

    for (let round = 1; round <= maxRounds; round++) {
      const suffix = round === 1 ? '' : ` (round ${round})`;
      runStage(critique, `critique${suffix}`);
      runStage(conflict, `conflict${suffix}`);
      runStage(alternativeGeneration, `alternativeGeneration${suffix}`);
      runStage(decisionScoring, `decisionScoring${suffix}`);

      let foundNew = false;
      for (const item of state.requirements) {
        const id = findingIdentity(item);
        if (!seenFindingIdentities.has(id)) {
          seenFindingIdentities.add(id);
          foundNew = true;
        }
      }

      if (!foundNew) break;
    }
  } else {
    // architect
    runStage(critique, 'critique');
    runStage(conflict, 'conflict');
  }

  runStage(synthesis, 'synthesis');
  runStage(outputValidation, 'outputValidation');

  return state;
}
