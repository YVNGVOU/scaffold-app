import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006).
// Plain substring matching let the bare keyword 'api' match inside unrelated
// words like "rapid" — the same discipline applies here so e.g. 'rig' does
// not match inside "rigorous" and 'cel' does not match inside "cellular".
const KEYWORDS = [
  'animation', 'animator', 'animate', 'storyboard', 'storyboarding', 'keyframe',
  'keyframes', 'frame rate', 'fps', 'rigging', 'rig', 'character rig',
  'skeletal animation', 'inbetween', 'inbetweening', 'tweening', 'squash and stretch',
  'motion graphics', 'motion capture', 'mocap', 'rotoscope', 'rotoscoping',
  'cel animation', 'stop motion', '2d animation', '3d animation', 'walk cycle',
  'lip sync', 'anticipation', 'timing chart', 'exposure sheet', 'animatic',
  'onion skinning', 'ease in and ease out', 'bone deformation', 'ik rig', 'fk rig',
  'motion design', 'explainer video', 'sprite animation', 'sprite sheet',
  'frame by frame', 'loop animation', 'easing curve', 'bezier curve animation',
  'timeline animation', 'vector animation', 'puppet animation', 'facial animation',
  'blend shape', 'blendshapes', 'morph target', 'particle effects',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const animationDomain: DomainModule = {
  id: 'animation',
  label: 'Animation',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define target frame rate (e.g. 24fps, 30fps, 60fps) and delivery resolution', category: 'constraint' },
    { text: 'Specify animation style (2D cel, 3D CG, stop motion, motion graphics)', category: 'functional' },
    { text: 'Establish a storyboard/animatic before full production begins', category: 'functional' },
    { text: 'Define output file format(s) and codec for final delivery', category: 'constraint' },
    { text: 'Maintain visual consistency of character/model rigs across all shots', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'style',
      description: 'Animation style (2D, 3D, stop motion, motion graphics, hybrid) is unspecified',
      isResolved: (input) => /\b(2d|3d|stop[- ]motion|motion graphics|cel animation|cutout|claymation|hybrid)\b/i.test(input),
    },
    {
      field: 'frame rate',
      description: 'Target frame rate or delivery timing (fps) is unspecified',
      isResolved: (input) => /\b(\d{2,3}\s?fps|frame rate|frames per second)\b/i.test(input),
    },
    {
      field: 'duration',
      description: 'Target duration/length of the animated piece is unspecified',
      isResolved: (input) => /\b(\d+\s?(second|sec|minute|min)s?|short film|feature[- ]length|runtime)\b/i.test(input),
    },
    {
      field: 'rigging complexity',
      description: 'Whether characters require custom rigging (skeletal/IK-FK) versus simple motion is unspecified',
      isResolved: (input) => /\b(rig|rigging|skeleton|bone|ik|fk|deform\w*)\b/i.test(input),
    },
    {
      field: 'software/pipeline',
      description: 'Target animation software or pipeline (e.g. Toon Boom, Maya, Blender, After Effects, Spine) is unspecified',
      isResolved: (input) => /\b(toon boom|maya|blender|after effects|spine|harmony|moho|cinema 4d|houdini|adobe animate)\b/i.test(input),
    },
    {
      field: 'audience/rating',
      description: 'Intended audience or content rating is unspecified',
      isResolved: (input) => /\b(kids?|children|family|all ages|teen(?:s|agers?)?|adult(?:s)?|mature|rated|audience)\b/i.test(input),
    },
    {
      field: 'delivery platform',
      description: 'Target delivery platform (broadcast/streaming, social media, web/game engine, cinema) is unspecified',
      isResolved: (input) => /\b(broadcast|streaming|netflix|youtube|tiktok|instagram|social media|web(?:site)?|game engine|cinema|theatrical|social)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'story/script', dependsOn: [], note: 'Written narrative or brief driving the animated piece' },
    { component: 'storyboard', dependsOn: ['story/script'], note: 'Shot-by-shot visual plan of composition and staging' },
    { component: 'animatic', dependsOn: ['storyboard'], note: 'Timed rough cut of storyboard panels with scratch audio/timing' },
    { component: 'character/asset design', dependsOn: ['story/script'], note: 'Character models, turnarounds, and prop/environment art' },
    { component: 'rigging', dependsOn: ['character/asset design'], note: 'Skeletal/bone structure and control system enabling deformation and posing' },
    { component: 'animation pass', dependsOn: ['rigging', 'animatic'], note: 'Keyframe and inbetween work producing the actual motion' },
    { component: 'lighting and rendering', dependsOn: ['animation pass'], note: 'Scene lighting setup and frame rendering to final resolution' },
    { component: 'compositing', dependsOn: ['lighting and rendering'], note: 'Layer compositing, effects, and color grading' },
    { component: 'audio/sound design', dependsOn: ['animatic'], note: 'Voice recording, lip sync reference, foley, and score integration' },
    { component: 'delivery/export', dependsOn: ['compositing', 'audio/sound design'], note: 'Final render/export to target codec, resolution, and platform spec' },
  ],
  technicalConsiderations: [
    { aspect: 'frame rate', note: 'Confirm target frame rate (24fps cinematic, 30/60fps for web/game motion graphics) since it affects animation density and file size', category: 'constraints' },
    { aspect: 'software/pipeline', note: 'Select an animation package suited to the style: Toon Boom Harmony or Adobe Animate for 2D, Maya/Blender/Cinema 4D for 3D, Spine/DragonBones for skeletal game animation', category: 'functionalRequirements' },
    { aspect: 'rigging approach', note: 'Choose an appropriate rig type (FK, IK, or blended IK/FK) and control scheme matched to the complexity of required motion', category: 'functionalRequirements' },
    { aspect: 'render engine', note: 'For 3D work, define the render engine (e.g. Cycles, Arnold, Redshift, real-time engine) balancing fidelity against render-farm time/cost', category: 'constraints' },
    { aspect: 'file interchange', note: 'Define interchange formats (FBX, Alembic, glTF, USD) if assets move between DCC tools or into a game engine', category: 'functionalRequirements' },
    { aspect: 'resolution and codec', note: 'Specify final delivery resolution and codec (ProRes, H.264, image sequence) matching the distribution platform', category: 'constraints' },
    { aspect: 'asset versioning', note: 'Establish a version-control/asset-management approach for scene files, rigs, and renders to avoid overwritten work across a team', category: 'preferences' },
    { aspect: 'render farm/compute', note: 'Estimate compute/render-farm needs for 3D scenes with heavy simulation, particles, or high sample counts', category: 'preferences' },
    { aspect: 'facial rig / blend shapes', note: 'For character dialogue-heavy work, decide between joint-based facial rigs and blend-shape/morph-target setups, since this determines how phoneme/viseme sets are authored', category: 'functionalRequirements' },
    { aspect: 'loop seamlessness', note: 'For sprite-sheet, GIF, or looping motion-graphics assets, verify the first and last frame match precisely so the loop does not visibly pop at the seam', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'pacing and timing', note: 'Use the animatic to validate pacing and comedic/dramatic timing before committing to full animation', category: 'functionalRequirements' },
    { aspect: 'readability of motion', note: 'Ensure poses and motion read clearly at intended viewing size/speed (silhouette test, staging)', category: 'preferences' },
    { aspect: 'accessibility', note: 'Consider captions/subtitles for dialogue and avoid rapid strobing/flashing sequences that could trigger photosensitive reactions', category: 'constraints' },
    { aspect: 'viewer engagement window', note: 'Match shot length and cut frequency to the platform (short-form social vs. long-form film) and target audience attention span', category: 'preferences' },
    { aspect: 'lip sync accuracy', note: 'Define acceptable lip-sync tolerance/method (phoneme-based vs. approximate) appropriate to production budget and style', category: 'functionalRequirements' },
    { aspect: 'onboarding/context', note: 'For explainer or instructional animation, ensure the opening seconds establish context so viewers are not lost', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'asset licensing', note: 'Confirm licensing/usage rights for any stock rigs, motion-capture libraries, music, or sound effects used in the production', category: 'constraints' },
    { aspect: 'client/brand IP', note: 'Protect unreleased character designs, scripts, and brand assets from leaking before public release (NDA, watermarked previews)', category: 'constraints' },
    { aspect: 'voice talent rights', note: 'Confirm voice actor usage rights and consent scope, especially for AI-assisted voice synthesis or likeness use', category: 'constraints' },
    { aspect: 'file sharing', note: 'Use access-controlled review/approval tools for dailies and cuts rather than open public links, to prevent premature leaks', category: 'preferences' },
    { aspect: 'third-party plugin trust', note: 'Vet any third-party rigging/rendering plugins before installing, since malicious DCC-tool plugins can execute arbitrary scripts', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'visual style', note: 'Define a clear visual style (line weight, color palette, shading approach) and lock it in a style guide before mass production begins', category: 'preferences' },
    { aspect: 'principles of animation', note: 'Apply core animation principles (squash and stretch, anticipation, follow-through, arcs, ease in/out) to give motion weight and appeal', category: 'preferences' },
    { aspect: 'character appeal', note: 'Ensure character designs read clearly in silhouette and carry distinct, appealing personality traits through pose and expression', category: 'preferences' },
    { aspect: 'consistency across shots', note: 'Maintain consistent proportions, color, and rig behavior for each character across every shot and animator', category: 'constraints' },
    { aspect: 'staging and composition', note: 'Stage each shot so the viewer\'s eye is drawn to the intended focal action, using framing, contrast, and negative space', category: 'functionalRequirements' },
    { aspect: 'originality', note: 'Differentiate character/environment design from obvious references so the work does not read as derivative of existing franchises', category: 'preferences' },
    { aspect: 'sound-motion synchronization', note: 'Sync key poses and hits to the beat/rhythm of music or sound effects for stronger impact', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'contradiction check', note: 'Check for contradictions such as "photorealistic 3D" paired with a "one week" timeline, or "hand-drawn 2D" paired with a rigged-skeleton workflow', category: 'constraints' },
    { aspect: 'missing requirement', note: 'Identify implied but unstated requirements, e.g. a talking character implying lip sync, or a walk cycle implying foot-contact timing', category: 'functionalRequirements' },
    { aspect: 'frame consistency', note: 'Check for popping, jittering rigs, volume loss in deformation, and off-model frames across the shot list', category: 'preferences' },
    { aspect: 'acceptance criteria', note: 'Define concrete review checkpoints (storyboard approval, animatic lock, rough animation pass, final render) with sign-off criteria at each', category: 'functionalRequirements' },
    { aspect: 'audio-visual sync check', note: 'Verify final audio and video remain in sync after every render/export pass, especially after frame-rate conversions', category: 'constraints' },
    { aspect: 'cross-platform playback', note: 'Test final export on all target playback platforms/players for codec compatibility and color-space shifts', category: 'preferences' },
    { aspect: 'sprite sheet integrity', note: 'For sprite-sheet/game-asset exports, verify pivot points, padding, and frame boundaries are consistent so the animation does not jitter when imported into the target engine', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs animation style',
      note: 'A very short delivery timeline paired with fully hand-keyed 3D character animation or traditional frame-by-frame 2D is a known-infeasible combination — that density of work typically requires weeks of animator time even for short pieces.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap|24 hours)\b/i,
      triggerB: /\b(hand[- ]?keyed|frame[- ]by[- ]frame|full(?:y)? animated|character animation)\b/i,
    },
    {
      aspect: 'budget vs mocap/render pipeline',
      note: 'A minimal/no budget stated alongside motion capture or high-fidelity 3D rendering is infeasible as stated — mocap suits and render-farm time both carry real cost that a shoestring budget cannot cover.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(motion capture|mocap|photorealistic|render farm|ray[- ]?traced)\b/i,
    },
    {
      aspect: 'team size vs feature-length scope',
      note: 'A solo creator or very small team paired with a feature-length or broadcast-series scope is a high-risk combination — professional animated features typically require large specialized teams across storyboarding, rigging, and rendering.',
      category: 'constraints',
      triggerA: /\b(solo|one person|just me|by myself|small team|two[- ]person)\b/i,
      triggerB: /\b(feature[- ]length|full[- ]length film|animated series|episodic series)\b/i,
    },
    {
      aspect: 'engine-agnostic export vs blend shapes',
      note: 'Targeting a lightweight/mobile game engine while also requiring dense blend-shape facial animation is a high-risk combination — high blend-shape counts bloat mesh data and often exceed mobile GPU/memory budgets.',
      category: 'constraints',
      triggerA: /\b(mobile|lightweight|low[- ]end device|low[- ]poly budget)\b/i,
      triggerB: /\b(blend shapes?|blendshapes|morph targets?|facial animation)\b/i,
    },
  ],
};
