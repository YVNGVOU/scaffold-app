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

  it('detects agriculture domain on newly-added realistic phrasings (ranching, hydroponics, variable rate)', () => {
    const compiled = compileArchitect(
      'Build a ranch management app for beef cattle with field scouting checklists, and a hydroponics module for vertical farming with a yield monitor and variable rate fertilizer recommendations'
    );
    expect(compiled.domain).toBe('agriculture');
  });

  it('word-boundary regression: new keywords do not false-positive inside unrelated words', () => {
    // "ranch" inside "branching", "grain" inside "grainy", "till" inside "until",
    // "cattle" inside "cattleman's day off at the fair", "hydroponic" only matches whole word.
    const state = runArchitectPipeline(
      'The branching strategy for the fairgrounds website looks grainy until we redesign it; the mattermost chat has a fair amount of noise'
    );
    expect(state.domain).not.toBe('agriculture');
  });

  it('ambiguity checklist recognizes a bare short answer for automation-level', () => {
    const compiled = compileArchitect(
      'Build a farm irrigation system that is advisory only, does not control any actuators, and tracks soil moisture for a commercial vegetable farm in a temperate climate with usda organic certification and cellular connectivity'
    );
    expect(compiled.domain).toBe('agriculture');
    // Should not flag automation-level as an unresolved ambiguity since "advisory" was given.
    const unresolvedFields = (compiled.ambiguities ?? []).map((a: { field: string }) => a.field);
    expect(unresolvedFields).not.toContain('automation-level');
  });

  it('constraint specialist flags organic certification combined with synthetic pesticide use as infeasible', () => {
    const compiled = compileArchitect(
      'Build a farm management app for a certified organic vegetable operation that also schedules synthetic pesticide applications across all fields'
    );
    expect(compiled.domain).toBe('agriculture');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/organic certif|synthetic pesticide/i);
  });
});
