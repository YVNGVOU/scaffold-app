import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('unreal domain', () => {
  it('detects unreal domain on a realistic Unreal Engine-specific request', () => {
    const compiled = compileArchitect(
      'Build an Unreal Engine 5 project with Blueprint gameplay classes, a level design pass with landscape tools, custom materials in the material editor, and Nanite/Lumen enabled for the PC build target'
    );
    expect(compiled.domain).toBe('unreal');
  });

  it('negative control: an unrelated web-focused request does not misclassify as unreal', () => {
    const compiled = compileArchitect(
      'I need a responsive marketing website with a React frontend for a bakery, targeting mobile and desktop customers'
    );
    expect(compiled.domain).not.toBe('unreal');
    expect(compiled.domain).toBe('web');
  });

  it('negative control: a generic game-development request without Unreal-specific detail does not misclassify as unreal', () => {
    const compiled = compileArchitect('Make a horror game in Unreal with multiplayer and a boss fight');
    expect(compiled.domain).not.toBe('unreal');
    expect(compiled.domain).toBe('game');
  });

  it('word-boundary regression: inflected/unrelated words do not falsely trigger unreal keywords', () => {
    // "landscaping" must not match the \blandscape tool\b keyword, and
    // "unreality" must not match the bare \bunreal\b keyword, since neither
    // has a word boundary at the point the substring would have to align.
    const state = runArchitectPipeline(
      'We upgraded our landscaping tools and building materials this quarter, brushing off the unreality of the deadline'
    );
    expect(state.domain).not.toBe('unreal');
  });

  it('architect specialist produces unreal-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Build an Unreal Engine 5 game with Blueprint and C++ gameplay classes, level design with world partition streaming, a material and shader library, and packaging for Windows and PlayStation'
    );
    expect(compiled.domain).toBe('unreal');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/gameplay framework|material and shader library|content pipeline|packaging configuration/i);
  });

  it('technical specialist surfaces an Unreal-specific consideration', () => {
    const compiled = compileArchitect(
      'Build an Unreal Engine 5 game with Blueprint and C++ gameplay classes, level design with world partition streaming, a material and shader library, and packaging for Windows and PlayStation'
    );
    expect(compiled.domain).toBe('unreal');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/rendering pipeline|blueprint vs c\+\+|level streaming|packaging and build/i);
  });
});
