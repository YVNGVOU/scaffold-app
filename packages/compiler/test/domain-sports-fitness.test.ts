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
});
