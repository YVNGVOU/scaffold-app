// Synonym tables for concepts the pipeline cares about. Each entry maps a
// canonical term to a list of synonyms/variants that should be treated as
// equivalent when scanning raw input. Purely data-driven, no network, no
// external dictionary lookups.

export type Lexicon = Record<string, string[]>;

/** Platform / device terms, used by ambiguity detection's "platform" field across domains. */
// NOTE: deliberately no "web" bucket here. The web domain's own detection
// keywords ("website", "web app", "webapp", "browser", etc. — see
// domains/web/index.ts) overlap almost entirely with what a "web" platform
// bucket would contain. Since the web domain can only be selected when one
// of those words is already present in the input, a "web" bucket here would
// make the "platform" ambiguity field auto-resolve for nearly every web-
// domain input regardless of whether the user actually specified a target
// platform (mobile/desktop/responsive/cross-platform) — defeating the
// ambiguity check for its most common field. Verified directly during
// TASK-002 verification: "Build a website with a frontend and an API
// backend" (no platform info) was incorrectly NOT flagged unresolved before
// this bucket was removed.
export const PLATFORM_LEXICON: Lexicon = {
  mobile: ['iphone', 'ipad', 'android', 'smartphone', 'phone', 'tablet', 'ios', 'mobile'],
  desktop: ['desktop', 'pc', 'windows', 'macos', 'mac', 'laptop'],
  console: ['playstation', 'ps5', 'ps4', 'xbox', 'switch', 'console'],
};

/** App/website/game/brand terms so domain detection & requirement text aren't tied to one literal string. */
export const CONCEPT_LEXICON: Lexicon = {
  application: ['app', 'application', 'program', 'software'],
  website: ['website', 'site', 'webpage', 'web page', 'web site'],
  game: ['game', 'videogame', 'video game', 'toon', 'cartoon-style game'],
  brand: ['brand', 'branding', 'identity', 'brand identity'],
};

/** Merge any number of lexicons into one flat synonym -> canonical lookup table. */
export function buildSynonymIndex(...lexicons: Lexicon[]): Map<string, string> {
  const index = new Map<string, string>();
  for (const lexicon of lexicons) {
    for (const [canonical, synonyms] of Object.entries(lexicon)) {
      for (const syn of synonyms) {
        index.set(syn.toLowerCase(), canonical);
      }
    }
  }
  return index;
}

export const DEFAULT_LEXICON_INDEX = buildSynonymIndex(PLATFORM_LEXICON, CONCEPT_LEXICON);

/** Returns true if `input` contains any synonym mapped to `canonical` in the given lexicon. */
export function matchesConcept(input: string, canonical: string, lexicon: Lexicon): boolean {
  const synonyms = lexicon[canonical];
  if (!synonyms) return false;
  const text = input.toLowerCase();
  return synonyms.some((syn) => text.includes(syn.toLowerCase()));
}
