import { useEffect, useRef, useState } from 'react';
import type { CompiledPrompt, DomainId } from '@lucid/schema';
import {
  runArchitectPipeline,
  ARCHITECT_MODE_STAGE_NAMES,
  runQuickPipeline,
  QUICK_MODE_STAGE_NAMES,
  runMasterPipeline,
  resumeAndRecompile,
  DOMAIN_MODULES,
  DEFAULT_SECTION_GROUP_ORDER,
  normalizeSectionGroupOrder,
  type PipelineState,
  type SectionGroupKey,
} from '@lucid/compiler';
import { createPrompt, listPrompts, saveCompile, listCompiles, getSetting, setSetting, createTemplate, listTemplates, type Prompt, type Template } from './lib/api';
import { PromptList } from './components/PromptList';
import { CompiledOutput } from './components/CompiledOutput';
import { DecisionsPanel } from './components/DecisionsPanel';
import { PipelineStepper } from './components/PipelineStepper';
import { SettingsPanel, DEFAULT_MODE_KEY, MAX_ROUNDS_KEY, DEFAULT_MAX_ROUNDS, type CompileMode } from './components/SettingsPanel';
import { VersionHistory } from './components/VersionHistory';
import { BatchCompile } from './components/BatchCompile';
import { CompareModes } from './components/CompareModes';
import { OnboardingPanel, ONBOARDING_SEEN_KEY } from './components/OnboardingPanel';
import { ErrorNote } from './components/ErrorNote';
import { toFriendlyError, type FriendlyError } from './lib/friendlyError';
import { STARTER_PROMPTS } from './starterPrompts';
import { WorkspaceShell, type WorkspaceId } from './components/workspace/WorkspaceShell';
import { CommandPalette } from './components/workspace/CommandPalette';
import { HomeWorkspace } from './components/workspace/HomeWorkspace';
import { ProjectsWorkspace } from './components/workspace/ProjectsWorkspace';
import { TemplatesWorkspace } from './components/workspace/TemplatesWorkspace';
import { LibraryWorkspace } from './components/workspace/LibraryWorkspace';
import { HistoryWorkspace } from './components/workspace/HistoryWorkspace';
import { ArchitecturePanel } from './components/ArchitecturePanel';
import { MultiPassView } from './components/compiler/MultiPassView';
import { StageInspector } from './components/compiler/StageInspector';
import type { BucketKey } from './components/compiler/stageBuckets';
import './theme.css';

