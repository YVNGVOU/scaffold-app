/** Groups the compiler's real, fine-grained pipeline stage names (from
 * @lucid/compiler's ARCHITECT_MODE_STAGE_NAMES / QUICK_MODE_STAGE_NAMES /
 * MASTER's dynamic stagesRun / resumeAndRecompile's stage sequence) into the
 * 8 conceptual passes from the full UI/UX spec's multi-pass compiler
 * diagram: ANALYSIS → DECOMPOSITION → SPECIALIST PASSES → CONFLICT CHECK →
 * STRUCTURAL REBUILD → QUALITY CONTROL. INPUT and FINAL PROMPT are not real
 * stages — INPUT is the raw text before stage 0, FINAL PROMPT is the
 * finished CompiledPrompt after the last stage. This mapping is purely a
 * presentation grouping; it doesn't change what the compiler runs. */
export type BucketKey =
  | 'input'
  | 'analysis'
  | 'decomposition'
  | 'specialistPasses'
  | 'conflictCheck'
  | 'structuralRebuild'
  | 'qualityControl'
  | 'finalPrompt';

export const BUCKET_LABELS: Record<BucketKey, string> = {
  input: 'Input',
  analysis: 'Analysis',
  decomposition: 'Decomposition',
  specialistPasses: 'Specialist Passes',
  conflictCheck: 'Conflict Check',
  structuralRebuild: 'Structural Rebuild',
  qualityControl: 'Quality Control',
  finalPrompt: 'Final Prompt',
};

export const BUCKET_ORDER: BucketKey[] = [
  'input',
  'analysis',
  'decomposition',
  'specialistPasses',
  'conflictCheck',
  'structuralRebuild',
  'qualityControl',
  'finalPrompt',
];

/** Strips MASTER mode's " (round N)" suffix before matching, so e.g.
 * "critique (round 2)" still buckets as conflictCheck. */
function baseStageName(stageName: string): string {
  return stageName.replace(/ \(round \d+\)$/, '');
}

const SPECIALIST_STAGES = new Set([
  'architectSpecialistPass',
  'technicalSpecialistPass',
  'uxSpecialistPass',
  'securitySpecialistPass',
  'creativeSpecialistPass',
  'qaSpecialistPass',
  'constraintSpecialistPass',
]);

const CONFLICT_STAGES = new Set(['critique', 'conflict', 'alternativeGeneration', 'decisionScoring']);

export function stageToBucket(stageName: string): BucketKey {
  const base = baseStageName(stageName);
  if (base === 'intentAnalysis' || base === 'domainDetection') return 'analysis';
  if (base === 'requirementExtraction' || base === 'requirementExpansion' || base === 'ambiguityDetection') return 'decomposition';
  if (SPECIALIST_STAGES.has(base)) return 'specialistPasses';
  if (CONFLICT_STAGES.has(base)) return 'conflictCheck';
  if (base === 'synthesis') return 'structuralRebuild';
  if (base === 'outputValidation') return 'qualityControl';
  // Unknown/future stage names default to decomposition rather than
  // silently vanishing from every bucket.
  return 'decomposition';
}
