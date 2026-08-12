import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('education domain', () => {
  it('education domain detected on canonical education example', () => {
    const compiled = compileArchitect(
      'Design an online course with a lesson plan, learning objectives, and a quiz to assess students at a beginner skill level'
    );
    expect(compiled.domain).toBe('education');
  });

  it('negative control: unrelated web request does not misclassify as education', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('education');
  });

  it('negative control: bare substring inside unrelated words does not misclassify as education', () => {
    // Word-boundary safety check, mirroring TASK-006's 'multiplayer'/'api' regressions.
    // Bare 'course' or 'exam' matching inside unrelated words (e.g. "intercourse",
    // "examine") must not inflate the education score.
    const state = runArchitectPipeline('We need to examine the intercourse of trade routes across the continent for our history documentary');
    expect(state.domain).not.toBe('education');
  });

  it('architect specialist produces education-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Build a beginner course teaching students Python basics, with lessons and a final quiz to assess mastery of learning objectives'
    );
    expect(state.domain).toBe('education');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
    const mentionsCurriculum = architectureItems.some(
      (r) => r.text.toLowerCase().includes('curriculum') || r.text.toLowerCase().includes('lesson') || r.text.toLowerCase().includes('assessment')
    );
    expect(mentionsCurriculum).toBe(true);
  });

  it('technical specialist produces education-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Create a self-paced training module with quizzes for new employees, delivered through an LMS'
    );
    expect(state.domain).toBe('education');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsEducationTech = technicalItems.some((r) => /platform|LMS|scoring|grading|content format/i.test(r.text));
    expect(mentionsEducationTech).toBe(true);
  });
});
