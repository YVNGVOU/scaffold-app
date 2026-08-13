import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('research domain', () => {
  it('detects research domain on a realistic research request', () => {
    const compiled = compileArchitect(
      'Write a research report on the competitive landscape for meal-kit delivery startups, citing peer-reviewed and industry sources'
    );
    expect(compiled.domain).toBe('research');
  });

  it('detects research domain on a meta-analysis / systematic review phrasing', () => {
    const compiled = compileArchitect(
      'Conduct a systematic review and meta-analysis of published studies on remote work productivity, gather sources from academic databases'
    );
    expect(compiled.domain).toBe('research');
  });

  it('negative control: an unrelated software-development request does not misclassify as research', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('research');
  });

  it('word-boundary regression: new keywords do not false-positive on unrelated words', () => {
    // 'lit review' should not fire on unrelated text containing 'literary' etc,
    // and 'research paper' phrasing must not bare-match on 'research' inside other words.
    const state = runArchitectPipeline('The prescription pad and literary criticism papered over the exploratorium display');
    expect(state.domain).not.toBe('research');
  });

  it('ambiguity checklist: audience field resolves on a bare short answer', () => {
    const compiled = compileArchitect(
      'Research the impact of AI on hiring for a technical audience, report format, scope limited to US tech companies'
    );
    const compiledText = JSON.stringify(compiled);
    // audience is addressed, so it should not appear as an unresolved ambiguity item
    expect(compiledText).not.toMatch(/intended audience\/reader/i);
  });

  it('ambiguity checklist: recency window field is recognized', () => {
    const compiled = compileArchitect(
      'Research current market trends in EV batteries, focus on data from the last 3 years, report format for executives'
    );
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).not.toMatch(/how recent sources must be/i);
  });

  it('security specialist surfaces the copyright/reproduction consideration', () => {
    const compiled = compileArchitect(
      'Write a research summary comparing industry whitepapers on cloud pricing, cite sources, include quotes from paywalled reports'
    );
    expect(compiled.domain).toBe('research');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/copyright|verbatim|paywalled/i);
  });

  it('constraint specialist flags peer-review-only vs cutting-edge topic tension', () => {
    const compiled = compileArchitect(
      'Research the latest breaking developments in quantum computing, academic sources only, peer-reviewed only'
    );
    expect(compiled.domain).toBe('research');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/peer review lag|peer-reviewed-only vs cutting-edge|little or no peer-reviewed/i);
  });
});
