import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006).
// Plain substring matching would let e.g. 'edit' match inside 'editorial',
// or 'cast' match inside 'broadcaster' unpredictably — word-boundary regex
// keeps scoring precise.
const KEYWORDS = [
  'podcast', 'podcasting', 'episode', 'episodes', 'audio production', 'audio engineer',
  'mastering', 'audio editing', 'voiceover', 'voice over', 'microphone', 'mic',
  'audio interface', 'soundproofing', 'noise floor', 'rss feed', 'show notes',
  'audiogram', 'spotify for podcasters', 'apple podcasts', 'listenership',
  'audio levels', 'de-essing', 'loudness normalization', 'lufs', 'pop filter',
  'multi-track recording', 'co-host', 'audio post-production', 'podcast script',
  'ad read', 'dynamic ad insertion', 'podcast transcript', 'chapter markers', 'sound engineer',
  'podcast trailer', 'explicit tag', 'id3 tags',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const podcastAudioDomain: DomainModule = {
  id: 'podcast-audio',
  label: 'Podcast / Audio Production',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define episode format and target length (interview, solo, narrative) and typical runtime', category: 'functional' },
    { text: 'Establish recording setup (microphones, audio interface, recording software) before production begins', category: 'constraint' },
    { text: 'Define target loudness standard (e.g. -16 LUFS stereo, -19 LUFS mono) for consistent playback volume across platforms', category: 'constraint' },
    { text: 'Choose a distribution/hosting platform (e.g. Spotify for Podcasters, Buzzsprout, Libsyn) that generates the RSS feed', category: 'functional' },
    { text: 'Plan a consistent publishing cadence (weekly, biweekly) appropriate to the format', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'format',
      description: 'Episode format (solo, co-hosted, interview, narrative/scripted) is unspecified',
      isResolved: (input) => /\b(solo|co-?host(?:ed)?|interview|narrative|scripted|panel|round-?table)\b/i.test(input),
    },
    {
      field: 'length',
      description: 'Target episode length/runtime is unspecified',
      isResolved: (input) => /\b(\d+\s*(minute|min|hour|hr)s?|short-?form|long-?form)\b/i.test(input),
    },
    {
      field: 'recording setup',
      description: 'Recording environment/equipment (remote vs. in-studio, mic/interface) is unspecified',
      isResolved: (input) => /\b(remote|in-?studio|microphone|mic|audio interface|zoom recorder|riverside|squadcast)\b/i.test(input),
    },
    {
      field: 'distribution platform',
      description: 'Target distribution platform(s) (Spotify, Apple Podcasts, YouTube) are unspecified',
      isResolved: (input) => /\b(spotify|apple podcasts?|youtube|rss feed|podcast hosting)\b/i.test(input),
    },
    {
      field: 'editing style',
      description: 'Desired editing style (raw/unedited vs. tightly edited with music/sound design) is unspecified',
      isResolved: (input) => /\b(raw|unedited|tightly edited|sound design|music bed|edited down)\b/i.test(input),
    },
    {
      field: 'monetization',
      description: 'Monetization approach (ads, sponsorships, listener support, none) is unspecified',
      isResolved: (input) => /\b(sponsorship|advertis(?:ing|ement)|monetiz|patreon|listener support|paid subscription)\b/i.test(input),
    },
    {
      field: 'publishing cadence',
      description: 'Publishing cadence/frequency (daily, weekly, biweekly, monthly, seasonal) is unspecified',
      isResolved: (input) => /\b(daily|weekly|bi-?weekly|monthly|seasonal|seasonally|every (?:day|week|month)|per week|per month)\b/i.test(input),
    },
    {
      field: 'navigation/chapters',
      description: 'Whether episodes need chapter markers/timestamps for in-episode navigation is unspecified',
      isResolved: (input) => /\b(chapter markers?|chapters|timestamps?|id3 tags?)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'pre-production planning', dependsOn: [], note: 'Episode outline, guest booking, and talking points/script prepared ahead of recording' },
    { component: 'recording setup', dependsOn: ['pre-production planning'], note: 'Microphones, audio interface, acoustic treatment, and recording software/DAW configured' },
    { component: 'raw capture', dependsOn: ['recording setup'], note: 'Multi-track recording session capturing each speaker on a separate track' },
    { component: 'editing', dependsOn: ['raw capture'], note: 'Cutting dead air/mistakes, arranging segments, removing filler words' },
    { component: 'mixing', dependsOn: ['editing'], note: 'Leveling tracks, EQ, compression, de-essing, and noise reduction across all speakers' },
    { component: 'mastering', dependsOn: ['mixing'], note: 'Final loudness normalization to platform target (e.g. -16 LUFS) and limiting/export to distribution format' },
    { component: 'show notes and metadata', dependsOn: ['mastering'], note: 'Episode title, description, timestamps, and tags written for discoverability' },
    { component: 'distribution', dependsOn: ['mastering', 'show notes and metadata'], note: 'Upload to hosting platform which generates the RSS feed consumed by Spotify/Apple Podcasts/etc.' },
    { component: 'promotion assets', dependsOn: ['distribution'], note: 'Audiograms, clips, and social snippets produced from the finished episode for marketing' },
  ],
  technicalConsiderations: [
    { aspect: 'recording format', note: 'Record in an uncompressed or lossless format (WAV/AIFF, 44.1-48kHz, 16/24-bit) to preserve headroom for editing; export to compressed MP3/AAC only for final distribution', category: 'constraints' },
    { aspect: 'multi-track capture', note: 'Record each speaker on an isolated track (local or via a remote tool like Riverside/Squadcast/Zencastr) rather than a single mixed track, so editing and leveling can be done per-speaker', category: 'functionalRequirements' },
    { aspect: 'DAW/editing software', note: 'Select an audio workstation appropriate to complexity (e.g. Audacity/Descript for simple cuts, Adobe Audition/Reaper/Logic Pro for multitrack mixing)', category: 'functionalRequirements' },
    { aspect: 'loudness standard', note: 'Master to a consistent integrated loudness target (commonly -16 LUFS stereo for most platforms, -19 LUFS mono) with true-peak limiting at -1dBTP to avoid clipping on playback devices', category: 'constraints' },
    { aspect: 'noise handling', note: 'Address room noise, hum, and background artifacts via acoustic treatment or software noise reduction before mixing, since noise removed late is harder to fix cleanly', category: 'constraints' },
    { aspect: 'file interchange', note: 'Define the export/delivery format (WAV master + MP3 distribution copy) and sample rate/bit depth consistency across the pipeline', category: 'functionalRequirements' },
    { aspect: 'hosting bandwidth', note: 'Choose a podcast host with adequate bandwidth/storage limits and reliable RSS feed generation for the expected episode volume and audience size', category: 'constraints' },
    { aspect: 'remote recording reliability', note: 'For remote interviews, record a local backup track on each participant\'s end in case of internet dropouts, since a compressed VoIP-only recording degrades quality', category: 'preferences' },
    { aspect: 'chapter markers and ID3 tags', note: 'If chapter navigation is required, embed chapter markers (Podcasting 2.0 chapters.json or ID3v2 chapter frames) at export time rather than relying on the host platform to infer them', category: 'functionalRequirements' },
    { aspect: 'transcript generation', note: 'Decide whether transcripts are produced via automated speech-to-text (with a manual accuracy pass) or fully manual transcription, since ASR error rates rise sharply with cross-talk, accents, and technical jargon', category: 'functionalRequirements' },
    { aspect: 'dynamic ad insertion', note: 'If using dynamic ad insertion (DAI), leave clearly marked silence/marker points in the master export for the host platform to inject ads server-side, rather than baking ads permanently into the file', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'episode pacing', note: 'Define pacing/structure (cold open, intro, segments, outro) so listeners know what to expect and can navigate via chapter markers', category: 'functionalRequirements' },
    { aspect: 'audio consistency', note: 'Keep intro/outro music and voice levels consistent across episodes so the listening experience feels like one coherent show, not disjointed one-offs', category: 'preferences' },
    { aspect: 'discoverability', note: 'Write clear episode titles, descriptions, and show notes with timestamps so listeners can find and navigate content within an episode', category: 'functionalRequirements' },
    { aspect: 'accessibility', note: 'Provide a transcript for each episode so hearing-impaired listeners and search engines can access the content', category: 'preferences' },
    { aspect: 'first-episode experience', note: 'Design a strong first few episodes and a clear show trailer, since most new-listener churn happens in the first minute of the first episode', category: 'preferences' },
    { aspect: 'cross-platform playback', note: 'Verify episode playback and metadata display correctly across major apps (Apple Podcasts, Spotify, Overcast, Pocket Casts), which render feeds differently', category: 'constraints' },
    { aspect: 'ad placement experience', note: 'Place ad reads at natural segment breaks rather than mid-sentence interruptions, and keep total ad load proportionate to episode length so listeners do not churn mid-episode', category: 'preferences' },
    { aspect: 'explicit content labeling', note: 'Set the RSS explicit tag accurately and warn listeners up front for strong language or graphic content, since default players surface this before playback', category: 'functionalRequirements' },
  ],
  securityConsiderations: [
    { aspect: 'guest consent', note: 'Obtain explicit recorded or written consent from guests before publishing their voice/likeness, including how the recording may be reused (clips, ads)', category: 'constraints' },
    { aspect: 'copyright clearance', note: 'Ensure intro/outro music, sound effects, and any sampled audio are licensed for podcast distribution (royalty-free, purchased license, or original) to avoid takedowns/claims', category: 'constraints' },
    { aspect: 'defamation and factual claims', note: 'Review scripted or edited claims about real people/companies for defamation risk, especially in true-crime, news commentary, or opinion formats', category: 'constraints' },
    { aspect: 'sensitive information exposure', note: 'Screen recordings for accidental disclosure of guests\' personal information (addresses, phone numbers, unreleased business details) before publishing', category: 'constraints' },
    { aspect: 'platform account security', note: 'Secure hosting-platform and RSS feed credentials, since a compromised feed can be used to inject malicious enclosure URLs into every subscriber\'s app', category: 'constraints' },
    { aspect: 'sponsorship disclosure', note: 'Clearly disclose paid sponsorships/ads per FTC and platform guidelines rather than presenting paid content as organic commentary', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'show identity', note: 'Establish a distinct sonic identity (theme music, intro sting, host voice/tone) that makes the show recognizable within a few seconds of playback', category: 'preferences' },
    { aspect: 'segment structure', note: 'Design a memorable, repeatable segment structure (recurring bits, listener questions, a signature sign-off) that gives the show a format rather than being a shapeless conversation', category: 'preferences' },
    { aspect: 'sound design', note: 'Use tasteful sound design (transition stings, ambient beds for narrative segments) to reinforce mood without becoming distracting or gimmicky', category: 'preferences' },
    { aspect: 'guest chemistry', note: 'Consider host/guest or co-host chemistry and interview style (conversational vs. structured Q&A) as a core creative choice, not an afterthought', category: 'preferences' },
    { aspect: 'cover art and branding', note: 'Design cover art that reads clearly at thumbnail size in podcast apps and reflects the show\'s tone and genre at a glance', category: 'functionalRequirements' },
    { aspect: 'episode titling', note: 'Craft titles that balance searchability/SEO with genuine intrigue, avoiding generic "Episode 42" naming that gives potential listeners no reason to click', category: 'preferences' },
    { aspect: 'ad read delivery', note: 'Decide whether sponsor reads are host-read (personal, higher trust, more production time) or pre-produced spots (consistent, faster to insert) as a deliberate creative/production tradeoff', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'audio quality check', note: 'Listen to the full mastered episode on multiple playback devices (phone speaker, earbuds, car audio) to catch clipping, sibilance, or inconsistent levels before publishing', category: 'constraints' },
    { aspect: 'contradiction check', note: 'Check for contradictions such as "no editing/raw conversation" stated alongside "polished sound design with music beds and tight pacing"', category: 'constraints' },
    { aspect: 'missing requirement', note: 'Identify requirements the spec implies but never states, such as a transcript requirement implied by an accessibility goal, or ad-insertion points implied by a monetization goal', category: 'functionalRequirements' },
    { aspect: 'metadata verification', note: 'Verify RSS feed metadata (title, author, category, explicit tag, episode artwork) validates correctly before submitting to directories, since malformed feeds get rejected or misclassified', category: 'functionalRequirements' },
    { aspect: 'failure states', note: 'Plan for failure states: a guest\'s remote connection drops mid-recording, a co-host is unavailable last-minute, or an upload to the host fails before a scheduled release', category: 'constraints' },
    { aspect: 'legal/release checklist', note: 'Confirm guest release forms, sponsor read scripts, and music licenses are all signed off before the episode goes live, not after', category: 'constraints' },
    { aspect: 'break the spec', note: 'Attempt to break the specification: a guest cancels day-of, a copyright claim hits a past episode, or the RSS feed needs to migrate hosts without breaking subscriber counts', category: 'preferences' },
    { aspect: 'chapter/timestamp accuracy', note: 'Verify chapter markers and show-notes timestamps still line up with the audio after any post-export trim or re-edit, since a stale timestamp list is worse than none', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'budget vs studio-quality claim',
      note: 'A near-zero/shoestring budget stated alongside "studio-quality" or "broadcast-quality" audio is a known-infeasible combination — professional-sounding audio requires proportional spend on microphones, interfaces, and acoustic treatment.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(studio[- ]quality|broadcast[- ]quality|professional[- ]grade)\s+(audio|sound)\b/i,
    },
    {
      aspect: 'timeline vs multi-guest production',
      note: 'An extremely short delivery timeline (same day or overnight) alongside a multi-guest/panel format with heavy editing and sound design is high-risk — scheduling, recording, and mixing multiple contributors realistically takes days.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(multi-?guest|panel|round-?table|multiple guests)\b/i,
    },
    {
      aspect: 'raw/unedited vs heavy production',
      note: 'Requesting a "raw, unedited, one-take" recording alongside heavy sound design, music beds, and tight pacing is a contradictory pairing — genuinely unedited audio cannot also be tightly produced.',
      category: 'constraints',
      triggerA: /\b(raw|unedited|one[- ]take|no editing)\b/i,
      triggerB: /\b(sound design|music bed|tightly edited|tight pacing)\b/i,
    },
    {
      aspect: 'solo host vs daily cadence',
      note: 'A single solo host stated alongside a daily publishing cadence is high-risk — sustaining daily recording, editing, and mastering single-handedly with no team is rarely feasible without burning out or dropping quality.',
      category: 'constraints',
      triggerA: /\b(solo host|just (?:me|myself)|one[- ]person show|no team)\b/i,
      triggerB: /\b(daily|every day)\b/i,
    },
  ],
};
