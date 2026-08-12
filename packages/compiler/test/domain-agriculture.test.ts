import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('agriculture domain', () => {
  it('detects agriculture domain on a realistic AgTech-specific request', () => {
    const compiled = compileArchitect(
      'Build a precision agriculture platform for a corn farm that ingests soil moisture sensor data, schedules irrigation, tracks crop rotation, and forecasts yield across multiple fields'
    );
    expect(compiled.domain).toBe('agriculture');
  });

  it('negative control: an unrelated web-focused request does not misclassify as agriculture', () => {
    const compiled = compileArchitect(
      'I need a responsive marketing website with a React frontend for a bakery, targeting mobile and desktop customers'
    );
    expect(compiled.domain).not.toBe('agriculture');
    expect(compiled.domain).toBe('web');
  });

  it('word-boundary regression: unrelated words do not falsely trigger agriculture keywords', () => {
    const state = runArchitectPipeline('The farmhouse-style website needs a reformed layout and a graincom logo redesign');
    expect(state.domain).not.toBe('agriculture');
  });

  it('architect specialist produces agriculture-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Build a dairy farm management system with livestock tracking, an IoT sensor integration layer for barn temperature and feed levels, automated feeding schedules, and a compliance module for traceability records'
    );
    expect(compiled.domain).toBe('agriculture');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/sensor|IoT integration|crop\/livestock data model|traceability/i);
  });

  it('technical specialist surfaces an agriculture-specific consideration', () => {
    const compiled = compileArchitect(
      'Build a precision agriculture platform for a corn farm that ingests soil moisture sensor data, schedules irrigation, tracks crop rotation, and forecasts yield across multiple fields'
    );
    expect(compiled.domain).toBe('agriculture');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/sensor integration|offline operation|weather API|geospatial data/i);
  });
});
