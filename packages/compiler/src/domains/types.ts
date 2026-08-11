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

export interface DomainModule {
  id: DomainId;
  label: string;
  /** Deterministic keyword/pattern scoring function, returns a raw score >= 0. */
  score: (input: string) => number;
  defaultRequirements: DomainDefaultRequirement[];
  ambiguityChecklist: AmbiguityField[];
  architectureTemplate: ArchitectureComponentTemplate[];
}
