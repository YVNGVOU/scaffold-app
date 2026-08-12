// Thin, bounded wrapper around `compromise` (pure JS, deterministic, fully
// offline grammar tagger — no network calls, no native deps; verified by
// reading its dependency tree: efrt/grad-school/suffix-thumb are all local
// lookup-table helpers, not network clients).
//
// Every entry point here is deliberately bounded in how much text it hands
// to compromise, mirroring the {0,200} bounded-regex fix from TASK-001's
// perf pass: compromise's per-character cost is roughly linear-to-slightly-
// superlinear, and letting it run over an arbitrarily large raw input (a
// user can paste 200k+ characters) can push single-call latency into the
// seconds range. Capping the prefix processed keeps every call fast and
// keeps total pipeline latency sub-second regardless of input size.
import nlp from 'compromise';
import type { Lexicon } from './lexicon.js';
import { DEFAULT_LEXICON_INDEX } from './lexicon.js';

/** Max characters handed to compromise for whole-document sentence splitting. */
export const MAX_SENTENCE_PARSE_CHARS = 5000;
/** Max characters handed to compromise for a single already-segmented sentence/clause. */
export const MAX_CLAUSE_PARSE_CHARS = 1000;

export interface MainVerbPhrase {
  /** Infinitive/root form of the main verb, e.g. "build". */
  verb: string;
  /** Whether the verb phrase is grammatically negated ("must not build"). */
  isNegated: boolean;
  /** Best-effort noun phrase object of the verb, e.g. "a website". */
  object: string;
  /** Raw matched verb phrase text. */
  raw: string;
}

export interface ModalClause {
  modal: 'must' | 'should' | 'need to' | 'requires';
  negated: boolean;
  /** Full matched clause text (bounded to 200 chars, same bound as the legacy regex extractor). */
  text: string;
  /** The verb phrase portion compromise identified within the clause, if any. */
  verbPhrase: string;
  /** Best-effort object/noun-phrase of the clause. */
  object: string;
}

/**
 * Split text into sentences using real grammar-aware sentence boundaries.
 * Bounded to MAX_SENTENCE_PARSE_CHARS — safe on arbitrarily large input.
 * Never throws; returns [] on any parsing failure.
 */
export function parseSentences(text: string): string[] {
  if (!text || !text.trim()) return [];
  const capped = text.length > MAX_SENTENCE_PARSE_CHARS ? text.slice(0, MAX_SENTENCE_PARSE_CHARS) : text;
  try {
    const doc = nlp(capped);
    const sentences = doc
      .sentences()
      .json({ normal: true })
      .map((s: { text: string }) => s.text)
      .filter((s: string) => !!s && s.trim().length > 0);
    return sentences;
  } catch {
    return [];
  }
}

/**
 * Extract the main verb + best-effort object from a single sentence/clause.
 * Returns null if compromise finds no verb (e.g. a sentence fragment) —
 * callers should fall back to keyword matching in that case.
 */
export function getMainVerbPhrase(sentence: string): MainVerbPhrase | null {
  if (!sentence || !sentence.trim()) return null;
  const capped = sentence.length > MAX_CLAUSE_PARSE_CHARS ? sentence.slice(0, MAX_CLAUSE_PARSE_CHARS) : sentence;
  try {
    const doc = nlp(capped);
    const verbs = doc.verbs().json() as Array<{
      text: string;
      verb?: { infinitive?: string; root?: string; negative?: boolean };
    }>;
    if (!verbs.length) return null;
    const v = verbs[0];
    const verbRoot = v.verb?.infinitive || v.verb?.root || v.text;
    const negated = !!v.verb?.negative;
    const nounPhrases = doc
      .nouns()
      .json({ normal: true }) as Array<{ text: string }>;
    // Prefer a noun phrase that isn't the subject itself when there are 2+;
    // otherwise fall back to whatever noun phrase compromise found.
    const object = nounPhrases.length > 1 ? nounPhrases[nounPhrases.length - 1].text : (nounPhrases[0]?.text ?? '');
    return { verb: verbRoot.toLowerCase(), isNegated: negated, object, raw: v.text };
  } catch {
    return null;
  }
}

