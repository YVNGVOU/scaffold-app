import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('data-analysis domain', () => {
  it('detects data-analysis domain on a realistic analytics request', () => {
    const compiled = compileArchitect(
      'Build a dashboard that pulls data from our CSV exports and shows trend analysis and cohort analysis with weekly refresh for the executive team'
    );
    expect(compiled.domain).toBe('data-analysis');
  });

  it('negative control: an unrelated game-design request does not misclassify as data-analysis', () => {
    const compiled = compileArchitect(
      'Design a 2D platformer level with enemy patrol patterns, a health system, and a boss fight at the end'
    );
    expect(compiled.domain).not.toBe('data-analysis');
  });

  it('word-boundary regression: new keywords do not falsely trigger on unrelated substrings', () => {
    // "model" inside "modeling", "ab" inside "absolute", "bi" inside "cabinet" must not match
    const state = runArchitectPipeline(
      'The cabinet absolute value modeling agency scheduled a photo shoot for the new furniture line'
    );
    expect(state.domain).not.toBe('data-analysis');
  });

  it('recognizes new realistic keyword phrasings (tableau, power bi, cohort analysis)', () => {
    const compiled = compileArchitect(
      'I need a Tableau report with Power BI style KPIs, cohort analysis, and churn analysis for our SaaS product'
    );
    expect(compiled.domain).toBe('data-analysis');
  });

  it('ambiguity checklist recognizes a bare short answer for update cadence', () => {
    const compiled = compileArchitect(
      'Analyze our sales dataset from the data warehouse and build a dashboard with charts. Refresh cadence: weekly. Audience: executives.'
    );
    expect(compiled.domain).toBe('data-analysis');
    const compiledText = JSON.stringify(compiled);
    // update cadence and audience fields should not appear as unresolved ambiguity
    expect(compiledText).not.toMatch(/update cadence.*unspecified/i);
  });

  it('constraint specialist flags the executive-audience-vs-raw-statistics mismatch', () => {
    const compiled = compileArchitect(
      'Prepare a data analysis dashboard for our executive leadership team that reports the p-value and confidence interval from our regression for each KPI metric as the main deliverable'
    );
    expect(compiled.domain).toBe('data-analysis');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/executive audience vs raw statistical detail|narrative summary/i);
  });

  it('QA specialist surfaces the correlation-vs-causation consideration', () => {
    const compiled = compileArchitect(
      'Analyze marketing spend and revenue from our dataset, run a regression and correlation analysis, and produce a statistical report with a dashboard for the team'
    );
    expect(compiled.domain).toBe('data-analysis');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/correlation|causation/i);
  });
});
