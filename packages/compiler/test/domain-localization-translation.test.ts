import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('localization-translation domain', () => {
  it('localization-translation domain detected on canonical example', () => {
    const compiled = compileArchitect(
      'We need to localize our app UI strings into Spanish, French, and Japanese, with a translation memory and glossary for consistency, and RTL support for Arabic'
    );
    expect(compiled.domain).toBe('localization-translation');
  });

  it('negative control: unrelated web request does not misclassify as localization-translation', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('localization-translation');
  });

  it('negative control: bare substring inside unrelated words does not misclassify as localization-translation', () => {
    // Word-boundary safety check, mirroring TASK-006's 'multiplayer'/'api' regressions.
    // A bare 'mt' or 'l10n'-adjacent fragment should not inflate the score when
    // embedded inside unrelated words.
    const state = runArchitectPipeline('The mtn range near the localistan village was surveyed for a documentary on translationless folklore');
    expect(state.domain).not.toBe('localization-translation');
  });

  it('architect specialist produces localization-translation-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Translate our marketing website into German, Korean, and Arabic, maintaining a translation memory and termbase, with in-country linguistic review before launch'
    );
    expect(state.domain).toBe('localization-translation');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
    const mentionsLocalizationArchitecture = architectureItems.some(
      (r) =>
        r.text.toLowerCase().includes('translation memory') ||
        r.text.toLowerCase().includes('glossary') ||
        r.text.toLowerCase().includes('cat tool') ||
        r.text.toLowerCase().includes('string catalog')
    );
    expect(mentionsLocalizationArchitecture).toBe(true);
  });

  it('technical specialist produces localization-translation-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Set up continuous localization for our product strings across 10 locales using a TMS, with ICU pluralization support'
    );
    expect(state.domain).toBe('localization-translation');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsLocalizationTech = technicalItems.some((r) => /ICU|pluraliz|placeholder|TMS|locale|encoding|UTF-8/i.test(r.text));
    expect(mentionsLocalizationTech).toBe(true);
  });

  it('detects localization-translation using newly added keywords like "in-country review" and "string freeze"', () => {
    const compiled = compileArchitect(
      'We need an in-country review process and a string freeze policy before shipping our localized release across all target locales'
    );
    expect(compiled.domain).toBe('localization-translation');
  });

  it('word-boundary regression: "localize" keyword does not falsely trigger inside unrelated words', () => {
    const state = runArchitectPipeline(
      'The demoralized team decided to generalize their approach after the moralize debate about the initialized settings'
    );
    expect(state.domain).not.toBe('localization-translation');
  });

  it('ambiguity checklist recognizes a bare short answer for update cadence', () => {
    const compiled = compileArchitect(
      'Translate our app UI strings into Spanish and French with a translation memory, glossary, and continuous localization pipeline'
    );
    expect(compiled.domain).toBe('localization-translation');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).not.toMatch(/update cadence \/ continuous localization/);
  });

  it('QA specialist surfaces string-freeze and character-limit considerations for a new localization request', () => {
    const state = runArchitectPipeline(
      'Localize our push notification and SMS string catalog into Japanese and German with a full LQA pass and translation memory'
    );
    expect(state.domain).toBe('localization-translation');
    const compiledText = JSON.stringify(state.requirements);
    expect(compiledText).toMatch(/string freeze|character-limit|character limit/i);
  });
});