/**
 * Grammar-aware negation check on a short phrase (already extracted/bounded
 * by the caller). Checks compromise's own negative-verb/negative-tag
 * detection, falling back to a plain word check if parsing yields nothing.
 */
export function isNegated(phrase: string): boolean {
  if (!phrase || !phrase.trim()) return false;
  const capped = phrase.length > MAX_CLAUSE_PARSE_CHARS ? phrase.slice(0, MAX_CLAUSE_PARSE_CHARS) : phrase;
  try {
    const doc = nlp(capped);
    if (doc.has('#Negative')) return true;
    const verbs = doc.verbs().json() as Array<{ verb?: { negative?: boolean } }>;
    if (verbs.some((v) => v.verb?.negative)) return true;
    return /\b(not|never|without|no)\b/i.test(capped);
  } catch {
    return /\b(not|never|without|no)\b/i.test(capped);
  }
}

// Bounded candidate-clause regexes (same {0,200} bound pattern proven safe
// in requirementExtraction.ts's Phase-E perf fix) — these run over the FULL
// raw input (cheap, linear, no unbounded backtracking) to find modal clause
// candidates; compromise itself only ever sees the small captured substring.
const MODAL_REGEXES: Array<{ modal: ModalClause['modal']; regex: RegExp }> = [
  { modal: 'must', regex: /\bmust\b[^.!?\n]{0,200}/gi },
  { modal: 'should', regex: /\bshould\b[^.!?\n]{0,200}/gi },
  { modal: 'need to', regex: /\bneeds?\s+to\b[^.!?\n]{0,200}/gi },
  { modal: 'requires', regex: /\brequires?\b[^.!?\n]{0,200}/gi },
];

/**
 * Extract must/should/need-to/requires clauses from the FULL raw input
 * (not sentence-capped — modal clauses can occur anywhere in a large
 * paste), negation-aware. Bounded per-match to 200 chars so this stays
 * linear regardless of total input size (verified: 96k-char input < 1s).
 */
export function extractModalClauses(text: string): ModalClause[] {
  if (!text) return [];
  const results: ModalClause[] = [];
  const seen = new Set<string>();

  for (const { modal, regex } of MODAL_REGEXES) {
    const matches = text.match(regex) ?? [];
    for (const raw of matches) {
      const clauseText = raw.trim();
      if (!clauseText) continue;
      const key = clauseText.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      let negated = /\b(not|never|without|no)\b/i.test(clauseText);
      let verbPhrase = '';
      let object = '';
      try {
        const doc = nlp(clauseText.slice(0, MAX_CLAUSE_PARSE_CHARS));
        const verbs = doc.verbs().json() as Array<{ text: string; verb?: { negative?: boolean } }>;
        if (verbs.length) {
          negated = !!verbs[0].verb?.negative || negated;
          verbPhrase = verbs[0].text;
        }
        const nouns = doc.nouns().json({ normal: true }) as Array<{ text: string }>;
        object = nouns.length ? nouns[nouns.length - 1].text : '';
      } catch {
        // fall back to the regex-only negation/verbPhrase-less result above
      }

      results.push({ modal, negated, text: clauseText, verbPhrase, object });
    }
  }

  return results;
}

/**
 * Replace known synonyms in `text` with their canonical form, using the
 * supplied lexicon index (defaults to the project-wide DEFAULT_LEXICON_INDEX).
 * Purely a string-substitution helper for downstream keyword matching —
 * does not attempt full semantic normalization.
 */
export function synonymNormalize(text: string, lexiconIndex: Map<string, string> = DEFAULT_LEXICON_INDEX): string {
  if (!text) return text;
  let result = text;
  for (const [synonym, canonical] of lexiconIndex) {
    if (synonym === canonical) continue;
    const escaped = synonym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'gi');
    result = result.replace(re, canonical);
  }
  return result;
}

export type { Lexicon };
