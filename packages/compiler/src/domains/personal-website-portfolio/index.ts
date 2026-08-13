import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Keywords are chosen to differentiate a personal
// site/portfolio from general web-development (domains/web), branding
// (domains/branding), resume/CV documents (domains/resume-cv), and
// graphic-design (domains/graphic-design) — the focus here is specifically
// on an individual's own showcase/portfolio site, not a business site, a
// standalone resume document, or brand identity design work.
const KEYWORDS = [
  'personal website', 'personal site', 'portfolio site', 'portfolio website',
  'my portfolio', 'online portfolio', 'personal portfolio', 'personal brand website',
  'personal domain', 'squarespace', 'wix', 'about me page', 'personal blog',
  'showcase my work', 'freelance portfolio', 'design portfolio site',
  'photography portfolio', 'developer portfolio', 'personal homepage',
  'link in bio page', 'linktree', 'carrd', 'personal web page',
  'artist portfolio', 'writer portfolio', 'illustrator portfolio',
  'portfolio for job hunting', 'digital resume site', 'about me website',
  'vcard site', 'bio.link', 'personal splash page',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const personalWebsitePortfolioDomain: DomainModule = {
  id: 'personal-website-portfolio',
  label: 'Personal Website / Portfolio',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Site must be maintainable by a single non-technical owner without ongoing developer support', category: 'constraint' },
    { text: 'Include a clear showcase of work/projects with case-study-level detail on top pieces', category: 'functional' },
    { text: 'Provide a way for visitors to contact the owner (form, email link, or social links)', category: 'functional' },
    { text: 'Site must be responsive and readable on mobile, since portfolio links are often shared on social/mobile', category: 'constraint' },
    { text: 'Reflect a consistent personal voice/tone across bio, project descriptions, and about page', category: 'preference' },
    { text: 'Keep initial page load fast given the site is typically self-hosted or on a low-tier platform plan', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'platform',
      description: 'Target platform/builder (Squarespace, Wix, custom code, static site generator) is unspecified',
      isResolved: (input) => /\b(squarespace|wix|webflow|carrd|framer|wordpress|custom[- ]coded|static site|hand-?coded|next\.?js|astro|gatsby|hugo|jekyll)\b/i.test(input),
    },
    {
      field: 'purpose',
      description: 'Primary purpose (job hunting, freelance client acquisition, personal brand/blog, creative showcase) is unspecified',
      isResolved: (input) => /\b(job\s+hunt|hire\s+me|freelance|clients?|personal\s+brand|showcase|creative\s+work|land\s+a\s+job|job\s+search|recruiters?|networking|grad\s+school|applications?)\b/i.test(input),
    },
    {
      field: 'content sections',
      description: 'Which sections are needed (about, projects/work, resume, blog, contact) is unspecified',
      isResolved: (input) => /\b(about\s+(me|page)|projects?|work\s+samples?|resume|blog|contact\s+(page|form)|case\s+stud(y|ies))\b/i.test(input),
    },
    {
      field: 'domain/hosting',
      description: 'Custom domain and hosting arrangement is unspecified',
      isResolved: (input) => /\b(custom\s+domain|\.com|\.dev|\.me|hosting|domain\s+name|github\s+pages|netlify|vercel)\b/i.test(input),
    },
    {
      field: 'visual style',
      description: 'Desired visual tone (minimal, bold/colorful, professional, playful) is unspecified',
      isResolved: (input) => /\b(minimal|bold|colorful|professional|playful|clean|dark\s+mode|elegant|monochrome)\b/i.test(input),
    },
    {
      field: 'update frequency',
      description: 'How often content (new projects, blog posts) will be updated is unspecified',
      isResolved: (input) => /\b(update\w*\s+(regularly|often|monthly|weekly|quarterly)|add\s+new\s+(projects?|posts?)|ongoing|static|one-?time|quarterly|as[- ]needed|set\s+it\s+and\s+forget\s+it)\b/i.test(input),
    },
    {
      field: 'target audience',
      description: 'Who the site is primarily written for (hiring managers, prospective clients, general public, industry peers) is unspecified',
      isResolved: (input) => /\b(hiring\s+managers?|recruiters?|prospective\s+clients?|general\s+public|industry\s+peers?|potential\s+employers?|target\s+audience)\b/i.test(input),
    },
    {
      field: 'multimedia handling',
      description: 'Whether the portfolio needs to embed heavier media (video reels, audio, large image galleries, interactive demos) beyond static text/images is unspecified',
      isResolved: (input) => /\b(video\s+reel|showreel|demo\s+reel|audio\s+samples?|large\s+galler(y|ies)|interactive\s+demos?|embedded\s+video|playable\s+demo)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'landing/hero section', dependsOn: [], note: 'First-impression intro with name, tagline, and clear value proposition' },
    { component: 'about page/section', dependsOn: [], note: 'Bio, background, and personal voice that differentiates the individual' },
    { component: 'work/project showcase', dependsOn: ['landing/hero section'], note: 'Gallery or list of projects with case-study depth on featured pieces' },
    { component: 'individual project/case-study pages', dependsOn: ['work/project showcase'], note: 'Deeper pages per featured project: problem, process, outcome, visuals' },
    { component: 'resume/CV section or downloadable file', dependsOn: [], note: 'Either an inline experience summary or a linked PDF resume, kept in sync with the site' },
    { component: 'contact section', dependsOn: [], note: 'Contact form, mailto link, or social/professional links (LinkedIn, GitHub, Instagram)' },
    { component: 'navigation/site structure', dependsOn: ['landing/hero section', 'about page/section', 'work/project showcase'], note: 'Simple single-person nav — typically single-page scroll or a handful of top-level routes' },
    { component: 'platform/hosting setup', dependsOn: [], note: 'Chosen builder or static host (Squarespace/Wix/Webflow, or GitHub Pages/Netlify/Vercel for coded sites) with custom domain' },
    { component: 'blog (optional)', dependsOn: ['navigation/site structure'], note: 'Lightweight post archive if the owner intends ongoing writing, separate from the static portfolio content' },
  ],
  technicalConsiderations: [
    { aspect: 'platform choice', note: 'Confirm no-code builder (Squarespace/Wix/Webflow/Carrd) vs custom-coded static site — this determines the entire remaining build approach and maintenance burden', category: 'functionalRequirements' },
    { aspect: 'hosting and domain', note: 'Set up a custom domain pointed at the chosen host; for coded sites, static hosts like GitHub Pages/Netlify/Vercel are typically sufficient and free/low-cost for a single-person site', category: 'constraints' },
    { aspect: 'image optimization', note: 'Compress and responsively size portfolio images/screenshots so the site loads quickly despite being visually heavy', category: 'preferences' },
    { aspect: 'maintainability', note: 'Favor a stack the owner can update solo going forward (CMS-backed content or simple markdown files) over a build requiring a developer for every content change', category: 'constraints' },
    { aspect: 'SEO basics', note: 'Set page titles, meta descriptions, and a favicon so the site is discoverable when the owner\'s name is searched', category: 'functionalRequirements' },
    { aspect: 'analytics', note: 'Consider a lightweight, privacy-respecting analytics tool (Plausible, Fathom, or platform-native analytics) to see whether the site is being visited', category: 'preferences' },
    { aspect: 'resume file sync', note: 'If a downloadable resume PDF is offered alongside on-page content, establish a process to keep both in sync as experience changes', category: 'functionalRequirements' },
    { aspect: 'video/media hosting', note: 'Host video reels and large audio/media files on an external platform (YouTube/Vimeo unlisted, SoundCloud) rather than uploading raw files to the site host, which quickly blows through free-tier bandwidth/storage limits', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'first-impression clarity', note: 'The hero/landing area should communicate who the person is and what they do within a few seconds of arrival', category: 'functionalRequirements' },
    { aspect: 'project browsability', note: 'Structure the work showcase so a visitor can quickly scan all projects and drill into the ones that interest them, rather than a wall of undifferentiated content', category: 'functionalRequirements' },
    { aspect: 'mobile readability', note: 'Verify portfolio images, project grids, and text remain legible and well-spaced on small screens, since links are often opened from a phone', category: 'constraints' },
    { aspect: 'call to action clarity', note: 'Make the desired next action for a visitor (hire me, view resume, get in touch) unambiguous rather than buried', category: 'preferences' },
    { aspect: 'navigation simplicity', note: 'Keep navigation minimal — a single-person site rarely needs more than a handful of sections', category: 'preferences' },
    { aspect: 'load performance', note: 'Avoid heavy unoptimized hero video/imagery that delays the first render, since a slow-loading portfolio undercuts the impression it is trying to make', category: 'constraints' },
  ],
  securityConsiderations: [
    { aspect: 'contact form spam', note: 'Add basic spam protection (honeypot field, CAPTCHA-free rate limiting, or a form service with built-in filtering) to a public contact form', category: 'preferences' },
    { aspect: 'personal information exposure', note: 'Review what personal details (phone number, home address, full birthdate) are safe to publish publicly versus better kept off the site', category: 'constraints' },
    { aspect: 'platform account security', note: 'Use a strong, unique password and available 2FA on the builder/hosting account, since it is often a single point of failure for a solo-maintained site', category: 'preferences' },
    { aspect: 'third-party embed risk', note: 'Vet any embedded widgets/scripts (analytics, forms, social feeds) for what data they collect before adding them to the page', category: 'preferences' },
    { aspect: 'domain/DNS control', note: 'Ensure the owner (not an agency or ex-collaborator) retains registrar/DNS control of the personal domain', category: 'constraints' },
    { aspect: 'form/email submission retention', note: 'Check what a third-party form service (Formspree, Netlify Forms, Google Forms) does with submitted contact data — where it is stored, for how long, and who besides the owner can access it', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'personal voice', note: 'Write bio and project copy in a voice that reads as the individual, not generic corporate copy — this is a personal site, not a company site', category: 'preferences' },
    { aspect: 'visual distinctiveness', note: 'Avoid an unedited default template look; adjust typography, spacing, and color so the site feels intentionally designed rather than templated', category: 'preferences' },
    { aspect: 'work curation', note: 'Curate a focused set of strongest projects rather than including everything ever made — quality and relevance over exhaustive coverage', category: 'preferences' },
    { aspect: 'consistent presentation', note: 'Present all featured projects with a consistent format (same case-study structure/image treatment) so the portfolio reads as one coherent body of work', category: 'constraints' },
    { aspect: 'photography/screenshot quality', note: 'Use high-quality, consistently cropped/lit visuals for project imagery — inconsistent screenshot quality undercuts perceived craft', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'broken link check', note: 'Verify every project link, social link, and downloadable resume link resolves correctly before launch', category: 'functionalRequirements' },
    { aspect: 'contact form delivery test', note: 'Submit a real test message through the contact form/mailto link to confirm it actually reaches the owner', category: 'functionalRequirements' },
    { aspect: 'cross-device check', note: 'Test the site on at least one mobile and one desktop viewport, since portfolio links are shared across both contexts', category: 'preferences' },
    { aspect: 'stale content check', note: 'Check for outdated content (old employer, expired project links, an out-of-sync resume date) before treating the site as launch-ready', category: 'constraints' },
    { aspect: 'missing requirement', note: 'Identify implied-but-unstated needs, e.g. a portfolio aimed at job hunting implying a downloadable resume even if not explicitly requested', category: 'functionalRequirements' },
    { aspect: 'load-time spot check', note: 'Spot-check page load time with unoptimized images before launch, since a slow single-scroll portfolio page is a common failure mode', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'no-code platform vs custom interactive features',
      note: 'A no-code builder (Squarespace/Wix/Carrd) combined with a request for deep custom interactive functionality (custom backend logic, complex user accounts) is a mismatch — those platforms are template-and-content oriented, not general application platforms.',
      category: 'constraints',
      triggerA: /\b(squarespace|wix|carrd)\b/i,
      triggerB: /\b(custom\s+backend|user\s+accounts?|custom\s+database|complex\s+web\s+app)\b/i,
    },
    {
      aspect: 'timeline vs case-study depth',
      note: 'An extremely short delivery timeline alongside multiple in-depth case-study project pages is high-risk — writing and designing genuine case studies (problem, process, outcome, visuals) per project takes meaningfully more than a day or two.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|overnight|in (?:a|one) day|this afternoon|asap)\b/i,
      triggerB: /\b(case\s+stud(y|ies)|in-?depth\s+project\s+pages?|detailed\s+write-?ups?)\b/i,
    },
    {
      aspect: 'free-tier hosting vs heavy media portfolio',
      note: 'A free-tier no-code builder or free static host combined with heavy embedded media (video showreels, large hi-res image galleries, audio samples) is a mismatch — free tiers typically cap bandwidth/storage, so heavy media needs external hosting (YouTube/Vimeo) or a paid plan.',
      category: 'constraints',
      triggerA: /\b(free\s+tier|free\s+plan|free\s+hosting|github\s+pages)\b/i,
      triggerB: /\b(video\s+reel|showreel|demo\s+reel|large\s+galler(y|ies)|hi-?res\s+images?|audio\s+samples?)\b/i,
    },
    {
      aspect: 'no budget vs custom-coded build',
      note: 'A "no budget"/free-only constraint alongside a fully custom-coded site (hand-built frontend, custom domain, paid hosting tier) is a tension — a genuinely free path typically means a no-code builder\'s free tier or a free static host with a subdomain, not a bespoke build with a paid custom domain.',
      category: 'constraints',
      triggerA: /\b(no\s+budget|zero\s+budget|completely\s+free|can'?t\s+pay)\b/i,
      triggerB: /\b(custom[- ]coded|hand-?coded|bespoke\s+build|paid\s+hosting)\b/i,
    },
  ],
};