const GROUP_ORDER_KEY = 'architecture_group_order';

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
  const [error, setError] = useState<FriendlyError | null>(null);
  const [mode, setMode] = useState<CompileMode>('architect');
  // TASK-078: manual domain override — 'auto' (default) leaves domainDetection's
  // own scoring in charge; any specific DomainId forces that domain directly
  // while domainScores stays populated for the existing reasoning tooltip.
  const [forceDomain, setForceDomain] = useState<DomainId | 'auto'>('auto');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  // TASK-079: Batch Compile modal — compiles a newline-delimited list of
  // prompts in one pass, one createPrompt+saveCompile row per line, reusing
  // the current mode/maxRounds and the exact same pipeline calls handleCompile
  // uses. Own component owns its own run/progress state; App.tsx only owns
  // whether the modal is open and refreshes the prompt list when it's done.
  const [batchCompileOpen, setBatchCompileOpen] = useState(false);
  // TASK-082: Compare Modes — runs the current raw input through QUICK/
  // ARCHITECT/MASTER concurrently and shows a compact comparison. Own
  // component owns its own per-column run/progress state; App.tsx only owns
  // whether the modal is open, plus the "Use this" persistence handoff.
  const [compareModesOpen, setCompareModesOpen] = useState(false);
  const [maxRounds, setMaxRounds] = useState(DEFAULT_MAX_ROUNDS);
  // TASK-026: one-time first-run onboarding panel, tracked via the existing
  // settings table. null = not yet determined (avoids a flash of the panel
  // before the persisted flag has been read), false = already seen or write
  // pending, true = should show now.
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  // MASTER mode's stage sequence is dynamic (the deliberation loop can run a
  // variable number of rounds), unlike ARCHITECT/QUICK's static stage-name
  // arrays — so the stepper's name list is captured from the real
  // PipelineState.stagesRun AFTER a MASTER run completes, same "compute
  // first, animate the reveal after" pattern this component already uses
  // for ARCHITECT/QUICK (the pipeline runs synchronously to completion, then
  // the stepper visually replays the recorded stage sequence).
  const [masterStageNames, setMasterStageNames] = useState<string[]>([]);
  // TASK-031: "Confirm & Recompile" resumes from the existing compiled state
  // rather than re-running the full pipeline, so its real executed stage
  // sequence (specialists + critique/conflict [+ MASTER's loop] + synthesis +
  // outputValidation, no intentAnalysis/domainDetection/requirementExtraction/
  // ambiguityDetection) never matches ARCHITECT_MODE_STAGE_NAMES/
  // QUICK_MODE_STAGE_NAMES/masterStageNames. Tracked separately so the
  // stepper can render the genuine resume sequence, same "compute first,
  // animate the reveal after" pattern used for MASTER mode above.
  const [isRecompiling, setIsRecompiling] = useState(false);
  const [recompileStageNames, setRecompileStageNames] = useState<string[]>([]);
  const cancelRef = useRef(false);

  const [workspace, setWorkspace] = useState<WorkspaceId>('home');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesRefreshKey, setTemplatesRefreshKey] = useState(0);

  // Architecture Panel: real section order, persisted globally (not
  // per-prompt — a user's preferred structure is a workflow habit, not a
  // one-off per document). Feeds directly into CompiledOutput's render AND
  // formatAsMarkdown's export.
  const [groupOrder, setGroupOrder] = useState<SectionGroupKey[]>(DEFAULT_SECTION_GROUP_ORDER);
  const [rightPanelTab, setRightPanelTab] = useState<'decisions' | 'architecture'>('decisions');

  // Multi-pass compiler visualization: real per-stage snapshots captured via
  // each pipeline run's onStage callback (not synthesized), so the
  // inspector shows what the compiler actually did at each stage.
  const [stageSnapshots, setStageSnapshots] = useState<(PipelineState | null)[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<BucketKey | null>(null);

  async function handleReorderGroups(next: SectionGroupKey[]) {
    setGroupOrder(next);
    setSetting(GROUP_ORDER_KEY, JSON.stringify(next)).catch(() => {});
  }

  async function refreshTemplates() {
    try {
      setTemplates(await listTemplates());
    } catch (e) {
      setError(toFriendlyError(e));
    }
  }

  function handleOpenPromptFromNav(p: Prompt) {
    handleSelectPrompt(p);
    setWorkspace('studio');
  }

  async function handleSaveAsTemplate() {
    if (!compiled) return;
    const title = (activePrompt?.title || rawInput.trim().slice(0, 60) || 'Untitled template').trim();
    try {
      await createTemplate(title, compiled.domain ?? 'general', rawInput);
      await refreshTemplates();
      setTemplatesRefreshKey((k) => k + 1);
    } catch (e) {
      setError(toFriendlyError(e));
    }
  }

  function handleUseTemplate(body: string) {
    setActivePrompt(null);
    setCompiled(null);
    setStageIndex(-1);
    setMasterStageNames([]);
    setError(null);
    setRawInput(body);
    setWorkspace('studio');
  }

  useEffect(() => {
    refreshPrompts();
    refreshTemplates();
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
    // TASK-026: show the first-run onboarding panel unless it's already been
    // dismissed. Best-effort — if the read fails, default to not showing it
    // rather than risk showing it on every launch for a user with a flaky
    // settings read.
    getSetting(ONBOARDING_SEEN_KEY)
      .then((v) => setShowOnboarding(v !== '1'))
      .catch(() => setShowOnboarding(false));
    getSetting(GROUP_ORDER_KEY)
      .then((v) => {
        if (!v) return;
        try {
          setGroupOrder(normalizeSectionGroupOrder(JSON.parse(v)));
        } catch {
          // malformed persisted value — keep the default order rather than crash
        }
      })
      .catch(() => {});
  }, []);

  function handleDismissOnboarding() {
    setShowOnboarding(false);
    setSetting(ONBOARDING_SEEN_KEY, '1').catch(() => {});
  }

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
      setError(toFriendlyError(e));
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
      setError(toFriendlyError(e));
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
      setError(toFriendlyError(e));
    }
  }

  // TASK-030: `overrideRawInput`, when provided, is used in place of the
  // `rawInput` textbox state as the text fed into the pipeline — this is
  // what lets "Confirm & Recompile" (handleConfirmRecompile below) run the
  // exact same full pipeline/animation/persistence path as a normal compile,
  // just with an augmented input string, without duplicating this function.
  async function handleCompile(overrideRawInput?: string) {
    const inputToCompile = overrideRawInput ?? rawInput;
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
      const snapshots: (PipelineState | null)[] = [];
      let stageNames: readonly string[] =
        mode === 'quick' ? QUICK_MODE_STAGE_NAMES : mode === 'master' ? [] : ARCHITECT_MODE_STAGE_NAMES;

      const domainOverride = forceDomain === 'auto' ? undefined : forceDomain;

      let state;
      if (mode === 'master') {
        state = runMasterPipeline(inputToCompile, {
          maxRounds,
          forceDomain: domainOverride,
          onStage: (_name, index, s) => {
            stageQueue.push(index);
            snapshots[index] = s;
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
        state = runPipeline(inputToCompile, {
          forceDomain: domainOverride,
          onStage: (_name, index, s) => {
            stageQueue.push(index);
            snapshots[index] = s;
          },
        });
      }
      finalCompiled = state.compiled;
      setStageSnapshots(snapshots);
      setSelectedBucket(null);

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
        const title = inputToCompile.trim().slice(0, 60) || 'Untitled prompt';
        prompt = await createPrompt(title, inputToCompile);
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
      setError(toFriendlyError(e));
    } finally {
      setRunning(false);
    }
  }

  // TASK-031: "Confirm & Recompile" — fixes TASK-030's buggy implementation,
  // which fed a synthetic augmented-text string through a completely fresh
  // pipeline run (discarding the prior compile's answered items and
  // re-running domain/ambiguity detection against phrasing it didn't
  // recognize, so the recompile could look like a no-op or silently lose
  // answers). Instead this resumes from the EXISTING `compiled` result via
  // `resumeAndRecompile` — reusing the prior domain/architecture notes and
  // preserving every already-answered item — and genuinely re-runs the
  // specialists + critique/conflict (or MASTER's full loop) + synthesis +
  // outputValidation fresh so they can react to the answered content. Same
  // stepper animation / `saveCompile` persistence (a new `compiles` row, so
  // it shows up in TASK-020's version history) as a normal compile.
  // Deliberately only ever fired by an explicit user click, never
  // automatically.
  async function handleConfirmRecompile() {
    if (!compiled) return;
    const answeredItems = compiled.userRequirements.filter((r) => r.source === 'user-answered-question');
    if (answeredItems.length === 0) return;

    setError(null);
    setRunning(true);
    setIsRecompiling(true);
    setStageIndex(-1);
    cancelRef.current = false;

    try {
      const stageQueue: number[] = [];
      const stageNamesRun: string[] = [];
      const snapshots: (PipelineState | null)[] = [];

      const state = resumeAndRecompile(compiled, rawInput, mode, {
        maxRounds,
        onStage: (name, index, s) => {
          stageQueue.push(index);
          stageNamesRun.push(name);
          snapshots[index] = s;
        },
      });
      setRecompileStageNames(stageNamesRun);
      const finalCompiled = state.compiled;
      setStageSnapshots(snapshots);
      setSelectedBucket(null);

      for (const idx of stageQueue) {
        if (cancelRef.current) break;
        setStageIndex(idx);
        await sleep(STAGE_DELAY_MS);
      }
      setStageIndex(stageNamesRun.length);

      setCompiled(finalCompiled);

      if (activePrompt) {
        await saveCompile(activePrompt.id, mode, JSON.stringify(finalCompiled));
        await refreshPrompts();
      }
    } catch (e) {
      setError(toFriendlyError(e));
    } finally {
      setRunning(false);
      setIsRecompiling(false);
    }
  }

  // TASK-082: "Use this" from the Compare Modes view. Reuses the exact same
  // create-if-needed-then-persist sequence handleCompile already uses; the
  // pipeline run itself already happened inside CompareModes, so this only
  // lifts the chosen result into App.tsx's active state, switches the mode
  // toggle to match, and refreshes the prompt list (parity with a normal
  // compile / with BatchCompile's onDone).
  async function handleUseComparisonResult(prompt: Prompt, resultMode: CompileMode, resultCompiled: CompiledPrompt) {
    setActivePrompt(prompt);
    setMode(resultMode);
    setCompiled(resultCompiled);
    setCompareModesOpen(false);
    await refreshPrompts();
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

      // Ctrl/Cmd+K: command palette, available from any workspace.
      if (mod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }

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

  const studioView = (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 320px', gridTemplateRows: '1fr auto', height: '100%', minHeight: 0, position: 'relative' }}>
      <div style={{ gridColumn: '1', gridRow: '1', borderRight: '1px solid var(--sv-hairline)', minHeight: 0, overflow: 'hidden' }}>
        <PromptList
          prompts={prompts}
          activeId={activePrompt?.id ?? null}
          onSelect={handleSelectPrompt}
          onNew={handleNewPrompt}
          onPromptsChanged={refreshPrompts}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenBatchCompile={() => setBatchCompileOpen(true)}
        />
      </div>

      {batchCompileOpen && (
        <BatchCompile
          mode={mode}
          maxRounds={maxRounds}
          onClose={() => setBatchCompileOpen(false)}
          onDone={refreshPrompts}
        />
      )}

      {compareModesOpen && (
        <CompareModes
          rawInput={rawInput}
          maxRounds={maxRounds}
          activePrompt={activePrompt}
          onUseResult={handleUseComparisonResult}
          onClose={() => setCompareModesOpen(false)}
        />
      )}

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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sv-space-2)', flexWrap: 'wrap' }}>
            <div className="sv-label">Raw Input · {mode.toUpperCase()} mode</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sv-space-2)' }}>
              {/* TASK-078: manual domain override, for when auto-detection guesses
                  wrong and rephrasing the prompt isn't the fastest fix. */}
              <select
                value={forceDomain}
                onChange={(e) => setForceDomain(e.target.value as DomainId | 'auto')}
                disabled={running}
                aria-label="Domain override"
                title="Force a specific domain instead of auto-detecting"
                style={{
                  fontSize: 10,
                  padding: 'var(--sv-space-1) var(--sv-space-2)',
                  background: 'var(--sv-ivory)',
                  color: 'var(--sv-ink)',
                  border: '1px solid var(--sv-hairline-strong)',
                  borderRadius: 0,
                }}
              >
                <option value="auto">Auto-detect domain</option>
                {DOMAIN_MODULES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
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
              {/* TASK-082: runs the current raw input through all three modes and shows
                  a compact side-by-side comparison. Disabled while a normal compile is
                  in flight or the input is empty, same guard shape as the Compile button. */}
              <button type="button" onClick={() => setCompareModesOpen(true)} disabled={running || rawInput.trim().length === 0}>
                Compare Modes
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
            <button className="sv-primary" onClick={() => handleCompile()} disabled={running}>
              {running ? 'Compiling…' : 'Compile'}
            </button>
            <button type="button" onClick={() => setHistoryOpen(true)} disabled={!activePrompt}>
              History
            </button>
            <button type="button" onClick={handleSaveAsTemplate} disabled={!compiled}>
              Save as Template
            </button>
          </div>
          {error && <ErrorNote error={error} />}
          <div style={{ fontSize: 10, color: 'var(--sv-ink-soft)', letterSpacing: '0.04em' }}>
            ⌘/Ctrl+Enter to compile · ⌘/Ctrl+Shift+N for a new prompt · Esc to cancel
          </div>
        </div>
        <hr className="sv-hairline" />
        <div className="sv-scrollpane" style={{ flex: 1, minHeight: 0 }}>
          <CompiledOutput compiled={compiled} promptTitle={activePrompt?.title} mode={mode} groupOrder={groupOrder} />
        </div>
      </div>

      <div
        style={{
          gridColumn: '3',
          gridRow: '1',
          borderLeft: '1px solid var(--sv-hairline)',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', borderBottom: '1px solid var(--sv-hairline)' }}>
          <button
            type="button"
            className={rightPanelTab === 'decisions' ? 'sv-primary' : ''}
            onClick={() => setRightPanelTab('decisions')}
            style={{ flex: 1, fontSize: 10, padding: 'var(--sv-space-2)', border: 'none' }}
          >
            Decisions
          </button>
          <button
            type="button"
            className={rightPanelTab === 'architecture' ? 'sv-primary' : ''}
            onClick={() => setRightPanelTab('architecture')}
            style={{ flex: 1, fontSize: 10, padding: 'var(--sv-space-2)', border: 'none' }}
          >
            Architecture
          </button>
        </div>
        <div className="sv-scrollpane" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {rightPanelTab === 'decisions' ? (
            <DecisionsPanel
              compiled={compiled}
              onAnswered={handleAnswered}
              onConfirmRecompile={handleConfirmRecompile}
              recompiling={running}
            />
          ) : (
            <ArchitecturePanel compiled={compiled} order={groupOrder} onReorder={handleReorderGroups} />
          )}
        </div>
      </div>

      <div style={{ gridColumn: '1 / 4', gridRow: '2', borderTop: '1px solid var(--sv-hairline)', background: 'var(--sv-ivory-dim)', display: 'flex', flexDirection: 'column' }}>
        {(() => {
          const activeStageNames = isRecompiling
            ? recompileStageNames
            : mode === 'quick'
              ? QUICK_MODE_STAGE_NAMES
              : mode === 'master'
                ? masterStageNames
                : ARCHITECT_MODE_STAGE_NAMES;
          return (
            <>
              <MultiPassView
                stageNames={activeStageNames}
                activeIndex={stageIndex}
                running={running}
                hasCompiled={compiled !== null}
                selectedBucket={selectedBucket}
                onSelectBucket={(b) => setSelectedBucket((prev) => (prev === b ? null : b))}
              />
              {selectedBucket && (
                <StageInspector
                  bucket={selectedBucket}
                  stageNames={activeStageNames}
                  snapshots={stageSnapshots}
                  onClose={() => setSelectedBucket(null)}
                />
              )}
              <PipelineStepper stageNames={activeStageNames} activeIndex={stageIndex} running={running} />
            </>
          );
        })()}
      </div>
    </div>
  );

  return (
    <>
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

      {showOnboarding && <OnboardingPanel onDismiss={handleDismissOnboarding} />}

      {batchCompileOpen && (
        <BatchCompile mode={mode} maxRounds={maxRounds} onClose={() => setBatchCompileOpen(false)} onDone={refreshPrompts} />
      )}

      {compareModesOpen && (
        <CompareModes
          rawInput={rawInput}
          maxRounds={maxRounds}
          activePrompt={activePrompt}
          onUseResult={handleUseComparisonResult}
          onClose={() => setCompareModesOpen(false)}
        />
      )}

      {historyOpen && activePrompt && <VersionHistory promptId={activePrompt.id} onClose={() => setHistoryOpen(false)} />}

      {settingsOpen && (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          defaultMode={mode}
          onDefaultModeChange={setMode}
          maxRounds={maxRounds}
          onMaxRoundsChange={setMaxRounds}
        />
      )}

      {paletteOpen && (
        <CommandPalette
          prompts={prompts}
          onClose={() => setPaletteOpen(false)}
          onNavigate={setWorkspace}
          onNewPrompt={() => {
            handleNewPrompt();
            setWorkspace('studio');
          }}
          onCompile={() => {
            setWorkspace('studio');
            handleCompile();
          }}
          onOpenPrompt={handleOpenPromptFromNav}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      )}

      <WorkspaceShell
        active={workspace}
        onNavigate={setWorkspace}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      >
        {workspace === 'home' && (
          <HomeWorkspace
            prompts={prompts}
            onOpenPrompt={handleOpenPromptFromNav}
            onNewPrompt={() => {
              handleNewPrompt();
              setWorkspace('studio');
            }}
            onNavigate={setWorkspace}
            onOpenPalette={() => setPaletteOpen(true)}
          />
        )}
        {workspace === 'studio' && studioView}
        {workspace === 'projects' && (
          <ProjectsWorkspace prompts={prompts} onOpenPrompt={handleOpenPromptFromNav} onPromptsChanged={refreshPrompts} />
        )}
        {workspace === 'templates' && <TemplatesWorkspace onUseTemplate={handleUseTemplate} refreshKey={templatesRefreshKey} />}
        {workspace === 'library' && <LibraryWorkspace prompts={prompts} templates={templates} onOpenPrompt={handleOpenPromptFromNav} />}
        {workspace === 'history' && <HistoryWorkspace prompts={prompts} onOpenPrompt={handleOpenPromptFromNav} />}
      </WorkspaceShell>
    </>
  );
}
