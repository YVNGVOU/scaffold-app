import { BUCKET_LABELS, BUCKET_ORDER, stageToBucket, type BucketKey } from './stageBuckets';

interface MultiPassViewProps {
  stageNames: readonly string[];
  activeIndex: number; // -1 = idle, >= stageNames.length = done
  running: boolean;
  hasCompiled: boolean;
  selectedBucket: BucketKey | null;
  onSelectBucket: (b: BucketKey) => void;
}

/** The spec's INPUT → ANALYSIS → DECOMPOSITION → SPECIALIST PASSES →
 * CONFLICT CHECK → STRUCTURAL REBUILD → QUALITY CONTROL → FINAL PROMPT
 * diagram, rendered from the pipeline's REAL executed stage list — a bucket
 * lights up exactly when at least one of its real stages has run. Clicking
 * a bucket that has real stages selects it for inspection below. */
export function MultiPassView({ stageNames, activeIndex, running, hasCompiled, selectedBucket, onSelectBucket }: MultiPassViewProps) {
  const doneCount = running ? activeIndex : hasCompiled ? stageNames.length : -1;

  const bucketStageIndices = Object.fromEntries(BUCKET_ORDER.map((b) => [b, [] as number[]])) as Record<BucketKey, number[]>;
  stageNames.forEach((name, i) => {
    bucketStageIndices[stageToBucket(name)].push(i);
  });

  function bucketStatus(bucket: BucketKey): 'idle' | 'active' | 'done' {
    if (bucket === 'input') return doneCount >= 0 ? 'done' : 'idle';
    if (bucket === 'finalPrompt') return !running && hasCompiled ? 'done' : 'idle';
    const indices = bucketStageIndices[bucket];
    if (indices.length === 0) return 'idle';
    if (indices.some((i) => i === activeIndex) && running) return 'active';
    if (indices.every((i) => i < doneCount)) return 'done';
    return 'idle';
  }

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 4, padding: 'var(--sv-space-3) var(--sv-space-4)', flexWrap: 'wrap' }}>
      {BUCKET_ORDER.map((bucket, i) => {
        const status = bucketStatus(bucket);
        const clickable = bucket !== 'input' && bucket !== 'finalPrompt' && bucketStageIndices[bucket].length > 0;
        const isSelected = selectedBucket === bucket;
        let color = 'var(--sv-hairline-strong)';
        if (status === 'done') color = 'var(--sv-ink)';
        if (status === 'active') color = 'var(--sv-burgundy)';

        return (
          <div key={bucket} style={{ display: 'flex', alignItems: 'center', flex: '1 0 auto' }}>
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onSelectBucket(bucket)}
              title={clickable ? `Inspect ${BUCKET_LABELS[bucket]}` : undefined}
              style={{
                fontSize: 10,
                letterSpacing: '0.03em',
                textTransform: 'uppercase',
                padding: 'var(--sv-space-2) var(--sv-space-3)',
                border: `1px solid ${color}`,
                background: isSelected ? 'var(--sv-ivory-dim)' : 'transparent',
                color,
                cursor: clickable ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
              }}
            >
              {BUCKET_LABELS[bucket]}
            </button>
            {i < BUCKET_ORDER.length - 1 && <div style={{ width: 12, height: 1, background: 'var(--sv-hairline)' }} />}
          </div>
        );
      })}
    </div>
  );
}
