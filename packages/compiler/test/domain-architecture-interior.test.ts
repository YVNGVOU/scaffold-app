import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('architecture-interior domain', () => {
  it('detects architecture-interior domain on a realistic renovation request', () => {
    const compiled = compileArchitect(
      'Design a kitchen remodel for a residential home including a new floor plan, cabinetry layout, and lighting plan, with a construction documents package for permit submission'
    );
    expect(compiled.domain).toBe('architecture-interior');
  });

  it('negative control: an unrelated marketing request does not misclassify as architecture-interior', () => {
    const compiled = compileArchitect(
      'Write a social media campaign plan for a new sneaker launch including hashtag strategy and influencer outreach'
    );
    expect(compiled.domain).not.toBe('architecture-interior');
  });

  it('word-boundary regression: new keyword phrases do not falsely trigger on unrelated prose', () => {
    const state = runArchitectPipeline(
      'The programmer used a design development methodology to schedule the punchy list of tasks in her open-source project, and reflected on ceiling fans she wanted to buy'
    );
    expect(state.domain).not.toBe('architecture-interior');
  });

  it('word-boundary regression: added keyword phrases match correctly in real usage', () => {
    const compiled = compileArchitect(
      'We need an open floor plan tenant improvement for a retail space, with schematic design and reflected ceiling plan drawings, targeting LEED certification'
    );
    expect(compiled.domain).toBe('architecture-interior');
  });

  it('ambiguity checklist flags missing project timeline and design style', () => {
    const compiled = compileArchitect(
      'Design a bathroom remodel for a residential home with new tile flooring and fixtures'
    );
    expect(compiled.domain).toBe('architecture-interior');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/timeline|design style|aesthetic direction/i);
  });

  it('ambiguity checklist resolves project timeline and design style from bare short answers', () => {
    const compiled = compileArchitect(
      'Design an office interior design fit-out with a floor plan, modern aesthetic, deadline in 3 months, commercial occupancy, 5000 square feet, budget $200,000, IBC jurisdiction, ADA compliant'
    );
    expect(compiled.domain).toBe('architecture-interior');
    const unresolved = JSON.stringify(compiled.ambiguities ?? compiled);
    expect(unresolved).not.toMatch(/project timeline is unspecified/i);
    expect(unresolved).not.toMatch(/aesthetic direction.*is unspecified/i);
  });

  it('constraint specialist flags historic preservation vs open modern renovation as infeasible', () => {
    const compiled = compileArchitect(
      'Renovate a historic building into an open floor plan office space with a gut renovation removing the original layout'
    );
    expect(compiled.domain).toBe('architecture-interior');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/historic|preservation|landmark/i);
  });

  it('technical specialist surfaces the new energy code / existing conditions considerations', () => {
    const compiled = compileArchitect(
      'Renovate an existing commercial building to meet net zero building energy targets, with a full as-built drawings survey before demolition begins'
    );
    expect(compiled.domain).toBe('architecture-interior');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/energy code|existing conditions survey|as-built|LEED|passive-house|net-zero/i);
  });
});
