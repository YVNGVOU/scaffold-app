import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006).
// Plain substring matching would let bare keywords like 'ad' or 'seo' match
// inside unrelated words — silently inflating scores on inputs that have
// nothing to do with marketing.
const KEYWORDS = [
  'marketing campaign', 'marketing', 'ad campaign', 'advertising', 'advertisement',
  'social media campaign', 'email campaign', 'newsletter', 'seo', 'brand awareness',
  'target audience', 'lead generation', 'conversion rate', 'call to action',
  'content strategy', 'promotional', 'promotion', 'influencer', 'ppc',
  'google ads', 'facebook ads', 'instagram ads', 'press release', 'launch campaign',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const marketingDomain: DomainModule = {
  id: 'marketing',
  label: 'Marketing',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define a specific target audience/segment for the campaign', category: 'functional' },
    { text: 'Specify the primary channel(s) the campaign will run on', category: 'functional' },
    { text: 'Set a budget and timeline for the campaign', category: 'constraint' },
    { text: 'Define success metrics (KPIs) up front so results can be measured', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'target audience',
      description: 'Target audience/customer segment for the campaign is unspecified',
      isResolved: (input) => /(target audience|demographic|customer segment|persona|for (?:small businesses|marketers|consumers|b2b|b2c))/i.test(input),
    },
    {
      field: 'channel',
      description: 'Marketing channel(s) (e.g. email, social, paid ads, SEO) are unspecified',
      isResolved: (input) => /\b(email|social media|instagram|facebook|tiktok|linkedin|twitter|x|google ads|ppc|seo|content marketing|print|radio|tv|billboard)\b/i.test(input),
    },
    {
      field: 'budget and timeline',
      description: 'Campaign budget and/or timeline is unspecified',
      isResolved: (input) => /\$|budget|\b(week|weeks|month|months|quarter|deadline|launch date)\b/i.test(input),
    },
    {
      field: 'success metrics',
      description: 'Success metrics/KPIs for the campaign are unspecified',
      isResolved: (input) => /(kpi|conversion rate|click-through|ctr|roi|engagement rate|open rate|sign-?ups|leads generated|success metric)/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'audience research', dependsOn: [], note: 'Define and validate the target audience/segment' },
    { component: 'messaging and positioning', dependsOn: ['audience research'], note: 'Core value proposition and key messages' },
    { component: 'channel plan', dependsOn: ['messaging and positioning'], note: 'Select and sequence channels (email, social, paid, organic)' },
    { component: 'content production', dependsOn: ['channel plan'], note: 'Copy, creative assets, and channel-specific formats' },
    { component: 'campaign launch', dependsOn: ['content production'], note: 'Scheduling, publishing, and go-live coordination' },
    { component: 'measurement and reporting', dependsOn: ['campaign launch'], note: 'Tracking setup, dashboards, and post-campaign reporting' },
  ],
  technicalConsiderations: [
    { aspect: 'tracking setup', note: 'Define UTM parameters, pixel/tag tracking, and attribution model before launch so results are measurable', category: 'functionalRequirements' },
    { aspect: 'marketing stack', note: 'Identify the tools involved (email platform, ad platform, CRM, analytics) and how they integrate', category: 'constraints' },
    { aspect: 'landing page infrastructure', note: 'Confirm any landing pages or forms the campaign drives to are built, tested, and load fast on mobile', category: 'functionalRequirements' },
    { aspect: 'audience data', note: 'Define how audience/segment lists are sourced, deduplicated, and kept compliant with consent records', category: 'constraints' },
    { aspect: 'automation rules', note: 'Specify any trigger-based automation (drip sequences, retargeting rules) and their exit conditions', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'audience journey', note: 'Map the path from first touch (ad/email/post) to conversion so each step has a clear next action', category: 'functionalRequirements' },
    { aspect: 'message clarity', note: 'Ensure the value proposition is understandable within seconds on the first screen/subject line', category: 'functionalRequirements' },
    { aspect: 'call to action', note: 'Every asset needs one clear, unambiguous call to action rather than competing asks', category: 'constraints' },
    { aspect: 'cross-channel consistency', note: 'Keep tone, offer, and visuals consistent across channels so the campaign reads as one coherent effort', category: 'preferences' },
    { aspect: 'mobile experience', note: 'Verify emails, landing pages, and ads render correctly on mobile, where most audiences will first see them', category: 'constraints' },
  ],
  securityConsiderations: [
    { aspect: 'data privacy compliance', note: 'Confirm audience data collection and email sends comply with applicable regulations (CAN-SPAM, GDPR, CCPA) including consent and opt-out handling', category: 'constraints' },
    { aspect: 'pii handling', note: 'Audit what personal data (emails, names, purchase history) is stored in the marketing stack and who can access it', category: 'constraints' },
    { aspect: 'third-party ad platform trust', note: 'Review data-sharing terms with ad platforms (pixel tracking, custom audiences) before enabling', category: 'constraints' },
    { aspect: 'brand impersonation risk', note: 'Protect sender domains/handles (SPF/DKIM, verified accounts) so the campaign cannot be spoofed by phishing lookalikes', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'positioning angle', note: 'Establish a distinct positioning angle so the campaign does not read as interchangeable with competitor messaging', category: 'preferences' },
    { aspect: 'tone and voice', note: 'Define a consistent brand voice (playful, authoritative, aspirational) appropriate to the target audience', category: 'preferences' },
    { aspect: 'visual identity', note: 'Align creative assets (imagery, color, typography) with existing brand guidelines across every channel', category: 'constraints' },
    { aspect: 'hook and headline', note: 'Craft a strong opening hook/headline for each asset since attention is lost within the first few seconds', category: 'functionalRequirements' },
    { aspect: 'creative variation', note: 'Plan multiple creative variants for A/B testing rather than shipping a single untested version', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'contradiction check', note: 'Check for contradictions in stated goals (e.g. "brand awareness only" alongside "must drive X sign-ups this week")', category: 'constraints' },
    { aspect: 'link and tracking QA', note: 'Verify every link, UTM parameter, and tracking pixel fires correctly before launch', category: 'functionalRequirements' },
    { aspect: 'compliance review', note: 'Confirm required disclosures, unsubscribe links, and legal disclaimers are present where applicable', category: 'constraints' },
    { aspect: 'acceptance criteria', note: 'Define concrete, testable success criteria (e.g. "achieve a 2% click-through rate within 30 days")', category: 'functionalRequirements' },
    { aspect: 'send/publish rehearsal', note: 'Test email sends, ad previews, and landing pages across devices before the real launch to catch broken renders', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'budget vs channel mix',
      note: 'A near-zero/shoestring budget stated alongside paid, multi-channel advertising (e.g. paid search plus paid social plus influencer) is a known-infeasible combination — meaningful paid reach requires proportional ad spend.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(paid (?:ads|advertising|search|social)|influencer (?:marketing|partnership)|multi-channel)\b/i,
    },
    {
      aspect: 'timeline vs campaign scope',
      note: 'An extremely short timeline (days) alongside a full multi-channel launch campaign is high-risk — audience research, creative production, and approvals typically require weeks.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(full[- ]scale|multi-channel|nationwide|global)\s+(campaign|launch)\b/i,
    },
  ],
};
