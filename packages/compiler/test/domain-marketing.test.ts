import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('marketing domain', () => {
  it('detects marketing domain on a realistic campaign request', () => {
    const compiled = compileArchitect(
      'Plan a multi-channel marketing campaign to launch our new product, targeting small business owners with email and social media ads, budget $10,000 over one month'
    );
    expect(compiled.domain).toBe('marketing');
  });

  it('negative control: an unrelated software-development request does not misclassify as marketing', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('marketing');
  });

  it('word-boundary regression: unrelated words do not falsely trigger marketing keywords', () => {
    const state = runArchitectPipeline(
      'The multiplayer game had a broadcaster mode and a display advert-free experience for premium players'
    );
    expect(state.domain).not.toBe('marketing');
  });

  it('detects new drip/funnel/retargeting phrasings', () => {
    const compiled = compileArchitect(
      'Design a drip campaign and nurture sequence for our marketing funnel, using retargeting and lookalike audiences to improve demand generation'
    );
    expect(compiled.domain).toBe('marketing');
  });

  it('word-boundary regression: "ppc" and "a/b test" style keywords do not match inside unrelated words', () => {
    const state = runArchitectPipeline(
      'The appraiser tested a fabric sample and wrote a happy report about the apple orchard'
    );
    expect(state.domain).not.toBe('marketing');
  });

  it('ambiguity checklist recognizes bare short answers for new fields', () => {
    const compiled = compileArchitect(
      'Run a marketing campaign for b2b prospects using video creative, focused on lead generation, with a $5,000 budget over two weeks, tracked by conversion rate'
    );
    expect(compiled.domain).toBe('marketing');
    const compiledText = JSON.stringify(compiled);
    // objective and creative format fields should be considered resolved, not flagged as unresolved gaps
    expect(compiledText).not.toMatch(/campaign objective is unspecified/i);
    expect(compiledText).not.toMatch(/creative format\/asset types.*unspecified/i);
  });

  it('surfaces a new marketing-specific consideration (deliverability / UTM / disclosure)', () => {
    const compiled = compileArchitect(
      'Plan a multi-channel marketing campaign to launch our new product, targeting small business owners with email and social media ads, budget $10,000 over one month'
    );
    expect(compiled.domain).toBe('marketing');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/SPF|DKIM|UTM naming|disclosure/i);
  });

  it('flags the personalization-vs-no-data infeasible combination', () => {
    const compiled = compileArchitect(
      'Create a hyper-targeted, personalized email campaign for our audience, but note we have no customer data and no CRM in place'
    );
    expect(compiled.domain).toBe('marketing');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/personalization vs no data|infeasible/i);
  });
});
