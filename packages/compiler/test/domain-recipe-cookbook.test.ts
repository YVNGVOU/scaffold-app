import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('recipe-cookbook domain', () => {
  it('detects recipe-cookbook domain on a realistic cookbook request', () => {
    const compiled = compileArchitect(
      'Write a cookbook of weeknight recipes with ingredient lists, step-by-step instructions, yield and prep time, and gluten-free recipe variations'
    );
    expect(compiled.domain).toBe('recipe-cookbook');
  });

  it('negative control: an unrelated software-development request does not misclassify as recipe-cookbook', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('recipe-cookbook');
  });

  it('disambiguation: a restaurant menu design request does not misclassify as recipe-cookbook', () => {
    const compiled = compileArchitect(
      'Design a restaurant menu with sections for appetizers, entrees, and drinks, with item descriptions and pricing layout'
    );
    expect(compiled.domain).not.toBe('recipe-cookbook');
  });

  it('word-boundary regression: new keywords do not false-positive on unrelated words', () => {
    const state = runArchitectPipeline(
      'The multiplayer game blog had a roundup of the weeknights team stayed late testing kitchen sinks for a plumbing app'
    );
    expect(state.domain).not.toBe('recipe-cookbook');
  });

  it('detects new keyword phrasings like recipe development and food blog', () => {
    const compiled = compileArchitect(
      'I need help with recipe development for my food blog, including a recipe roundup of family recipes with allergen labeling'
    );
    expect(compiled.domain).toBe('recipe-cookbook');
  });

  it('architect specialist surfaces equipment/component-recipe considerations', () => {
    const compiled = compileArchitect(
      'Write a baking cookbook of kitchen-tested recipes for beginners, each recipe with ingredient list, step-by-step instructions, and yield, serves 8, using only basic kitchen equipment'
    );
    expect(compiled.domain).toBe('recipe-cookbook');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/equipment|component-recipe|altitude/i);
  });
});
