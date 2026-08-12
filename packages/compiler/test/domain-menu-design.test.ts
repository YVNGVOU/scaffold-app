import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('menu-design domain', () => {
  it('detects menu-design domain on a realistic cafe menu request', () => {
    const compiled = compileArchitect(
      'Design a menu for a coffee shop with pastries and drinks, organized into sections with prices and dietary tags for vegan and gluten-free options'
    );
    expect(compiled.domain).toBe('menu-design');
  });

  it('negative control: an unrelated software-development request does not misclassify as menu-design', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('menu-design');
  });

  it('word-boundary regression: unrelated words do not falsely trigger menu-design keywords', () => {
    const state = runArchitectPipeline('The dropdown menu bar options were a menagerie of confusing settings in the app');
    expect(state.domain).not.toBe('menu-design');
  });

  it('disambiguation: a logo/identity request classifies as branding, not menu-design', () => {
    const compiled = compileArchitect(
      'Create a logo and brand identity system with color palette and typography guidelines for a new coffee shop'
    );
    expect(compiled.domain).toBe('branding');
  });

  it('disambiguation: a cafe menu design request classifies as menu-design, not branding', () => {
    const compiled = compileArchitect(
      'Design a restaurant menu with a food menu and drink menu section, item descriptions, and pricing layout for a bistro'
    );
    expect(compiled.domain).toBe('menu-design');
  });

  it('architect specialist produces menu-design-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Design a cafe menu with sections for coffee, pastries, and sandwiches, allergen tagging, and a QR code digital menu option alongside the printed version'
    );
    expect(compiled.domain).toBe('menu-design');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/allergen|pricing layout|digital.*menu|photography/i);
  });

  it('technical specialist surfaces a menu-design-specific consideration', () => {
    const compiled = compileArchitect(
      'Design a cafe menu with sections for coffee, pastries, and sandwiches, allergen tagging, and a QR code digital menu option alongside the printed version'
    );
    expect(compiled.domain).toBe('menu-design');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/print vs digital|QR menu|update cadence|point-of-sale/i);
  });
});
