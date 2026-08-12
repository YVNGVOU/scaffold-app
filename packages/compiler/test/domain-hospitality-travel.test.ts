import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('hospitality-travel domain', () => {
  it('detects hospitality-travel domain on a realistic hotel booking request', () => {
    const compiled = compileArchitect(
      'Build a hotel reservation system with a real-time availability calendar, check-in/check-out workflow, seasonal rate pricing, and a channel manager integration to sync with Booking.com and Expedia'
    );
    expect(compiled.domain).toBe('hospitality-travel');
  });

  it('negative control: an unrelated software-development request does not misclassify as hospitality-travel', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('hospitality-travel');
  });

  it('word-boundary regression: unrelated words do not falsely trigger hospitality keywords', () => {
    const state = runArchitectPipeline('The beginning of the inning was delayed while the inn-house team reviewed the resorting algorithm');
    expect(state.domain).not.toBe('hospitality-travel');
  });

  it('architect specialist produces hospitality/travel-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Build a vacation rental booking platform with room inventory management, a reservation flow from search to payment, guest communication for confirmations and reminders, and a loyalty program for repeat guests'
    );
    expect(compiled.domain).toBe('hospitality-travel');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/inventory|reservation|channel manager|loyalty/i);
  });

  it('technical specialist surfaces a hospitality/travel-specific consideration', () => {
    const compiled = compileArchitect(
      'Build a hotel reservation system with a real-time availability calendar, check-in/check-out workflow, seasonal rate pricing, and a channel manager integration to sync with Booking.com and Expedia'
    );
    expect(compiled.domain).toBe('hospitality-travel');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/inventory locking|channel manager sync|payment integration|rate.plan/i);
  });
});
