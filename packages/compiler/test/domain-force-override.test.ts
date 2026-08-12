import { describe, it, expect } from 'vitest';
import { runArchitectPipeline, runQuickPipeline, runMasterPipeline } from '../src/index.js';
import { domainDetection } from '../src/pipeline/stages/domainDetection.js';
import { createInitialState } from '../src/pipeline/state.js';

// TASK-078: manual domain override — proves forceDomain genuinely overrides
// detection instead of just being ignored, and that domainScores stays
// populated for the existing reasoning tooltip (TASK-074) even when overridden.

const CLEARLY_GAME_INPUT = 'build a multiplayer game with level design, unity scripting, and gameplay balancing';

describe('domainDetection stage: forceDomain override (TASK-078)', () => {
  it('auto-detects the clearly-game input as game when no override is set', () => {
    const state = domainDetection(createInitialState(CLEARLY_GAME_INPUT));
    expect(state.domain).toBe('game');
  });

  it('forces a clearly-game input to the web domain when forceDomain is set', () => {
    const state = domainDetection(createInitialState(CLEARLY_GAME_INPUT, 'web'));
    expect(state.domain).toBe('web');
  });

  it('still populates domainScores for transparency when overridden, matching real per-domain scores', () => {
    const forced = domainDetection(createInitialState(CLEARLY_GAME_INPUT, 'web'));
    const auto = domainDetection(createInitialState(CLEARLY_GAME_INPUT));

    expect(Object.keys(forced.domainScores).length).toBeGreaterThan(0);
    // The forced run's scores reflect the same real per-module scoring as the
    // auto-detect run — forcing changes only which domain WINS, not what each
    // module actually scored against the raw input.
    expect(forced.domainScores).toEqual(auto.domainScores);
    // The game domain (what detection would have picked) still shows as the
    // top scorer in the transparency data, even though `domain` is 'web'.
    expect(forced.domainScores['game']).toBeGreaterThan(forced.domainScores['web'] ?? 0);
  });

  it('does not fabricate 100% confidence for a forced domain that scored zero', () => {
    // A forced domain with no keyword match in the input should show its
    // honest (low/zero) confidence share, not a fake full-confidence value.
    const state = domainDetection(createInitialState('write a short story about the ocean', 'game'));
    expect(state.domain).toBe('game');
    expect(state.domainScores['game']).toBe(0);
    expect(state.domainConfidence).toBe(0);
  });
});

describe('forceDomain threaded through the mode runners (TASK-078)', () => {
  it('runArchitectPipeline honors forceDomain and still returns real domainScores', () => {
    const state = runArchitectPipeline(CLEARLY_GAME_INPUT, { forceDomain: 'web' });
    expect(state.domain).toBe('web');
    expect(state.compiled.domain).toBe('web');
    expect(Object.keys(state.compiled.domainScores ?? {}).length).toBeGreaterThan(0);
    expect((state.compiled.domainScores ?? {})['game']).toBeGreaterThan(0);
  });

  it('runArchitectPipeline auto-detects normally when forceDomain is omitted', () => {
    const state = runArchitectPipeline(CLEARLY_GAME_INPUT);
    expect(state.domain).toBe('game');
  });

  it('runQuickPipeline honors forceDomain', () => {
    const state = runQuickPipeline(CLEARLY_GAME_INPUT, { forceDomain: 'web' });
    expect(state.domain).toBe('web');
    expect(state.compiled.domain).toBe('web');
  });

  it('runMasterPipeline honors forceDomain', () => {
    const state = runMasterPipeline(CLEARLY_GAME_INPUT, { forceDomain: 'web' });
    expect(state.domain).toBe('web');
    expect(state.compiled.domain).toBe('web');
    expect((state.compiled.domainScores ?? {})['game']).toBeGreaterThan(0);
  });
});
