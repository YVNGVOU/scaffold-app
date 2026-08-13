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
    { text: 'State who owns the final call on whether the result is acceptable if reviewer and requester differ', category: 'preference' },
    { text: 'Specify how the result will be delivered/handed off (file, message, live demo, link) so the deliverable does not stall at the last step', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'deliverable type',
      description: 'What concrete thing this produces (document, code, image, plan, other) is unclear',
      isResolved: (input) =>
        (/\b(build|create|write|design|make|generate|draft|produce|develop|plan|compile)\b/i.test(input) && input.trim().split(/\s+/).length > 3) ||
        /\b(document|report|code|script|image|graphic|spreadsheet|presentation|deck|plan|summary|analysis|proposal|template)\b/i.test(input),
    },
    {
      field: 'audience',
      description: 'Who this is for (end user, reader, customer, internal team) is unspecified',
      isResolved: (input) => /\b(for|audience|users?|readers?|customers?|team|myself|client|stakeholders?)\b/i.test(input),
    },
    {
      field: 'success criteria',
      description: 'How to tell the result is correct/good/finished is unspecified',
      isResolved: (input) => /\b(so that|so it|must|should|needs? to|goal|success|acceptance|done when|criteria)\b/i.test(input),
    },
    {
      field: 'constraints',
      description: 'No budget, timeline, platform, or format constraint was mentioned',
      isResolved: (input) => /\b(budget|deadline|by (?:tomorrow|next|end of)|timeline|platform|format|under \$?\d|within \d|no\s+budget|free)\b/i.test(input),
    },
    {
      field: 'length/scope',
      description: 'The expected size or scope of the deliverable (short vs comprehensive, one item vs a set) is unspecified',
      isResolved: (input) => /\b(short|brief|long|comprehensive|detailed|one[- ]pag(?:er?|e)|full|quick|high[- ]level|in[- ]depth)\b/i.test(input),
    },
    {
      field: 'existing material to build on',
      description: 'Whether this starts from scratch or builds on existing material (a draft, template, prior version) is unspecified',
      isResolved: (input) => /\b(from\s+scratch|existing|template|draft|prior|previous|based\s+on|attached|starting\s+point)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'clarify scope', dependsOn: [], note: 'Pin down exactly what deliverable is being produced and in what format' },
    { component: 'plan approach', dependsOn: ['clarify scope'], note: 'Decide the steps/method to get from the raw request to the deliverable' },
    { component: 'produce', dependsOn: ['plan approach'], note: 'Do the actual work of creating the deliverable' },
    { component: 'review', dependsOn: ['produce'], note: 'Check the result against the stated success criteria before calling it done' },
    { component: 'deliver/handoff', dependsOn: ['review'], note: 'Get the finished result to whoever needs it, in the format and channel they can actually use' },
  ],
  technicalConsiderations: [
    { aspect: 'format', note: 'Specify the exact output format/file type expected (document, code, image, spreadsheet, etc.)', category: 'functionalRequirements' },
    { aspect: 'tooling', note: 'Note any specific tool, platform, or technology this must be produced in or compatible with', category: 'preferences' },
    { aspect: 'scale', note: 'Clarify the scale/scope (one item vs many, small vs large) so effort is calibrated correctly', category: 'functionalRequirements' },
    { aspect: 'source material', note: 'Confirm whether this starts from scratch or must incorporate/preserve existing material (a draft, prior version, reference file)', category: 'functionalRequirements' },
    { aspect: 'revision path', note: 'Clarify how many revision rounds are expected and how feedback will be delivered, so iteration is not treated as scope creep', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'audience fit', note: 'Consider who will actually use or read the result and what they need from it', category: 'functionalRequirements' },
    { aspect: 'clarity', note: 'Prefer a result that is understandable on its own without extra explanation', category: 'preferences' },
    { aspect: 'context of use', note: 'Consider where/when the result will actually be consumed (skimmed on a phone, read in a meeting, referenced later) and shape it accordingly', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'sensitive content', note: 'Flag if the request involves personal, financial, or otherwise sensitive information that needs careful handling', category: 'constraints' },
    { aspect: 'sharing scope', note: 'Clarify whether the result is meant for private/internal use or wider distribution, since that changes what can safely be included', category: 'constraints' },
    { aspect: 'third-party material', note: 'If the deliverable incorporates someone else\'s text, image, or data, confirm the right to use and redistribute it', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'tone', note: 'Consider what tone/voice fits the intended audience and purpose', category: 'preferences' },
    { aspect: 'existing style to match', note: 'If the deliverable should match an existing house style, brand, or prior example, confirm that reference is available', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'contradiction check', note: 'Check the stated requirements for internal contradictions before finalizing', category: 'constraints' },
    { aspect: 'missing requirement', note: 'Identify anything the request clearly implies but never states outright', category: 'functionalRequirements' },
    { aspect: 'acceptance criteria', note: 'Define a concrete way to verify the result actually satisfies the request', category: 'functionalRequirements' },
    { aspect: 'completeness pass', note: 'Before calling it done, re-read the original request line by line and confirm every explicit ask was actually addressed', category: 'functionalRequirements' },
  ],
  constraintConsiderations: [
    {
      aspect: 'scope vs timeline',
      note: 'An open-ended or large-sounding scope paired with an extremely short timeline is a common source of failed delivery — flag it rather than silently ignore it.',
      category: 'constraints',
      triggerA: /\b(everything|comprehensive|full|complete|entire|all of)\b/i,
      triggerB: /\b(by tomorrow|today|this hour|right now|asap|in \d+ min)\b/i,
    },
    {
      aspect: 'no budget vs premium quality',
      note: 'A stated zero/near-zero budget alongside a demand for premium, professional-grade, or agency-quality output is a known-infeasible pairing — flag the tension rather than silently promising both.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(premium|professional[- ]grade|agency[- ]quality|world[- ]class|top[- ]tier)\b/i,
    },
  ],
};
