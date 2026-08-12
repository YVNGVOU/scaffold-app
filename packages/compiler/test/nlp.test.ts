import { describe, it, expect } from 'vitest';
import {
  parseSentences,
  getMainVerbPhrase,
  isNegated,
  extractModalClauses,
  synonymNormalize,
} from '../src/nlp/index.js';
import { buildSynonymIndex, PLATFORM_LEXICON, CONCEPT_LEXICON } from '../src/nlp/lexicon.js';

describe('nlp.parseSentences', () => {
  it('splits multi-sentence text into individual sentences', () => {
    const sentences = parseSentences('Build a website. It must support checkout. Should be fast.');
    expect(sentences.length).toBe(3);
    expect(sentences[0]).toMatch(/Build a website/);
  });

  it('returns [] for empty/whitespace input without throwing', () => {
    expect(parseSentences('')).toEqual([]);
    expect(parseSentences('   \n\t ')).toEqual([]);
  });
});

describe('nlp.getMainVerbPhrase', () => {
  it('extracts verb + object from an imperative sentence', () => {
    const result = getMainVerbPhrase('Build a responsive website for a bakery');
    expect(result).not.toBeNull();
    expect(result!.verb).toBe('build');
    expect(result!.isNegated).toBe(false);
  });

  it('detects negation on the main verb', () => {
    const result = getMainVerbPhrase('The app must not include microtransactions');
    expect(result).not.toBeNull();
    expect(result!.isNegated).toBe(true);
  });

  it('returns null for a fragment with no verb', () => {
    expect(getMainVerbPhrase('')).toBeNull();
  });
});

describe('nlp.isNegated', () => {
  it('detects negation in a negative clause', () => {
    expect(isNegated('must not include microtransactions')).toBe(true);
  });

  it('does not flag a positive clause as negated', () => {
    expect(isNegated('must include microtransactions')).toBe(false);
  });
});

describe('nlp.extractModalClauses', () => {
  it('distinguishes a negated modal clause from a positive one', () => {
    const negative = extractModalClauses('The game must not include microtransactions.');
    const positive = extractModalClauses('The game must include microtransactions.');
    expect(negative.length).toBeGreaterThan(0);
    expect(positive.length).toBeGreaterThan(0);
    expect(negative[0].negated).toBe(true);
    expect(positive[0].negated).toBe(false);
  });

  it('extracts should/need-to/requires clauses', () => {
    const clauses = extractModalClauses(
      'It should be mobile friendly. The team needs to ship by Friday. This requires a database.'
    );
    const modals = clauses.map((c) => c.modal);
    expect(modals).toContain('should');
    expect(modals).toContain('need to');
    expect(modals).toContain('requires');
  });

  it('handles a 50k+ character input in well under a second', () => {
    const longInput = 'The app must support fast checkout and should not use tracking. '.repeat(800);
    expect(longInput.length).toBeGreaterThan(50000);
    const start = Date.now();
    const clauses = extractModalClauses(longInput);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(1000);
    expect(clauses.length).toBeGreaterThan(0);
  });
});

describe('nlp.synonymNormalize', () => {
  it('normalizes a platform synonym to its canonical form', () => {
    const index = buildSynonymIndex(PLATFORM_LEXICON);
    const normalized = synonymNormalize('Build this for iPhone', index);
    expect(normalized.toLowerCase()).toContain('mobile');
  });

  it('normalizes a concept synonym (app -> application) without literal string present', () => {
    const index = buildSynonymIndex(CONCEPT_LEXICON);
    const normalized = synonymNormalize('make an app for tracking tasks', index);
    expect(normalized.toLowerCase()).toContain('application');
  });
});
