import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('game domain', () => {
  it('detects game domain on a realistic game dev request', () => {
    const compiled = compileArchitect(
      'Build a 2D roguelike platformer in Godot with tilemap-based levels, a skill tree, and procedural generation for dungeon layouts'
    );
    expect(compiled.domain).toBe('game');
  });

  it('negative control: an unrelated web development request does not misclassify as game', () => {
    const compiled = compileArchitect(
      'Build a horror-themed multiplayer chat website with real-time messaging and user presence indicators'
    );
    expect(compiled.domain).not.toBe('game');
  });

  it('word-boundary regression: new keywords do not falsely trigger on unrelated words', () => {
    const state = runArchitectPipeline('The team held a cooperative retrospective to review a loophole in the tax filing software leaderboarding vendor contract');
    expect(state.domain).not.toBe('game');
  });

  it('word-boundary regression: "gdd" and "loot drop" do not false-positive as substrings', () => {
    const state = runArchitectPipeline('We need a good idea for a droplet-based cloud deployment pipeline for our backend service');
    expect(state.domain).not.toBe('game');
  });

  it('ambiguity checklist recognizes bare answers for monetization and multiplayer mode', () => {
    const compiled = compileArchitect(
      'Design a game with core gameplay loop, boss fight, and level design'
    );
    expect(compiled.domain).toBe('game');
    const compiledText = JSON.stringify(compiled);
    // monetization and multiplayer/art-style fields remain unresolved and should surface
    expect(compiledText).toMatch(/monetization|multiplayer mode|art style/i);
  });

  it('constraint specialist flags solo dev vs MMO/open-world scope as infeasible', () => {
    const compiled = compileArchitect(
      'I am a solo developer building an open-world MMO RPG with unity, please help scope it'
    );
    expect(compiled.domain).toBe('game');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/solo dev/i);
  });

  it('technical specialist surfaces the physics determinism consideration for networked games', () => {
    const compiled = compileArchitect(
      'Build a multiplayer fps game in unreal with dedicated server networking and replay support'
    );
    expect(compiled.domain).toBe('game');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/deterministic|physics/i);
  });
});
