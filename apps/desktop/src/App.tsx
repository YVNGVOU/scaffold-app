import { useEffect, useRef, useState } from 'react';
import type { CompiledPrompt } from '@lucid/schema';
import {
  runArchitectPipeline,
  ARCHITECT_MODE_STAGE_NAMES,
  runQuickPipeline,
  QUICK_MODE_STAGE_NAMES,
  runMasterPipeline,
} from '@lucid/compiler';
import { createPrompt, listPrompts, saveCompile, listCompiles, getSetting, setSetting, type Prompt } from './lib/api';
import { PromptList } from './components/PromptList';
import { CompiledOutput } from './components/CompiledOutput';
import { DecisionsPanel } from './components/DecisionsPanel';
import { PipelineStepper } from './components/PipelineStepper';
import { SettingsPanel, DEFAULT_MODE_KEY, MAX_ROUNDS_KEY, DEFAULT_MAX_ROUNDS, type CompileMode } from './components/SettingsPanel';
import { VersionHistory } from './components/VersionHistory';
import { STARTER_PROMPTS } from './starterPrompts';
import './theme.css';

const STAGE_DELAY_MS = 90;
const DRAFT_DEBOUNCE_MS = 500;
// TASK-023: draft input is persisted (debounced) via the existing
// get_setting/set_setting settings table (TASK-018), keyed per-prompt-id so
// each prompt's mid-typing raw input survives switching away and back. A
// prompt not yet saved (no id) uses a single shared "new prompt" draft key.
const NEW_DRAFT_KEY = 'draft_new_prompt';
function draftKey(promptId: string | null): string {
  return promptId ? `draft_prompt_${promptId}` : NEW_DRAFT_KEY;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function App() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
  const [rawInput, setRawInput] = useState('');
  const [compiled, setCompiled] = useState<CompiledPrompt | null>(null);
  const [stageIndex, setStageIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<CompileMode>('architect');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [maxRounds, setMaxRounds] = useState(DEFAULT_MAX_ROUNDS);
  // MASTER mode's stage sequence is dynamic (the deliberation loop can run a
  // variable number of rounds), unlike ARCHITECT/QUICK's static stage-name
  // arrays — so the stepper's name list is captured from the real
  // PipelineState.stagesRun AFTER a MASTER run completes, same "compute
  // first, animate the reveal after" pattern this component already uses
  // for ARCHITECT/QUICK (the pipeline runs synchronously to completion, then
  // the stepper visually replays the recorded stage sequence).
  const [masterStageNames, setMasterStageNames] = useState<string[]>([]);
  const cancelRef = useRef(false);

  useEffect(() => {
    refreshPrompts();
    // Load persisted settings (TASK-018 sub-feature A): default compile mode
    // and MASTER mode's maxRounds. Best-effort — if the settings row doesn't
    // exist yet (first run) or the read fails, the existing hardcoded
    // defaults ('architect' / DEFAULT_MAX_ROUNDS) stand.
    getSetting(DEFAULT_MODE_KEY)
      .then((v) => {
        if (v === 'architect' || v === 'quick' || v === 'master') setMode(v);
      })
      .catch(() => {});
    getSetting(MAX_ROUNDS_KEY)
      .then((v) => {
        if (v) {
          const n = Number(v);
          if (Number.isFinite(n) && n >= 1 && n <= 5) setMaxRounds(n);
        }
      })
      .catch(() => {});
  }, []);

  // TASK-023: debounced draft auto-save. Fires DRAFT_DEBOUNCE_MS after the
  // last keystroke (or active-prompt switch) so navigating away mid-typing
  // doesn't lose the last few hundred ms of unsaved text under normal use.
  // Keyed per activePrompt so switching prompts saves under the correct key.
  useEffect(() => {
    const key = draftKey(activePrompt?.id ?? null);
    const timeout = setTimeout(() => {
      setSetting(key, rawInput).catch(() => {});
    }, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [rawInput, activePrompt]);

  async function refreshPrompts() {
    try {
      const list = await listPrompts();
      setPrompts(list);
      // If the active prompt was renamed, pick up the fresh title; if it was
      // deleted (TASK-018 sub-feature B), clear the now-dangling selection
      // (and any compiled output still showing for it) rather than
      // continuing to show a prompt that no longer exists.
      setActivePrompt((prev) => {
        if (!prev) return prev;
        const fresh = list.find((p) => p.id === prev.id);
        if (!fresh) {
          setCompiled(null);
          return null;
        }
        return fresh;
      });
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleNewPrompt() {
    setActivePrompt(null);
    setCompiled(null);
    setStageIndex(-1);
    setMasterStageNames([]);
    setError(null);
    // Restore any previously-saved "new prompt" draft (TASK-023) rather than
    // always clearing to empty, so switching to New Prompt and back doesn't
    // lose in-progress text that was never attached to a saved prompt.
    try {
      const draft = await getSetting(NEW_DRAFT_KEY);
      setRawInput(draft ?? '');
    } catch {
      setRawInput('');
    }
  }

  async function handleSelectPrompt(p: Prompt) {
    setActivePrompt(p);
    setStageIndex(-1);
    setError(null);
    // TASK-023: prefer a saved draft over the prompt's last-compiled
    // raw_input, so mid-typing edits that were never compiled survive
    // switching away and back. Falls back to raw_input if no draft exists
    // (or the draft read fails) so existing behavior is unaffected.
    try {
      const draft = await getSetting(draftKey(p.id));
      setRawInput(draft && draft.length > 0 ? draft : p.raw_input);
    } catch {
      setRawInput(p.raw_input);
    }
    try {
      const compiles = await listCompiles(p.id);
      if (compiles.length > 0) {
        setCompiled(JSON.parse(compiles[0].compiled_json));
      } else {
        setCompiled(null);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  // TASK-017: an unresolved item was answered inline in DecisionsPanel.
  // mergeAnswer() already produced the updated CompiledPrompt (pure,
  // headless, no pipeline re-run) — just lift it into state and persist it
  // via the same saveCompile flow used after a normal compile, so answers
  // survive prompt switches / app restarts. Does NOT re-run any pipeline.
  async function handleAnswered(updated: CompiledPrompt) {
    setCompiled(updated);
    if (!activePrompt) return;
    try {
      await saveCompile(activePrompt.id, mode, JSON.stringify(updated));
      await refreshPrompts();
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleCompile() {
    if (!rawInput.trim() && rawInput.length === 0) {
      // allow whitespace/symbol-only input through to the compiler (it must not throw),
      // but require at least an empty-string call to be intentional.
    }
    setError(null);
    setRunning(true);
    setCompiled(null);
    setStageIndex(-1);
    cancelRef.current = false;

    try {
      // Drive the visual stepper stage-by-stage using the pipeline's onStage callback,
      // pacing each step slightly so the stage sequence is visible to the user.
      // Mode toggle (TASK-008): the run function and stage-name array both switch
      // together based on `mode` — PipelineStepper already renders any stage-name
      // array generically, so QUICK's shorter sequence "just works" here.
      let finalCompiled: CompiledPrompt | null = null;
      const stageQueue: number[] = [];
      let stageNames: readonly string[] =
        mode === 'quick' ? QUICK_MODE_STAGE_NAMES : mode === 'master' ? [] : ARCHITECT_MODE_STAGE_NAMES;

      let state;
      if (mode === 'master') {
        state = runMasterPipeline(rawInput, {
          maxRounds,
          onStage: (_name, index) => {
            stageQueue.push(index);
          },
        });
        // MASTER's real, possibly-looped stage sequence is only known after
        // the run completes — capture it now so the stepper can render the
        // genuine executed sequence (including any repeated round entries),
        // not a padded fixed animation.
        stageNames = state.stagesRun;
        setMasterStageNames([...state.stagesRun]);
      } else {
        const runPipeline = mode === 'quick' ? runQuickPipeline : runArchitectPipeline;
        state = runPipeline(rawInput, {
          onStage: (_name, index) => {
            stageQueue.push(index);
          },
        });
      }
      finalCompiled = state.compiled;

      for (const idx of stageQueue) {
        if (cancelRef.current) break;
        setStageIndex(idx);
        await sleep(STAGE_DELAY_MS);
      }
      setStageIndex(stageNames.length);

      setCompiled(finalCompiled);

      let prompt = activePrompt;
      const wasNewPrompt = !prompt;
      if (!prompt) {
        const title = rawInput.trim().slice(0, 60) || 'Untitled prompt';
        prompt = await createPrompt(title, rawInput);
        setActivePrompt(prompt);
      }
      await saveCompile(prompt.id, mode, JSON.stringify(finalCompiled));
      await refreshPrompts();
      // TASK-023: the raw input is now durably saved as the prompt's
      // raw_input (or a fresh prompt was just created from it), so the
      // separate draft entry is redundant — clear it to avoid a stale draft
      // shadowing future edits. Best-effort; a leftover draft is harmless.
      setSetting(draftKey(prompt.id), '').catch(() => {});
      if (wasNewPrompt) setSetting(NEW_DRAFT_KEY, '').catch(() => {});
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  }

  // TASK-018 sub-feature D: keyboard shortcuts. Latest handlers/state are
  // read via refs inside a single stable window listener, so the listener
  // never goes stale without needing handleCompile/handleNewPrompt in a
  // useEffect dependency array (which would re-run the pipeline's onStage
  // callbacks unpredictably if re-created mid-run).
  const runningRef = useRef(running);
  runningRef.current = running;
  const handleCompileRef = useRef(handleCompile);
  handleCompileRef.current = handleCompile;
  const handleNewPromptRef = useRef(handleNewPrompt);
  handleNewPromptRef.current = handleNewPrompt;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd+Enter: compile — respects the existing disabled={running}
      // guard so a second compile can never fire while one is in flight.
      if (mod && e.key === 'Enter') {
        if (!runningRef.current) {
          e.preventDefault();
          handleCompileRef.current();
        }
        return;
      }

      // Ctrl/Cmd+Shift+N: new prompt. Plain Ctrl+N is reserved by most OSes
      // (new window) and awkward inside a Tauri webview, so Shift is added.
      if (mod && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        handleNewPromptRef.current();
        return;
      }

      // Escape: cancel the running compile stepper animation via cancelRef —
      // only meaningful while a compile is actually in flight.
      if (e.key === 'Escape' && runningRef.current) {
        cancelRef.current = true;
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 320px', gridTemplateRows: '1fr 90px', height: '100vh', position: 'relative' }}>
      {/* Persistent company-brand stamp (TASK-016) — visible from every pane, not just the left nav footer. */}
      <div
        style={{
          position: 'fixed',
          bottom: 'var(--sv-space-2)',
          right: 'var(--sv-space-3)',
          fontSize: 9,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--sv-ink-soft)',
          pointerEvents: 'none',
          zIndex: 10,
          userSelect: 'none',
        }}
      >
        SINVAUX
      </div>

      <div style={{ gridColumn: '1', gridRow: '1', borderRight: '1px solid var(--sv-hairline)', minHeight: 0, overflow: 'hidden' }}>
        <PromptList
          prompts={prompts}
          activeId={activePrompt?.id ?? null}
          onSelect={handleSelectPrompt}
          onNew={handleNewPrompt}
          onPromptsChanged={refreshPrompts}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      {historyOpen && activePrompt && (
        <VersionHistory promptId={activePrompt.id} onClose={() => setHistoryOpen(false)} />
      )}

      {settingsOpen && (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          defaultMode={mode}
          onDefaultModeChange={setMode}
          maxRounds={maxRounds}
          onMaxRoundsChange={setMaxRounds}
        />
      )}

      <div style={{ gridColumn: '2', gridRow: '1', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: 'var(--sv-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sv-space-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sv-space-2)' }}>
            <div className="sv-label">Raw Input · {mode.toUpperCase()} mode</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                type="button"
                className={mode === 'architect' ? 'sv-primary' : ''}
                onClick={() => setMode('architect')}
                disabled={running}
              >
                ARCHITECT
              </button>
              <button
                type="button"
                className={mode === 'quick' ? 'sv-primary' : ''}
                onClick={() => setMode('quick')}
                disabled={running}
              >
                QUICK
              </button>
              <button
                type="button"
                className={mode === 'master' ? 'sv-primary' : ''}
                onClick={() => setMode('master')}
                disabled={running}
              >
                MASTER
              </button>
            </div>
          </div>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={5}
            placeholder="Describe what you want, plainly. e.g. &quot;build me a portfolio site for a photographer&quot;"
          />
          {rawInput.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sv-space-2)' }}>
              <div className="sv-label">Try an example</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sv-space-2)' }}>
                {STARTER_PROMPTS.map((starter) => (
                  <button
                    key={starter.label}
                    type="button"
                    title={starter.text}
                    onClick={() => setRawInput(starter.text)}
                    style={{
                      fontSize: 11,
                      padding: 'var(--sv-space-1) var(--sv-space-3)',
                      background: 'var(--sv-ivory-dim)',
                      color: 'var(--sv-ink-soft)',
                      border: '1px solid var(--sv-hairline-strong)',
                    }}
                  >
                    {starter.domain} · {starter.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 'var(--sv-space-2)' }}>
            <button className="sv-primary" onClick={handleCompile} disabled={running}>
              {running ? 'Compiling…' : 'Compile'}
            </button>
            <button type="button" onClick={() => setHistoryOpen(true)} disabled={!activePrompt}>
              History
            </button>
          </div>
          {error && <div style={{ color: 'var(--sv-burgundy)', fontSize: 12 }}>{error}</div>}
          <div style={{ fontSize: 10, color: 'var(--sv-ink-soft)', letterSpacing: '0.04em' }}>
            ⌘/Ctrl+Enter to compile · ⌘/Ctrl+Shift+N for a new prompt · Esc to cancel
          </div>
        </div>
        <hr className="sv-hairline" />
        <div className="sv-scrollpane" style={{ flex: 1, minHeight: 0 }}>
          <CompiledOutput compiled={compiled} />
        </div>
      </div>

      <div
        style={{
          gridColumn: '3',
          gridRow: '1',
          borderLeft: '1px solid var(--sv-hairline)',
          minHeight: 0,
          overflowY: 'auto',
        }}
        className="sv-scrollpane"
      >
        <DecisionsPanel compiled={compiled} onAnswered={handleAnswered} />
      </div>

      <div style={{ gridColumn: '1 / 4', gridRow: '2', borderTop: '1px solid var(--sv-hairline)', background: 'var(--sv-ivory-dim)' }}>
        <PipelineStepper
          stageNames={
            mode === 'quick' ? QUICK_MODE_STAGE_NAMES : mode === 'master' ? masterStageNames : ARCHITECT_MODE_STAGE_NAMES
          }
          activeIndex={stageIndex}
          running={running}
        />
      </div>
    </div>
  );
}
