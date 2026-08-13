import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching let 'multiplayer' match
// inside unrelated text and 'player' double-count inside "multiplayer" — do
// not repeat that bug here (e.g. a bare 'i18n' or 'locale' keyword must not
// bleed into unrelated words).
const KEYWORDS = [
  'localization', 'localisation', 'translation', 'translate', 'translator',
  'i18n', 'l10n', 'internationalization', 'internationalisation',
  'multilingual', 'multi-language', 'target language', 'source language',
  'locale', 'locales', 'transcreation', 'translation memory', 'glossary',
  'terminology base', 'termbase', 'cat tool', 'trados', 'memoq', 'phrase tms',
  'crowdin', 'lokalise', 'smartling', 'rtl', 'right-to-left',
  'left-to-right', 'text expansion', 'string catalog', 'localizable strings',
  'gettext', 'po file', 'xliff', 'icu message format', 'pluralization',
  'cultural adaptation', 'transliteration', 'back-translation',
  'machine translation', 'post-editing', 'mtpe', 'subtitle translation',
  'dubbing', 'language pair', 'localize', 'localizing',
  'in-country review', 'linguistic qa', 'lqa', 'string freeze',
  'pseudo-localization', 'source string', 'target locale', 'language coverage',
  'transcreator', 'translation vendor', 'localization vendor', 'language service provider',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const localizationTranslationDomain: DomainModule = {
  id: 'localization-translation',
  label: 'Localization / Translation',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Maintain a translation memory (TM) and glossary/termbase for consistency across all target languages', category: 'functional' },
    { text: 'Preserve source string placeholders, variables, and formatting tags exactly through translation', category: 'constraint' },
    { text: 'Support Unicode (UTF-8) text and locale-aware date/number/currency formatting', category: 'functional' },
    { text: 'Flag strings requiring transcreation or cultural adaptation rather than literal translation', category: 'preference' },
    { text: 'Have translations reviewed by a native-speaking linguist before release (in-country review)', category: 'constraint' },
    { text: 'Design UI layouts to tolerate text expansion/contraction and RTL mirroring without breaking', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'target languages/locales',
      description: 'The specific target languages or locales (e.g. es-MX vs es-ES) are unspecified',
      isResolved: (input) => /\b(spanish|french|german|japanese|chinese|mandarin|korean|arabic|portuguese|italian|russian|hindi|dutch|polish|vietnamese|thai|swedish|target\s+languages?|locales?|language\s+pair|es-mx|es-es|pt-br|zh-cn|zh-tw)\b/i.test(input),
    },
    {
      field: 'translation method',
      description: 'Whether translation will be human, machine (MT), or machine-translation-plus-post-editing (MTPE) is unspecified',
      isResolved: (input) => /\b(human\s+translat\w*|machine\s+translat\w*|\bmt\b|mtpe|post-?edit\w*|professional\s+translator)\b/i.test(input),
    },
    {
      field: 'RTL/text-expansion handling',
      description: 'Whether right-to-left languages or significant text-expansion layout impact must be supported is unspecified',
      isResolved: (input) => /\b(rtl|right-to-left|arabic|hebrew|text\s+expansion|layout\s+mirror\w*|bidi\w*)\b/i.test(input),
    },
    {
      field: 'translation memory/glossary source',
      description: 'Whether an existing translation memory, style guide, or approved glossary/termbase already exists is unspecified',
      isResolved: (input) => /\b(translation\s+memory|\btm\b|glossary|termbase|term\s+base|style\s+guide)\b/i.test(input),
    },
    {
      field: 'content type and format',
      description: 'The content type/file format to localize (UI strings, marketing copy, legal docs, subtitles, audio for dubbing) is unspecified',
      isResolved: (input) => /\b(ui\s+strings?|marketing\s+copy|legal\s+document\w*|subtitle\w*|dubbing|voice-?over|documentation|app\s+store\s+listing|website\s+copy|email\s+campaign\w*|help\s+center|knowledge\s+base|in-game\s+text)\b/i.test(input),
    },
    {
      field: 'review/QA workflow',
      description: 'Whether an in-country linguistic review or QA/back-translation step is required before publishing is unspecified',
      isResolved: (input) => /\b(in-country\s+review|linguistic\s+review|back-translation|lqa|linguistic\s+qa|native\s+reviewer)\b/i.test(input),
    },
    {
      field: 'update cadence / continuous localization',
      description: 'Whether this is a one-time translation project or an ongoing/continuous localization workflow tied to content updates is unspecified',
      isResolved: (input) => /\b(one-?time\s+translation|ongoing\s+localization|continuous\s+localization|string\s+freeze|weekly\s+release|per\s+release|nightly\s+build|sprint\s+cadence)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'source content extraction', dependsOn: [], note: 'Pull translatable strings out of code/CMS/design files into a translatable format (resource files, XLIFF, PO)' },
    { component: 'string catalog / resource files', dependsOn: ['source content extraction'], note: 'Locale-keyed string catalogs (e.g. .po, .xliff, .json ICU message format) as the single source of truth per locale' },
    { component: 'translation memory (TM) store', dependsOn: [], note: 'Segment-level TM (source/target pairs) reused across projects to enforce consistency and reduce cost on repeated content' },
    { component: 'glossary/termbase', dependsOn: [], note: 'Approved terminology and brand-voice rules that translators/MT engines must follow' },
    { component: 'CAT tool / TMS pipeline', dependsOn: ['string catalog / resource files', 'translation memory (TM) store', 'glossary/termbase'], note: 'Translation management system (e.g. Crowdin, Lokalise, Phrase, memoQ, Trados) orchestrating strings, TM, glossary, and translator assignments' },
    { component: 'machine translation / MTPE layer', dependsOn: ['CAT tool / TMS pipeline'], note: 'Optional MT engine pre-translation pass, followed by human post-editing where full MT is not acceptable quality' },
    { component: 'in-country linguistic review', dependsOn: ['CAT tool / TMS pipeline'], note: 'Native-speaker review/LQA pass for tone, cultural fit, and terminology accuracy before sign-off' },
    { component: 'locale build & injection', dependsOn: ['CAT tool / TMS pipeline', 'in-country linguistic review'], note: 'Compile approved translations back into locale-specific builds/resource bundles for the target product' },
    { component: 'RTL/layout QA pass', dependsOn: ['locale build & injection'], note: 'Visual QA for text expansion, truncation, and RTL mirroring across all supported locales' },
    { component: 'continuous localization sync', dependsOn: ['source content extraction', 'CAT tool / TMS pipeline'], note: 'Automated pipeline (webhook/CLI) that pushes new source strings and pulls completed translations on every content change' },
  ],
  technicalConsiderations: [
    { aspect: 'string externalization', note: 'Ensure all user-facing text is externalized into resource files (no hardcoded strings in code/templates) so it can be extracted for translation', category: 'constraints' },
    { aspect: 'ICU message format / pluralization', note: 'Use ICU MessageFormat or an equivalent pluralization system for count-dependent strings, since plural rules differ per language (e.g. Arabic has six plural forms, Japanese has one)', category: 'functionalRequirements' },
    { aspect: 'placeholder and tag preservation', note: 'Protect variables, HTML tags, and printf-style placeholders (e.g. {name}, %s) from being altered or reordered by translators or MT, since word order varies by language', category: 'constraints' },
    { aspect: 'encoding', note: 'Use UTF-8 encoding end-to-end and verify font/glyph support for target scripts (CJK, Arabic, Devanagari, Cyrillic)', category: 'constraints' },
    { aspect: 'locale-aware formatting', note: 'Localize dates, numbers, currency, units, and sort order via a locale library (e.g. ICU, Intl API) rather than hardcoding a single format', category: 'functionalRequirements' },
    { aspect: 'TMS/CAT tool integration', note: 'Choose a translation management system (Crowdin, Lokalise, Phrase, Smartling, memoQ, Trados) with API/CLI integration matching the existing build pipeline', category: 'functionalRequirements' },
    { aspect: 'file format compatibility', note: 'Confirm the exchange format (XLIFF, PO, JSON, RESX, ARB) is compatible with both the source codebase and the chosen TMS', category: 'functionalRequirements' },
    { aspect: 'translation memory leverage', note: 'Configure fuzzy-match thresholds against the translation memory to reduce cost/turnaround on repeated or near-duplicate segments', category: 'preferences' },
    { aspect: 'continuous localization', note: 'Automate string push/pull between the codebase and the TMS on every content change to avoid manual export/import bottlenecks', category: 'preferences' },
    { aspect: 'string context metadata', note: 'Attach developer comments, screenshots, or character-limit metadata to each source string so translators are not guessing at meaning from an isolated key like "submit_btn_02"', category: 'functionalRequirements' },
    { aspect: 'string ID stability', note: 'Keep string/resource keys stable across releases — renaming or regenerating keys breaks TM matching and forces re-translation of unchanged content', category: 'constraints' },
    { aspect: 'concatenated string handling', note: 'Flag and refactor concatenated strings built from multiple fragments (e.g. "You have " + count + " items"), since word order and grammar rules make fragment-level translation unreliable across languages', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'text expansion tolerance', note: 'Design layouts to tolerate 30-200% text expansion (e.g. German, Finnish) without truncation or overflow', category: 'constraints' },
    { aspect: 'RTL layout mirroring', note: 'Mirror the full UI (icon direction, navigation flow, alignment) for RTL languages like Arabic and Hebrew, not just flip text direction', category: 'functionalRequirements' },
    { aspect: 'font and script support', note: 'Verify chosen typefaces render all target scripts correctly, including diacritics, ligatures, and complex script shaping', category: 'constraints' },
    { aspect: 'locale switcher discoverability', note: 'Provide a clear, easily discoverable language/locale switcher rather than relying solely on browser/OS locale auto-detection', category: 'preferences' },
    { aspect: 'culturally appropriate imagery', note: 'Review icons, colors, gestures, and imagery for cultural appropriateness per target market (e.g. color symbolism, hand gestures)', category: 'preferences' },
    { aspect: 'in-context translation review', note: 'Provide translators with screenshots or in-context preview tooling so ambiguous short strings are translated with correct context', category: 'preferences' },
    { aspect: 'date/number locale formatting', note: 'Display dates, addresses, and phone number formats in locally expected conventions rather than the source-locale format', category: 'functionalRequirements' },
  ],
  securityConsiderations: [
    { aspect: 'third-party MT data handling', note: 'Confirm what happens to source content sent to third-party machine translation APIs (retention, training-data use) before sending confidential or regulated content', category: 'constraints' },
    { aspect: 'translator/vendor access control', note: 'Limit external translator/vendor access to only the strings and context they need, not full source code or unrelated confidential data', category: 'constraints' },
    { aspect: 'PII in translatable strings', note: 'Screen source strings for personal data before sending them to external translation vendors or MT services', category: 'constraints' },
    { aspect: 'regulatory content requirements', note: 'Identify jurisdictions requiring locally certified/legally reviewed translations (e.g. medical, legal, financial disclosures)', category: 'constraints' },
    { aspect: 'TMS credential management', note: 'Scope API keys/tokens for the translation management system narrowly and rotate them if a vendor relationship ends', category: 'constraints' },
    { aspect: 'supply-chain trust for translators', note: 'Vet freelance/agency translators and enforce NDAs before granting access to unreleased or sensitive product content', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'tone and voice adaptation', note: 'Adapt brand voice per locale rather than translating literally — humor, idioms, and formality norms differ across languages/cultures', category: 'preferences' },
    { aspect: 'transcreation for marketing copy', note: 'Use transcreation (creative re-writing, not direct translation) for taglines, slogans, and marketing hooks where literal translation loses impact', category: 'preferences' },
    { aspect: 'cultural symbolism review', note: 'Review names, colors, numbers, and imagery for unintended cultural or religious connotations in each target market', category: 'constraints' },
    { aspect: 'localized visual assets', note: 'Consider whether hero images, screenshots, or video need locale-specific versions rather than reusing source-locale visuals as-is', category: 'preferences' },
    { aspect: 'humor and idiom handling', note: 'Flag source jokes, idioms, and wordplay for adaptation rather than direct translation, since these rarely survive literal translation', category: 'preferences' },
    { aspect: 'consistent brand terminology', note: 'Keep product/brand names, taglines, and key terms consistent per the glossary across all localized touchpoints', category: 'constraints' },
  ],
  qaConsiderations: [
    { aspect: 'linguistic QA (LQA)', note: 'Run a formal LQA pass checking accuracy, fluency, terminology adherence, and tone against the source and style guide', category: 'functionalRequirements' },
    { aspect: 'pseudo-localization testing', note: 'Run a pseudo-localization pass (accented/expanded placeholder text) early to catch hardcoded strings and layout breakage before real translation begins', category: 'preferences' },
    { aspect: 'back-translation spot checks', note: 'Use back-translation on high-risk strings (legal, medical, safety warnings) to independently verify meaning was preserved', category: 'constraints' },
    { aspect: 'visual/layout QA per locale', note: 'Screenshot and review every locale build for truncation, overlap, and RTL mirroring issues, not just the source locale', category: 'functionalRequirements' },
    { aspect: 'placeholder/variable integrity testing', note: 'Verify no placeholders, HTML tags, or format specifiers were dropped, duplicated, or corrupted during translation', category: 'constraints' },
    { aspect: 'missing/untranslated string detection', note: 'Automate detection of strings that fell back to source language or were never sent for translation', category: 'functionalRequirements' },
    { aspect: 'consistency check against TM/glossary', note: 'Validate final translations against the translation memory and glossary to catch terminology drift between translators or sessions', category: 'preferences' },
    { aspect: 'string freeze compliance', note: 'Verify no new or changed source strings were introduced after string freeze, since late changes silently reintroduce untranslated content into an already-signed-off locale build', category: 'constraints' },
    { aspect: 'character-limit overflow testing', note: 'Test hard character-limit fields (SMS, push notification titles, button labels) in every target locale, since translated strings can exceed the original limit even when the UI itself would tolerate expansion', category: 'functionalRequirements' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs number of target languages',
      note: 'An extremely short delivery timeline alongside a large number of target languages requiring human translation and in-country review is high-risk — quality localization at scale typically requires days-to-weeks per language, not hours.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(\d{2,}\s+languages|all\s+languages|dozens\s+of\s+languages|every\s+market)\b/i,
    },
    {
      aspect: 'machine-translation-only vs regulated/legal content',
      note: 'Relying solely on raw machine translation (no human review) for legal, medical, or safety-critical content is high-risk — regulatory and liability standards typically require certified human translation and review for that content class.',
      category: 'constraints',
      triggerA: /\b(machine\s+translation\s+only|raw\s+mt|no\s+human\s+review|fully\s+automated\s+translation)\b/i,
      triggerB: /\b(legal\s+document\w*|medical\s+content|safety\s+warning\w*|regulatory\s+filing\w*|contract\s+translation)\b/i,
    },
    {
      aspect: 'no budget vs full human translation at scale',
      note: 'A near-zero/shoestring budget stated alongside professional human translation across many languages plus in-country linguistic review is a known-infeasible combination — human translation and LQA scale in cost with word count and language count.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(professional\s+translat\w*|human\s+translat\w*|in-country\s+review|linguistic\s+review)\b/i,
    },
    {
      aspect: 'no source-string refactor time vs continuous localization',
      note: 'Continuous/automated localization pipelines assume externalized, ID-stable source strings — if there is no time budgeted to refactor hardcoded or concatenated strings first, automated string push/pull will surface broken or untranslatable content on every sync.',
      category: 'constraints',
      triggerA: /\b(no\s+time\s+for\s+refactor\w*|skip\s+refactor\w*|can'?t\s+touch\s+the\s+code|freeze\s+the\s+codebase)\b/i,
      triggerB: /\b(continuous\s+localization|automated\s+string\s+sync|every\s+content\s+change)\b/i,
    },
  ],
};
