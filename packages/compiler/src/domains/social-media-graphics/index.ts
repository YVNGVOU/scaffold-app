import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching would let short keywords
// collide with unrelated words. This domain is scoped to the *graphics
// production* side of social media (platform-specific post/story/profile
// asset dimensions, carousel/grid layouts, template kits) and is
// deliberately distinct from:
//   - domains/marketing/index.ts (campaign strategy, ad spend, KPIs, funnels)
//   - domains/branding/index.ts (logo/identity system creation itself)
//   - domains/graphic-design/index.ts (general print/poster/editorial design)
//   - domains/menu-design/index.ts (food & beverage menu layout)
//   - domains/hospitality-travel/index.ts (unrelated vertical)
// Keywords below target platform-post-format and grid/template vocabulary
// that those neighboring domains do not use.
const KEYWORDS = [
  'social media graphic', 'social media post', 'social media graphics',
  'instagram post', 'instagram story', 'instagram stories', 'instagram carousel',
  'instagram grid', 'instagram reel', 'instagram reel cover', 'tiktok cover',
  'linkedin banner', 'linkedin post', 'facebook cover', 'twitter header',
  'x header', 'pinterest pin', 'story template', 'post template',
  'carousel post', 'content calendar', 'post frequency', 'feed grid',
  'profile picture', 'profile banner', 'highlight cover', 'highlight covers',
  'canva template', 'social media template', 'social template kit',
  'youtube thumbnail', 'facebook event cover', 'twitter post',
  'linkedin cover photo', 'story highlight cover', 'quote card',
  'testimonial graphic', 'announcement graphic template',
  'social graphics package', 'social asset kit',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

// BUGFIX (holistic verification pass, TASK-069 batch): compound phrases like
// 'tiktok cover' require exact adjacency, but real requests routinely
// separate the platform name from the asset word ("a TikTok video cover and
// story graphic for my brand"). This proximity pattern requires a named
// platform near a graphics-production word, which stays distinct from
// generic platform mentions (e.g. "manage our TikTok account") since it
// requires the asset/production noun too.
const PROXIMITY_PATTERNS = [
  /\b(instagram|tiktok|facebook|linkedin|twitter|pinterest|snapchat)\b[^.!?]{0,30}\b(graphic|graphics|cover|banner|post|story|stories|reel|carousel|template|thumbnail)\b/i,
  /\b(graphic|graphics|cover|banner|post|story|stories|reel|carousel|template|thumbnail)\b[^.!?]{0,30}\b(instagram|tiktok|facebook|linkedin|twitter|pinterest|snapchat)\b/i,
];

export const socialMediaGraphicsDomain: DomainModule = {
  id: 'social-media-graphics',
  label: 'Social Media Graphics',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    for (const pattern of PROXIMITY_PATTERNS) {
      if (pattern.test(input)) score += 2;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Deliver assets at each target platform\'s exact current dimensions/aspect ratio (e.g. 1080x1080 feed post, 1080x1920 story/reel, 1200x627 LinkedIn link post)', category: 'functional' },
    { text: 'Keep a consistent visual system (color palette, type, logo lockup) across every post in the set so the profile grid reads as one brand', category: 'functional' },
    { text: 'Provide both a source/editable file (e.g. layered file or Canva template) and flattened export-ready files per platform', category: 'constraint' },
    { text: 'Keep key text and focal subjects inside each platform\'s safe zone so nothing is cropped by UI overlays (profile ring, captions, reply bar)', category: 'constraint' },
    { text: 'Design as a reusable template/kit where feasible, not one-off single graphics, to support ongoing posting cadence', category: 'preference' },
    { text: 'Keep exported file sizes within platform upload limits without visible compression artifacts', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'target platform(s)',
      description: 'Which platform(s) the graphics are for (Instagram, TikTok, LinkedIn, Facebook, X/Twitter, Pinterest) is unspecified — each has different canvas dimensions',
      isResolved: (input) => /\b(instagram|tiktok|linkedin|facebook|twitter|x\.com|pinterest|threads)\b/i.test(input),
    },
    {
      field: 'post format',
      description: 'Which format(s) are needed (single feed post, story/reel, carousel, profile/cover banner) is unspecified',
      isResolved: (input) => /\b(feed\s*post|story|stories|reel|carousel|banner|cover\s*photo|profile\s*(picture|photo))\b/i.test(input),
    },
    {
      field: 'quantity / batch size',
      description: 'How many graphics are needed (a single post vs a full week/month content batch) is unspecified',
      isResolved: (input) => /\b(\d+\s*(posts?|graphics?|templates?|days?|weeks?)|batch|content\s*calendar|posting\s*schedule)\b/i.test(input),
    },
    {
      field: 'brand assets available',
      description: 'Whether existing brand assets (logo, color palette, fonts) will be supplied or need to be created from scratch is unspecified',
      isResolved: (input) => /\b(existing\s+(logo|brand|colors?)|brand\s+kit|style\s+guide|from\s+scratch|no\s+brand\s+assets)\b/i.test(input),
    },
    {
      field: 'editable template vs static graphics',
      description: 'Whether the deliverable is a reusable editable template (e.g. Canva) versus finished static graphics is unspecified',
      isResolved: (input) => /\b(canva|editable\s+template|template\s+kit|figma\s+template|static\s+graphics?|final\s+files?\s+only)\b/i.test(input),
    },
    {
      field: 'posting cadence',
      description: 'Expected posting frequency (daily, a few times a week, one-off campaign) that the graphics need to sustain is unspecified',
      isResolved: (input) => /\b(daily|weekly|per\s+week|per\s+day|posting\s+cadence|post\s+frequency|times?\s+a\s+week|one[- ]off|one[- ]time)\b/i.test(input),
    },
    {
      field: 'production tool',
      description: 'Which design tool the templates need to be built/handed off in (Canva, Figma, Photoshop, Adobe Express) is unspecified',
      isResolved: (input) => /\b(canva|figma|photoshop|illustrator|adobe\s+express|indesign)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'brand asset intake', dependsOn: [], note: 'Collect existing logo, color palette, fonts, and any brand guidelines before design starts; flag gaps as new default requirements' },
    { component: 'platform dimension matrix', dependsOn: ['brand asset intake'], note: 'Table of exact canvas sizes/aspect ratios/safe zones per target platform and post type (feed, story, carousel, cover)' },
    { component: 'master template set', dependsOn: ['platform dimension matrix'], note: 'A small number of reusable layout templates (e.g. quote, product, announcement) rather than fully bespoke graphics per post' },
    { component: 'grid/feed preview mockup', dependsOn: ['master template set'], note: 'A mocked profile-grid or story-sequence preview to check the batch reads as visually cohesive before export' },
    { component: 'content calendar mapping', dependsOn: ['master template set'], note: 'Maps each graphic to a planned post date/slot so the design batch matches the intended posting cadence' },
    { component: 'copy/caption slotting', dependsOn: ['master template set'], note: 'Defined text layers (headline, subhead, CTA) with character-length guardrails per template so copy swaps do not break layout' },
    { component: 'export pipeline', dependsOn: ['master template set'], note: 'Per-platform batch export at correct dimensions/format/color profile (typically sRGB, not CMYK)' },
    { component: 'source file archive', dependsOn: ['master template set'], note: 'Organized, versioned storage of editable source files (Canva/Figma/Photoshop) for future reuse and edits' },
    { component: 'asset naming/file convention', dependsOn: ['export pipeline'], note: 'Consistent file-naming scheme (platform, format, date, version) so a batch of dozens of exports stays manageable' },
  ],
  technicalConsiderations: [
    { aspect: 'platform dimension accuracy', note: 'Use each platform\'s current official spec (dimensions/aspect ratio/max file size) rather than outdated cached values — platforms periodically change recommended sizes', category: 'constraints' },
    { aspect: 'color profile', note: 'Export in sRGB, not CMYK — social platforms render sRGB and CMYK-exported files will look washed out or shifted on-screen', category: 'constraints' },
    { aspect: 'file format and compression', note: 'Choose export format per platform (PNG for crisp text/logos, JPEG for photo-heavy posts) and check platform re-compression behavior so posted quality matches the source', category: 'functionalRequirements' },
    { aspect: 'template tool choice', note: 'Confirm the production tool (Canva, Figma, Adobe Express, Photoshop) up front since template structure, reusability, and handoff format all depend on it', category: 'functionalRequirements' },
    { aspect: 'text safe zones', note: 'Keep headline/CTA text inside each platform\'s documented safe area so UI chrome (profile ring, username, reply box, captions) never covers key content', category: 'constraints' },
    { aspect: 'scalable component structure', note: 'Build templates with swappable/component layers (image, headline, logo lockup) rather than flattened one-off files, so future posts can be produced without rebuilding from scratch', category: 'preferences' },
    { aspect: 'batch export efficiency', note: 'Plan for bulk/batch export (naming conventions, consistent artboard sizes) when the deliverable is a full week or month of graphics rather than a single post', category: 'preferences' },
    { aspect: 'algorithm-driven crop variance', note: 'Account for platforms that auto-crop or re-frame square/vertical uploads differently across surfaces (e.g. Instagram feed grid thumbnail vs full post view) so a centered focal point survives multiple crop ratios of the same asset', category: 'constraints' },
    { aspect: 'video-first template compatibility', note: 'If Reels/TikTok/Stories are in scope, decide whether cover frames need to work as both a static thumbnail and the first frame of an autoplaying video, since those have different legibility requirements', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'mobile-first legibility', note: 'Design assuming a small phone screen at thumb-scroll speed — text and key visuals must read clearly at a glance, not just at full-size review', category: 'constraints' },
    { aspect: 'feed/grid cohesion', note: 'Preview how a post looks alongside its neighbors in the profile grid or story sequence, not only in isolation, since visual rhythm across posts affects perceived brand quality', category: 'preferences' },
    { aspect: 'scroll-stopping hierarchy', note: 'Establish a clear single focal point and reading order per graphic so it competes effectively against a fast-scrolling, high-competition feed', category: 'functionalRequirements' },
    { aspect: 'accessibility of on-image text', note: 'Maintain sufficient contrast between text and background imagery, and keep critical information available in the caption too, not only baked into the image, for screen-reader users', category: 'constraints' },
    { aspect: 'story/reel interaction zones', note: 'Keep tappable-adjacent content out of the areas where platform UI (reply field, sticker tray, progress bar) commonly sits on stories and reels', category: 'constraints' },
    { aspect: 'template usability for non-designers', note: 'If the deliverable is an editable template kit, make swappable fields (text, image slot) obviously editable so a non-designer on the team can update it without breaking layout', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'stock/licensed asset rights', note: 'Confirm any stock photography, fonts, or icons used carry a license that covers commercial social media use and the expected posting volume/reach', category: 'constraints' },
    { aspect: 'personal data in graphics', note: 'Avoid embedding real customer names, faces, or personal data in template examples/mockups without explicit consent, since these graphics are public by default', category: 'constraints' },
    { aspect: 'brand asset access control', note: 'Restrict who can edit shared template files (Canva team/Figma project) so brand-locked elements like logo and color palette are not altered inconsistently by multiple editors', category: 'preferences' },
    { aspect: 'metadata scrubbing', note: 'Strip EXIF/location metadata from source photos before publishing where it is not intentionally part of the post, since these graphics are public-facing', category: 'preferences' },
    { aspect: 'link and QR destination safety', note: 'If a graphic includes a link or QR code (e.g. swipe-up, bio link, promo QR), verify the destination before publishing and keep it under the team\'s control, not a third-party shortener with an unclear owner', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'visual identity translation', note: 'Adapt the existing brand system (not invent a new one) into a template that still reads as "the brand" at small, fast-scroll sizes', category: 'preferences' },
    { aspect: 'platform-native feel', note: 'Tune tone and composition to feel native to each platform (e.g. more polished/composed for LinkedIn, more casual/motion-forward for TikTok/Reels) rather than one identical look pasted across all platforms', category: 'preferences' },
    { aspect: 'grid rhythm and variety', note: 'Balance repetition (recognizable template) with enough variation across a batch so the feed does not feel monotonous or purely automated', category: 'preferences' },
    { aspect: 'typography hierarchy at small sizes', note: 'Choose type weights/sizes that remain legible and hierarchy-clear when rendered as a small thumbnail in a feed, not only at full-canvas review size', category: 'functionalRequirements' },
    { aspect: 'motion/animation consideration', note: 'For story and reel-cover formats, consider whether static or subtly animated treatment better fits the platform\'s expected content style', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'per-platform dimension check', note: 'Verify every exported file matches the exact required dimensions/aspect ratio for its target platform and post type before scheduling', category: 'functionalRequirements' },
    { aspect: 'crop/safe-zone test', note: 'Preview each graphic with the platform\'s actual UI overlay (profile ring, caption area, reply bar) to confirm nothing important is obscured', category: 'functionalRequirements' },
    { aspect: 'cross-device rendering', note: 'Check rendering on both small phone screens and desktop feed previews, since text/element scale can read very differently between the two', category: 'preferences' },
    { aspect: 'brand consistency audit', note: 'Compare the full batch side by side against brand guidelines (colors, fonts, logo usage) to catch drift across a large template set', category: 'constraints' },
    { aspect: 'file naming and delivery check', note: 'Confirm all exported files follow the agreed naming convention and are organized by platform/date before handoff to whoever schedules posts', category: 'preferences' },
    { aspect: 'copy fit testing', note: 'Test template text fields with the longest realistic caption/headline content, not just placeholder lorem ipsum, to catch overflow or truncation before it ships', category: 'functionalRequirements' },
  ],
  constraintConsiderations: [
    {
      aspect: 'single design vs multi-platform reuse claim',
      note: 'A single fixed-canvas design cannot be losslessly reused across platforms with very different aspect ratios (square feed post vs 9:16 story) without redesigning the composition — claiming "one graphic, all platforms" is infeasible without per-platform layout variants.',
      category: 'constraints',
      triggerA: /\b(one\s+(design|graphic|image)|single\s+(design|graphic|canvas))\b/i,
      triggerB: /\b(all\s+platforms?|every\s+platform|instagram\s+and\s+tiktok\s+and\s+linkedin|cross[- ]?platform)\b/i,
    },
    {
      aspect: 'large batch volume vs unrealistic timeline',
      note: 'A large volume of platform-accurate, brand-consistent graphics (e.g. a full month of daily posts) combined with an extremely short delivery timeline is high-risk — template-based production still needs time for brand-asset intake, review, and per-platform QA.',
      category: 'constraints',
      triggerA: /\b(\d{2,}\s*(posts?|graphics?|days?\s+of\s+content)|full\s+month|entire\s+month|30\s+days?\s+of\s+posts?)\b/i,
      triggerB: /\b(by\s+tomorrow|today|overnight|in\s+(?:a|one)\s+day|asap|end\s+of\s+day)\b/i,
    },
    {
      aspect: 'no brand assets vs strict brand consistency requirement',
      note: 'Requiring strict brand consistency across the full grid while having no existing logo, color palette, or style guide is a scope gap, not a design task alone — a foundational brand system needs to be created first (or sourced from the branding domain) before a consistent graphics template can be built.',
      category: 'constraints',
      triggerA: /\b(no\s+(existing\s+)?(logo|brand\s+(assets|guidelines)|style\s+guide)|brand\s+new\s+business|from\s+scratch)\b/i,
      triggerB: /\b(strict(?:ly)?\s+(on[- ]?brand|brand\s+consistent)|must\s+match\s+brand|consistent\s+brand\s+identity)\b/i,
    },
    {
      aspect: 'single static template vs heavy video/animated requirement',
      note: 'Requesting fully animated or video-first assets (motion, transitions, autoplay-ready Reels/TikTok content) while scoping the work as a simple static template kit is a tooling mismatch — animated deliverables need a motion-capable tool (e.g. After Effects, CapCut) and a different production/QA path than flat image templates.',
      category: 'constraints',
      triggerA: /\b(static\s+(template|graphics?)|flat\s+images?|image\s+only|just\s+images?)\b/i,
      triggerB: /\b(animated|animation|motion\s+graphics?|video\s+cover|autoplay|transitions?)\b/i,
    },
  ],
};
