import { useState } from 'react';
import type { CompiledPrompt } from '@lucid/schema';
import {
  runArchitectPipeline,
  runQuickPipeline,
  runMasterPipeline,
  splitBatchLines,
} from '@lucid/compiler';
import { createPrompt, saveCompile } from '../lib/api';
import { toFriendlyError } from '../lib/friendlyError';
import type { CompileMode } from './SettingsPanel';

interface Props {
  mode: CompileMode;
  maxRounds: number;
  onClose: () => void;
  onDone: () => void;
}

interface LineResult {
  line: string;
  status: 'success' | 'failure';
  message: string;
}

/**
 * TASK-079: Batch Compile — paste/import a newline-delimited list of
 * prompts and compile them all in one pass, using the currently-selected
 * mode. Reuses the exact same pipeline calls (runArchitectPipeline /
 * runQuickPipeline / runMasterPipeline) and the exact same createPrompt /
 * saveCompile Tauri command sequence that App.tsx's handleCompile already
 * uses for a single compile — one new prompt + one new compile row per
 * non-blank input line. One bad line cannot abort the rest of the batch:
 * each line runs in its own try/catch and failures are collected into a
 * per-item summary shown at the end (ErrorNote/toFriendlyError pattern).
 */
export function BatchCompile({ mode, maxRounds, onClose, onDone }: Props) {
  const [text, setText] = useState('');
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<LineResult[] | null>(null);

  const lines = splitBatchLines(text);

  async function runLine(line: string): Promise<CompiledPrompt> {
    // Same run-function selection handleCompile uses, just without the
    // visual stepper animation (batch mode reports coarse per-item
    // progress instead of per-stage progress, since N items already take
    // a few seconds each).
    let state;
    if (mode === 'master') {
      state = runMasterPipeline(line, { maxRounds });
    } else {
      const runPipeline = mode === 'quick' ? runQuickPipeline : runArchitectPipeline;
      state = runPipeline(line);
    }
    return state.compiled;
  }

  async function handleRunBatch() {
    if (lines.length === 0) return;
    setRunning(true);
    setResults(null);
    setCompleted(0);
    setTotal(lines.length);

    const collected: LineResult[] = [];
    for (const line of lines) {
      try {
        const compiled = await runLine(line);
        const title = line.slice(0, 60) || 'Untitled prompt';
        const prompt = await createPrompt(title, line);
        await saveCompile(prompt.id, mode, JSON.stringify(compiled));
        collected.push({ line, status: 'success', message: 'Compiled and saved.' });
      } catch (e) {
        collected.push({ line, status: 'failure', message: toFriendlyError(e).summary });
      }
      setCompleted((c) => c + 1);
    }

    setResults(collected);
    setRunning(false);
    // Refresh the prompt list so every newly-created prompt appears
    // immediately, same as a normal single compile does via refreshPrompts().
    onDone();
  }

  const successCount = results ? results.filter((r) => r.status === 'success').length : 0;
  const failureCount = results ? results.filter((r) => r.status === 'failure').length : 0;

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
      onClick={running ? undefined : onClose}
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
          <h2 style={{ fontSize: 18 }}>Batch Compile</h2>
          <button type="button" onClick={onClose} disabled={running}>
            Close
          </button>
        </div>

        <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
          One prompt per line · {mode.toUpperCase()} mode · blank lines skipped
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          disabled={running}
          placeholder={'build me a portfolio site for a photographer\nmake a mobile game about farming\nwrite a business plan for a coffee shop'}
          style={{ width: '100%', fontFamily: 'var(--sv-font-mono)', fontSize: 12 }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sv-space-3)', marginTop: 'var(--sv-space-3)' }}>
          <button className="sv-primary" onClick={handleRunBatch} disabled={running || lines.length === 0}>
            {running ? `Compiling ${completed} of ${total}…` : `Compile ${lines.length || ''} prompt${lines.length === 1 ? '' : 's'}`}
          </button>
          {running && (
            <div style={{ fontSize: 11, color: 'var(--sv-ink-soft)' }}>
              {completed} of {total} compiled
            </div>
          )}
        </div>

        {results && (
          <div style={{ marginTop: 'var(--sv-space-4)' }}>
            <hr className="sv-hairline" style={{ margin: 'var(--sv-space-4) 0' }} />
            <div className="sv-label" style={{ marginBottom: 'var(--sv-space-2)' }}>
              {successCount} succeeded, {failureCount} failed
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {results.map((r, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 11,
                    color: r.status === 'success' ? 'var(--sv-ink-soft)' : 'var(--sv-burgundy)',
                  }}
                >
                  {r.status === 'success' ? '✓' : '✗'} {r.line.slice(0, 60)}
                  {r.status === 'failure' && ` — ${r.message}`}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
