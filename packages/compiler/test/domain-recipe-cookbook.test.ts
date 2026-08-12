import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('recipe-cookbook domain', () => {
  it('detects recipe-cookbook domain on a realistic cookbook request', () => {
    const compiled = compileArchitect(
      'Write a cookbook of 20 recipes with ingredient lists, step-by-step instructions, serving size, and vegan dietary variations for each recipe'
    );
    expect(compiled.domain).toBe('recipe-cookbook');
  });

  it('negative control: an unrelated software-development request does not misclassify as recipe-cookbook', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('recipe-cookbook');
  });

  it('word-boundary regression: unrelated words do not falsely trigger recipe-cookbook keywords', () => {
    const state = runArchitectPipeline('The cook was preparing to book a table at a restaurant next to the menu stand');
    expect(state.domain).not.toBe('recipe-cookbook');
  });

  it('disambiguation: a restaurant menu design request classifies as menu-design, not recipe-cookbook', () => {
    const compiled = compileArchitect(
      'Design a restaurant menu with a food menu and drink menu section, item descriptions, and pricing layout for a bistro'
    );
    expect(compiled.domain).toBe('menu-design');
  });

  it('disambiguation: a recipe/cookbook request classifies as recipe-cookbook, not menu-design', () => {
    const compiled = compileArchitect(
      'Compile a recipe collection cookbook with ingredient lists, cooking instructions, prep time, and gluten-free recipe substitutions'
    );
    expect(compiled.domain).toBe('recipe-cookbook');
  });

  it('architect specialist produces recipe-cookbook-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Create a recipe collection cookbook with ingredient lists, step-by-step cooking instructions, yield and serving size, dietary variation notes, and food photography for each recipe'
    );
    expect(compiled.domain).toBe('recipe-cookbook');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/ingredient list|recipe testing|food photography|dietary variation/i);
  });

  it('technical specialist surfaces a recipe-cookbook-specific consideration', () => {
    const compiled = compileArchitect(
      'Create a recipe collection cookbook with ingredient lists, step-by-step cooking instructions, yield and serving size, dietary variation notes, and food photography for each recipe'
    );
    expect(compiled.domain).toBe('recipe-cookbook');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/measurement consistency|unit conversion|recipe scaling|nutritional data/i);
  });
});
