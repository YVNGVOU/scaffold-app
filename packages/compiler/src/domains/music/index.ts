import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching would let a keyword
// like 'mix' match inside unrelated words (e.g. 'admixture', 'commix'), and
// 'song' would match inside 'songwriter' in a way that double counts —
// word-boundary regexes avoid that class of bug entirely.
const KEYWORDS = [
  'music', 'song', 'songwriting', 'compose', 'composition', 'composer',
  'track', 'album', 'ep', 'single', 'melody', 'harmony', 'chord progression',
  'tempo', 'bpm', 'genre', 'instrumentation', 'instrumental', 'lyrics',
  'vocals', 'mixing', 'mastering', 'mix', 'master', 'daw', 'sample pack',
  'beat', 'soundtrack', 'score', 'sync licensing', 'royalty-free music',
  'band', 'orchestra', 'synth', 'drum pattern',
  'produce a beat', 'music producer', 'jingle', 'theme song', 'backing track',
  'instrumental track', 'remix', 'cover song', 'acapella', 'stem mastering',
  'vocal chain', 'chord chart', 'lead sheet', 'sheet music', 'midi arrangement',
  'sound design', 'foley', 'audio engineer', 'recording session', 'demo track',
  'playlist pitch', 'streaming release', 'topline', 'hook writing',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const musicDomain: DomainModule = {
  id: 'music',
  label: 'Music',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define target genre and mood/tempo direction', category: 'functional' },
    { text: 'Specify instrumentation and arrangement style', category: 'functional' },
    { text: 'Define delivery format (stems, mixed/mastered file, sample rate/bit depth)', category: 'constraint' },
    { text: 'Clarify licensing/usage rights for the finished track', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'genre',
      description: 'Target genre or stylistic reference is unspecified',
      isResolved: (input) =>
        /(pop|rock|hip-?hop|rap|jazz|classical|electronic|edm|folk|country|r&b|ambient|lo-?fi|orchestral|metal|indie|reggae|blues|cinematic)/i.test(
          input
        ),
    },
    {
      field: 'mood/tempo',
      description: 'Mood, energy, or tempo (e.g. upbeat, melancholic, BPM range) is unspecified',
      isResolved: (input) => /(upbeat|energetic|melancholic|calm|dark|happy|sad|aggressive|chill|\bbpm\b|slow|fast|mid[- ]tempo)/i.test(input),
    },
    {
      field: 'instrumentation',
      description: 'Instrumentation (acoustic, electronic, specific instruments, vocals) is unspecified',
      isResolved: (input) =>
        /(guitar|piano|drums|synth|vocals?|orchestra|strings|bass|instrumental|acapella|choir|band)/i.test(input),
    },
    {
      field: 'licensing',
      description: 'Intended use and licensing (personal, commercial, sync, royalty-free) is unspecified',
      isResolved: (input) => /(licens|royalty-?free|commercial use|sync|copyright|rights)/i.test(input),
    },
    {
      field: 'vocals-vs-instrumental',
      description: 'Whether the track includes vocals/lyrics or is purely instrumental is unspecified',
      isResolved: (input) => /(with vocals|vocal track|lyrics|\binstrumental\b|no vocals|purely instrumental|acapella)/i.test(input),
    },
    {
      field: 'reference-track',
      description: 'A reference artist or track to anchor the intended sound is unspecified',
      isResolved: (input) => /(reference track|sounds? like|similar to|in the style of|inspired by)/i.test(input),
    },
    {
      field: 'track-length',
      description: 'Target track length or duration is unspecified',
      isResolved: (input) => /(\d+\s*(?:seconds?|secs?|minutes?|mins?)\b|full[- ]length|short loop|\bloopable\b)/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'songwriting/composition', dependsOn: [], note: 'Melody, harmony, structure, and lyrics (if vocal)' },
    { component: 'arrangement', dependsOn: ['songwriting/composition'], note: 'Instrumentation layout and part writing' },
    { component: 'production/recording', dependsOn: ['arrangement'], note: 'Tracking or programming instruments/vocals in a DAW' },
    { component: 'mixing', dependsOn: ['production/recording'], note: 'Balancing levels, EQ, dynamics, and spatial processing' },
    { component: 'mastering', dependsOn: ['mixing'], note: 'Final loudness/tonal polish for the target distribution platform' },
    { component: 'delivery', dependsOn: ['mastering'], note: 'Export format, stems, and licensing metadata for handoff' },
  ],
  technicalConsiderations: [
    { aspect: 'daw/tooling', note: 'Select a DAW and plugin chain appropriate to the genre and production budget', category: 'functionalRequirements' },
    { aspect: 'tempo and key', note: 'Define tempo (BPM) and key signature up front so all stems stay in sync', category: 'functionalRequirements' },
    { aspect: 'file format/sample rate', note: 'Specify delivery format, sample rate, and bit depth required by the target platform (streaming, film, game engine)', category: 'constraints' },
    { aspect: 'stems and session files', note: 'Clarify whether stems or full session/project files are required for future edits', category: 'preferences' },
    { aspect: 'loudness standard', note: 'Target the correct loudness standard (e.g. streaming LUFS targets vs. broadcast/film specs) during mastering', category: 'constraints' },
    { aspect: 'sample rate/plugin compatibility', note: 'Confirm session sample rate and any third-party plugins used are compatible with the recipient\'s DAW to avoid resampling artifacts or missing-plugin errors on handoff', category: 'constraints' },
    { aspect: 'MIDI vs audio deliverables', note: 'Clarify whether MIDI files/arrangement data are needed in addition to rendered audio (e.g. for game engines or further arrangement work)', category: 'functionalRequirements' },
    { aspect: 'tuning reference', note: 'Confirm the tuning standard (A440 vs alternate concert pitch) when collaborating with acoustic instruments or other recorded stems', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'listening context', note: 'Consider the primary listening context (headphones, car, club system, film theater) when shaping the mix', category: 'preferences' },
    { aspect: 'song structure', note: 'Define a clear structural arc (intro/verse/chorus/bridge or cinematic build) appropriate to the use case', category: 'functionalRequirements' },
    { aspect: 'accessibility of lyrics', note: 'If vocals are present, ensure lyric intelligibility and consider providing a lyric sheet or captions', category: 'preferences' },
    { aspect: 'revision workflow', note: 'Define how feedback rounds and revisions on demos/mixes will be shared and tracked', category: 'preferences' },
    { aspect: 'looping/adaptive use', note: 'If the track is intended for games or interactive media, define loop points, stinger/transition needs, and vertical layering (adaptive music) requirements', category: 'functionalRequirements' },
    { aspect: 'silence/intro pacing', note: 'Consider platform-specific attention spans (e.g. short-form video hooks needing impact in the first 1-2 seconds) when pacing the intro', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'sample clearance', note: 'Verify any samples, loops, or stems used are cleared for the intended use to avoid copyright infringement claims', category: 'constraints' },
    { aspect: 'licensing terms', note: 'Confirm the licensing model (exclusive, non-exclusive, royalty-free, sync) matches the client\'s intended use before delivery', category: 'constraints' },
    { aspect: 'metadata/rights registration', note: 'Register ownership/publishing metadata (ISRC, PRO registration) to protect royalty collection', category: 'preferences' },
    { aspect: 'file distribution', note: 'Avoid distributing unmastered or watermarked drafts through channels where they could be leaked or resold', category: 'preferences' },
    { aspect: 'AI-generated content disclosure', note: 'If any AI music generation or AI-assisted stems are used, disclose this per platform policy (e.g. distributor/DSP AI content rules) to avoid takedown or account risk', category: 'constraints' },
    { aspect: 'session/split agreements', note: 'For collaborative writing sessions, confirm songwriter/producer split percentages and publishing agreements are documented before release to avoid royalty disputes', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'sonic identity', note: 'Establish a distinct sonic palette (instrumentation, production texture) that differentiates the track from generic genre defaults', category: 'preferences' },
    { aspect: 'reference tracks', note: 'Gather 1-3 reference tracks to anchor tone, energy, and production quality expectations', category: 'preferences' },
    { aspect: 'dynamic contrast', note: 'Use dynamic and textural contrast between sections so the arrangement builds rather than staying flat', category: 'functionalRequirements' },
    { aspect: 'hook strength', note: 'Ensure the central hook (melodic, rhythmic, or lyrical) is memorable and reinforced at key structural points', category: 'preferences' },
    { aspect: 'harmonic movement', note: 'Vary chord progression or reharmonize repeated sections to avoid the arrangement feeling static across multiple choruses/loops', category: 'preferences' },
    { aspect: 'genre-blending intent', note: 'If blending genres, clarify which genre provides the primary rhythmic/harmonic backbone so the fusion reads as intentional rather than unfocused', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'mix translation check', note: 'Test the mix across multiple playback systems (earbuds, studio monitors, phone speaker) to catch translation issues', category: 'preferences' },
    { aspect: 'tuning and timing', note: 'Check for pitch/tuning drift and timing inconsistencies, especially in recorded (non-quantized) performances', category: 'functionalRequirements' },
    { aspect: 'loudness compliance', note: 'Verify final master meets the target platform\'s loudness normalization requirements before delivery', category: 'constraints' },
    { aspect: 'contradiction check', note: 'Check for contradictions in the brief (e.g. "fully acoustic" alongside "heavy synth bass")', category: 'constraints' },
    { aspect: 'clipping/peak check', note: 'Scan final render for digital clipping or inter-sample peaks above 0 dBTP, especially after loudness maximization', category: 'functionalRequirements' },
    { aspect: 'mono compatibility', note: 'Verify the mix collapses cleanly to mono without phase cancellation, since many playback contexts (club PA, phone speaker, broadcast) are not fully stereo', category: 'functionalRequirements' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs production scope',
      note: 'A same-day/overnight deadline alongside a full multi-instrument production with mixing and mastering is high-risk — professional production and mastering typically require days to weeks per track.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|overnight|today|in (?:a|one) day|asap)\b/i,
      triggerB: /\b(full (?:band|orchestra) production|mixing and mastering|multi-?track production)\b/i,
    },
    {
      aspect: 'budget vs licensing scope',
      note: 'A zero/minimal budget stated alongside a request for exclusive commercial or sync licensing rights is a known-infeasible combination — exclusive/commercial rights typically command higher fees than royalty-free or non-exclusive licenses.',
      category: 'constraints',
      triggerA: /\b(no|zero|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(exclusive (?:rights|license|licensing)|commercial (?:license|licensing)|sync licensing)\b/i,
    },
    {
      aspect: 'purely acoustic vs live-instrument-free workflow',
      note: 'A request for "fully acoustic" or "live band" sound alongside a remote/no-studio-access production workflow is a high-risk combination — authentic acoustic instrumentation typically requires in-person tracking rather than sample libraries alone.',
      category: 'constraints',
      triggerA: /\b(fully acoustic|live band|real instruments|no synths?)\b/i,
      triggerB: /\b(remote(?:ly)?|no studio access|entirely in[- ]the[- ]box|sample library only)\b/i,
    },
  ],
};
