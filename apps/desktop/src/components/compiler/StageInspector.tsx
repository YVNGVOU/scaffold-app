import type { PipelineState } from '@lucid/compiler';
import { BUCKET_LABELS, stageToBucket, type BucketKey } from './stageBuckets';

interface StageInspectorProps {
  bucket: BucketKey;
  stageNames: readonly string[];
  snapshots: (PipelineState | null)[];
  onClose: () => void;
}

/** Shows what a real pipeline stage actually did — items/notes/ambiguities
 * added since the previous stage's snapshot — for every real stage that
 * falls in the selected bucket. `snapshots[i]` is the PipelineState
 * immediately after stage `i` ran (captured via the pipeline's own onStage
 * callback, not synthesized). */
export function StageInspector({ bucket, stageNames, snapshots, onClose }: StageInspectorProps) {
  const indices = stageNames.map((name, i) => ({ name, i })).filter(({ name }) => stageToBucket(name) === bucket);

  return (
    <div style={{ borderTop: '1px solid var(--sv-hairline)', padding: 'var(--sv-space-3) var(--sv-space-4)', maxHeight: 220, overflowY: 'auto' }} className="sv-scrollpane">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sv-space-2)' }}>
        <div className="sv-label">{BUCKET_LABELS[bucket]} — what ran</div>
        <button type="button" onClick={onClose} style={{ fontSize: 10 }}>
          Close
        </button>
      </div>
      {indices.length === 0 && <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>No stage from this pass has run yet.</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sv-space-2)' }}>
        {indices.map(({ name, i }) => {
          const after = snapshots[i];
          const before = i > 0 ? snapshots[i - 1] : null;
          if (!after) {
            return (
              <div key={name} style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>
                {name} — not run yet
              </div>
            );
          }
          const reqBefore = before?.requirements.length ?? 0;
          const notesBefore = before?.architectureNotes.length ?? 0;
          const ambigBefore = before?.ambiguities.length ?? 0;
          const newReqs = after.requirements.slice(reqBefore);
          const newNotes = after.architectureNotes.slice(notesBefore);
          const newAmbig = after.ambiguities.length - ambigBefore;

          return (
            <div key={name} style={{ border: '1px solid var(--sv-hairline)', padding: 'var(--sv-space-2)' }}>
              <div style={{ fontFamily: 'var(--sv-font-mono)', fontSize: 11, marginBottom: 4 }}>{name}</div>
              <div style={{ fontSize: 10, color: 'var(--sv-ink-soft)', marginBottom: newReqs.length + newNotes.length > 0 ? 4 : 0 }}>
                +{newReqs.length} requirement{newReqs.length === 1 ? '' : 's'} · +{newNotes.length} architecture note{newNotes.length === 1 ? '' : 's'}
                {newAmbig !== 0 ? ` · ${newAmbig > 0 ? '+' : ''}${newAmbig} ambiguit${Math.abs(newAmbig) === 1 ? 'y' : 'ies'}` : ''}
              </div>
              {newReqs.slice(0, 4).map((r, j) => (
                <div key={j} style={{ fontSize: 10, color: 'var(--sv-ink-soft)' }}>
                  · [{r.kind}] {r.text.slice(0, 90)}
                </div>
              ))}
              {newNotes.slice(0, 3).map((n, j) => (
                <div key={j} style={{ fontSize: 10, color: 'var(--sv-ink-soft)' }}>
                  · {n.component}: {n.note.slice(0, 80)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
