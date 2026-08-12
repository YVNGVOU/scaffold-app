import type { PipelineState, RequirementCategory } from '../state.js';
import type { RequirementItem } from '@lucid/schema';
import { DOMAIN_MODULES } from '../../domains/index.js';
import { extractModalClauses } from '../../nlp/index.js';

// Bounded quantifiers ({0,200}) instead of unbounded (*) — an unbounded
// [^.!?\n]* on very long punctuation-free input (e.g. a 200k-char string)
// causes the regex engine to re-scan large spans at every start position,
// which is quadratic and can take 100+ seconds. Bounding the span keeps
// per-position work constant while still matching realistic sentences.
// Kept as the legacy fallback path (used only if the nlp-based extractor
// throws) — extractModalClauses (../../nlp/index.js) uses this exact same
// bounded-regex strategy internally as its first pass, so this list stays
// in sync with it.
const EXPLICIT_PATTERNS = [
  /[^.!?\n]{0,200}\bmust\b[^.!?\n]{0,200}/gi,
  /[^.!?\n]{0,200}\bneeds? to\b[^.!?\n]{0,200}/gi,
  /[^.!?\n]{0,200}\bshould\b[^.!?\n]{0,200}/gi,
  /[^.!?\n]{0,200}\brequires?\b[^.!?\n]{0,200}/gi,
];

const DEFAULT_CATEGORY_MAP: Record<'functional' | 'constraint' | 'preference', RequirementCategory> = {
  functional: 'functionalRequirements',
  constraint: 'constraints',
  preference: 'preferences',
};

/** Stage 3: pull explicit user requirements out of raw text, plus domain defaults. */
export function requirementExtraction(state: PipelineState): PipelineState {
  const newItems: RequirementItem[] = [];
  const newCategories: RequirementCategory[] = [];
  const seen = new Set<string>();

  try {
    const clauses = extractModalClauses(state.rawInput);
    for (const clause of clauses) {
      const text = clause.text;
      if (!text || seen.has(text.toLowerCase())) continue;
      seen.add(text.toLowerCase());
      newItems.push({
        text,
        kind: 'user',
        source: 'user-input',
        confidence: 1,
        evidence: [
          `matched explicit ${clause.modal} requirement phrase in raw input`,
          // Negation is a real, testable behavior difference from the old
          // regex-only extractor: "must not include X" and "must include X"
          // now produce distinguishably different items (different evidence
          // tag AND different target category — see below).
          clause.negated ? 'negated:true (this clause excludes the stated item)' : 'negated:false',
        ],
        status: 'accepted',
      });
      // A negated modal clause ("must NOT include tracking") is inherently a
      // constraint (a thing to avoid), not a positive user requirement to
      // fulfill — route it accordingly instead of lumping it in with
      // positive asks.
      newCategories.push(clause.negated ? 'constraints' : 'userRequirements');
    }
  } catch {
    // Fallback: legacy bounded-regex-only extraction, preserved so a parser
    // failure never regresses below pre-TASK-002 behavior.
    for (const pattern of EXPLICIT_PATTERNS) {
      const matches = state.rawInput.match(pattern) ?? [];
      for (const raw of matches) {
        const text = raw.trim();
        if (!text || seen.has(text.toLowerCase())) continue;
        seen.add(text.toLowerCase());
        newItems.push({
          text,
          kind: 'user',
          source: 'user-input',
          confidence: 1,
          evidence: ['matched explicit requirement phrase in raw input (fallback path)'],
          status: 'accepted',
        });
        newCategories.push('userRequirements');
      }
    }
  }

  const domainModule = DOMAIN_MODULES.find((d) => d.id === state.domain);
  if (domainModule) {
    for (const def of domainModule.defaultRequirements) {
      newItems.push({
        text: def.text,
        kind: 'default',
        source: `domain:${domainModule.id}`,
        confidence: 0.6,
        evidence: [`domain:${domainModule.id} default requirement category:${def.category}`],
        status: 'pending',
      });
      newCategories.push(DEFAULT_CATEGORY_MAP[def.category]);
    }
  }

  return {
    ...state,
    requirements: [...state.requirements, ...newItems],
    requirementCategories: [...state.requirementCategories, ...newCategories],
    stagesRun: [...state.stagesRun, 'requirementExtraction'],
  };
}
