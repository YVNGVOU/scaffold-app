import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('sports-fitness domain', () => {
  it('detects sports-fitness domain on a realistic training-app request', () => {
    const compiled = compileArchitect(
      'Build a strength training app with a workout plan builder, reps and sets logging, progressive overload tracking, and a personal trainer dashboard for assigning programs to athletes'
    );
    expect(compiled.domain).toBe('sports-fitness');
  });

  it('negative control: an unrelated e-commerce request does not misclassify as sports-fitness', () => {
    const compiled = compileArchitect(
      'Build an online storefront with a product catalog, shopping cart, checkout flow, and order fulfillment tracking'
    );
    expect(compiled.domain).not.toBe('sports-fitness');
  });

  it('word-boundary regression: unrelated words do not falsely trigger sports-fitness keywords', () => {
    const state = runArchitectPipeline('The runner-up in the contest kept a running total of scores while the report ran overnight');
    expect(state.domain).not.toBe('sports-fitness');
  });

  it('architect specialist produces sports-fitness-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Build a fitness tracker with a workout program builder, an exercise library with form cues, wearable integration with Garmin and Strava, and a progress dashboard showing strength and pace trends'
    );
    expect(compiled.domain).toBe('sports-fitness');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/exercise library|progress dashboard|wearable|progression/i);
  });

  it('technical specialist surfaces a sports-fitness-specific consideration', () => {
    const compiled = compileArchitect(
      'Build a strength training app with a workout plan builder, reps and sets logging, progressive overload tracking, and a personal trainer dashboard for assigning programs to athletes'
    );
    expect(compiled.domain).toBe('sports-fitness');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/wearable|time-series|offline-first|progression algorithm/i);
  });

  it('detects sports-fitness domain via new team/league keyword phrasings', () => {
    const compiled = compileArchitect(
      'Build a league app with team roster management, league standings, a scoreboard, match schedule, and tournament bracket for a rec sports club'
    );
    expect(compiled.domain).toBe('sports-fitness');
  });

  it('word-boundary regression: new keywords do not falsely trigger on unrelated words', () => {
    const state = runArchitectPipeline(
      'The project team assembled a roster of vendors and reviewed the standings of open tickets while the sprint retrospective ran long'
    );
    expect(state.domain).not.toBe('sports-fitness');
  });

  it('ambiguity checklist flags individual vs team/league scope and resolves on league keywords', () => {
    const unresolved = compileArchitect(
      'Build a fitness tracker with a workout program builder and reps and sets logging'
    );
    const unresolvedText = JSON.stringify(unresolved);
    expect(unresolvedText).toMatch(/individual vs team|league\/league scope|team\/league/i);

    const resolved = compileArchitect(
      'Build a league app with team roster management and league standings for a rec sports club'
    );
    const resolvedText = JSON.stringify(resolved);
    // once team/league keywords are present, that ambiguity field should no longer surface as unresolved
    expect(resolvedText).not.toMatch(/individual vs team\/league scope is unspecified/i);
  });

  it('constraint specialist flags public leaderboard vs strict privacy tension', () => {
    const compiled = compileArchitect(
      'Build a fitness app with a public leaderboard and social feed, but it must meet HIPAA-level confidential health data privacy requirements'
    );
    expect(compiled.domain).toBe('sports-fitness');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/public leaderboard|social feed/i);
  });
});
