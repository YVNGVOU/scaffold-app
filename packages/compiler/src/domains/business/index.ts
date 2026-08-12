import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching would let a keyword
// like 'plan' match inside unrelated words, or 'market' inside 'supermarket',
// silently inflating scores on inputs that have nothing to do with business
// planning/strategy.
const KEYWORDS = [
  'business plan', 'business model', 'target market', 'go-to-market',
  'go to market', 'competitive landscape', 'competitor analysis', 'startup',
  'revenue model', 'pricing strategy', 'market research', 'value proposition',
  'financial projections', 'investors', 'monetization',
  'customer acquisition', 'market fit', 'swot analysis', 'roi',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const businessDomain: DomainModule = {
  id: 'business',
  label: 'Business',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define the core business model and revenue streams', category: 'functional' },
    { text: 'Identify and describe the target market/customer segment', category: 'functional' },
    { text: 'State key financial assumptions (costs, pricing, projected revenue)', category: 'constraint' },
    { text: 'Outline a go-to-market approach for reaching first customers', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'target market',
      description: 'The target customer segment/market is unspecified',
      isResolved: (input) => /\b(target market|target customers?|target audience|demographic|b2b|b2c|smb|enterprise customers?)\b/i.test(input),
    },
    {
      field: 'revenue model',
      description: 'How the business makes money (revenue/pricing model) is unspecified',
      isResolved: (input) => /\b(revenue model|subscription|pricing|freemium|one-time purchase|commission|monetiz\w*)\b/i.test(input),
    },
    {
      field: 'competitive landscape',
      description: 'Competitors or competitive positioning is unaddressed',
      isResolved: (input) => /\b(competitors?|competitive landscape|competing with|alternatives? to|market leaders?)\b/i.test(input),
    },
    {
      field: 'financial assumptions',
      description: 'Financial assumptions (budget, costs, funding, margins) are unspecified',
      isResolved: (input) => /\b(budget|funding|startup costs?|margins?|financial projections?|burn rate|runway)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'market analysis', dependsOn: [], note: 'Research target market size, segments, and customer needs' },
    { component: 'business model', dependsOn: ['market analysis'], note: 'Define value proposition, revenue streams, and cost structure' },
    { component: 'competitive analysis', dependsOn: ['market analysis'], note: 'Map competitors and identify differentiation/positioning' },
    { component: 'financial plan', dependsOn: ['business model'], note: 'Build revenue/cost projections and key assumptions' },
    { component: 'go-to-market plan', dependsOn: ['business model', 'competitive analysis'], note: 'Define launch channels, customer acquisition strategy, and pricing rollout' },
  ],
  technicalConsiderations: [
    { aspect: 'data sources', note: 'Identify what market/financial data sources back the assumptions (surveys, industry reports, comparable companies)', category: 'functionalRequirements' },
    { aspect: 'unit economics', note: 'Define customer acquisition cost (CAC), lifetime value (LTV), and margin assumptions with explicit inputs', category: 'functionalRequirements' },
    { aspect: 'forecasting method', note: 'State the forecasting method used for revenue/growth projections (bottom-up vs top-down) so assumptions are auditable', category: 'preferences' },
    { aspect: 'tooling', note: 'Specify what tools/spreadsheets/CRM will be used to track the plan and its metrics over time', category: 'preferences' },
    { aspect: 'scalability of operations', note: 'Consider operational bottlenecks (fulfillment, support, hiring) that could break the model at 10x scale', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'customer journey', note: 'Map the customer journey from awareness to purchase to retention to identify where the plan is thin', category: 'functionalRequirements' },
    { aspect: 'onboarding friction', note: 'Consider friction points in customer onboarding/first purchase that could suppress conversion', category: 'preferences' },
    { aspect: 'pricing presentation', note: 'Define how pricing tiers/plans are presented to avoid confusing or overwhelming prospective customers', category: 'preferences' },
    { aspect: 'stakeholder communication', note: 'Consider how the plan will be communicated to investors, partners, or internal stakeholders (deck vs document vs summary)', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'confidential financials', note: 'Flag which financial figures and projections are confidential and should not be shared outside signed NDAs/investor agreements', category: 'constraints' },
    { aspect: 'customer data handling', note: 'If the model collects customer/prospect data (emails, payment info), define how it is stored and who can access it', category: 'constraints' },
    { aspect: 'ip protection', note: 'Identify any proprietary process, formula, or trade secret in the business model that needs protection before wide sharing', category: 'constraints' },
    { aspect: 'compliance and licensing', note: 'Check whether the business activity requires licenses, permits, or regulatory compliance (financial services, health, food, etc.)', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'brand positioning', note: 'Articulate a clear, differentiated brand positioning statement that distinguishes the business from competitors', category: 'preferences' },
    { aspect: 'narrative clarity', note: 'Craft a compelling one-line narrative (elevator pitch) that makes the value proposition immediately understandable', category: 'preferences' },
    { aspect: 'pitch materials', note: 'Consider the visual/narrative quality of pitch materials (deck, one-pager) if the plan will be presented to investors or partners', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'contradiction check', note: 'Check stated requirements for contradictions (e.g. "no marketing budget" alongside "aggressive customer acquisition targets")', category: 'constraints' },
    { aspect: 'missing requirement', note: 'Identify assumptions the plan implies but never states outright (e.g. a subscription model implying churn/retention targets)', category: 'functionalRequirements' },
    { aspect: 'acceptance criteria', note: 'Define concrete, measurable milestones (e.g. "acquire 100 paying customers within 90 days") to validate the plan', category: 'functionalRequirements' },
    { aspect: 'assumption stress test', note: 'Stress-test key assumptions: what happens if CAC doubles, churn triples, or a competitor undercuts on price', category: 'preferences' },
    { aspect: 'financial sanity check', note: 'Verify revenue projections are internally consistent with stated pricing, market size, and conversion assumptions', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'budget vs scale of ambition',
      note: 'A near-zero/bootstrapped budget stated alongside enterprise-scale or national/global launch ambitions is a known-infeasible combination — customer acquisition, sales, and operations at that scale require proportional capital.',
      category: 'constraints',
      triggerA: /\b(no|zero|bootstrapp\w*|shoestring|very tight)\s+budget\b/i,
      triggerB: /\b(enterprise[- ]scale|national launch|global launch|nationwide|worldwide rollout)\b/i,
    },
    {
      aspect: 'timeline vs validation',
      note: 'Seeking major funding or a full launch within days/a week is high-risk when paired with an unvalidated or brand-new business idea — investors and markets typically expect evidence of traction first.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(raise (?:funding|capital|investment)|seed round|series a|full (?:launch|rollout))\b/i,
    },
  ],
};
