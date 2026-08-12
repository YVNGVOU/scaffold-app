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

  describe('output-target profiles (TASK-021)', () => {
    function buildCompiled() {
      const compiled = createEmptyCompiledPrompt('web');
      compiled.mission = 'Build a portfolio site.';
      compiled.userRequirements = [item('Must support dark mode', 'user')];
      compiled.nonNegotiables = [item('Must be accessible', 'assumption')];
      compiled.constraints = [item('Budget under $500', 'constraint')];
      return compiled;
    }

    it('defaults to the generic profile with no framing line', () => {
      const compiled = buildCompiled();
      const md = formatAsMarkdown(compiled);
      expect(md).toContain('# Compiled Prompt');
      expect(md).toContain('Target profile: Generic AI');
    });

    it('claude profile has a distinguishing title/framing line', () => {
      const md = formatAsMarkdown(buildCompiled(), 'claude');
      expect(md).toContain('Target profile: Claude');
      expect(md).toContain('Claude conversation');
    });

    it('chatgpt profile has a distinguishing framing line', () => {
      const md = formatAsMarkdown(buildCompiled(), 'chatgpt');
      expect(md).toContain('Target profile: ChatGPT');
      expect(md).toContain('ChatGPT');
    });

    it('coding-agent profile uses a distinct title and puts non-negotiables first', () => {
      const md = formatAsMarkdown(buildCompiled(), 'coding-agent');
      expect(md).toContain('# Task Specification');
      expect(md).toContain('## Non-Negotiables (must satisfy)');
      const nonNegIdx = md.indexOf('Non-Negotiables (must satisfy)');
      const userReqIdx = md.indexOf('## User Requirements');
      expect(nonNegIdx).toBeGreaterThan(-1);
      expect(nonNegIdx).toBeLessThan(userReqIdx);
    });

    it('image-model profile uses a distinct title and relabels Role', () => {
      const compiled = buildCompiled();
      compiled.role = 'Photorealistic studio lighting.';
      const md = formatAsMarkdown(compiled, 'image-model');
      expect(md).toContain('# Image Prompt Brief');
      expect(md).toContain('## Style / Role');
    });

    it('never changes the underlying requirement/data content across profiles, only formatting', () => {
      const compiled = buildCompiled();
      const profiles: Array<Parameters<typeof formatAsMarkdown>[1]> = [
        'generic',
        'claude',
        'chatgpt',
        'coding-agent',
        'image-model',
      ];
      for (const profile of profiles) {
        const md = formatAsMarkdown(compiled, profile);
        expect(md).toContain('Must support dark mode');
        expect(md).toContain('Must be accessible');
        expect(md).toContain('Budget under $500');
        expect(md).toContain('Build a portfolio site.');
      }
    });

    it('does not mutate its input across any profile', () => {
      const compiled = buildCompiled();
      const snapshot = JSON.stringify(compiled);
      formatAsMarkdown(compiled, 'coding-agent');
      formatAsMarkdown(compiled, 'image-model');
      expect(JSON.stringify(compiled)).toBe(snapshot);
    });
  });
});
