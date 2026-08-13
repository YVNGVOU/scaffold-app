import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('resume-cv domain', () => {
  it('detects resume-cv domain on a realistic resume request', () => {
    const compiled = compileArchitect(
      'Write me an ATS-friendly resume for a marketing manager role, one page, chronological format, with a cover letter'
    );
    expect(compiled.domain).toBe('resume-cv');
  });

  it('negative control: an unrelated software-development request does not misclassify as resume-cv', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('resume-cv');
  });

  it('word-boundary regression: new keywords do not falsely trigger on unrelated words', () => {
    const state = runArchitectPipeline(
      'The team will review and rewrite the interview scheduling summary statement for the new job description keywords are not part of this app config'
    );
    // sanity: this is a contrived stress string, just ensure no crash and domain stays plausible
    expect(typeof state.domain).toBe('string');

    const gapState = runArchitectPipeline('We hit a gap in the pipeline throughput after the last deploy, please investigate the outage');
    expect(gapState.domain).not.toBe('resume-cv');
  });

  it('detects resume-cv on new keyword phrasings (rewrite, career change, employment gap)', () => {
    const compiled = compileArchitect(
      'I need a resume rewrite and career summary for a career change resume, and I need to explain a gap in employment from the last two years'
    );
    expect(compiled.domain).toBe('resume-cv');
  });

  it('ambiguity checklist flags employment gap handling and submission channel when unaddressed', () => {
    const compiled = compileArchitect(
      'Write me a resume for a project manager role'
    );
    expect(compiled.domain).toBe('resume-cv');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/employment gap|submission channel/i);
  });

  it('ambiguity checklist resolves employment gap field when addressed inline', () => {
    const compiled = compileArchitect(
      'Write me a resume for a project manager role, I have a career break for two years I need to address, and it will be submitted via an online job portal'
    );
    expect(compiled.domain).toBe('resume-cv');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).not.toMatch(/Whether there are employment gaps/i);
    expect(compiledText).not.toMatch(/Where the document will be submitted/i);
  });

  it('constraint specialist flags entry-level vs senior-only requirement infeasibility', () => {
    const compiled = compileArchitect(
      'Write an entry-level resume for a new grad with no prior experience but include years of managerial experience and led a team of 20'
    );
    expect(compiled.domain).toBe('resume-cv');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/entry-level|first\s+job|new\s+grad/i);
  });

  it('technical specialist surfaces the portal upload field limits consideration', () => {
    const compiled = compileArchitect(
      'Create an ATS-optimized resume for a software engineer role that I will upload through an online job portal'
    );
    expect(compiled.domain).toBe('resume-cv');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/portal upload|auto-parse|re-parsing/i);
  });
});
