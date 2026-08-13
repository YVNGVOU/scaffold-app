import { describe, it, expect } from 'vitest';
import { compileArchitect } from '../src/index.js';

describe('generic domain', () => {
  it('falls back to generic for a request that does not match any named domain', () => {
    const compiled = compileArchitect(
      'Help me put together a plan for reorganizing my garage storage over the next month'
    );
    expect(compiled.domain).toBe('generic');
  });

  it('negative control: a clearly software-development request does not classify as generic', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('generic');
  });

  it('ambiguity checklist recognizes a bare short answer to the length/scope field', () => {
    const compiled = compileArchitect(
      'Help me put together a plan for reorganizing my garage storage, keep it brief'
    );
    expect(compiled.domain).toBe('generic');
    const compiledText = JSON.stringify(compiled);
    // 'brief' should resolve the length/scope ambiguity field rather than being left unresolved
    expect(compiledText).not.toMatch(/length\/scope/);
  });

  it('ambiguity checklist recognizes existing-material phrasing', () => {
    const compiled = compileArchitect(
      'Help me put together a plan for reorganizing my garage storage, based on the layout I already have'
    );
    expect(compiled.domain).toBe('generic');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).not.toMatch(/existing material to build on/);
  });

  it('surfaces the new deliver/handoff architecture step and revision-path consideration', () => {
    const compiled = compileArchitect(
      'Help me put together a plan for reorganizing my garage storage over the next month'
    );
    expect(compiled.domain).toBe('generic');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/deliver.?\/?.?handoff|revision/i);
  });
});
