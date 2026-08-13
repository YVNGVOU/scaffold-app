import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006).
// Plain substring matching could let bare keywords like 'mls' or 'lease'
// match inside unrelated words, silently inflating scores on inputs that
// have nothing to do with real estate.
const KEYWORDS = [
  'real estate', 'realtor', 'mls', 'listing', 'listings', 'property management',
  'property', 'properties', 'fair housing', 'zillow', 'redfin', 'idx',
  'lease', 'leasing', 'tenant', 'landlord', 'escrow', 'closing disclosure',
  'square footage', 'comps', 'comparative market analysis', 'open house',
  'brokerage', 'appraisal', 'title company', 'homebuyer', 'rezoning',
  'zoning', 'multiple listing service', 'showing', 'showings',
  'walk score', 'hoa fees', 'school district', 'pre-approval', 'preapproval',
  'earnest money', 'due diligence period', 'seller disclosure',
  'virtual tour', 'floor plan', 'days on market', 'price per square foot',
  'cma report', 'rent roll', 'cap rate', 'listing agent', 'buyer\'s agent',
  'commercial real estate', 'residential real estate', 'reso web api',
  'rets feed',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const realEstateDomain: DomainModule = {
  id: 'real-estate',
  label: 'Real Estate',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Property listings must display accurate square footage, price, and status (active/pending/sold)', category: 'functional' },
    { text: 'Fair housing compliance: no discriminatory filtering or language in listings or search', category: 'constraint' },
    { text: 'Define MLS/data feed source and refresh cadence for listing data', category: 'constraint' },
    { text: 'Geographic search and map-based property display', category: 'functional' },
    { text: 'Lead capture and agent/broker contact routing for inquiries', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'data source',
      description: 'Source of listing data (MLS feed, IDX, manual entry, third-party API) is unspecified',
      isResolved: (input) => /\b(mls|idx|zillow|redfin|realtor\.com|api feed|manual entry|rets|reso)\b/i.test(input),
    },
    {
      field: 'user role',
      description: 'Primary user role (buyer, seller, agent/broker, property manager, renter) is unspecified',
      isResolved: (input) => /\b(buyer|seller|agent|broker|property manager|renter|tenant|landlord|homebuyer)\b/i.test(input),
    },
    {
      field: 'geographic scope',
      description: 'Geographic coverage area (single market, statewide, national) is unspecified',
      isResolved: (input) => /\b(city|county|state|nationwide|region|metro|zip code|market area|local(ly)?|statewide)\b/i.test(input),
    },
    {
      field: 'transaction type',
      description: 'Whether the platform covers sales, rentals/leasing, or property management is unspecified',
      isResolved: (input) => /\b(for sale|rentals?|leasing|property management|buy|sell|rent|sales|residential sale|commercial lease)\b/i.test(input),
    },
    {
      field: 'compliance scope',
      description: 'Regulatory compliance requirements (fair housing, RESPA, state licensing disclosures) are unspecified',
      isResolved: (input) => /\b(fair housing|respa|disclosure|licens(e|ing)|compliance|regulation)\b/i.test(input),
    },
    {
      field: 'property type coverage',
      description: 'Which property types are supported (single-family, condo/multi-family, land, commercial) is unspecified',
      isResolved: (input) => /\b(single[- ]family|condo(minium)?s?|multi[- ]family|land|lots?|commercial|residential|townhomes?|new construction)\b/i.test(input),
    },
    {
      field: 'monetization model',
      description: 'How the platform generates revenue (agent subscriptions, listing fees, referral/lead fees, ad-supported) is unspecified',
      isResolved: (input) => /\b(subscription|listing fee|referral fee|lead fee|commission split|ad[- ]supported|free to list|pay per lead)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'listing ingestion', dependsOn: [], note: 'MLS/IDX feed integration or manual listing entry pipeline (RETS/RESO Web API)' },
    { component: 'listing database', dependsOn: ['listing ingestion'], note: 'Normalized property records with dedupe against MLS/broker reciprocity rules' },
    { component: 'geospatial search', dependsOn: ['listing database'], note: 'Map-based and radius/polygon search, geocoding of addresses' },
    { component: 'media pipeline', dependsOn: ['listing database'], note: 'Photo/video/virtual-tour storage and optimization per listing' },
    { component: 'search and filtering UI', dependsOn: ['geospatial search'], note: 'Buyer/renter-facing search with price, beds/baths, and status filters' },
    { component: 'lead capture and CRM', dependsOn: ['search and filtering UI'], note: 'Inquiry forms routed to agents/brokers, lead tracking and follow-up' },
    { component: 'agent/broker dashboard', dependsOn: ['listing database'], note: 'Listing management, showing scheduling, and lead pipeline for agents' },
    { component: 'compliance layer', dependsOn: ['listing database', 'search and filtering UI'], note: 'Fair housing filtering restrictions, required disclosures, and audit logging' },
    { component: 'transaction/document workflow', dependsOn: ['agent/broker dashboard'], note: 'Offer, escrow, and closing document tracking if the platform extends beyond listing discovery' },
  ],
  technicalConsiderations: [
    { aspect: 'MLS integration', note: 'Define which MLS/IDX feed(s) to integrate (RETS legacy vs. RESO Web API) and the data license/reciprocity agreement required to display listings', category: 'constraints' },
    { aspect: 'geocoding', note: 'Select a geocoding/mapping provider (Google Maps, Mapbox) and handle address normalization for accurate map pins', category: 'functionalRequirements' },
    { aspect: 'data freshness', note: 'Define listing sync frequency and staleness handling so sold/pending properties do not appear as active', category: 'functionalRequirements' },
    { aspect: 'media storage', note: 'Plan storage and CDN delivery for high volumes of listing photos, floor plans, and virtual tour embeds', category: 'constraints' },
    { aspect: 'search performance', note: 'Index property data for fast geo-radius and multi-filter queries at scale (e.g. Elasticsearch or PostGIS)', category: 'preferences' },
    { aspect: 'third-party valuation APIs', note: 'Consider integrating AVM (automated valuation model) data (e.g. Zestimate-equivalent) if estimated value display is required', category: 'preferences' },
    { aspect: 'data deduplication', note: 'Handle duplicate listings across multiple MLS boards or syndication feeds for the same property', category: 'functionalRequirements' },
    { aspect: 'scalability', note: 'Plan for regional expansion (multiple MLS regions) without hardcoding a single board\'s schema', category: 'preferences' },
    { aspect: 'RESO Data Dictionary compliance', note: 'Map incoming feed fields to the RESO Data Dictionary standard field names so the schema is portable across MLS boards rather than coupled to one board\'s custom field naming', category: 'constraints' },
    { aspect: 'showing scheduling integration', note: 'Integrate with a showing-management system (e.g. ShowingTime-equivalent) if agents need to coordinate showing requests and lockbox access rather than building scheduling from scratch', category: 'preferences' },
    { aspect: 'status change webhooks', note: 'Use MLS feed webhooks/polling with a defined SLA (e.g. 15-minute sync) rather than nightly batch sync, since price and status changes are time-sensitive to buyers', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'search and filters', note: 'Provide intuitive filtering by price, beds/baths, property type, and radius/map-drawn search area', category: 'functionalRequirements' },
    { aspect: 'listing detail page', note: 'Surface key decision-making info (price, price history, days on market, school zone, HOA fees) prominently on the listing detail view', category: 'functionalRequirements' },
    { aspect: 'map interaction', note: 'Design smooth pan/zoom map browsing synced with listing result lists, with clustering for dense areas', category: 'preferences' },
    { aspect: 'saved searches and alerts', note: 'Allow users to save searches and receive notifications on new/price-changed listings matching criteria', category: 'preferences' },
    { aspect: 'photo gallery experience', note: 'Design a fast, swipeable photo/virtual-tour viewer since listing photos are the primary decision driver', category: 'functionalRequirements' },
    { aspect: 'mobile-first browsing', note: 'Optimize for mobile since a large share of property search traffic is on-the-go/mobile', category: 'constraints' },
    { aspect: 'agent contact flow', note: 'Make contacting the listing agent or requesting a showing low-friction without excessive form fields', category: 'preferences' },
    { aspect: 'price change visibility', note: 'Surface price history and price-drop indicators clearly so buyers can spot negotiation signals without digging through a details tab', category: 'preferences' },
    { aspect: 'comparison/shortlist workflow', note: 'Let buyers shortlist and side-by-side compare properties (price, beds/baths, HOA, days on market) since real estate decisions rarely happen on a single listing view', category: 'functionalRequirements' },
  ],
  securityConsiderations: [
    { aspect: 'fair housing compliance', note: 'Ensure search/filter features cannot be used to discriminate on protected classes (familial status, race, religion, etc.) per the Fair Housing Act', category: 'constraints' },
    { aspect: 'PII handling', note: 'Protect buyer/seller personal and financial information (pre-approval letters, SSNs in transaction docs) with encryption at rest and in transit', category: 'constraints' },
    { aspect: 'agent licensing verification', note: 'Verify agent/broker license status where the platform represents users as licensed professionals', category: 'constraints' },
    { aspect: 'document access control', note: 'Restrict access to sensitive transaction documents (contracts, disclosures, escrow) to authorized parties only', category: 'constraints' },
    { aspect: 'API data scraping', note: 'Enforce MLS data-license terms prohibiting unauthorized scraping/redistribution of syndicated listing data', category: 'constraints' },
    { aspect: 'seller privacy', note: 'Avoid exposing seller identity or exact showing schedules to unauthenticated users beyond what MLS rules permit', category: 'preferences' },
    { aspect: 'payment/escrow security', note: 'If handling earnest money or transaction payments, use a licensed escrow/title partner rather than direct fund handling', category: 'constraints' },
    { aspect: 'wire fraud / BEC protection', note: 'Warn users about wire-fraud scams targeting closing funds (spoofed wiring instructions) and never transmit wiring instructions via unauthenticated email/chat channels', category: 'constraints' },
    { aspect: 'tenant screening data (FCRA)', note: 'If tenant background/credit checks are part of the flow, handle screening reports under FCRA requirements (adverse action notices, permissible purpose, secure storage)', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'listing photography presentation', note: 'Design a gallery/hero-image treatment that makes listing photos the visual centerpiece, not an afterthought', category: 'preferences' },
    { aspect: 'trust and credibility', note: 'Use a visual style (clean typography, professional imagery) that signals trustworthiness for high-stakes financial decisions', category: 'preferences' },
    { aspect: 'brand differentiation', note: 'Differentiate from generic Zillow/Redfin-style templates with a distinct visual identity for the brokerage/platform brand', category: 'preferences' },
    { aspect: 'map and data visualization', note: 'Style map overlays, price heat maps, or neighborhood data in a way that is legible and not visually cluttered', category: 'preferences' },
    { aspect: 'consistency across listing types', note: 'Maintain consistent card/detail layouts across property types (condo, single-family, land) despite differing data fields', category: 'constraints' },
    { aspect: 'agent branding', note: 'Balance platform branding with space for individual agent/brokerage branding on listing and profile pages', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'stale listing check', note: 'Test that sold/off-market properties are removed or clearly marked promptly after MLS status change, not left visible as active', category: 'constraints' },
    { aspect: 'fair housing audit', note: 'Audit all search filters and generated listing descriptions for fair-housing-violating language or discriminatory filter combinations', category: 'constraints' },
    { aspect: 'data accuracy', note: 'Verify listing price, address, and square footage match the source-of-truth MLS record exactly (no transcription drift)', category: 'functionalRequirements' },
    { aspect: 'edge case: zero results', note: 'Test search behavior when a filter combination or map area returns zero listings', category: 'preferences' },
    { aspect: 'edge case: incomplete listing', note: 'Test rendering of listings missing photos, price, or key fields so the UI degrades gracefully rather than breaking', category: 'preferences' },
    { aspect: 'geocoding accuracy', note: 'Verify map pins match the actual property address, especially for new construction or rural addresses with imprecise geocoding', category: 'functionalRequirements' },
    { aspect: 'cross-MLS duplicate check', note: 'Test that the same property syndicated from multiple sources does not appear as duplicate listings', category: 'functionalRequirements' },
    { aspect: 'fair housing filter combination check', note: 'Test that no combination of otherwise-legitimate filters (e.g. school district plus proximity plus price band) can be used as a proxy to redline a protected class', category: 'constraints' },
    { aspect: 'timezone/DST for showing times', note: 'Verify showing schedule and open-house times display correctly across timezones and around DST transitions so agents and buyers do not show up at the wrong time', category: 'functionalRequirements' },
  ],
  constraintConsiderations: [
    {
      aspect: 'MLS data rights vs. public scraping',
      note: 'Requiring nationwide MLS listing coverage without a licensed IDX/RESO data feed agreement is infeasible — MLS data cannot be legally scraped or redistributed without a broker reciprocity agreement.',
      category: 'constraints',
      triggerA: /\b(scrape|scraping|no (mls )?license|without (a |an )?(mls )?agreement)\b/i,
      triggerB: /\b(mls|idx|listing data|nationwide listings|all listings)\b/i,
    },
    {
      aspect: 'budget vs. compliance scope',
      note: 'A minimal/no budget alongside a platform that facilitates real transactions (escrow, offers, disclosures) is high-risk — real estate transaction handling carries legal/licensing overhead that requires proportional investment.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(escrow|closing|transaction management|offer management|disclosures?)\b/i,
    },
    {
      aspect: 'timeline vs. MLS integration complexity',
      note: 'An extremely short delivery timeline alongside multi-MLS/RESO integration is high-risk — MLS onboarding, data mapping, and compliance review typically take weeks even before feature development begins.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(multi-mls|multiple mls|reso|rets|mls integration)\b/i,
    },
    {
      aspect: 'nationwide coverage vs. single developer',
      note: 'Nationwide or multi-state listing coverage built by a single developer/small team is infeasible in the near term — each MLS board requires a separate data agreement, schema mapping, and compliance review, so scope should start with one market.',
      category: 'constraints',
      triggerA: /\b(nationwide|all 50 states|coast to coast|every state)\b/i,
      triggerB: /\b(solo|one developer|small team|just me|indie)\b/i,
    },
  ],
};
