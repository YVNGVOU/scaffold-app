import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('animation domain', () => {
  it('detects animation domain on a realistic animation production request', () => {
    const compiled = compileArchitect(
      'I need a 2D animated explainer video with a storyboard, character rigging, keyframe animation at 24fps, and a walk cycle for the mascot, with lip sync for the voiceover'
    );
    expect(compiled.domain).toBe('animation');
  });

  it('negative control: an unrelated Blender 3D modeling request does not misclassify as animation', () => {
    const compiled = compileArchitect(
      'Model a low-poly spaceship in Blender with hard-surface modeling, PBR texturing, and UV unwrapping for a game asset'
    );
    expect(compiled.domain).not.toBe('animation');
  });

  it('negative control: a generic business request does not misclassify as animation', () => {
    const compiled = compileArchitect(
      'Write a business plan for a coffee shop including market analysis, staffing plan, and a three-year revenue forecast'
    );
    expect(compiled.domain).not.toBe('animation');
  });

  it('word-boundary regression: unrelated words do not falsely trigger animation keywords', () => {
    const state = runArchitectPipeline('The rigorous celestial API rapid deployment requires a unified frame of reference');
    expect(state.domain).not.toBe('animation');
  });

  it('architect specialist produces animation-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Produce a short 3D animated short film with a full storyboard, animatic, character rigging with IK/FK controls, keyframe animation pass, lighting, and final compositing at 24fps'
    );
    expect(compiled.domain).toBe('animation');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/storyboard|animatic|rigging|compositing/i);
  });

  it('technical specialist surfaces an animation-specific consideration', () => {
    const compiled = compileArchitect(
      'Produce a short 3D animated short film with a full storyboard, animatic, character rigging with IK/FK controls, keyframe animation pass, lighting, and final compositing at 24fps'
    );
    expect(compiled.domain).toBe('animation');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/frame rate|rigging approach|render engine|file interchange/i);
  });
});
