import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('automation domain', () => {
  it('automation domain detected on canonical automation example', () => {
    const compiled = compileArchitect(
      'I need a workflow automation that triggers on a webhook from our CRM, integrates with our billing API, and retries on failure'
    );
    expect(compiled.domain).toBe('automation');
  });

  it('negative control: unrelated web request does not misclassify as automation', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('automation');
  });

  it('negative control: bare substring inside unrelated words does not misclassify as automation', () => {
    // Word-boundary safety check, mirroring TASK-006's 'multiplayer'/'api' regressions.
    // Bare 'bot' matching inside unrelated words (e.g. "robot" mention avoided; using
    // "abbot" and "workflower") must not inflate the automation score.
    const state = runArchitectPipeline('The abbot tended the workflower garden near the botanical robotics museum gift shop');
    expect(state.domain).not.toBe('automation');
  });

  it('architect specialist produces automation-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Build a workflow automation triggered by a new order webhook that syncs data to our inventory system and alerts on failure'
    );
    expect(state.domain).toBe('automation');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
    const mentionsOrchestration = architectureItems.some(
      (r) => r.text.toLowerCase().includes('orchestration') || r.text.toLowerCase().includes('trigger')
    );
    expect(mentionsOrchestration).toBe(true);
  });

  it('technical specialist produces automation-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Automate our onboarding pipeline: trigger on new signup event, call the CRM and email integrations, and handle retries on error'
    );
    expect(state.domain).toBe('automation');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsAutomationTech = technicalItems.some((r) => /idempoten|rate limit|trigger|state persistence|timeout/i.test(r.text));
    expect(mentionsAutomationTech).toBe(true);
  });
});
