import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('resume-cv domain', () => {
  it('detects resume-cv domain on a realistic job-search document request', () => {
    const compiled = compileArchitect(
      'Write an ATS-friendly resume for a marketing manager applying to tech companies, one page, chronological format, with a cover letter'
    );
    expect(compiled.domain).toBe('resume-cv');
  });

  it('negative control: an unrelated software-development request does not misclassify as resume-cv', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('resume-cv');
  });

  it('word-boundary regression: unrelated words do not falsely trigger resume-cv keywords', () => {
    const state = runArchitectPipeline('After the meeting resumed, we discussed the curriculum for the new employee onboarding course');
    expect(state.domain).not.toBe('resume-cv');
  });

  it('disambiguation: a general essay/article writing request classifies as writing, not resume-cv', () => {
    const compiled = compileArchitect(
      'Write a personal essay about my career journey for a blog post, reflective tone, about 1000 words'
    );
    expect(compiled.domain).toBe('writing');
  });

  it('disambiguation: a resume/CV request classifies as resume-cv, not writing', () => {
    const compiled = compileArchitect(
      'Update my CV with my latest work experience and skills section, targeting a data analyst role, hybrid resume format'
    );
    expect(compiled.domain).toBe('resume-cv');
  });

  it('architect specialist produces resume-cv-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Create a professional resume for a software engineer career change, ATS-optimized, one-page, with a tailored cover letter'
    );
    expect(compiled.domain).toBe('resume-cv');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/ats formatting pass|work experience section|cover letter|export package/i);
  });

  it('technical specialist surfaces a resume-cv-specific consideration', () => {
    const compiled = compileArchitect(
      'Create a professional resume for a software engineer career change, ATS-optimized, one-page, with a tailored cover letter'
    );
    expect(compiled.domain).toBe('resume-cv');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/ats parsing compatibility|keyword matching|section header naming/i);
  });
});
