import { describe, it, expect } from 'vitest';
import { createEmptyCompiledPrompt } from '@lucid/schema';
import { getExportWarnings, EXPORT_LOW_CONFIDENCE_THRESHOLD } from '../src/exportWarnings.js';

describe('getExportWarnings (TASK-081)', () => {
  it('reports no warnings on a clean compiled prompt with high confidence', () => {
    const compiled = createEmptyCompiledPrompt('web');
    compiled.domainConfidence = 0.9;
    const result = getExportWarnings(compiled);
    expect(result.unresolvedCount).toBe(0);
    expect(result.lowDomainConfidence).toBe(false);
    expect(result.hasWarnings).toBe(false);
  });

  it('counts kind:"unresolved" items in assumptions', () => {
    const compiled = createEmptyCompiledPrompt('web');
    compiled.domainConfidence = 0.9;
    compiled.assumptions = [
      { text: 'unclear scope', kind: 'unresolved', source: 'ambiguity-detection', confidence: 0.5, evidence: [] },
      { text: 'unclear timeline', kind: 'unresolved', source: 'ambiguity-detection', confidence: 0.5, evidence: [] },
      { text: 'assumed default', kind: 'assumption', source: 'synthesis', confidence: 0.5, evidence: [] },
    ];
    const result = getExportWarnings(compiled);
    expect(result.unresolvedCount).toBe(2);
    expect(result.hasWarnings).toBe(true);
  });

  it('flags low domain confidence strictly below the threshold', () => {
    const compiled = createEmptyCompiledPrompt('web');
    compiled.domainConfidence = EXPORT_LOW_CONFIDENCE_THRESHOLD - 0.01;
    const result = getExportWarnings(compiled);
    expect(result.lowDomainConfidence).toBe(true);
    expect(result.hasWarnings).toBe(true);
  });

  it('does not flag domain confidence exactly at or above the threshold', () => {
    const compiled = createEmptyCompiledPrompt('web');
    compiled.domainConfidence = EXPORT_LOW_CONFIDENCE_THRESHOLD;
    expect(getExportWarnings(compiled).lowDomainConfidence).toBe(false);

    compiled.domainConfidence = 1;
    expect(getExportWarnings(compiled).lowDomainConfidence).toBe(false);
  });

  it('does not flag low confidence when domainConfidence is undefined', () => {
    const compiled = createEmptyCompiledPrompt('unknown');
    compiled.domainConfidence = undefined;
    const result = getExportWarnings(compiled);
    expect(result.lowDomainConfidence).toBe(false);
    expect(result.hasWarnings).toBe(false);
  });

  it('hasWarnings is true when only one of the two conditions is true', () => {
    const compiled = createEmptyCompiledPrompt('web');
    compiled.domainConfidence = 0.9;
    compiled.assumptions = [
      { text: 'x', kind: 'unresolved', source: 'ambiguity-detection', confidence: 0.5, evidence: [] },
    ];
    expect(getExportWarnings(compiled).hasWarnings).toBe(true);
  });
});
