import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('fashion domain', () => {
  it('detects fashion domain on a realistic apparel brand request', () => {
    const compiled = compileArchitect(
      'Design a streetwear clothing brand capsule wardrobe with a lookbook and a tech pack for a cut and sew manufacturer'
    );
    expect(compiled.domain).toBe('fashion');
  });

  it('negative control: an unrelated software-development request does not misclassify as fashion', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('fashion');
  });

  it('word-boundary regression: unrelated words do not falsely trigger new fashion keywords', () => {
    const state = runArchitectPipeline(
      'The multiplayer game lobby had a fitness tracker widget and a brandenburg gate photo in the background'
    );
    expect(state.domain).not.toBe('fashion');
  });

  it('detects fashion domain on made-to-measure/bespoke tailoring phrasing', () => {
    const compiled = compileArchitect(
      'I want to start a bespoke tailoring service offering made-to-measure suits for menswear clients'
    );
    expect(compiled.domain).toBe('fashion');
  });

  it('ambiguity checklist flags missing sales channel and resolves on bare answer', () => {
    const unresolved = runArchitectPipeline(
      'Design a womenswear jacket collection using wool fabric in size S-XL for fall'
    );
    const unresolvedText = JSON.stringify(unresolved);
    expect(unresolvedText).toMatch(/sales channel|distribution/i);

    const resolved = runArchitectPipeline(
      'Design a womenswear jacket collection using wool fabric in size S-XL for fall, sold wholesale to boutiques'
    );
    const resolvedText = JSON.stringify(resolved);
    expect(resolvedText === unresolvedText).toBe(false);
  });

  it('constraint specialist flags inclusive sizing vs solo-designer infeasibility', () => {
    const compiled = compileArchitect(
      'As a solo designer working by myself, I want to launch a womenswear clothing brand with a full inclusive sizing range from XS to 4XL for my new fashion label'
    );
    expect(compiled.domain).toBe('fashion');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/sizing scope|solo|independent designer/i);
  });

  it('technical specialist surfaces landed cost/duty consideration for overseas sourcing', () => {
    const compiled = compileArchitect(
      'Design a footwear collection manufactured overseas with fabric sourcing, tech pack, and production QC'
    );
    expect(compiled.domain).toBe('fashion');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/landed cost|duty|tariff|HTS/i);
  });
});
