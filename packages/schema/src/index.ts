// Canonical prompt representation types for the lucid/SINVAUX compiler.
// Pure TypeScript, zero runtime dependencies, zero Tauri/AI-API dependency.
// See docs/superpowers/specs/2026-08-11-lucid-compiler-phase1-design.md

export type DomainId = 'web' | 'game' | 'branding' | 'software-development' | 'mobile-development' | 'desktop-development' | 'unity' | 'unreal' | 'roblox' | 'blender' | 'graphic-design' | 'image-generation' | 'video-generation' | 'music' | 'writing' | 'research' | 'business' | 'marketing' | 'product-design' | 'education' | 'data-analysis' | 'automation' | 'legal' | 'healthcare' | 'finance' | 'real-estate' | 'devops-infrastructure' | 'cybersecurity' | 'e-commerce' | 'hardware-iot' | 'animation' | 'podcast-audio' | 'fashion' | 'architecture-interior' | 'agriculture' | 'hospitality-travel' | 'sports-fitness' | 'nonprofit-civic' | 'localization-translation' | 'accessibility' | 'menu-design' | 'print-collateral' | 'resume-cv' | 'event-invitations' | 'presentation-deck' | 'social-media-graphics' | 'small-business-branding' | 'recipe-cookbook' | 'greeting-card-stationery' | 'personal-website-portfolio' | 'generic';

export type RequirementKind =
  | 'user'
  | 'inferred'
  | 'default'
  | 'assumption'
  | 'recommendation'
  | 'unresolved'
  | 'rejected';

export type RequirementStatus = 'accepted' | 'pending' | 'rejected';

export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * A single requirement-shaped fact about the compiled prompt.
 *
 * Provenance is permanent: once created, a RequirementItem's `kind` is never
 * mutated in place. Superseding an item means appending a new RequirementItem
 * whose `source` references the old item (e.g. `source: 'supersedes:<prior-source>'`),
 * never editing the original's kind/text to change its meaning.
 */
export interface RequirementItem {
  text: string;
  kind: RequirementKind;
  /** e.g. "architect-specialist", "user-input", "domain:web" */
  source: string;
  /** 0-1 */
  confidence: number;
  evidence: string[];
  risk?: RiskLevel;
  status: RequirementStatus;
}

export interface ArchitectureNote {
  component: string;
  dependsOn: string[];
  note: string;
  source: string;
}

/**
 * Canonical state v1: a locked, user-decided fact about one ambiguity
 * checklist field (see each domain module's `ambiguityChecklist`). This is
 * Priority-1 in the precedence model — a canonical fact is written ONLY by
 * `mergeAnswer` (an explicit user answer to an unresolved question) and is
 * NEVER overwritten automatically by any specialist/critique/synthesis
 * stage. It exists alongside (not instead of) the matching entry in
 * `userRequirements` — that array is the append-only provenance record;
 * `canonicalState` is the deduplicated, keyed, "what do we currently know
 * for certain" view, one entry per field, always reflecting the LATEST
 * answer if a field is somehow answered more than once.
 *
 * Scope, stated honestly: this is v1. Specialists do not yet read
 * `canonicalState` to change their own recommendations, and there is no
 * automated ACCEPT/REJECT resolver checking specialist proposals against it
 * for semantic conflicts — building that requires a per-domain link from
 * each specialist consideration to the checklist field it concerns, which
 * doesn't exist yet across the 68 domain modules. What v1 DOES guarantee:
 * an answered field is locked, visible as its own structured fact (not just
 * buried in a text list), rendered in its own "Locked Requirements" section
 * ahead of everything else in every export, and never silently reverted.
 */
export interface CanonicalFact {
  /** The literal answer text, verbatim — never paraphrased/inferred. */
  value: string;
  /** Always 1.0 for a direct user answer (v1's only fact source). Kept as a
   * field rather than a hardcoded constant so a future fact source (e.g. an
   * inferred-with-high-confidence extraction) can slot in without a schema change. */
  confidence: number;
  /** v1 only ever writes 'user' — reserved for future non-user fact sources. */
  source: 'user';
  /** The unresolved item's description text this fact answers, for traceability. */
  evidence: string[];
}

/**
 * Key format: `${domainId}::${checklistFieldKey}`, e.g.
 * `"menu-design::menu format"` — derived from the unresolved RequirementItem's
 * `source` string, which ambiguityDetection.ts already encodes as
 * `domain:<id>:ambiguity-checklist:<field>` (see canonicalState.ts's
 * `parseFieldKey`), so no domain module needs to change to support this.
 */
export type CanonicalState = Record<string, CanonicalFact>;

export interface CompiledPrompt {
  mission?: string;
  context?: string;
  objective?: string;
  role?: string;
  domain: DomainId | 'unknown';
  /** 0-1, how strongly the winning domain scored vs. the confidence floor. Optional — only set when domain detection genuinely ran (ARCHITECT/MASTER modes). */
  domainConfidence?: number;
  /** Raw per-domain scores from detection, for transparency into why this domain won over others. Optional, same conditions as domainConfidence. */
  domainScores?: Record<string, number>;
  userRequirements: RequirementItem[];
  nonNegotiables: RequirementItem[];
  preferences: RequirementItem[];
  constraints: RequirementItem[];
  assumptions: RequirementItem[];
  functionalRequirements: RequirementItem[];
  architecture?: ArchitectureNote[];
  outputFormat?: string;
  /** See CanonicalState's doc comment. Always present (possibly empty) once
   * synthesis has run at least once; optional only for pre-synthesis shells. */
  canonicalState?: CanonicalState;
}

/** Creates an empty CompiledPrompt shell for the given domain. */
export function createEmptyCompiledPrompt(domain: DomainId | 'unknown'): CompiledPrompt {
  return {
    domain,
    userRequirements: [],
    nonNegotiables: [],
    preferences: [],
    constraints: [],
    assumptions: [],
    functionalRequirements: [],
    canonicalState: {},
  };
}
