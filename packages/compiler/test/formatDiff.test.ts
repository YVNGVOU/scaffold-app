import { describe, it, expect } from 'vitest';
import { createEmptyCompiledPrompt, type RequirementItem, type ArchitectureNote } from '@lucid/schema';
import { formatDiff } from '../src/index.js';

function item(text: string, overrides: Partial<RequirementItem> = {}): RequirementItem {
  return {
    text,
    kind: 'user',
    source: 'user-input',
    confidence: 1,
    evidence: [],
    status: 'accepted',
    ...overrides,
  };
}

function note(component: string, overrides: Partial<ArchitectureNote> = {}): ArchitectureNote {
  return {
    component,
    dependsOn: [],
    note: 'initial note',
    source: 'architect-specialist',
    ...overrides,
  };
}

describe('formatDiff', () => {
  it('reports added items in a category', () => {
    const a = createEmptyCompiledPrompt('web');
    const b = createEmptyCompiledPrompt('web');
    b.userRequirements = [item('New requirement')];

    const diff = formatDiff(a, b);

    expect(diff.categories.userRequirements.added).toEqual([item('New requirement')]);
    expect(diff.categories.userRequirements.removed).toEqual([]);
  });

  it('reports removed items in a category', () => {
    const a = createEmptyCompiledPrompt('web');
    a.constraints = [item('Old constraint')];
    const b = createEmptyCompiledPrompt('web');

    const diff = formatDiff(a, b);

    expect(diff.categories.constraints.removed).toEqual([item('Old constraint')]);
    expect(diff.categories.constraints.added).toEqual([]);
  });

  it('does not report unchanged items as added or removed, regardless of order', () => {
    const a = createEmptyCompiledPrompt('web');
    a.preferences = [item('Fast'), item('Cheap')];
    const b = createEmptyCompiledPrompt('web');
    b.preferences = [item('Cheap'), item('Fast')];

    const diff = formatDiff(a, b);

    expect(diff.categories.preferences.added).toEqual([]);
    expect(diff.categories.preferences.removed).toEqual([]);
  });

  it('reports changed top-level scalar fields', () => {
    const a = createEmptyCompiledPrompt('web');
    a.mission = 'Build a site';
    const b = createEmptyCompiledPrompt('web');
    b.mission = 'Build a better site';
    b.outputFormat = 'markdown';

    const diff = formatDiff(a, b);

    expect(diff.fieldChanges).toEqual(
      expect.arrayContaining([
        { field: 'mission', from: 'Build a site', to: 'Build a better site' },
        { field: 'outputFormat', from: undefined, to: 'markdown' },
      ])
    );
    expect(diff.fieldChanges.length).toBe(2);
  });

  it('reports added, removed, and changed architecture notes', () => {
    const a = createEmptyCompiledPrompt('web');
    a.architecture = [note('auth', { note: 'v1' }), note('db')];
    const b = createEmptyCompiledPrompt('web');
    b.architecture = [note('auth', { note: 'v2' }), note('cache')];

    const diff = formatDiff(a, b);

    expect(diff.architecture.added).toEqual([note('cache')]);
    expect(diff.architecture.removed).toEqual([note('db')]);
    expect(diff.architecture.changed).toEqual([
      { component: 'auth', from: note('auth', { note: 'v1' }), to: note('auth', { note: 'v2' }) },
    ]);
  });

  it('does not mutate either input CompiledPrompt', () => {
    const a = createEmptyCompiledPrompt('web');
    a.userRequirements = [item('A')];
    a.architecture = [note('x')];
    const b = createEmptyCompiledPrompt('web');
    b.userRequirements = [item('B')];
    b.architecture = [note('y')];

    const aSnapshot = JSON.parse(JSON.stringify(a));
    const bSnapshot = JSON.parse(JSON.stringify(b));

    formatDiff(a, b);

    expect(a).toEqual(aSnapshot);
    expect(b).toEqual(bSnapshot);
  });
});
