// Canonical prompt representation types for the lucid/SINVAUX compiler.
// Pure TypeScript, zero runtime dependencies, zero Tauri/AI-API dependency.
// See docs/superpowers/specs/2026-08-11-lucid-compiler-phase1-design.md

export type DomainId = 'web' | 'game' | 'branding' | 'software-development' | 'mobile-development' | 'desktop-development' | 'unity' | 'unreal' | 'roblox' | 'blender' | 'graphic-design' | 'image-generation' | 'video-generation' | 'music' | 'writing' | 'research' | 'business' | 'marketing' | 'product-design' | 'education' | 'data-analysis' | 'automation';

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

export interface CompiledPrompt {
  mission?: string;
  context?: string;
  objective?: string;
  role?: string;
  domain: DomainId | 'unknown';
  userRequirements: RequirementItem[];
  nonNegotiables: RequirementItem[];
  preferences: RequirementItem[];
  constraints: RequirementItem[];
  assumptions: RequirementItem[];
  functionalRequirements: RequirementItem[];
  architecture?: ArchitectureNote[];
  outputFormat?: string;
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
  };
}
