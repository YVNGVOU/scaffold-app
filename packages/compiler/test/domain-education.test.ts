import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('education domain', () => {
  it('detects education domain on a realistic online course request', () => {
    const compiled = compileArchitect(
      'Design an online course for beginner students covering JavaScript basics, with lesson plans, quizzes, and a certificate of completion'
    );
    expect(compiled.domain).toBe('education');
  });

  it('negative control: an unrelated software-development request does not misclassify as education', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('education');
  });

  it('word-boundary regression: new keywords do not falsely trigger on unrelated substrings', () => {
    const state = runArchitectPipeline(
      'The alms distribution program and the algorithms lecture were unrelated topics discussed at the town hall'
    );
    expect(state.domain).not.toBe('education');
  });

  it('detects education domain using new employee-training phrasing', () => {
    const compiled = compileArchitect(
      'Build an employee training program with an LMS-hosted onboarding module, a question bank, and a gradebook for managers to track completion'
    );
    expect(compiled.domain).toBe('education');
  });

  it('ambiguity checklist recognizes bare short answers for delivery timeline and credential fields', () => {
    const compiled = compileArchitect(
      'Create a course for intermediate learners about data analysis, self-paced, with a certificate at the end, assessed via quizzes'
    );
    expect(compiled.domain).toBe('education');
    const unresolvedText = (compiled.ambiguities ?? []).map((a) => a.text).join(' | ');
    expect(unresolvedText).not.toMatch(/delivery.*timeline|completion credential/i);
  });

  it('surfaces the self-paced vs proctored exam constraint conflict', () => {
    const compiled = compileArchitect(
      'Create a fully self-paced online course with a proctored final exam required for certification'
    );
    expect(compiled.domain).toBe('education');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/proctor/i);
  });

  it('technical specialist surfaces SCORM/xAPI packaging consideration for LMS-hosted content', () => {
    const compiled = compileArchitect(
      'Design a training module to be hosted inside our company LMS, with progress tracking reported back to the LMS'
    );
    expect(compiled.domain).toBe('education');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/SCORM|xAPI|Tin Can/i);
  });
});
