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

  it('detects menu-design domain via newly added keyword phrasings (kids menu, happy hour menu, takeout menu)', () => {
    const kids = compileArchitect('Design a kids menu with fun illustrations and simple pricing for a family restaurant');
    const happyHour = compileArchitect('We need a happy hour menu layout for our bar with drink specials');
    const takeout = compileArchitect('Redesign our takeout menu to be easier to read for phone orders');
    expect(kids.domain).toBe('menu-design');
    expect(happyHour.domain).toBe('menu-design');
    expect(takeout.domain).toBe('menu-design');
  });

  it('word-boundary regression: new keywords do not false-positive on unrelated phrases', () => {
    const state1 = runArchitectPipeline('The kids are redesigning their bedroom this weekend with new furniture');
    expect(state1.domain).not.toBe('menu-design');
    const state2 = runArchitectPipeline('We had a happy reunion at the family reunion picnic last weekend');
    expect(state2.domain).not.toBe('menu-design');
  });

  it('ambiguity checklist flags menu scope/item count as unresolved until the user specifies it', () => {
    const compiled = compileArchitect('Design a cafe menu with sections and pricing');
    const unresolvedText = JSON.stringify(compiled);
    expect(unresolvedText).toMatch(/scope|item count/i);

    const scoped = compileArchitect(
      'Design a compact menu for a cafe with about 20 items, digital QR format, mid-range pricing, weekly rotating specials, vegan tags, and no photography'
    );
    expect(scoped.domain).toBe('menu-design');
  });

  it('constraint specialist flags nutrition labeling requirement combined with no kitchen data as infeasible', () => {
    const compiled = compileArchitect(
      'Design a restaurant menu with calorie counts for every dish, but we have no kitchen data or recipes to work from'
    );
    expect(compiled.domain).toBe('menu-design');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/nutrition\w*\s+label|calorie/i);
  });
});
