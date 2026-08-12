import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. A bare 'plan' or 'code' keyword would match
// inside unrelated words (e.g. 'explanation', 'coded') if not word-boundary-
// safe — do not repeat that bug here.
const KEYWORDS = [
  'floor plan', 'floorplan', 'building code', 'zoning', 'setback',
  'square footage', 'square feet', 'load-bearing', 'load bearing',
  'interior design', 'interior designer', 'space planning', 'blueprint',
  'elevation drawing', 'construction drawing', 'renovation', 'remodel',
  'hvac', 'egress', 'ada compliance', 'accessibility code',
  'occupancy permit', 'building permit', 'structural engineer',
  'millwork', 'furniture layout', 'fixture schedule', 'finish schedule',
  'material specification', 'material spec', 'flooring material',
  'ceiling height', 'wall partition', 'kitchen layout', 'bathroom layout',
  'residential architecture', 'commercial architecture', 'architect',
  'archicad', 'revit', 'autocad', 'sketchup', 'bim model',
  'lighting plan', 'furniture, fixtures, and equipment', 'ffe',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const architectureInteriorDomain: DomainModule = {
  id: 'architecture-interior',
  label: 'Architecture / Interior Design',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Design must comply with applicable local building codes and zoning ordinances', category: 'constraint' },
    { text: 'Layout must meet ADA/accessibility requirements where applicable (egress width, clearances, ramp slopes)', category: 'constraint' },
    { text: 'Specify structural, mechanical (HVAC), electrical, and plumbing coordination points before finish selection', category: 'functional' },
    { text: 'Provide a material and finish schedule with sourcing/lead-time notes', category: 'functional' },
    { text: 'Define occupancy type and expected occupant load for the space', category: 'constraint' },
    { text: 'Account for permitting and inspection milestones in the project timeline', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'project scope',
      description: 'Whether this is new construction, a renovation/remodel, or a pure interior fit-out is unspecified',
      isResolved: (input) => /\b(new\s+construction|renovation|remodel|fit-?out|ground-?up|addition)\b/i.test(input),
    },
    {
      field: 'occupancy type',
      description: 'Building occupancy classification (residential, commercial, mixed-use, retail, hospitality) is unspecified',
      isResolved: (input) => /\b(residential|commercial|mixed-?use|retail|hospitality|office|restaurant)\b/i.test(input),
    },
    {
      field: 'square footage',
      description: 'The approximate square footage/area of the space is unspecified',
      isResolved: (input) => /\b(\d[\d,]*\s*(sq\.?\s*ft\.?|square\s+f(oo|ee)t)|square\s+footage)\b/i.test(input),
    },
    {
      field: 'budget tier',
      description: 'Budget range or price-per-square-foot target is unspecified',
      isResolved: (input) => /\b(budget|\$[\d,]+|price\s+per\s+square\s+foot|cost\s+target)\b/i.test(input),
    },
    {
      field: 'code jurisdiction',
      description: 'The governing building code jurisdiction (city/state/country, IBC vs local amendments) is unspecified',
      isResolved: (input) => /\b(jurisdiction|ibc|building\s+code|zoning|city\s+of|county|municipal)\b/i.test(input),
    },
    {
      field: 'accessibility requirements',
      description: 'Whether the space must meet ADA or other accessibility standards is unspecified',
      isResolved: (input) => /\b(ada|accessib\w*|wheelchair|universal\s+design)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'site and zoning analysis', dependsOn: [], note: 'Confirm zoning district, setbacks, height limits, and lot coverage allowances before design begins' },
    { component: 'programming and space plan', dependsOn: ['site and zoning analysis'], note: 'Define required rooms/zones, adjacencies, and square footage allocation per use' },
    { component: 'schematic design (floor plans)', dependsOn: ['programming and space plan'], note: 'Preliminary floor plans establishing circulation, room layout, and structural grid' },
    { component: 'structural coordination', dependsOn: ['schematic design (floor plans)'], note: 'Load-bearing wall/column locations and structural engineer sign-off, especially for renovations removing walls' },
    { component: 'MEP coordination (mechanical/electrical/plumbing)', dependsOn: ['schematic design (floor plans)'], note: 'HVAC routing, electrical panel/outlet layout, and plumbing riser locations coordinated before finishes are locked' },
    { component: 'construction documents', dependsOn: ['structural coordination', 'MEP coordination (mechanical/electrical/plumbing)'], note: 'Permit-ready drawing set: dimensioned plans, elevations, sections, and details (typically in Revit/AutoCAD/ArchiCAD)' },
    { component: 'material and FF&E schedule', dependsOn: ['schematic design (floor plans)'], note: 'Finish schedule (flooring, wall, ceiling) and furniture/fixtures/equipment specification with vendor and lead-time data' },
    { component: 'lighting plan', dependsOn: ['MEP coordination (mechanical/electrical/plumbing)'], note: 'Reflected ceiling plan with fixture types, switching/dimming zones, and daylighting considerations' },
    { component: 'permitting package', dependsOn: ['construction documents'], note: 'Assembled drawing set, code analysis, and applications submitted to the local building/planning department' },
    { component: 'construction administration', dependsOn: ['permitting package'], note: 'Site visits, RFI responses, and punch-list review during the build phase to verify the design intent is executed' },
  ],
  technicalConsiderations: [
    { aspect: 'building code compliance', note: 'Verify design against the governing code (IBC or local amendment) for occupancy classification, egress, fire rating, and means of egress travel distance', category: 'constraints' },
    { aspect: 'structural feasibility', note: 'Any wall removal or opening enlargement must be reviewed by a structural engineer to confirm it is not load-bearing or to specify a header/beam replacement', category: 'constraints' },
    { aspect: 'HVAC load and routing', note: 'Confirm mechanical system capacity (tonnage/BTU) matches the space and that ductwork routing is coordinated with ceiling height and structural framing', category: 'functionalRequirements' },
    { aspect: 'electrical and plumbing rough-in', note: 'Confirm outlet/switch placement and panel capacity, and that plumbing fixture relocations are feasible given existing riser and drain-line locations', category: 'functionalRequirements' },
    { aspect: 'material specification and lead times', note: 'Specify materials with exact SKU/finish codes and confirm vendor lead times against the project schedule, since custom millwork and stone can add months', category: 'functionalRequirements' },
    { aspect: 'CAD/BIM software workflow', note: 'Standardize on a modeling platform (Revit, ArchiCAD, AutoCAD, SketchUp) and file format for coordination between architect, engineer, and contractor', category: 'preferences' },
    { aspect: 'ceiling height and clearances', note: 'Verify finished ceiling height after ductwork, insulation, and lighting fixtures still meets code minimums and design intent', category: 'constraints' },
    { aspect: 'moisture and vapor barrier detailing', note: 'Specify vapor barrier and waterproofing details at wet areas (bathrooms, kitchens, exteriors) to prevent mold and structural damage', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'circulation and wayfinding', note: 'Design clear circulation paths and sightlines so occupants intuitively find entries, exits, and key spaces without signage dependency', category: 'functionalRequirements' },
    { aspect: 'furniture layout and clearances', note: 'Verify furniture placement leaves code-required clearances (walkway widths, door swing paths) and comfortable ergonomic spacing', category: 'constraints' },
    { aspect: 'natural light and daylighting', note: 'Position windows/skylights and interior glazing to maximize daylight penetration into occupied spaces', category: 'preferences' },
    { aspect: 'acoustic comfort', note: 'Address acoustic separation between noisy and quiet zones (mechanical rooms, bedrooms, open offices) with appropriate wall assemblies or sound-absorbing finishes', category: 'preferences' },
    { aspect: 'accessibility and universal design', note: 'Design ramps, door widths, counter heights, and reach ranges to meet ADA/accessibility standards for all intended occupants', category: 'constraints' },
    { aspect: 'storage and functional adjacency', note: 'Ensure adjacent-use rooms (kitchen to dining, bedroom to bath) and adequate storage are planned into the program, not added after the fact', category: 'functionalRequirements' },
    { aspect: 'thermal comfort zoning', note: 'Zone HVAC controls appropriately so different areas (sunny exposures, high-occupancy rooms) can be independently regulated', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'means of egress', note: 'Verify at least two remote exits where required by occupant load, with unobstructed egress paths and code-compliant travel distances', category: 'constraints' },
    { aspect: 'fire and life safety systems', note: 'Confirm smoke detector, sprinkler, and fire-rated assembly requirements are met for the occupancy classification and building height', category: 'constraints' },
    { aspect: 'access control', note: 'Specify entry point security (locks, keycard/access systems, visitor management) appropriate to the building type, especially for commercial/multi-tenant spaces', category: 'functionalRequirements' },
    { aspect: 'structural integrity documentation', note: 'Retain a structural engineer\'s stamped drawings for any load-bearing modification as legal/liability documentation, not just as a design reference', category: 'constraints' },
    { aspect: 'hazardous material assessment', note: 'For renovations of older buildings, require an asbestos/lead-paint assessment before demolition begins', category: 'constraints' },
    { aspect: 'child and vulnerable-occupant safety', note: 'For residential or care-facility spaces, address fall hazards (stair railings, window guards) and secure storage for hazardous items', category: 'preferences' },
  ],
  creativeConsiderations: [
    { aspect: 'design concept and narrative', note: 'Establish a coherent design concept (material palette, spatial theme) that ties the project together rather than a room-by-room assortment of choices', category: 'preferences' },
    { aspect: 'material and finish palette', note: 'Curate a cohesive palette of flooring, wall, and cabinetry finishes that reads intentional across adjoining spaces', category: 'preferences' },
    { aspect: 'lighting as design element', note: 'Use layered lighting (ambient, task, accent) as a deliberate design tool, not just code-minimum illumination', category: 'preferences' },
    { aspect: 'spatial proportion and scale', note: 'Calibrate ceiling height, room proportions, and furniture scale so spaces feel intentional rather than accidental', category: 'functionalRequirements' },
    { aspect: 'brand or client identity expression', note: 'For commercial/hospitality projects, reflect brand identity through material choice, signage integration, and spatial experience', category: 'preferences' },
    { aspect: 'indoor-outdoor connection', note: 'Consider sightlines, glazing, and transitional spaces (patios, courtyards) that connect interior spaces to the exterior context', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'code compliance review', note: 'Cross-check final drawings against the applicable building code checklist (egress, fire rating, accessibility) before permit submission', category: 'constraints' },
    { aspect: 'dimension and clash checking', note: 'Verify dimensions across plan, elevation, and section drawings are consistent, and check for clashes between structural, MEP, and finish elements', category: 'functionalRequirements' },
    { aspect: 'material quantity takeoff accuracy', note: 'Confirm material quantities in the schedule match actual square footage calculations to avoid costly under/over-ordering', category: 'functionalRequirements' },
    { aspect: 'missing scope identification', note: 'Identify implied-but-unstated scope (e.g. a kitchen remodel implying electrical upgrades for new appliances) before construction starts', category: 'functionalRequirements' },
    { aspect: 'punch-list and site verification', note: 'Define a formal punch-list process to verify built conditions match construction documents before project closeout', category: 'preferences' },
    { aspect: 'permit rejection risk', note: 'Anticipate common plan-review rejection points (missing egress calculations, unclear fire-rating notes) and pre-address them in the submission package', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'load-bearing removal vs no structural engineer',
      note: 'Removing or altering a load-bearing wall without a structural engineer\'s review and stamped drawings is a code violation and safety risk — this combination must be flagged as infeasible-as-stated.',
      category: 'constraints',
      triggerA: /\b(load-?bearing|structural)\s+wall\b/i,
      triggerB: /\b(no\s+structural\s+engineer|without\s+an?\s+engineer|skip\s+the\s+engineer)\b/i,
    },
    {
      aspect: 'timeline vs permitting process',
      note: 'An extremely short delivery timeline alongside work that requires a building permit is high-risk — permit review and approval commonly takes weeks to months depending on jurisdiction, independent of design or construction speed.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap|next\s+week)\b/i,
      triggerB: /\b(building\s+permit|permit\s+approval|structural\s+change|addition)\b/i,
    },
    {
      aspect: 'budget vs custom high-end finishes',
      note: 'A minimal/shoestring budget stated alongside custom millwork, imported stone, or fully custom fixtures is a known-infeasible combination — those material categories carry premium cost and long lead times.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight|low)\s+budget\b/i,
      triggerB: /\b(custom\s+millwork|imported\s+stone|custom\s+fixtures|high-?end\s+finishes)\b/i,
    },
    {
      aspect: 'occupancy load vs single egress',
      note: 'A high expected occupant load stated alongside only a single point of egress is a code-compliance conflict — most building codes require two remote exits above a defined occupant-load threshold.',
      category: 'constraints',
      triggerA: /\b(high\s+occupancy|large\s+crowd|hundreds\s+of\s+(?:people|guests|attendees))\b/i,
      triggerB: /\b(single\s+exit|one\s+exit|only\s+one\s+door|single\s+entry\/exit)\b/i,
    },
  ],
};
