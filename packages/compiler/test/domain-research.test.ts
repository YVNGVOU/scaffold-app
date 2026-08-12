import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('research domain', () => {
  it('research domain detected on canonical research example', () => {
    const compiled = compileArchitect(
      'I need a market research report comparing three competitors, with citations from peer-reviewed sources and a methodology section'
    );
    expect(compiled.domain).toBe('research');
  });

  it('negative control: unrelated web request does not misclassify as research', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('research');
  });

  it('negative control: bare "search" substring inside unrelated word does not misclassify as research', () => {
    // Word-boundary safety check, mirroring TASK-006's 'multiplayer'/'api' regressions.
    // 'research' must not bare-match inside unrelated words like "researched" being
    // the only signal isn't the concern here; the concern is short fragments like
    // 'cite' or 'survey' matching inside unrelated words such as "excite" or "surveying".
    const state = runArchitectPipeline('The excited team is surveying the new office layout for furniture placement');
    expect(state.domain).not.toBe('research');
  });

  it('technical specialist produces research-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Conduct a literature review on renewable energy adoption trends, with a research summary as the final deliverable'
    );
    expect(state.domain).toBe('research');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsResearchTech = technicalItems.some((r) => /sourc|methodology|citation|data collection/i.test(r.text));
    expect(mentionsResearchTech).toBe(true);
  });

  it('architect stage includes research architecture template components not mentioned in raw input', () => {
    const state = runArchitectPipeline('Put together a due diligence analysis on a potential acquisition target');
    expect(state.domain).toBe('research');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
    const mentionsCitationManagement = architectureItems.some((r) => r.text.toLowerCase().includes('citation'));
    expect(mentionsCitationManagement).toBe(true);
  });
});
