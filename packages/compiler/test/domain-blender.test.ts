import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('blender domain', () => {
  it('blender domain detected on canonical 3D modeling example', () => {
    const compiled = compileArchitect(
      'I need to model a low-poly character in Blender with clean topology, rig it with an armature, and export as glTF for a game engine'
    );
    expect(compiled.domain).toBe('blender');
  });

  it('negative control: unrelated web request does not misclassify as blender', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('blender');
  });

  it('negative control: unrelated game engine request does not misclassify as blender', () => {
    const compiled = compileArchitect('Make a horror game in Unity with multiplayer and a boss fight');
    expect(compiled.domain).not.toBe('blender');
  });

  it('technical specialist produces Blender-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Create a 3D model asset in Blender: sculpt a high-poly rock, retopologize, unwrap UVs, and set up materials with Cycles render'
    );
    expect(state.domain).toBe('blender');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsDomainConcept = technicalItems.some((r) =>
      /(topology|render engine|polycount|rig|export format|cycles|eevee)/i.test(r.text)
    );
    expect(mentionsDomainConcept).toBe(true);
  });

  it('architect stage includes blender architecture template components not mentioned in raw input', () => {
    const state = runArchitectPipeline('Build a character model in Blender for a cinematic render');
    expect(state.domain).toBe('blender');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
  });
});
