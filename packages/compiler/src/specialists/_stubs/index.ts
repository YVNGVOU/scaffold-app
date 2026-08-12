import type { Specialist } from '../types.js';
import { technicalSpecialist } from '../technical/index.js';
import { uxSpecialist } from '../ux/index.js';
import { securitySpecialist } from '../security/index.js';
import { creativeSpecialist } from '../creative/index.js';
import { qaSpecialist } from '../qa/index.js';
import { constraintSpecialist } from '../constraint/index.js';

/**
 * Registry of all 7 specialists from the original brief. ARCHITECT,
 * TECHNICAL, UX, SECURITY, CREATIVE, QA, and CONSTRAINT are all real,
 * deterministic rule engines (TASK-001, TASK-003, TASK-004, TASK-007,
 * TASK-010, TASK-013, TASK-014) — this closes out the full 7-specialist
 * roster from docs/superpowers/specs/2026-08-11-lucid-compiler-phase1-design.md.
 */
export const SPECIALIST_REGISTRY: Partial<Record<string, Specialist>> = {
  // ARCHITECT is registered directly in the pipeline's architectSpecialistPass
  // stage rather than through this registry, since the pipeline runs a fixed
  // ARCHITECT-mode stage list rather than iterating this registry dynamically.
  //
  // TECHNICAL: real (TASK-003). Also registered directly in the pipeline's
  // technicalSpecialistPass stage, mirroring ARCHITECT's wiring.
  technical: technicalSpecialist,
  //
  // UX: real (TASK-004). Also registered directly in the pipeline's
  // uxSpecialistPass stage, mirroring ARCHITECT/TECHNICAL's wiring.
  ux: uxSpecialist,
  //
  // SECURITY: real (TASK-007). Also registered directly in the pipeline's
  // securitySpecialistPass stage, mirroring ARCHITECT/TECHNICAL/UX's wiring.
  security: securitySpecialist,
  //
  // CREATIVE: real (TASK-010). Also registered directly in the pipeline's
  // creativeSpecialistPass stage, mirroring ARCHITECT/TECHNICAL/UX/SECURITY's
  // wiring.
  creative: creativeSpecialist,
  //
  // QA: real (TASK-013). Also registered directly in the pipeline's
  // qaSpecialistPass stage, mirroring ARCHITECT/TECHNICAL/UX/SECURITY/
  // CREATIVE's wiring.
  qa: qaSpecialist,
  //
  // CONSTRAINT: real (TASK-014). Also registered directly in the pipeline's
  // constraintSpecialistPass stage, mirroring the other six specialists'
  // wiring. Last specialist slot in both ARCHITECT and MASTER pipelines.
  constraint: constraintSpecialist,
};
