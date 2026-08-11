import type { Specialist } from '../types.js';

/**
 * Registry of all 7 specialists. Phase 1 registers ARCHITECT only.
 * The remaining six are typed interface stubs — commented entries below
 * show where their real rule engines will be registered in a future phase,
 * per docs/superpowers/specs/2026-08-11-lucid-compiler-phase1-design.md.
 */
export const SPECIALIST_REGISTRY: Partial<Record<string, Specialist>> = {
  // ARCHITECT is registered directly in the pipeline's architectSpecialistPass
  // stage rather than through this registry, since it is the only specialist
  // that actually runs in Phase 1.
  //
  // TECHNICAL: not implemented in Phase 1.
  // 'technical': technicalSpecialist,
  //
  // UX: not implemented in Phase 1.
  // 'ux': uxSpecialist,
  //
  // CREATIVE: not implemented in Phase 1.
  // 'creative': creativeSpecialist,
  //
  // QA: not implemented in Phase 1.
  // 'qa': qaSpecialist,
  //
  // SECURITY: not implemented in Phase 1.
  // 'security': securitySpecialist,
  //
  // CONSTRAINT: not implemented in Phase 1.
  // 'constraint': constraintSpecialist,
};
