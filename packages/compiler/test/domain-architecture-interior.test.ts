import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('architecture-interior domain', () => {
  it('detects architecture-interior domain on a realistic building/interior request', () => {
    const compiled = compileArchitect(
      'Design a floor plan for a residential kitchen renovation, including a new load-bearing wall opening, updated HVAC routing, a material and finish schedule, and confirmation the layout meets ADA compliance and local building code egress requirements'
    );
    expect(compiled.domain).toBe('architecture-interior');
  });

  it('negative control: an unrelated graphic design request does not misclassify as architecture-interior', () => {
    const compiled = compileArchitect(
      'Design a logo and brand identity package for a new coffee shop, including a color palette, typography system, and social media templates'
    );
    expect(compiled.domain).not.toBe('architecture-interior');
  });

  it('word-boundary regression: unrelated words do not falsely trigger architecture-interior keywords', () => {
    const state = runArchitectPipeline('We need a solid game plan and a clear code of conduct for the team retrospective');
    expect(state.domain).not.toBe('architecture-interior');
  });

  it('architect specialist produces architecture-interior-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Create construction documents for a commercial office interior fit-out: schematic floor plan, structural coordination for a load-bearing wall removal, HVAC and electrical MEP coordination, a material and FF&E schedule, and a lighting plan, targeting building permit submission'
    );
    expect(compiled.domain).toBe('architecture-interior');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/floor plan|structural coordination|MEP coordination|construction documents|material and FF&E schedule/i);
  });

  it('technical specialist surfaces an architecture-interior-specific consideration', () => {
    const compiled = compileArchitect(
      'Create construction documents for a commercial office interior fit-out: schematic floor plan, structural coordination for a load-bearing wall removal, HVAC and electrical MEP coordination, a material and FF&E schedule, and a lighting plan, targeting building permit submission'
    );
    expect(compiled.domain).toBe('architecture-interior');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/building code|structural engineer|HVAC|material specification|egress/i);
  });
});
