import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('graphic-design domain', () => {
  it('graphic-design domain detected on canonical print poster example', () => {
    const compiled = compileArchitect(
      'I need a graphic design for a concert poster, print-ready with bleed, CMYK color, and bold typography'
    );
    expect(compiled.domain).toBe('graphic-design');
  });

  it('negative control: unrelated web request does not misclassify as graphic-design', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('graphic-design');
  });

  it('negative control: branding/logo request does not misclassify as graphic-design', () => {
    const compiled = compileArchitect('Design a brand identity with a logo, color palette, and style guide');
    expect(compiled.domain).not.toBe('graphic-design');
  });

  it('technical specialist produces graphic-design-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Create a print brochure layout with a grid system, typography hierarchy, and CMYK color for a trade show'
    );
    expect(state.domain).toBe('graphic-design');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsDomainConcept = technicalItems.some((r) =>
      /(resolution|dpi|color mode|cmyk|bleed|font licens|file format|print vendor)/i.test(r.text)
    );
    expect(mentionsDomainConcept).toBe(true);
  });

  it('architect stage includes graphic-design architecture template components not mentioned in raw input', () => {
    const state = runArchitectPipeline('Design a promotional flyer and poster set for a local music festival');
    expect(state.domain).toBe('graphic-design');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
  });
});
