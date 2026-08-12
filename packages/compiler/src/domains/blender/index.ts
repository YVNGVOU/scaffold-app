import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006).
// Bare keywords like 'rig' could match inside unrelated words (e.g.
// "rigorous"), and 'uv' could match inside acronyms elsewhere — silently
// inflating scores on inputs that have nothing to do with 3D modeling.
const KEYWORDS = [
  'blender', '3d model', '3d modeling', '3d modelling', 'topology', 'retopology',
  'rig', 'rigging', 'texture', 'texturing', 'material', 'uv unwrap', 'uv map',
  'shader', 'render engine', 'cycles', 'eevee', 'mesh', 'sculpt', 'sculpting',
  'low poly', 'high poly', 'polycount', 'render', 'animation', 'keyframe',
  'armature', 'blend file', 'glTF', 'fbx export',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const blenderDomain: DomainModule = {
  id: 'blender',
  label: 'Blender / 3D Modeling',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define target render engine (Cycles vs. Eevee) for the expected visual fidelity/performance tradeoff', category: 'functional' },
    { text: 'Clean, non-overlapping topology suitable for the intended use (animation, game export, or still render)', category: 'constraint' },
    { text: 'Define export format and destination (game engine, render farm, archival)', category: 'constraint' },
    { text: 'UV layout should avoid stretching/overlap for texture painting or baking', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'purpose',
      description: 'Whether the model is for a still render, animation, or real-time game engine (each implies very different poly budgets and topology rules) is unspecified',
      isResolved: (input) => /(still render|animation|game engine|real-?time|cinematic|game-ready|film|vfx)/i.test(input),
    },
    {
      field: 'topology target',
      description: 'Poly count / topology budget (low-poly game asset vs. high-poly cinematic sculpt) is unspecified',
      isResolved: (input) => /(low[- ]poly|high[- ]poly|poly ?count|triangle budget|topology|subdivision)/i.test(input),
    },
    {
      field: 'rigging needs',
      description: 'Whether the asset needs to be rigged/animated (armature, weight painting, IK) or is a static prop is unspecified',
      isResolved: (input) => /(rig|rigging|armature|skeleton|weight paint|animat|static prop|no animation)/i.test(input),
    },
    {
      field: 'render engine',
      description: 'Target render engine (Cycles for realism, Eevee for real-time preview) is unspecified',
      isResolved: (input) => /(cycles|eevee|render engine|path trac|real-?time render)/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'base mesh / blockout', dependsOn: [], note: 'Rough shape and proportions established before detail work' },
    { component: 'topology / retopology', dependsOn: ['base mesh / blockout'], note: 'Clean quad-based edge flow suited to the target use case' },
    { component: 'UV unwrap', dependsOn: ['topology / retopology'], note: 'Non-overlapping UV layout prepared for texturing/baking' },
    { component: 'texturing / materials', dependsOn: ['UV unwrap'], note: 'PBR material setup (base color, roughness, normal, etc.) in the node editor' },
    { component: 'rigging', dependsOn: ['topology / retopology'], note: 'Armature and weight painting, only if the asset needs to animate' },
    { component: 'render / export', dependsOn: ['texturing / materials'], note: 'Render engine configuration or export to the target file format (glTF, FBX, etc.)' },
  ],
  technicalConsiderations: [
    { aspect: 'topology', note: 'Define whether clean quad topology is required (for subdivision/animation) or triangles are acceptable (static game props)', category: 'functionalRequirements' },
    { aspect: 'polycount budget', note: 'Set an explicit polygon/triangle budget appropriate to the target platform (real-time engine vs. offline render)', category: 'constraints' },
    { aspect: 'render engine', note: 'Choose between Cycles (path-traced realism) and Eevee (real-time rasterized preview) based on fidelity vs. speed needs', category: 'functionalRequirements' },
    { aspect: 'rigging', note: 'Define rig complexity (simple prop, IK/FK character rig, facial rig) and whether it must be game-engine compatible', category: 'functionalRequirements' },
    { aspect: 'export format', note: 'Select an export pipeline (glTF, FBX, OBJ) matched to the destination engine or DCC tool, including scale/axis conventions', category: 'constraints' },
    { aspect: 'file organization', note: 'Establish a naming/collection convention for objects, materials, and .blend file structure to keep the scene maintainable', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'viewport ergonomics', note: 'Organize collections, hide helper geometry, and set sensible clipping/navigation defaults so the scene is easy to work in', category: 'preferences' },
    { aspect: 'material feedback', note: 'Use viewport shading (material preview / rendered) so texture and lighting changes are visible without full renders', category: 'preferences' },
    { aspect: 'asset naming', note: 'Name objects, meshes, and materials descriptively rather than leaving default "Cube.001"-style names, especially for hand-off to other tools', category: 'functionalRequirements' },
    { aspect: 'lighting setup', note: 'Define a lighting rig (HDRI, three-point, or in-engine) appropriate for reviewing shape and material reads during modeling', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'linked file paths', note: 'Avoid absolute/external file paths for linked textures and libraries so the .blend is portable across machines', category: 'constraints' },
    { aspect: 'embedded scripts', note: 'Treat any embedded Python scripts or drivers in shared .blend files as untrusted before enabling auto-run', category: 'constraints' },
    { aspect: 'asset provenance', note: 'Confirm licensing/usage rights for any downloaded assets, HDRIs, or textures brought into the project', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'silhouette read', note: 'Ensure the model reads clearly as a recognizable shape/silhouette before investing in fine detail', category: 'preferences' },
    { aspect: 'material storytelling', note: 'Use material choices (wear, grime, roughness variation) to communicate age, function, or narrative context', category: 'preferences' },
    { aspect: 'lighting mood', note: 'Choose a lighting setup that supports the intended mood of the final render (dramatic, neutral studio, natural)', category: 'preferences' },
    { aspect: 'stylization consistency', note: 'Keep proportions, detail density, and material style consistent with the target art direction (stylized vs. photoreal)', category: 'constraints' },
  ],
  qaConsiderations: [
    { aspect: 'non-manifold geometry', note: 'Check for non-manifold edges, flipped normals, or n-gons that could break subdivision, baking, or game-engine import', category: 'constraints' },
    { aspect: 'UV overlap', note: 'Verify UVs do not overlap or exceed the 0-1 UV space where unique texture space is required', category: 'constraints' },
    { aspect: 'scale and units', note: 'Confirm the model is built to real-world scale/units consistent with the target engine or render setup', category: 'functionalRequirements' },
    { aspect: 'export validation', note: 'Test the exported file (glTF/FBX) actually imports correctly with expected materials, scale, and rig into the destination tool', category: 'functionalRequirements' },
    { aspect: 'poly budget compliance', note: 'Verify final poly/vertex count stays within the agreed budget for the target platform', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'real-time budget vs. cinematic detail',
      note: 'A real-time/game-engine target stated alongside cinematic-level sculpted detail (millions of polygons) is infeasible without baking to normal maps and heavy decimation — the two goals need an explicit high-to-low bake pipeline, not raw high-poly export.',
      category: 'constraints',
      triggerA: /\b(real-?time|game engine|game-ready|mobile game)\b/i,
      triggerB: /\b(cinematic|hyper-?realistic|sculpted detail|millions? of (?:polygons?|polys?)|high-?poly)\b/i,
    },
    {
      aspect: 'render deadline vs. path tracing',
      note: 'An extremely short deadline (hours/overnight) alongside a demand for photorealistic Cycles path-traced rendering at high sample counts is high-risk — noise-free path tracing at that fidelity typically needs long render times or farm access.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|tonight|in (?:a|one) hour|overnight|asap)\b/i,
      triggerB: /\b(cycles|path trac(?:e|ing)|photorealistic|ray trac(?:e|ing))\b/i,
    },
  ],
};
