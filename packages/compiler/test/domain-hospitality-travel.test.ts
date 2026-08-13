import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';
import { hospitalityTravelDomain } from '../src/domains/hospitality-travel/index.js';

describe('hospitality-travel domain', () => {
  it('detects hospitality-travel domain on a realistic hotel booking request', () => {
    const compiled = compileArchitect(
      'Build a hotel reservation system with room inventory, check-in/check-out flow, and a booking engine for guests'
    );
    expect(compiled.domain).toBe('hospitality-travel');
  });

  it('negative control: an unrelated software-development request does not misclassify as hospitality-travel', () => {
    const compiled = compileArchitect(
      'Build a CLI tool in Rust that parses log files and outputs aggregated metrics to a local SQLite database'
    );
    expect(compiled.domain).not.toBe('hospitality-travel');
  });

  it('word-boundary regression: unrelated words do not falsely trigger hospitality-travel keywords', () => {
    const state = runArchitectPipeline(
      'The player was on the winning team during the innings, and the layoff at the beginning of the year affected motels of unrelated industries'
    );
    expect(state.domain).not.toBe('hospitality-travel');
  });

  it('detects new keywords: group booking and self check-in on a realistic prompt', () => {
    const compiled = compileArchitect(
      'Design a property management system with group booking support for wedding blocks, self check-in kiosk, and housekeeping coordination'
    );
    expect(compiled.domain).toBe('hospitality-travel');
  });

  it('architect specialist produces group/block booking architecture output', () => {
    const compiled = compileArchitect(
      'Build a hotel booking platform supporting group booking for conferences, with a room block manager and self check-in kiosk option'
    );
    expect(compiled.domain).toBe('hospitality-travel');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/group\/block booking manager|attrition|self\/kiosk check-in/i);
  });

  it('security specialist surfaces digital key / ID document handling considerations', () => {
    const compiled = compileArchitect(
      'Build a hotel booking platform with self check-in kiosk, digital room keys, and ID scanning for guest verification'
    );
    expect(compiled.domain).toBe('hospitality-travel');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/digital key|ID\/passport document handling|retention/i);
  });

  it('ambiguity checklist recognizes bare short answers for check-in method and group booking', () => {
    const checkInField = hospitalityTravelDomain.ambiguityChecklist.find((f) => f.field === 'check-in method')!;
    const groupField = hospitalityTravelDomain.ambiguityChecklist.find((f) => f.field === 'individual vs group booking')!;
    expect(checkInField.isResolved('kiosk')).toBe(true);
    expect(groupField.isResolved('room block')).toBe(true);
  });
});
