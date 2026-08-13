import type { DomainModule } from '../types.js';

/**
 * The fallback domain, used when no other domain module's keyword score
 * clears DOMAIN_CONFIDENCE_FLOOR — i.e. every request Scaffold doesn't
 * recognize as one of its named domains still gets real structure instead
 * of an empty compile. `score` always returns 0: this module never wins by
 * outscoring a real domain, it only wins when nothing else qualifies (see
 * domainDetection.ts's fallback logic).
 *
 * Content here is deliberately domain-agnostic — it asks the same questions
 * a competent generalist would ask about ANY deliverable (what is it, who
 * is it for, what does done look like, what constrains it), rather than
 * guessing at a specific field. This is the honest ceiling of a
 * zero-AI/deterministic system: it can't infer domain-specific expertise
 * for a request it doesn't recognize, but it can still make sure nothing
 * obvious gets skipped.
 */
export const genericDomain: DomainModule = {
  id: 'generic',
  label: 'General / Uncategorized',
  score(): number {
    return 0;
  },
  defaultRequirements: [
    { text: 'State the concrete deliverable — what artifact, output, or outcome this produces', category: 'functional' },
    { text: 'Define what "done" looks like — the acceptance/success condition', category: 'functional' },
    { text: 'Note any hard constraints (budget, timeline, platform, format) that bound the work', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'deliverable type',
      description: 'What concrete thing this produces (document, code, image, plan, other) is unclear',
      isResolved: (input) =>
        /\b(build|create|write|design|make|generate|draft|produce|develop|plan|compile)\b/i.test(input) && input.trim().split(/\s+/).length > 3,
    },
    {
      field: 'audience',
      description: 'Who this is for (end user, reader, customer, internal team) is unspecified',
      isResolved: (input) => /\b(for|audience|users?|readers?|customers?|team|myself|client)\b/i.test(input),
    },
    {
      field: 'success criteria',
      description: 'How to tell the result is correct/good/finished is unspecified',
      isResolved: (input) => /\b(so that|so it|must|should|needs? to|goal|success|acceptance|done when)\b/i.test(input),
    },
    {
      field: 'constraints',
      description: 'No budget, timeline, platform, or format constraint was mentioned',
      isResolved: (input) => /\b(budget|deadline|by (?:tomorrow|next|end of)|timeline|platform|format|under \$?\d|within \d)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'clarify scope', dependsOn: [], note: 'Pin down exactly what deliverable is being produced and in what format' },
    { component: 'plan approach', dependsOn: ['clarify scope'], note: 'Decide the steps/method to get from the raw request to the deliverable' },
    { component: 'produce', dependsOn: ['plan approach'], note: 'Do the actual work of creating the deliverable' },
    { component: 'review', dependsOn: ['produce'], note: 'Check the result against the stated success criteria before calling it done' },
  ],
  technicalConsiderations: [
    { aspect: 'format', note: 'Specify the exact output format/file type expected (document, code, image, spreadsheet, etc.)', category: 'functionalRequirements' },
    { aspect: 'tooling', note: 'Note any specific tool, platform, or technology this must be produced in or compatible with', category: 'preferences' },
    { aspect: 'scale', note: 'Clarify the scale/scope (one item vs many, small vs large) so effort is calibrated correctly', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'audience fit', note: 'Consider who will actually use or read the result and what they need from it', category: 'functionalRequirements' },
    { aspect: 'clarity', note: 'Prefer a result that is understandable on its own without extra explanation', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'sensitive content', note: 'Flag if the request involves personal, financial, or otherwise sensitive information that needs careful handling', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'tone', note: 'Consider what tone/voice fits the intended audience and purpose', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'contradiction check', note: 'Check the stated requirements for internal contradictions before finalizing', category: 'constraints' },
    { aspect: 'missing requirement', note: 'Identify anything the request clearly implies but never states outright', category: 'functionalRequirements' },
    { aspect: 'acceptance criteria', note: 'Define a concrete way to verify the result actually satisfies the request', category: 'functionalRequirements' },
  ],
  constraintConsiderations: [
    {
      aspect: 'scope vs timeline',
      note: 'An open-ended or large-sounding scope paired with an extremely short timeline is a common source of failed delivery — flag it rather than silently ignore it.',
      category: 'constraints',
      triggerA: /\b(everything|comprehensive|full|complete|entire|all of)\b/i,
      triggerB: /\b(by tomorrow|today|this hour|right now|asap|in \d+ min)\b/i,
    },
  ],
};
