import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/branding/index.ts. Scoped specifically to a lightweight
// STARTER branding request for a small/local business — logo + basic
// color/type system + a couple of immediate applications (storefront
// sign, business card), budget-conscious and fast-turnaround framing —
// distinct from the full branding domain (broader, multi-touchpoint brand
// systems/rebrands with no small-business/budget framing implied), from
// menu-design (food/drink menu structure and pricing layout, not logo/
// identity work), from graphic-design (general layout/print work, not
// logo+identity specifically), and from hospitality-travel (bookings/
// guest experience, not identity design). Keyword list favors compound,
// small-business-specific phrases ('starter logo', 'small business
// branding', 'storefront sign') over bare words like 'logo' or 'sign' so
// this domain doesn't over-trigger on generic branding/signage requests
// that belong to the broader branding domain.
const KEYWORDS = [
  'small business branding', 'small business logo', 'starter logo',
  'starter brand', 'starter branding', 'starter brand kit',
  'mini brand kit', 'basic brand kit', 'basic logo', 'simple logo',
  'local business branding', 'local business logo', 'shop logo',
  'storefront sign', 'store sign', 'business card design',
  'business card and logo', 'quick turnaround logo',
  'budget logo design', 'budget-friendly branding', 'affordable logo',
  'affordable branding', 'startup logo', 'small shop branding',
  'brand kit for my shop', 'branding for my small business',
  'logo for my small business', 'new business logo', 'first logo',
  'diy brand kit', 'starter identity', 'mom and pop branding',
  'food truck branding', 'salon branding', 'boutique branding',
  'coffee shop logo', 'small cafe branding', 'new small business',
  'small business coffee shop', 'custom hand-lettering', 'bespoke illustration',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const smallBusinessBrandingDomain: DomainModule = {
  id: 'small-business-branding',
  label: 'Small Business Branding Kit',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Deliver a simple, coherent logo + basic color/type system sized for a starter kit, not a full multi-touchpoint identity system', category: 'functional' },
    { text: 'Include at least one immediate real-world application (e.g. storefront sign or business card) alongside the logo', category: 'functional' },
    { text: 'Keep scope and turnaround proportional to a small/local-business budget and timeline', category: 'constraint' },
    { text: 'Deliverables must be provided in editable + exportable formats usable by a local print shop or sign vendor', category: 'constraint' },
    { text: 'Favor a small, easy-to-maintain color/type system the owner can apply consistently without a designer on retainer', category: 'preference' },
    { text: 'Design the logo to hold up at small sizes (business card, social avatar) and large sizes (storefront sign) alike', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'business type',
      description: 'What kind of small/local business this is for (cafe, salon, contractor, retail shop, etc.) is unspecified',
      isResolved: (input) => /\b(cafe|coffee\s*shop|salon|barbershop|contractor|retail\s+shop|boutique|bakery|food\s+truck|plumber|landscap\w*|small\s+business|local\s+business|storefront|shop)\b/i.test(input),
    },
    {
      field: 'immediate applications needed',
      description: 'Which first applications the kit must cover (storefront sign, business card, social avatar, etc.) is unspecified',
      isResolved: (input) => /\b(storefront\s+sign|store\s+sign|business\s+card|social\s+avatar|window\s+decal|vehicle\s+decal|door\s+sign)\b/i.test(input),
    },
    {
      field: 'budget tier',
      description: 'Budget expectations for a starter kit (DIY-tier vs. modest paid vs. full studio pricing) are unspecified',
      isResolved: (input) => /\b(budget|affordable|cheap|inexpensive|low[- ]cost|shoestring|\$\d+)\b/i.test(input),
    },
    {
      field: 'turnaround timeline',
      description: 'Expected turnaround time for the starter kit is unspecified',
      isResolved: (input) => /\b(quick\s+turnaround|fast\s+turnaround|by\s+(?:tomorrow|next\s+week)|within\s+\d+\s+days?|asap|rush)\b/i.test(input),
    },
    {
      field: 'existing brand assets',
      description: 'Whether the business already has any existing name/mark/colors to build from, or this is fully from scratch, is unspecified',
      isResolved: (input) => /\b(existing\s+logo|already\s+have|from\s+scratch|no\s+existing\s+brand|current\s+colors?)\b/i.test(input),
    },
    {
      field: 'print vs digital use',
      description: 'Whether the kit needs to support print production (sign, card) versus digital-only use (website, social) is unspecified',
      isResolved: (input) => /\b(print(ed)?|digital(?:-only)?|website|social\s+media|cmyk|rgb)\b/i.test(input),
    },
    {
      field: 'logo style direction',
      description: 'Whether the mark should be a wordmark, a lettermark/monogram, or an icon+wordmark combination is unspecified',
      isResolved: (input) => /\b(wordmark|lettermark|monogram|icon\s*\+?\s*wordmark|combination\s+mark|text[- ]only\s+logo|icon\s+and\s+text)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'starter logo mark', dependsOn: [], note: 'A single primary logo mark (wordmark or simple icon+wordmark), not a full multi-variant logo system' },
    { component: 'basic color palette', dependsOn: ['starter logo mark'], note: 'A small palette (typically 2-4 colors) simple enough for the owner to apply consistently without a designer' },
    { component: 'basic type pairing', dependsOn: ['starter logo mark'], note: 'One or two font choices (a display face for the logo/headers, a workhorse face for body copy) rather than a full type scale' },
    { component: 'business card layout', dependsOn: ['starter logo mark', 'basic color palette', 'basic type pairing'], note: 'Print-ready business card design as one of the kit\'s immediate applications' },
    { component: 'storefront/window sign layout', dependsOn: ['starter logo mark', 'basic color palette'], note: 'Print/production-ready signage design sized for the business\'s actual storefront or window' },
    { component: 'starter usage sheet', dependsOn: ['basic color palette', 'basic type pairing'], note: 'A one-page (not a full brand guidelines book) reference showing logo clear space, color hex/CMYK values, and font names for the owner to reuse' },
    { component: 'print production handoff', dependsOn: ['business card layout', 'storefront/window sign layout'], note: 'Files formatted for a local print shop or sign vendor (bleed, resolution, correct color mode) rather than assuming an in-house production pipeline' },
    { component: 'digital asset export', dependsOn: ['starter logo mark'], note: 'Web/social-ready logo exports (PNG with transparency, social avatar crop) if the business also needs an online presence' },
  ],
  technicalConsiderations: [
    { aspect: 'file formats', note: 'Deliver an editable vector source file (SVG/AI) plus flattened exports (PNG/JPG) sized for both the sign vendor and everyday owner use (email signature, social posts)', category: 'constraints' },
    { aspect: 'print vs digital color mode', note: 'Confirm whether business card/sign production needs CMYK values versus digital-only assets needing RGB/hex, since a starter kit often needs both from day one', category: 'constraints' },
    { aspect: 'sign production specs', note: 'Confirm the storefront sign\'s physical medium (vinyl banner, illuminated channel letters, painted window) early — production specs and file requirements differ substantially by medium', category: 'functionalRequirements' },
    { aspect: 'color specification', note: 'Specify colors precisely (hex + CMYK, and Pantone if the sign vendor requires spot color matching) so the palette reproduces consistently across the card and the sign', category: 'functionalRequirements' },
    { aspect: 'typography licensing', note: 'Confirm the chosen fonts are licensed for the business\'s actual usage (signage production, printed cards, and any web embedding) rather than assuming a free font is unrestricted for commercial signage', category: 'constraints' },
    { aspect: 'scalability across sizes', note: 'Verify the logo mark remains legible from business-card scale up to storefront-sign scale, since a starter kit typically spans that full size range immediately', category: 'constraints' },
    { aspect: 'print vendor handoff format', note: 'Package files in the format the intended local print/sign shop actually accepts (e.g. print-ready PDF with bleed marks) rather than a generic design-tool file they cannot open', category: 'preferences' },
    { aspect: 'favicon and social profile crop', note: 'Confirm the logo mark still reads correctly when cropped to a square (social profile photo, favicon) since a starter kit\'s icon-free wordmark can become illegible when forced into a tight square crop', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'owner self-sufficiency', note: 'Keep the color/type system small and simple enough that the business owner (likely without design staff) can apply it consistently to future ad-hoc materials without a designer on retainer', category: 'preferences' },
    { aspect: 'legibility at storefront distance', note: 'Verify the sign layout remains legible at realistic street-viewing distance and typical daylight/nighttime storefront lighting conditions', category: 'constraints' },
    { aspect: 'business card practicality', note: 'Keep business card layout to standard print dimensions with adequate margin/safe area so contact info survives standard trimming', category: 'functionalRequirements' },
    { aspect: 'first-impression clarity', note: 'Prioritize immediate legibility of the business name and what the business does/sells, since a starter kit is often a new business\'s very first customer-facing impression', category: 'preferences' },
    { aspect: 'consistency across the two applications', note: 'Ensure the card and sign read as clearly the same brand at a glance despite the large size/medium difference between them', category: 'functionalRequirements' },
  ],
  securityConsiderations: [
    { aspect: 'asset ownership handoff', note: 'Confirm the business owner receives full ownership of and access to the editable source files, not just flattened exports, so they are not locked out of their own brand assets', category: 'constraints' },
    { aspect: 'font/asset licensing exposure', note: 'Confirm any stock elements or fonts used are licensed for the business\'s actual commercial signage/print use, to avoid licensing liability landing on a small business owner unaware of the restriction', category: 'constraints' },
    { aspect: 'unreleased asset exposure', note: 'Avoid exposing an unreleased logo/sign design (before the storefront opening) via publicly accessible links ahead of the business\'s planned launch', category: 'preferences' },
    { aspect: 'trademark conflict check', note: 'Flag if the requested name/mark has not been checked against existing trademarks or very similar local competitor branding, which the owner should verify before committing to signage production', category: 'preferences' },
    { aspect: 'source file retention', note: 'Confirm who retains the working design files (designer vs. owner) after handoff, since a starter engagement with no formal contract can leave the owner unable to get future edits if the designer becomes unreachable', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'proportional creative scope', note: 'Keep the creative exploration proportional to a starter-kit scope (a small number of directions) rather than the extensive multi-round exploration appropriate to a full brand identity engagement', category: 'preferences' },
    { aspect: 'local/neighborhood character', note: 'Ground the visual direction in the business\'s actual local market/neighborhood character rather than a generic, could-be-anywhere aesthetic', category: 'preferences' },
    { aspect: 'legible simplicity', note: 'Favor a simple, legible mark over an intricate one, since a starter kit\'s logo must work immediately at both card scale and sign scale without a refinement pass', category: 'constraints' },
    { aspect: 'system consistency across applications', note: 'Ensure the logo, palette, and type choice form one coherent look across the card and sign despite being designed together quickly', category: 'constraints' },
    { aspect: 'budget-conscious material choice', note: 'Recommend sign/card materials and finishes that fit a small-business budget (e.g. vinyl banner over illuminated channel letters) rather than defaulting to premium production options', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'contradiction check', note: 'Check for contradictions such as requesting a "quick, budget-friendly" kit alongside premium/illuminated signage or extensive concept exploration', category: 'constraints' },
    { aspect: 'missing requirement', note: 'Identify requirements the request implies but never states, such as a storefront business needing exterior-durable print/sign materials', category: 'functionalRequirements' },
    { aspect: 'acceptance criteria', note: 'Define concrete acceptance criteria for the starter kit (e.g. "logo remains legible at business-card scale and at storefront-sign scale", "card fits standard print trim size")', category: 'functionalRequirements' },
    { aspect: 'print proof review', note: 'Review a physical print/production proof of both the card and the sign before final production, not only an on-screen mockup', category: 'functionalRequirements' },
    { aspect: 'vendor file compatibility test', note: 'Confirm the delivered files actually open correctly in the intended local print/sign vendor\'s workflow before the owner commits to a production run', category: 'preferences' },
    { aspect: 'failure states', note: 'Identify failure states the request does not address: low-resolution reproduction on a large sign, incorrect color mode conversion (RGB to CMYK), or unlicensed font substitution', category: 'constraints' },
    { aspect: 'cross-application readability check', note: 'Test the logo/palette at both extremes of the kit\'s actual size range (favicon-scale crop and full storefront-sign scale) rather than only reviewing it at a single comfortable mockup size', category: 'functionalRequirements' },
  ],
  constraintConsiderations: [
    {
      aspect: 'budget vs scope',
      note: 'A shoestring/DIY-tier budget stated alongside a full multi-touchpoint brand system or premium illuminated signage is a known-infeasible combination for a starter-kit engagement — that scope requires proportionally more budget than a starter kit implies.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight|diy)\s*[- ]?\s*budget\b/i,
      triggerB: /\b(full brand kit|complete identity system|illuminated\s+sign(?:age)?|premium\s+production)\b/i,
    },
    {
      aspect: 'timeline vs signage production',
      note: 'An extremely short delivery timeline (overnight/next day) alongside physical storefront signage production is high-risk — sign fabrication and installation through a local vendor typically takes days beyond design turnaround, which a same-day expectation does not account for.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|overnight|in (?:a|one) day|asap|by end of day)\b/i,
      triggerB: /\b(storefront\s+sign|store\s+sign|window\s+sign|signage)\b/i,
    },
    {
      aspect: 'quick turnaround vs extensive exploration',
      note: 'Requesting a "quick turnaround" starter kit alongside extensive multi-round concept exploration/revision cycles is contradictory — fast turnaround for a small-business starter kit implies a small number of directions, not an open-ended exploration process.',
      category: 'constraints',
      triggerA: /\b(quick\s+turnaround|fast\s+turnaround|rush(?:ed)?\s+(?:job|delivery|timeline))\b/i,
      triggerB: /\b(multiple\s+rounds?\s+of\s+revisions?|extensive\s+concept\s+exploration|many\s+concept\s+directions)\b/i,
    },
    {
      aspect: 'no-budget vs custom typography/illustration',
      note: 'A zero/DIY budget stated alongside a request for custom hand-lettering or bespoke illustration work is infeasible for a starter-kit engagement — custom lettering/illustration requires paid specialist time well beyond a template-based starter kit.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|diy)\s*[- ]?\s*budget\b/i,
      triggerB: /\b(custom\s+hand[- ]?lettering|bespoke\s+illustration|custom\s+illustration|hand[- ]?drawn\s+mark)\b/i,
    },
  ],
};
