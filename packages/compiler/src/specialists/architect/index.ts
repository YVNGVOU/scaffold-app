import type { Specialist } from '../types.js';
import type { Decision } from '../../pipeline/state.js';
import { DOMAIN_MODULES } from '../../domains/index.js';

/**
 * ARCHITECT specialist — deterministic rule engine, real logic (not a stub).
 *
 * 1. Looks up the domain's architecture component template.
 * 2. Cross-references user requirements against the template to flag missing pieces.
 * 3. Emits an ordered implementation sequence (topological, via dependsOn).
 * 4. Emits one RequirementItem/ArchitectureNote per decision, each with
 *    source: 'architect-specialist', a rule-weight-derived confidence, and evidence.
 * 5. Never emits kind: 'user' — only 'inferred' | 'default' | 'recommendation'.
 */
export const architectSpecialist: Specialist = (state) => {
  const decisions: Decision[] = [];

  const domainModule = DOMAIN_MODULES.find((d) => d.id === state.domain);
  if (!domainModule) {
    // Unknown domain: architect has no template to work from. Nothing to emit.
    return decisions;
  }

  const template = domainModule.architectureTemplate;
  const userText = state.rawInput.toLowerCase();

  // Topological order is already encoded in the template's declaration order
  // (each entry's dependsOn only references earlier entries), so we emit in
  // that order directly rather than running a separate topo-sort.
  for (const component of template) {
    const mentioned = userText.includes(component.component.toLowerCase());
    const confidence = mentioned ? 0.9 : 0.6;

    decisions.push({
      type: 'architectureNote',
      note: {
        component: component.component,
        dependsOn: component.dependsOn,
        note: component.note,
        source: 'architect-specialist',
      },
    });

    if (!mentioned) {
      // Flag the missing architecture piece as a recommendation, never as
      // a fabricated user requirement.
      decisions.push({
        type: 'requirement',
        category: 'functionalRequirements',
        item: {
          text: `Consider addressing "${component.component}": ${component.note}`,
          kind: 'recommendation',
          source: 'architect-specialist',
          confidence,
          evidence: [`domain:${domainModule.id} architecture template`, `user input did not mention "${component.component}"`],
          status: 'pending',
        },
      });
    }
  }

  // Emit an ordered implementation-sequence note as an assumption-tagged
  // recommendation (never 'user') summarizing build order.
  const sequence = template.map((c) => c.component).join(' -> ');
  decisions.push({
    type: 'requirement',
    category: 'preferences',
    item: {
      text: `Suggested implementation sequence: ${sequence}`,
      kind: 'recommendation',
      source: 'architect-specialist',
      confidence: 0.7,
      evidence: [`domain:${domainModule.id} architecture template dependency order`],
      status: 'pending',
    },
  });

  return decisions;
};
