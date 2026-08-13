import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('blender domain', () => {
  it('detects blender domain on a realistic 3D asset request', () => {
    const compiled = compileArchitect(
      'Model a low-poly game-ready hero prop in Blender with retopology, UV unwrap, and PBR texturing baked from a high-poly sculpt'
    );
    expect(compiled.domain).toBe('blender');
  });

  it('negative control: an unrelated marketing request does not misclassify as blender', () => {
    const compiled = compileArchitect(
      'Write a quarterly email newsletter announcing our new pricing tiers to existing subscribers'
    );
    expect(compiled.domain).not.toBe('blender');
  });

  it('word-boundary regression: unrelated words do not falsely trigger blender keywords', () => {
    const state = runArchitectPipeline(
      'The multiplayer environmental design was rigorous and the superhero costume concept felt heroic'
    );
    expect(state.domain).not.toBe('blender');
  });

  it('detects blender domain from newly added phrasings (geometry nodes, hard surface, hdri)', () => {
    const compiled = compileArchitect(
      'Use geometry nodes for a hard surface sci-fi environment prop lit with an HDRI, then bake normal maps for a game-ready asset'
    );
    expect(compiled.domain).toBe('blender');
  });

  it('ambiguity checklist recognizes a bare short answer for texture resolution', () => {
    const compiled = compileArchitect(
      'Model a character prop in Blender for a game engine, low poly, rigged, using Eevee, 2k textures, exported as glTF'
    );
    expect(compiled.domain).toBe('blender');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).not.toMatch(/texture resolution.*unspecified/i);
  });

  it('flags the mobile-platform vs. 4K texture infeasible combination', () => {
    const compiled = compileArchitect(
      'Build a mobile game character asset in Blender with 4k texture PBR materials for maximum fidelity'
    );
    expect(compiled.domain).toBe('blender');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/mobile.*texture|texture.*mobile/i);
  });
});
