import { useEffect, useState } from 'react';
import type { CompiledPrompt } from '@lucid/schema';
import { formatDiff, type CompiledPromptDiff, type RequirementCategoryKey } from '@lucid/compiler';
import { listCompiles, type Compile } from '../lib/api';

interface Props {
  promptId: string;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<RequirementCategoryKey, string> = {
  userRequirements: 'User Requirements',
  nonNegotiables: 'Non-Negotiables',
  preferences: 'Preferences',
  constraints: 'Constraints',
  assumptions: 'Assumptions',
  functionalRequirements: 'Functional Requirements',
};

function VersionLabel({ c }: { c: Compile }) {
  return (
    <>
      {c.mode.toUpperCase()} — {new Date(c.created_at).toLocaleString()}
    </>
  );
}

function DiffView({ diff }: { diff: CompiledPromptDiff }) {
  const categoryKeys = Object.keys(CATEGORY_LABELS) as RequirementCategoryKey[];
  const hasAnyChange =
    categoryKeys.some((k) => diff.categories[k].added.length > 0 || diff.categories[k].removed.length > 0) ||
    diff.fieldChanges.length > 0 ||
    diff.architecture.added.length > 0 ||
    diff.architecture.removed.length > 0 ||
    diff.architecture.changed.length > 0;

  if (!hasAnyChange) {
    return <div style={{ color: 'var(--sv-ink-soft)', fontSize: 12 }}>No differences between these two versions.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sv-space-4)' }}>
      {diff.fieldChanges.length > 0 && (
        <div>
          <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
            Changed Fields
          </div>
          {diff.fieldChanges.map((fc) => (
            <div key={fc.field} style={{ fontSize: 12, marginBottom: 6 }}>
              <div style={{ color: 'var(--sv-ink-soft)', textTransform: 'capitalize' }}>{fc.field}</div>
              <div style={{ color: 'var(--sv-burgundy)' }}>− {fc.from ?? '(none)'}</div>
              <div style={{ color: 'var(--sv-ink)' }}>+ {fc.to ?? '(none)'}</div>
            </div>
          ))}
        </div>
      )}

      {categoryKeys.map((key) => {
        const { added, removed } = diff.categories[key];
        if (added.length === 0 && removed.length === 0) return null;
        return (
          <div key={key}>
            <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
              {CATEGORY_LABELS[key]}
            </div>
            {removed.map((item, i) => (
              <div key={`r-${i}`} style={{ fontSize: 12, color: 'var(--sv-burgundy)' }}>
                − {item.text}
              </div>
            ))}
            {added.map((item, i) => (
              <div key={`a-${i}`} style={{ fontSize: 12, color: 'var(--sv-ink)' }}>
                + {item.text}
              </div>
            ))}
          </div>
        );
      })}

      {(diff.architecture.added.length > 0 ||
        diff.architecture.removed.length > 0 ||
        diff.architecture.changed.length > 0) && (
        <div>
          <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
            Architecture
          </div>
          {diff.architecture.removed.map((n) => (
            <div key={`ar-${n.component}`} style={{ fontSize: 12, color: 'var(--sv-burgundy)' }}>
              − {n.component}: {n.note}
            </div>
          ))}
          {diff.architecture.added.map((n) => (
            <div key={`aa-${n.component}`} style={{ fontSize: 12, color: 'var(--sv-ink)' }}>
              + {n.component}: {n.note}
            </div>
          ))}
          {diff.architecture.changed.map((c) => (
            <div key={`ac-${c.component}`} style={{ fontSize: 12 }}>
              <div style={{ color: 'var(--sv-ink-soft)' }}>{c.component}</div>
              <div style={{ color: 'var(--sv-burgundy)' }}>− {c.from.note}</div>
              <div style={{ color: 'var(--sv-alert)' }}>+ {c.to.note}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** TASK-020: browse a prompt's past compiles (`list_compiles`, already
 * append-only SQLite from TASK-001/018) and diff any two selected versions
 * via the pure `formatDiff` helper. Read-only — no revert/merge action. */
export function VersionHistory({ promptId, onClose }: Props) {
  const [compiles, setCompiles] = useState<Compile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromId, setFromId] = useState<string>('');
  const [toId, setToId] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listCompiles(promptId)
      .then((list) => {
        if (cancelled) return;
        // list_compiles is append-only; sort newest-first for display.
        const sorted = [...list].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
        setCompiles(sorted);
        if (sorted.length >= 2) {
          setToId(sorted[0].id);
          setFromId(sorted[1].id);
        } else if (sorted.length === 1) {
          setToId(sorted[0].id);
          setFromId(sorted[0].id);
        }
      })
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [promptId]);

  const fromCompile = compiles.find((c) => c.id === fromId);
  const toCompile = compiles.find((c) => c.id === toId);

  let diff: CompiledPromptDiff | null = null;
  let parseError = false;
  if (fromCompile && toCompile) {
    try {
      const a: CompiledPrompt = JSON.parse(fromCompile.compiled_json);
      const b: CompiledPrompt = JSON.parse(toCompile.compiled_json);
      diff = formatDiff(a, b);
    } catch {
      parseError = true;
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: '90vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'var(--sv-ivory)',
          border: '1px solid var(--sv-hairline-strong)',
          padding: 'var(--sv-space-5)',
        }}
        className="sv-scrollpane"
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--sv-space-4)' }}>
          <h2 style={{ fontSize: 18 }}>Version History</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        {loading && <div style={{ fontSize: 12, color: 'var(--sv-ink-soft)' }}>Loading versions…</div>}
        {error && <div style={{ fontSize: 12, color: 'var(--sv-burgundy)' }}>{error}</div>}

        {!loading && !error && compiles.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--sv-ink-soft)' }}>No saved compiles for this prompt yet.</div>
        )}

        {!loading && !error && compiles.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: 'var(--sv-space-3)', marginBottom: 'var(--sv-space-4)' }}>
              <div style={{ flex: 1 }}>
                <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                  From
                </div>
                <select value={fromId} onChange={(e) => setFromId(e.target.value)} style={{ width: '100%', fontSize: 12 }}>
                  {compiles.map((c) => (
                    <option key={c.id} value={c.id}>
                      <VersionLabel c={c} />
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
                  To
                </div>
                <select value={toId} onChange={(e) => setToId(e.target.value)} style={{ width: '100%', fontSize: 12 }}>
                  {compiles.map((c) => (
                    <option key={c.id} value={c.id}>
                      <VersionLabel c={c} />
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <hr className="sv-hairline" style={{ margin: 'var(--sv-space-4) 0' }} />

            {parseError && <div style={{ fontSize: 12, color: 'var(--sv-burgundy)' }}>Could not parse one of the selected versions.</div>}
            {!parseError && diff && <DiffView diff={diff} />}
          </>
        )}
      </div>
    </div>
  );
}
