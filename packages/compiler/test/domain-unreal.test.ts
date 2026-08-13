import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('unreal domain', () => {
  it('detects unreal domain on a realistic Unreal Engine project request', () => {
    const compiled = compileArchitect(
      'Build a third-person action game in Unreal Engine 5 with Blueprint gameplay, a behavior tree for enemy AI, and Lumen lighting'
    );
    expect(compiled.domain).toBe('unreal');
  });

  it('negative control: an unrelated web-development request does not misclassify as unreal', () => {
    const compiled = compileArchitect(
      'Build a REST API in Node.js with Express and PostgreSQL for a task management app'
    );
    expect(compiled.domain).not.toBe('unreal');
  });

  it('word-boundary regression: new keywords do not falsely trigger on unrelated words', () => {
    const state = runArchitectPipeline(
      'The multiplayer lobby lyrics were displayed while the navigation menu bar collision-avoidance banner appeared, and the aircontroller light blinked'
    );
    expect(state.domain).not.toBe('unreal');
  });

  it('word-boundary regression: standalone new keywords correctly score when used as real terms', () => {
    const compiled = compileArchitect(
      'Set up a behavior tree and blackboard for AI Controller pathfinding on the navmesh, with an animation blueprint driving a skeletal mesh in Unreal Engine'
    );
    expect(compiled.domain).toBe('unreal');
  });

  it('ambiguity checklist recognizes bare short answers for networking model and AI navigation', () => {
    const compiled = compileArchitect(
      'Make an Unreal Engine 5 game with dedicated server networking, behavior tree AI, motion matching animation, targeting PC'
    );
    expect(compiled.domain).toBe('unreal');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).not.toMatch(/networking model.*unspecified/i);
  });

  it('technical specialist surfaces the AI navigation / navmesh consideration', () => {
    const compiled = compileArchitect(
      'Build an Unreal Engine 5 stealth game with NPC guards using behavior trees and navmesh pathfinding, targeting PC and console'
    );
    expect(compiled.domain).toBe('unreal');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/NavMesh bounds volume|behavior tree\/blackboard/i);
  });

  it('constraint specialist flags mocap animation vs solo developer as infeasible', () => {
    const compiled = compileArchitect(
      'I am a solo developer building an Unreal Engine 5 game with MetaHuman characters and full motion capture facial animation'
    );
    expect(compiled.domain).toBe('unreal');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/mocap cleanup and retargeting pipelines/i);
  });
});
