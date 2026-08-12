import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/web/index.ts and
// domains/game/index.ts (TASK-006). Plain substring matching would let bare
// keywords like 'ai video' match inside unrelated phrases, or short keywords
// like 'cut' match inside "cutout"/"shortcut" — silently inflating scores on
// inputs that have nothing to do with video generation.
const KEYWORDS = [
  'video generation', 'ai video', 'text-to-video', 'text to video', 'image-to-video',
  'image to video', 'video clip', 'video prompt', 'runway', 'sora', 'pika', 'kling',
  'luma', 'veo', 'storyboard', 'shot list', 'b-roll', 'broll', 'voiceover',
  'video montage', 'video render', 'animated clip', 'frame rate', 'aspect ratio video',
  'scene transition', 'video pacing', 'video duration', 'motion graphics',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const videoGenerationDomain: DomainModule = {
  id: 'video-generation',
  label: 'Video Generation',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Specify target clip duration and total runtime', category: 'functional' },
    { text: 'Define aspect ratio / output resolution for the intended platform', category: 'constraint' },
    { text: 'Note that no live AI video generation call occurs — output is a structured prompt/spec for an external video model', category: 'constraint' },
    { text: 'Describe visual style and pacing consistent across shots', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'duration',
      description: 'Target clip length or total runtime is unspecified',
      isResolved: (input) => /\b(\d+\s*(second|sec|minute|min)s?|short[- ]form|long[- ]form)\b/i.test(input),
    },
    {
      field: 'style/pacing',
      description: 'Visual style and pacing (cinematic, fast-cut, slow/ambient, documentary) is unspecified',
      isResolved: (input) => /\b(cinematic|fast[- ]cut|slow[- ]paced|ambient|documentary|animated|realistic|stylized)\b/i.test(input),
    },
    {
      field: 'audio',
      description: 'Whether the video needs a soundtrack, voiceover, or sync\'d audio is unspecified',
      isResolved: (input) => /\b(music|soundtrack|voiceover|voice[- ]over|narration|sound effects?|sfx|silent|no audio)\b/i.test(input),
    },
    {
      field: 'platform/aspect ratio',
      description: 'Target platform or aspect ratio (e.g. vertical for social, widescreen for YouTube) is unspecified',
      isResolved: (input) => /\b(vertical|horizontal|widescreen|16:9|9:16|1:1|square|tiktok|instagram|youtube|reels)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'concept/storyboard', dependsOn: [], note: 'Shot-by-shot outline defining scenes, camera direction, and narrative beats' },
    { component: 'prompt sequencing', dependsOn: ['concept/storyboard'], note: 'Per-shot generation prompts sent to the external video model, one per scene/clip' },
    { component: 'style consistency layer', dependsOn: ['prompt sequencing'], note: 'Shared style/seed/reference guidance so shots feel visually continuous' },
    { component: 'transitions and pacing', dependsOn: ['prompt sequencing'], note: 'Cut points, transition types, and timing between shots' },
    { component: 'audio sync', dependsOn: ['transitions and pacing'], note: 'Music, voiceover, or SFX timed against the visual cut list' },
    { component: 'export/output spec', dependsOn: ['audio sync'], note: 'Final resolution, frame rate, aspect ratio, and delivery format' },
  ],
  technicalConsiderations: [
    { aspect: 'duration limits', note: 'Confirm target clip length against the constraints of typical AI video models (often short clips of a few seconds, chained together for longer sequences)', category: 'constraints' },
    { aspect: 'frame rate', note: 'Specify frame rate (e.g. 24/30/60fps) consistent with the intended platform and desired motion feel', category: 'functionalRequirements' },
    { aspect: 'resolution/aspect ratio', note: 'Define output resolution and aspect ratio matching the target platform (vertical for social, widescreen for broadcast)', category: 'constraints' },
    { aspect: 'shot continuity', note: 'Plan how visual consistency (character, style, lighting) is maintained across separately generated shots/clips', category: 'functionalRequirements' },
    { aspect: 'no live generation call', note: 'This is a prompt/spec for an external video generation tool — Scaffold does not call any video AI API itself', category: 'constraints' },
    { aspect: 'render/export pipeline', note: 'Define how generated clips are assembled, trimmed, and exported into a final sequence', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'pacing', note: 'Define overall pacing (fast-cut vs. slow/ambient) so shot length and transition rhythm match the intended viewer experience', category: 'functionalRequirements' },
    { aspect: 'viewer attention span', note: 'Consider platform norms for hook timing (e.g. first 1-3 seconds for short-form social video) so the opening shot earns attention', category: 'preferences' },
    { aspect: 'accessibility', note: 'Provide captions/subtitles for any dialogue or voiceover so the video is usable without sound', category: 'constraints' },
    { aspect: 'narrative clarity', note: 'Ensure the shot sequence tells a clear, followable story or message without requiring prior context', category: 'functionalRequirements' },
    { aspect: 'platform fit', note: 'Match cut style and length conventions to the target platform (social feed, presentation, ad, film)', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'likeness/consent', note: 'Flag use of real people\'s likeness, voice, or footage and confirm rights/consent before generation, especially for deepfake-adjacent requests', category: 'constraints' },
    { aspect: 'copyrighted material', note: 'Avoid prompting for direct reproduction of copyrighted footage, characters, music, or branded content without rights', category: 'constraints' },
    { aspect: 'misleading content', note: 'Flag requests that could produce deceptive or fabricated depictions of real events, people, or organizations presented as authentic', category: 'constraints' },
    { aspect: 'unsafe assumptions', note: 'Flag any implicit assumption that generated video will be presented as real/unlabeled AI-generated content', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'visual style', note: 'Establish a consistent visual style (color grading, lighting, camera language) across all shots before prompt sequencing begins', category: 'preferences' },
    { aspect: 'shot variety', note: 'Vary shot composition (wide, close-up, tracking) to avoid a static, repetitive feel across a sequence', category: 'preferences' },
    { aspect: 'transitions', note: 'Choose transition types (hard cut, crossfade, match cut) deliberately to reinforce pacing and tone rather than defaulting to one style throughout', category: 'preferences' },
    { aspect: 'audio-visual sync', note: 'Align key visual beats (cuts, reveals) with music or sound cues for a more polished, intentional feel', category: 'functionalRequirements' },
    { aspect: 'originality', note: 'Push toward a distinctive visual concept rather than generic stock-footage-style AI video output', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'contradiction check', note: 'Check for contradictions such as "silent video" alongside "voiceover narration" or mismatched duration vs. shot count', category: 'constraints' },
    { aspect: 'missing requirement', note: 'Identify requirements implied but unstated, such as captions for a dialogue-heavy video or a call-to-action end card for an ad', category: 'functionalRequirements' },
    { aspect: 'acceptance criteria', note: 'Define concrete acceptance criteria (e.g. "final cut is under 60 seconds and matches the storyboard shot count")', category: 'functionalRequirements' },
    { aspect: 'consistency check', note: 'Verify that style, character, and setting descriptions remain consistent across all per-shot prompts in the sequence', category: 'preferences' },
    { aspect: 'failure states', note: 'Identify failure states the spec does not address: generated shot not matching style, audio drift out of sync, model rejecting a prompt', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'duration vs single-shot generation',
      note: 'A long continuous runtime requested as a single generated shot is a known-infeasible combination for current AI video models, which typically generate only short clips that must be chained together.',
      category: 'constraints',
      triggerA: /\b(single|one)\s+(continuous\s+)?(shot|take|clip)\b/i,
      triggerB: /\b(\d+\s*(minute|min)s?|feature[- ]length|full[- ]length)\b/i,
    },
    {
      aspect: 'budget vs production scope',
      note: 'A near-zero/shoestring budget stated alongside a large-scale, multi-scene, cinematic production is a known-infeasible combination — that scope requires proportional spend on generation credits, editing, and iteration.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(cinematic|feature[- ]length|multi[- ]scene|full[- ]length)\s+(production|film|video)\b/i,
    },
  ],
};
