import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('marketing domain', () => {
  it('marketing domain detected on canonical marketing example', () => {
    const compiled = compileArchitect(
      'Plan a marketing campaign to promote our new product launch, targeting small business owners via email and social media ads'
    );
    expect(compiled.domain).toBe('marketing');
  });

  it('negative control: unrelated web request does not misclassify as marketing', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('marketing');
  });

  it('negative control: bare substring inside unrelated words does not misclassify as marketing', () => {
    // Word-boundary safety check, mirroring TASK-006's 'multiplayer'/'api' regressions.
    // Bare 'ad' matching inside unrelated words (e.g. "advance", "road", "ladder")
    // must not inflate the marketing score.
    const state = runArchitectPipeline('We drove down the road, made steady advance up the ladder, and reached the summit');
    expect(state.domain).not.toBe('marketing');
  });

  it('architect specialist produces marketing-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Build a marketing campaign for our SaaS product launch including messaging, channel plan, and content production'
    );
    expect(state.domain).toBe('marketing');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
    const mentionsChannelOrMessaging = architectureItems.some(
      (r) => r.text.toLowerCase().includes('channel') || r.text.toLowerCase().includes('messaging')
    );
    expect(mentionsChannelOrMessaging).toBe(true);
  });

  it('technical specialist produces marketing-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Run an email and paid social advertising campaign targeting new customers, with a tight budget and a two week timeline'
    );
    expect(state.domain).toBe('marketing');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsMarketingTech = technicalItems.some((r) => /UTM|tracking|attribution|marketing stack|landing page/i.test(r.text));
    expect(mentionsMarketingTech).toBe(true);
  });
});
