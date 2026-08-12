import { useEffect, useRef, useState } from 'react';
import type { CompiledPrompt } from '@lucid/schema';
import {
  runQuickPipeline,
  runArchitectPipeline,
  runMasterPipeline,
  summarizeForComparison,
  type ComparisonRow,
} from '@lucid/compiler';
import { createPrompt, saveCompile, type Prompt } from '../lib/api';
import { toFriendlyError } from '../lib/friendlyError';
import type { CompileMode } from './SettingsPanel';

interface Props {
  rawInput: string;
  maxRounds: number;
  activePrompt: Prompt | null;
  /** Called with the freshly-created-or-reused prompt and its compiled result when the user picks "Use this". Mirrors handleCompile's own persistence: create a prompt first if none is active, then saveCompile. */
  onUseResult: (prompt: Prompt, mode: CompileMode, compiled: CompiledPrompt) => void;
  onClose: () => void;
}

type ColumnState =
  | { status: 'running' }
  | { status: 'done'; compiled: CompiledPrompt; row: ComparisonRow }
  | { status: 'error'; message: string };

const COLUMNS: { mode: CompileMode; label: string }[] = [
  { mode: 'quick', label: 'QUICK' },
  { mode: 'architect', label: 'ARCHITECT' },
  { mode: 'master', label: 'MASTER' },
];

const CATEGORY_LABELS: { key: keyof ComparisonRow['categoryCounts']; label: string }[] = [
  { key: 'userRequirements', label: 'User requirements' },
  { key: 'nonNegotiables', label: 'Non-negotiables' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'constraints', label: 'Constraints' },
  { key: 'assumptions', label: 'Assumptions' },
  { key: 'functionalRequirements', label: 'Functional requirements' },
];

/**
 * TASK-082: "Compare Modes" — runs the current raw input through all three
 * pipelines (QUICK / ARCHITECT / MASTER, MASTER using the app's current
 * `maxRounds` setting) and shows a compact, honest side-by-side comparison
 * — counts per requirement category, architecture-notes presence,
 * critique/conflict-finding presence, unresolved-item count — via the pure
 * `summarizeForComparison` helper (`packages/compiler/src/compareModes.ts`).
 * Deliberately NOT three full `CompiledOutput` panels (too dense per the
 * brief) and deliberately transient: none of the three runs are persisted
 * automatically. Each column runs independently and concurrently
 * (fire-and-forget per column, not awaited in sequence) so a slow MASTER
 * deliberation loop doesn't block QUICK/ARCHITECT from showing their
 * (much faster) results first; each column owns its own loading/done/error
 * state. "Use this" reuses the exact createPrompt/saveCompile sequence
 * App.tsx's handleCompile already uses for a normal compile.
 */
