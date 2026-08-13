import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching previously let keywords
// like 'player' or 'api' match inside unrelated words ("multiplayer",
// "rapid"), silently inflating scores on inputs unrelated to the domain.
const KEYWORDS = [
  'image generation', 'image generator', 'ai image', 'ai art', 'ai-generated image',
  'text-to-image', 'text to image', 'midjourney', 'dall-e', 'dalle', 'stable diffusion',
  'diffusion model', 'image prompt', 'img2img', 'inpainting', 'outpainting', 'upscale',
  'upscaling', 'aspect ratio', 'illustration prompt', 'concept art', 'render style',
  'generate an image', 'generate images', 'image variations', 'seed value', 'negative prompt',
  'controlnet', 'lora model', 'sdxl', 'adobe firefly', 'leonardo ai', 'ideogram',
  'character design prompt', 'product photography ai', 'ai headshot', 'image-to-image',
  'photobash', 'image generation prompt', 'flux model', 'runway image', 'style transfer',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const imageGenerationDomain: DomainModule = {
  id: 'image-generation',
  label: 'Image Generation',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define target aspect ratio and output resolution', category: 'functional' },
    { text: 'Specify visual style/reference (photorealistic, illustration, painterly, etc.)', category: 'preference' },
    { text: 'Define number of variations/iterations to generate per prompt', category: 'functional' },
    { text: 'State intended use (print, web, social, concept exploration) to inform resolution needs', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'style',
      description: 'Visual/art style (photorealistic, illustration, anime, 3D render, etc.) is unspecified',
      isResolved: (input) => /\b(photorealistic|illustration|anime|3d render|watercolor|oil painting|cartoon|pixel art|concept art|art style|painterly|line art)\b/i.test(input),
    },
    {
      field: 'aspect ratio / resolution',
      description: 'Target aspect ratio or output resolution is unspecified',
      isResolved: (input) => /\b(aspect ratio|\d+:\d+|\d+x\d+|square|portrait|landscape|widescreen|4k|8k|hi-?res|high resolution)\b/i.test(input),
    },
    {
      field: 'subject / composition',
      description: 'Subject matter or composition (framing, focal point, background) is unspecified',
      isResolved: (input) => /\b(composition|foreground|background|close-?up|wide shot|framing|subject|centered|rule of thirds)\b/i.test(input),
    },
    {
      field: 'iteration strategy',
      description: 'How many variations to generate and how to select/refine among them is unspecified',
      isResolved: (input) => /\b(variations?|iterations?|refine\w*|reroll|batch of|number of images|pick the best)\b/i.test(input),
    },
    {
      field: 'target tool/model',
      description: 'Which image-generation tool or model the prompt is written for is unspecified, which affects prompt syntax and available controls',
      isResolved: (input) => /\b(midjourney|dall-?e|stable diffusion|sdxl|flux|firefly|leonardo|ideogram|runway|any tool|any model|no preference|whichever tool|open to any)\b/i.test(input),
    },
    {
      field: 'color palette',
      description: 'Intended color palette or dominant color scheme is unspecified',
      isResolved: (input) => /\b(color palette|colou?r scheme|dominant colou?rs?|monochrome|muted tones|vibrant colou?rs?|warm tones|cool tones|black and white)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'prompt specification', dependsOn: [], note: 'Core subject, style, composition, and mood direction the image prompt must convey' },
    { component: 'style reference', dependsOn: ['prompt specification'], note: 'Reference images, style tags, or artist/medium descriptors to anchor visual consistency' },
    { component: 'generation parameters', dependsOn: ['prompt specification'], note: 'Aspect ratio, resolution, seed, negative prompt, and model/tool-specific settings' },
    { component: 'iteration loop', dependsOn: ['generation parameters'], note: 'Batch generation, variation review, and refinement cycle (reroll, inpaint, upscale)' },
    { component: 'output pipeline', dependsOn: ['iteration loop'], note: 'Final selection, upscaling, and delivery in the required format/resolution' },
  ],
  technicalConsiderations: [
    { aspect: 'model/tool choice', note: 'Identify which image-generation tool or model family the user has in mind (or leave open), since prompt syntax and capabilities differ significantly', category: 'functionalRequirements' },
    { aspect: 'resolution ceiling', note: 'Confirm the maximum native output resolution of the target tool and whether upscaling is needed to hit the final deliverable size', category: 'constraints' },
    { aspect: 'aspect ratio support', note: 'Verify the target tool supports the requested aspect ratio natively rather than requiring post-crop', category: 'constraints' },
    { aspect: 'seed/reproducibility', note: 'Decide whether a fixed seed is needed for reproducible variations or comparison across prompt edits', category: 'preferences' },
    { aspect: 'negative prompting', note: 'Define negative-prompt terms to exclude unwanted artifacts (extra limbs, watermarks, text) where the tool supports it', category: 'functionalRequirements' },
    { aspect: 'batch/rate limits', note: 'Account for per-request or per-session generation limits when planning the number of variations to request', category: 'constraints' },
    { aspect: 'text rendering limitations', note: 'Flag that most diffusion models render legible text unreliably (signage, labels, logos in-image); plan to add text as a separate compositing/editing step if legibility matters', category: 'constraints' },
    { aspect: 'multi-subject consistency', note: 'Confirm whether the same character/product/mascot must stay visually consistent across multiple generations, which typically requires reference-image conditioning (ControlNet, character LoRA, image prompt) rather than text alone', category: 'functionalRequirements' },
    { aspect: 'color/format profile', note: 'Confirm whether output should be sRGB web-safe or CMYK/print-safe, since raw generator output is typically sRGB and needs conversion for print pipelines', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'prompt clarity', note: 'Write the prompt as an unambiguous, front-loaded description (subject, style, composition) so the model prioritizes the most important elements', category: 'functionalRequirements' },
    { aspect: 'iteration workflow', note: 'Define how the user reviews and selects among generated variations before committing to a final image', category: 'preferences' },
    { aspect: 'feedback loop', note: 'Plan how prompt adjustments will be made between iterations (what changed, what to keep constant)', category: 'preferences' },
    { aspect: 'delivery format', note: 'Confirm the file format and color profile expected by the downstream use (web-optimized vs. print-ready)', category: 'functionalRequirements' },
  ],
  securityConsiderations: [
    { aspect: 'likeness/consent', note: 'Flag requests that generate images of real, identifiable people without clear consent or legitimate purpose', category: 'constraints' },
    { aspect: 'copyright/trademark', note: 'Flag requests to closely imitate a specific living artist\'s style, copyrighted characters, or trademarked brand imagery', category: 'constraints' },
    { aspect: 'content policy', note: 'Confirm the requested subject matter complies with the target tool\'s content policy (no violent, sexual, or otherwise disallowed content)', category: 'constraints' },
    { aspect: 'provenance disclosure', note: 'Consider whether AI-generated origin needs to be disclosed for the intended use (advertising, journalism, stock imagery)', category: 'preferences' },
    { aspect: 'C2PA/watermark metadata', note: 'Confirm whether the target platform requires or auto-embeds C2PA content-credential metadata or a visible AI-generated watermark, and whether that metadata survives the intended export/edit pipeline', category: 'constraints' },
    { aspect: 'minors in generated imagery', note: 'Flag requests that could generate images of children in inappropriate contexts; treat as a hard content-policy violation regardless of stated intent', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'visual style', note: 'Establish a clear, specific style direction (medium, lighting, color palette, era/influence) rather than leaving the model to default to generic outputs', category: 'preferences' },
    { aspect: 'composition', note: 'Specify framing, focal point, and depth (foreground/midground/background) so the generated image has deliberate visual hierarchy', category: 'functionalRequirements' },
    { aspect: 'mood and lighting', note: 'Define the intended mood and lighting scheme (soft/dramatic, warm/cool, time of day) to guide tone consistently across variations', category: 'preferences' },
    { aspect: 'originality', note: 'Push beyond generic "trending on artstation"-style prompts toward a distinctive combination of references so output does not read as boilerplate AI art', category: 'preferences' },
    { aspect: 'consistency across a set', note: 'When generating multiple related images (e.g. a series), define shared style anchors so the set reads as cohesive rather than disjointed', category: 'constraints' },
  ],
  qaConsiderations: [
    { aspect: 'artifact check', note: 'Review generated images for common AI artifacts: malformed hands/faces, nonsensical text, inconsistent lighting or anatomy', category: 'constraints' },
    { aspect: 'prompt adherence', note: 'Verify the output actually reflects the requested subject, composition, and style rather than a plausible-but-different substitute', category: 'functionalRequirements' },
    { aspect: 'resolution/format check', note: 'Confirm final exported images meet the required resolution, aspect ratio, and file format before delivery', category: 'functionalRequirements' },
    { aspect: 'missing requirement', note: 'Identify unstated but implied requirements, e.g. a "product photo" request implying a clean/transparent background', category: 'functionalRequirements' },
    { aspect: 'contradiction check', note: 'Check for contradictory style directives in the same prompt (e.g. "photorealistic" combined with "cartoon style")', category: 'constraints' },
    { aspect: 'text legibility check', note: 'If the image includes any rendered text (signage, labels, packaging), verify it is spelled correctly and legible rather than garbled pseudo-text', category: 'functionalRequirements' },
    { aspect: 'cross-variation consistency', note: 'For a themed set or series, verify style, palette, and character/product identity stay consistent across all generated images rather than drifting between variations', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'style vs subject contradiction',
      note: 'Requesting mutually exclusive style directives (e.g. photorealistic alongside cartoon/anime styling) in the same prompt is a self-contradicting specification that will produce inconsistent results.',
      category: 'constraints',
      triggerA: /\b(photorealistic|photo-?real)\b/i,
      triggerB: /\b(cartoon|anime|pixel art)\b/i,
    },
    {
      aspect: 'print resolution vs low-res source',
      note: 'Requesting large-format print output while implying a low native resolution (e.g. small thumbnail-sized generation) is high-risk without an explicit upscaling step.',
      category: 'constraints',
      triggerA: /\b(billboard|poster print|large[- ]format print|print[- ]ready)\b/i,
      triggerB: /\b(thumbnail|low[- ]res(?:olution)?|small (?:image|preview))\b/i,
    },
    {
      aspect: 'exact legible text vs generative rendering',
      note: 'Requiring precise, guaranteed-legible in-image text (e.g. an exact product name on packaging) directly from a text-to-image generator is high-risk, since diffusion models render text unreliably; a compositing/typography pass on top of the generated image is typically required.',
      category: 'constraints',
      triggerA: /\b(exact text|precise text|readable text|legible text|correct spelling)\b/i,
      triggerB: /\b(text-?to-?image|diffusion model|midjourney|dall-?e|stable diffusion)\b/i,
    },
  ],
};
