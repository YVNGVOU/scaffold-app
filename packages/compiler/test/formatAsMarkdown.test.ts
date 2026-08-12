import { describe, it, expect } from 'vitest';
import { createEmptyCompiledPrompt, type RequirementItem } from '@lucid/schema';
import { formatAsMarkdown } from '../src/index.js';

function item(text: string, kind: RequirementItem['kind'] = 'user'): RequirementItem {
  return {
    text,
    kind,
    source: 'test',
    confidence: 1,
    evidence: [],
    status: 'accepted',
  };
}

describe('formatAsMarkdown', () => {
  it('renders mission/context/objective/role headers when present', () => {
    const compiled = createEmptyCompiledPrompt('web');
    compiled.mission = 'Build a portfolio site.';
    compiled.context = 'For a photographer.';
    compiled.objective = 'Ship a working v1.';
    compiled.role = 'You are a senior web developer.';

    const md = formatAsMarkdown(compiled);

    expect(md).toContain('# Compiled Prompt');
    expect(md).toContain('## Mission');
    expect(md).toContain('Build a portfolio site.');
    expect(md).toContain('## Context');
    expect(md).toContain('## Objective');
    expect(md).toContain('## Role');
  });

  it('omits sections with no content and no empty headers', () => {
    const compiled = createEmptyCompiledPrompt('web');
    const md = formatAsMarkdown(compiled);

    expect(md).not.toContain('## Mission');
    expect(md).not.toContain('## User Requirements');
    expect(md).not.toContain('## Architecture');
  });

  it('renders requirement items with their kind tag as list entries', () => {
    const compiled = createEmptyCompiledPrompt('web');
    compiled.userRequirements = [item('Must support dark mode', 'user')];
    compiled.nonNegotiables = [item('Must be accessible', 'assumption')];

    const md = formatAsMarkdown(compiled);

    expect(md).toContain('## User Requirements');
    expect(md).toContain('- [user] Must support dark mode');
    expect(md).toContain('## Non-Negotiables');
    expect(md).toContain('- [assumption] Must be accessible');
  });

  it('renders architecture notes with dependsOn suffix only when present', () => {
    const compiled = createEmptyCompiledPrompt('web');
    compiled.architecture = [
      { component: 'API', note: 'REST layer', dependsOn: ['DB'], source: 'test' },
      { component: 'DB', note: 'Postgres', dependsOn: [], source: 'test' },
    ];

    const md = formatAsMarkdown(compiled);

    expect(md).toContain('**API**: REST layer (depends on: DB)');
    expect(md).toContain('**DB**: Postgres');
    expect(md).not.toContain('Postgres (depends on:');
  });

  it('is a pure function that does not mutate its input', () => {
    const compiled = createEmptyCompiledPrompt('web');
    compiled.userRequirements = [item('Something')];
    const snapshot = JSON.stringify(compiled);

    formatAsMarkdown(compiled);

    expect(JSON.stringify(compiled)).toBe(snapshot);
  });
});