export function CompareModes({ rawInput, maxRounds, activePrompt, onUseResult, onClose }: Props) {
  const [columns, setColumns] = useState<Record<CompileMode, ColumnState>>({
    quick: { status: 'running' },
    architect: { status: 'running' },
    master: { status: 'running' },
  });
  const [savingMode, setSavingMode] = useState<CompileMode | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    function runOne(mode: CompileMode) {
      // Deferred to a macrotask per column so React can paint the initial
      // "running" state for all three columns before any (synchronous, CPU-
      // bound) pipeline run starts blocking the main thread — otherwise the
      // first column's run would block the paint that shows the other two
      // columns are also in flight.
      setTimeout(() => {
        if (cancelledRef.current) return;
        try {
          const state =
            mode === 'quick'
              ? runQuickPipeline(rawInput)
              : mode === 'architect'
                ? runArchitectPipeline(rawInput)
                : runMasterPipeline(rawInput, { maxRounds });
          if (cancelledRef.current) return;
          const row = summarizeForComparison(state.compiled);
          setColumns((prev) => ({ ...prev, [mode]: { status: 'done', compiled: state.compiled, row } }));
        } catch (e) {
          if (cancelledRef.current) return;
          setColumns((prev) => ({ ...prev, [mode]: { status: 'error', message: toFriendlyError(e).summary } }));
        }
      }, 0);
    }

    runOne('quick');
    runOne('architect');
    runOne('master');

    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawInput, maxRounds]);

  async function handleUseThis(mode: CompileMode) {
    const col = columns[mode];
    if (col.status !== 'done') return;
    setSaveError(null);
    setSavingMode(mode);
    try {
      let prompt = activePrompt;
      if (!prompt) {
        const title = rawInput.trim().slice(0, 60) || 'Untitled prompt';
        prompt = await createPrompt(title, rawInput);
      }
      await saveCompile(prompt.id, mode, JSON.stringify(col.compiled));
      onUseResult(prompt, mode, col.compiled);
    } catch (e) {
      setSaveError(toFriendlyError(e).summary);
    } finally {
      setSavingMode(null);
    }
  }

  const anyRunning = COLUMNS.some((c) => columns[c.mode].status === 'running');

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
          width: 920,
          maxWidth: '95vw',
          maxHeight: '88vh',
          overflowY: 'auto',
          background: 'var(--sv-ivory)',
          border: '1px solid var(--sv-hairline-strong)',
          padding: 'var(--sv-space-5)',
        }}
        className="sv-scrollpane"
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--sv-space-2)' }}>
          <h2 style={{ fontSize: 18 }}>Compare Modes</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="sv-label" style={{ marginBottom: 'var(--sv-space-4)' }}>
          {anyRunning ? 'Running QUICK / ARCHITECT / MASTER on the current input…' : 'All three modes finished.'}
          {' '}MASTER max rounds: {maxRounds}.
        </div>

        {saveError && (
          <div style={{ marginBottom: 'var(--sv-space-3)', fontSize: 11, color: 'var(--sv-burgundy)' }}>{saveError}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sv-space-4)' }}>
          {COLUMNS.map(({ mode, label }) => {
            const col = columns[mode];
            return (
              <div key={mode} style={{ border: '1px solid var(--sv-hairline)', display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    padding: 'var(--sv-space-2) var(--sv-space-3)',
                    borderBottom: '1px solid var(--sv-hairline)',
                    background: 'var(--sv-ivory-dim)',
                    fontWeight: 600,
                    fontSize: 12,
                    letterSpacing: '0.04em',
                  }}
                >
                  {label}
                </div>
                <div style={{ padding: 'var(--sv-space-3)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sv-space-2)' }}>
                  {col.status === 'running' && (
                    <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>
                      {mode === 'master' ? 'Running deliberation loop…' : 'Compiling…'}
                    </div>
                  )}
                  {col.status === 'error' && (
                    <div style={{ fontSize: 11, color: 'var(--sv-burgundy)' }}>Failed: {col.message}</div>
                  )}
                  {col.status === 'done' && (
                    <>
                      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                        <tbody>
                          {CATEGORY_LABELS.map(({ key, label: catLabel }) => (
                            <tr key={key}>
                              <td style={{ padding: '2px 0', color: 'var(--sv-ink-soft)' }}>{catLabel}</td>
                              <td style={{ padding: '2px 0', textAlign: 'right' }}>{col.row.categoryCounts[key]}</td>
                            </tr>
                          ))}
                          <tr>
                            <td style={{ padding: '4px 0 2px', borderTop: '1px solid var(--sv-hairline)', fontWeight: 600 }}>Total requirements</td>
                            <td style={{ padding: '4px 0 2px', borderTop: '1px solid var(--sv-hairline)', textAlign: 'right', fontWeight: 600 }}>
                              {col.row.totalRequirements}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '2px 0', color: 'var(--sv-ink-soft)' }}>Architecture notes</td>
                            <td style={{ padding: '2px 0', textAlign: 'right' }}>
                              {col.row.hasArchitectureNotes ? col.row.architectureNoteCount : '—'}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '2px 0', color: 'var(--sv-ink-soft)' }}>Critique/conflict findings</td>
                            <td style={{ padding: '2px 0', textAlign: 'right' }}>
                              {col.row.hasCritiqueConflictFindings ? col.row.critiqueConflictFindingCount : '—'}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '2px 0', color: col.row.unresolvedCount > 0 ? 'var(--sv-alert)' : 'var(--sv-ink-soft)' }}>
                              Unresolved items
                            </td>
                            <td style={{ padding: '2px 0', textAlign: 'right', color: col.row.unresolvedCount > 0 ? 'var(--sv-alert)' : undefined }}>
                              {col.row.unresolvedCount}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <button
                        type="button"
                        className="sv-primary"
                        onClick={() => handleUseThis(mode)}
                        disabled={savingMode !== null}
                        style={{ marginTop: 'auto', fontSize: 11 }}
                      >
                        {savingMode === mode ? 'Saving…' : 'Use this'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
