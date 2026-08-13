import { describe, it, expect } from 'vitest';
import { createEmptyCompiledPrompt } from '@lucid/schema';
import { summarizeForComparison } from '../src/compareModes.js';

describe('summarizeForComparison (TASK-082)', () => {
  it('reports all-zero counts for a freshly-created empty compiled prompt', () => {
    const compiled = createEmptyCompiledPrompt('web');
    const row = summarizeForComparison(compiled);
    expect(row.totalRequirements).toBe(0);
    expect(row.categoryCounts).toEqual({
      userRequirements: 0,
      nonNegotiables: 0,
      preferences: 0,
      constraints: 0,
      assumptions: 0,
      functionalRequirements: 0,
    });
    expect(row.architectureNoteCount).toBe(0);
    expect(row.hasArchitectureNotes).toBe(false);
    expect(row.critiqueConflictFindingCount).toBe(0);
    expect(row.hasCritiqueConflictFindings).toBe(false);
    expect(row.unresolvedCount).toBe(0);
  });

  it('counts items per category independently and sums them into totalRequirements', () => {
    const compiled = createEmptyCompiledPrompt('web');
    compiled.userRequirements = [
      { text: 'a', kind: 'user', source: 'user-input', confidence: 1, evidence: [], status: 'accepted' },
    ];
    compiled.nonNegotiables = [
      { text: 'b', kind: 'inferred', source: 'architect-specialist', confidence: 0.8, evidence: [], status: 'accepted' },
      { text: 'c', kind: 'inferred', source: 'architect-specialist', confidence: 0.8, evidence: [], status: 'accepted' },
    ];
    compiled.constraints = [
      { text: 'd', kind: 'default', source: 'domain:web', confidence: 0.6, evidence: [], status: 'accepted' },
    ];
    const row = summarizeForComparison(compiled);
    expect(row.categoryCounts.userRequirements).toBe(1);
    expect(row.categoryCounts.nonNegotiables).toBe(2);
    expect(row.categoryCounts.constraints).toBe(1);
    expect(row.categoryCounts.preferences).toBe(0);
    expect(row.totalRequirements).toBe(4);
  });

  it('counts architecture notes and reports hasArchitectureNotes', () => {
    const compiled = createEmptyCompiledPrompt('web');
    compiled.architecture = [
      { component: 'frontend', dependsOn: [], note: 'x', source: 'architect-specialist' },
      { component: 'backend', dependsOn: ['frontend'], note: 'y', source: 'architect-specialist' },
    ];
    const row = summarizeForComparison(compiled);
    expect(row.architectureNoteCount).toBe(2);
    expect(row.hasArchitectureNotes).toBe(true);
  });

  it('treats a missing architecture field (QUICK mode never populates it) as zero, not a crash', () => {
    const compiled = createEmptyCompiledPrompt('web');
    expect(compiled.architecture).toBeUndefined();
    const row = summarizeForComparison(compiled);
    expect(row.architectureNoteCount).toBe(0);
    expect(row.hasArchitectureNotes).toBe(false);
  });

  it('counts critique-engine and conflict-engine sourced items across every category', () => {
    const compiled = createEmptyCompiledPrompt('web');
    compiled.assumptions = [
      { text: 'x', kind: 'recommendation', source: 'critique-engine', confidence: 0.5, evidence: [], status: 'pending' },
    ];
    compiled.constraints = [
      { text: 'y', kind: 'recommendation', source: 'conflict-engine', confidence: 0.5, evidence: [], status: 'pending' },
      { text: 'z', kind: 'default', source: 'domain:web', confidence: 0.5, evidence: [], status: 'accepted' },
    ];
    const row = summarizeForComparison(compiled);
    expect(row.critiqueConflictFindingCount).toBe(2);
    expect(row.hasCritiqueConflictFindings).toBe(true);
  });

  it('counts kind:"unresolved" items regardless of source or category', () => {
    const compiled = createEmptyCompiledPrompt('web');
    compiled.assumptions = [
      { text: 'x', kind: 'unresolved', source: 'ambiguity-detection', confidence: 0.5, evidence: [], status: 'pending' },
    ];
    compiled.functionalRequirements = [
      { text: 'y', kind: 'unresolved', source: 'ambiguity-detection', confidence: 0.5, evidence: [], status: 'pending' },
    ];
    const row = summarizeForComparison(compiled);
    expect(row.unresolvedCount).toBe(2);
  });

  it('a real ARCHITECT-pipeline run produces internally-consistent counts (no mocking)', async () => {
    const { runArchitectPipeline } = await import('../src/pipeline/index.js');
    const state = runArchitectPipeline('build me a portfolio site for a photographer');
    const row = summarizeForComparison(state.compiled);
    expect(row.totalRequirements).toBeGreaterThan(0);
    expect(row.hasArchitectureNotes).toBe(true);
    // Real requirement items always carry an explicit status, and totalRequirements
    // must equal the sum of the six per-category counts by construction.
    const expectedTotal =
      row.categoryCounts.userRequirements +
      row.categoryCounts.nonNegotiables +
      row.categoryCounts.preferences +
      row.categoryCounts.constraints +
      row.categoryCounts.assumptions +
      row.categoryCounts.functionalRequirements;
    expect(row.totalRequirements).toBe(expectedTotal);
  }, 20000);
});
