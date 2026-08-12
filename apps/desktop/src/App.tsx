import { useEffect, useRef, useState } from 'react';
import type { CompiledPrompt } from '@lucid/schema';
import {
  runArchitectPipeline,
  ARCHITECT_MODE_STAGE_NAMES,
  runQuickPipeline,
  QUICK_MODE_STAGE_NAMES,
  runMasterPipeline,
} from '@lucid/compiler';
import { createPrompt, listPrompts, saveCompile, listCompiles, type Prompt } from './lib/api';
import { PromptList } from './components/PromptList';
import { CompiledOutput } from './components/CompiledOutput';
import { DecisionsPanel } from './components/DecisionsPanel';
import { PipelineStepper } from './components/PipelineStepper';
import './theme.css';

const STAGE_DELAY_MS = 90;

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
  const [mode, setMode] = useState<'architect' | 'quick' | 'master'>('architect');
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
  }, []);

  async function refreshPrompts() {
    try {
      const list = await listPrompts();
      setPrompts(list);
    } catch (e) {
      setError(String(e));
    }
  }

  function handleNewPrompt() {
    setActivePrompt(null);
    setRawInput('');
    setCompiled(null);
    setStageIndex(-1);
    setMasterStageNames([]);
    setError(null);
  }

  async function handleSelectPrompt(p: Prompt) {
    setActivePrompt(p);
    setRawInput(p.raw_input);
    setStageIndex(-1);
    setError(null);
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
      if (!prompt) {
        const title = rawInput.trim().slice(0, 60) || 'Untitled prompt';
        prompt = await createPrompt(title, rawInput);
        setActivePrompt(prompt);
      }
      await saveCompile(prompt.id, mode, JSON.stringify(finalCompiled));
      await refreshPrompts();
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 320px', gridTemplateRows: '1fr 90px', height: '100vh' }}>
      <div style={{ gridColumn: '1', gridRow: '1', borderRight: '1px solid var(--sv-hairline)', minHeight: 0, overflow: 'hidden' }}>
        <PromptList prompts={prompts} activeId={activePrompt?.id ?? null} onSelect={handleSelectPrompt} onNew={handleNewPrompt} />
      </div>

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
          <div>
            <button className="sv-primary" onClick={handleCompile} disabled={running}>
              {running ? 'Compiling…' : 'Compile'}
            </button>
          </div>
          {error && <div style={{ color: 'var(--sv-burgundy)', fontSize: 12 }}>{error}</div>}
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
        <DecisionsPanel compiled={compiled} />
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
