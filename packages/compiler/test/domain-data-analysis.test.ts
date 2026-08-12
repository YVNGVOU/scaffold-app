import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('data-analysis domain', () => {
  it('data-analysis domain detected on canonical example', () => {
    const compiled = compileArchitect(
      'I need a dashboard that visualizes sales data from a CSV export, with charts showing monthly trends and a regression analysis of revenue drivers'
    );
    expect(compiled.domain).toBe('data-analysis');
  });

  it('negative control: unrelated web request does not misclassify as data-analysis', () => {
    const compiled = compileArchitect('I need a responsive website with a React frontend and an API backend');
    expect(compiled.domain).not.toBe('data-analysis');
  });

  it('negative control: bare "sql" or "plot" substring inside unrelated words does not misclassify', () => {
    // Word-boundary safety check, mirroring TASK-006's 'multiplayer'/'api' regressions.
    const state = runArchitectPipeline('The pilot scheme for the courtyard plotline was approved by the council');
    expect(state.domain).not.toBe('data-analysis');
  });

  it('architect stage includes data-analysis architecture template components not mentioned in raw input', () => {
    const state = runArchitectPipeline(
      'Build an analytics report from our database that shows customer churn statistics with a pivot table breakdown'
    );
    expect(state.domain).toBe('data-analysis');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
    const mentionsCleaning = architectureItems.some((r) => r.text.toLowerCase().includes('clean'));
    expect(mentionsCleaning).toBe(true);
  });

  it('technical specialist produces data-analysis-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Create a data analytics dashboard from our sales dataset with time series charts and correlation analysis'
    );
    expect(state.domain).toBe('data-analysis');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsDataTech = technicalItems.some((r) => /data source|schema|statistical|volume|reproducib/i.test(r.text));
    expect(mentionsDataTech).toBe(true);
  });
});
