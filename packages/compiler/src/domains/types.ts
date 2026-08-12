import type { DomainId } from '@lucid/schema';

/** One required-field check for ambiguity detection in a given domain. */
export interface AmbiguityField {
  /** short machine key, e.g. 'platform' */
  field: string;
  /** human-readable description surfaced in the UI's unresolved-items list */
  description: string;
  /** returns true if the raw input appears to address this field */
  isResolved: (input: string) => boolean;
}

/** A default requirement category applied when the domain is detected. */
export interface DomainDefaultRequirement {
  text: string;
  category: 'functional' | 'constraint' | 'preference';
}

/** One component in a domain's architecture template, used by the ARCHITECT specialist. */
export interface ArchitectureComponentTemplate {
  component: string;
  dependsOn: string[];
  note: string;
}

/**
 * One technical-domain consideration (technology/implementation/dependency/
 * compatibility/performance/scalability/risk), used by the TECHNICAL specialist.
 * `category` targets the CompiledPrompt section the resulting RequirementItem
 * is routed into when the consideration isn't already addressed by the user.
 */
export interface TechnicalConsideration {
  /** short machine key/topic, e.g. 'hosting', 'engine', 'file format' */
  aspect: string;
  note: string;
  category: 'constraints' | 'functionalRequirements' | 'preferences';
}

/**
 * One UX-domain consideration (user flow, interaction hierarchy,
 * accessibility, usability, information architecture, edge cases), used by
 * the UX specialist. Same shape as `TechnicalConsideration` — reused rather
 * than duplicated since both are "aspect + note + routing category" tuples.
 */
export type UxConsideration = TechnicalConsideration;

/**
 * One security-domain consideration (privacy, authentication, authorization,
 * data exposure, unsafe assumptions, security requirements), used by the
 * SECURITY specialist. Same shape as `TechnicalConsideration`/`UxConsideration`
 * — reused rather than duplicated since all three are "aspect + note + routing
 * category" tuples.
 */
export type SecurityConsideration = TechnicalConsideration;

/**
 * One creative-domain consideration (visual direction, originality,
 * consistency, composition, style, creative opportunities), used by the
 * CREATIVE specialist. Same shape as `TechnicalConsideration`/`UxConsideration`/
 * `SecurityConsideration` — reused rather than duplicated since all four are
 * "aspect + note + routing category" tuples.
 */
export type CreativeConsideration = TechnicalConsideration;

/**
 * One QA-domain consideration (breaking the spec, missing requirements,
 * contradictions, acceptance criteria, test cases, failure states), used by
 * the QA specialist. Same shape as `TechnicalConsideration`/`UxConsideration`/
 * `SecurityConsideration`/`CreativeConsideration` — reused rather than
 * duplicated since all five are "aspect + note + routing category" tuples.
 */
export type QaConsideration = TechnicalConsideration;

/**
 * One constraint-level infeasibility/high-risk-combination check, used by the
 * CONSTRAINT specialist. Structurally different from
 * `TechnicalConsideration`/`UxConsideration`/`SecurityConsideration`/
 * `CreativeConsideration`/`QaConsideration`: those are single-aspect
 * "did the user address this" checks, while infeasibility is inherently about
 * two things being true at once (e.g. "no budget" + "custom engine"), so each
 * entry carries a PAIR of raw-input signals (`triggerA`/`triggerB`) that are
 * only flagged when both match together. Regexes must be word-boundary-safe
 * (`\b`-delimited), same discipline as domain `KEYWORDS` scoring.
 */
export interface ConstraintConsideration {
  /** short machine key/topic, e.g. 'budget vs scope' */
  aspect: string;
  /** describes why the combination is infeasible or high-risk */
  note: string;
  category: 'constraints' | 'functionalRequirements' | 'preferences';
  /** first half of the tension, tested against raw input */
  triggerA: RegExp;
  /** second half of the tension, tested against raw input */
  triggerB: RegExp;
}

export interface DomainModule {
  id: DomainId;
  label: string;
  /** Deterministic keyword/pattern scoring function, returns a raw score >= 0. */
  score: (input: string) => number;
  defaultRequirements: DomainDefaultRequirement[];
  ambiguityChecklist: AmbiguityField[];
  architectureTemplate: ArchitectureComponentTemplate[];
  /** Technical-domain considerations, read by the TECHNICAL specialist. */
  technicalConsiderations: TechnicalConsideration[];
  /** UX-domain considerations, read by the UX specialist. */
  uxConsiderations: UxConsideration[];
  /** Security-domain considerations, read by the SECURITY specialist. */
  securityConsiderations: SecurityConsideration[];
  /** Creative-domain considerations, read by the CREATIVE specialist. */
  creativeConsiderations: CreativeConsideration[];
  /** QA-domain considerations, read by the QA specialist. */
  qaConsiderations: QaConsideration[];
  /** Constraint-level infeasibility/high-risk-combination checks, read by the CONSTRAINT specialist. */
  constraintConsiderations: ConstraintConsideration[];
}
