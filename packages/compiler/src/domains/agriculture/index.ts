import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006).
// Plain substring matching would let bare keywords like 'crop' match inside
// unrelated words, or 'farm' match inside "farmhouse" in a different
// domain's context — silently inflating scores on inputs unrelated to
// agriculture/agtech.
const KEYWORDS = [
  'agriculture', 'agricultural', 'agtech', 'ag-tech', 'farm', 'farming', 'farmer', 'crop', 'crops',
  'livestock', 'irrigation', 'greenhouse', 'harvest', 'harvesting', 'planting', 'soil',
  'pesticide', 'herbicide', 'fertilizer', 'yield', 'orchard', 'vineyard', 'dairy',
  'poultry', 'grain', 'silo', 'agronomy', 'agronomist', 'tractor',
  'combine harvester', 'precision agriculture', 'crop rotation',
  'ranch', 'ranching', 'cattle', 'beef cattle', 'row crop', 'cover crop',
  'no-till', 'variable rate', 'yield monitor', 'yield map', 'crop insurance',
  'farm management', 'smart farming', 'vertical farming', 'hydroponic',
  'hydroponics', 'aquaponics', 'field scouting', 'seed drill', 'grain elevator',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const agricultureDomain: DomainModule = {
  id: 'agriculture',
  label: 'Agriculture / AgTech',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Specify target crop(s) or livestock and relevant growing region/climate zone', category: 'functional' },
    { text: 'Define data collection cadence (real-time sensor feed vs. periodic manual entry)', category: 'functional' },
    { text: 'Account for offline/low-connectivity operation in rural field conditions', category: 'constraint' },
    { text: 'Support seasonal variation in workflows (planting, growing, harvest, dormancy)', category: 'preference' },
    { text: 'Define units and localization for measurements (acres/hectares, imperial/metric)', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'crop-or-livestock',
      description: 'Whether the system targets crops, livestock, or both is unspecified',
      isResolved: (input) => /\b(crop|crops|livestock|cattle|poultry|dairy|orchard|vineyard|grain)\b/i.test(input),
    },
    {
      field: 'scale',
      description: 'Farm/operation scale (smallholder, commercial, industrial) is unspecified',
      isResolved: (input) => /\b(smallholder|small farm|commercial|industrial|large[- ]scale|acres?|hectares?)\b/i.test(input),
    },
    {
      field: 'connectivity',
      description: 'Field connectivity assumptions (cellular, satellite, offline-first, LoRaWAN) are unspecified',
      isResolved: (input) => /\b(offline|cellular|satellite|lorawan|wifi|wi-fi|connectivity|no signal|rural)\b/i.test(input),
    },
    {
      field: 'sensor-hardware',
      description: 'Whether the system integrates physical sensors/hardware or is software-only is unspecified',
      isResolved: (input) => /\b(sensor|sensors|iot|hardware|soil probe|weather station|drone|gps|gnss)\b/i.test(input),
    },
    {
      field: 'climate-zone',
      description: 'Growing region, climate zone, or growing season assumptions are unspecified',
      isResolved: (input) => /\b(climate|region|zone|growing season|hemisphere|tropical|temperate|arid)\b/i.test(input),
    },
    {
      field: 'compliance',
      description: 'Applicable agricultural/food-safety regulatory framework is unspecified',
      isResolved: (input) => /\b(usda|epa|organic certification|food safety|gap certification|traceability|regulat\w*)\b/i.test(input),
    },
    {
      field: 'automation-level',
      description: 'Whether the system only monitors/advises or actively controls field equipment (irrigation, feeding, spraying) is unspecified',
      isResolved: (input) => /\b(monitor(?:ing)?[- ]only|advisory|recommendations? only|manual control|automat\w*|autonomous|actuator|remote control|human[- ]in[- ]the[- ]loop)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'field data ingestion', dependsOn: [], note: 'Collects sensor telemetry (soil moisture, temperature, weather) and manual field entries' },
    { component: 'sensor/IoT integration layer', dependsOn: ['field data ingestion'], note: 'Interfaces with soil probes, weather stations, irrigation controllers, or livestock trackers over LoRaWAN/cellular' },
    { component: 'offline sync layer', dependsOn: ['field data ingestion'], note: 'Buffers and reconciles data captured while disconnected in remote field conditions' },
    { component: 'crop/livestock data model', dependsOn: [], note: 'Represents fields, plots, herds, crop cycles, planting/harvest dates, and yield history' },
    { component: 'analytics and forecasting engine', dependsOn: ['crop/livestock data model', 'field data ingestion'], note: 'Computes yield predictions, irrigation scheduling, pest/disease risk from historical and live data' },
    { component: 'weather and climate integration', dependsOn: [], note: 'Pulls external forecast and historical climate data to inform planting/harvest decisions' },
    { component: 'automation/control layer', dependsOn: ['sensor/IoT integration layer'], note: 'Triggers irrigation, feeding, or climate-control actuators based on thresholds or schedules' },
    { component: 'dashboard/reporting UI', dependsOn: ['analytics and forecasting engine'], note: 'Farmer/agronomist-facing views for field status, alerts, and yield reports' },
    { component: 'traceability and compliance module', dependsOn: ['crop/livestock data model'], note: 'Tracks inputs (pesticides, fertilizer, feed, treatments) for regulatory and certification records' },
    { component: 'deployment', dependsOn: ['dashboard/reporting UI', 'automation/control layer'], note: 'Edge devices in the field plus cloud backend for aggregation and remote access' },
  ],
  technicalConsiderations: [
    { aspect: 'sensor integration', note: 'Define protocols for soil moisture, pH, temperature, and weather sensors (LoRaWAN, NB-IoT, cellular, or wired) and their sampling intervals', category: 'functionalRequirements' },
    { aspect: 'offline operation', note: 'Design for intermittent or absent connectivity in rural fields, with local buffering and eventual sync', category: 'constraints' },
    { aspect: 'power constraints', note: 'Account for battery/solar power budgets on field-deployed sensor and actuator hardware', category: 'constraints' },
    { aspect: 'data volume and retention', note: 'Plan storage/retention strategy for high-frequency telemetry across multiple growing seasons', category: 'functionalRequirements' },
    { aspect: 'geospatial data', note: 'Support field-boundary mapping, GPS/GNSS coordinates, and integration with satellite/aerial imagery (NDVI)', category: 'functionalRequirements' },
    { aspect: 'weather API integration', note: 'Integrate external weather/climate forecast data to drive irrigation and spraying decisions', category: 'functionalRequirements' },
    { aspect: 'actuator control safety', note: 'Define fail-safe behavior for automated irrigation/feeding systems if connectivity or sensors fail mid-cycle', category: 'constraints' },
    { aspect: 'seasonal scalability', note: 'Handle sharp seasonal spikes in data volume and user activity around planting and harvest windows', category: 'preferences' },
    { aspect: 'equipment telematics integration', note: 'Define whether the system ingests machine data from tractors/combines/sprayers via ISOBUS, CAN bus, or vendor telematics APIs (e.g. John Deere Operations Center, Climate FieldView), and how conflicting formats are normalized', category: 'functionalRequirements' },
    { aspect: 'variable-rate prescription maps', note: 'Support generating and exporting variable-rate application (VRA) prescription maps (seeding, fertilizer, spray) in formats field equipment can consume (shapefile, ISO-XML)', category: 'functionalRequirements' },
    { aspect: 'satellite/aerial imagery latency', note: 'Clarify the refresh cadence of NDVI/multispectral imagery (daily satellite pass vs on-demand drone flight) since stale imagery can silently undermine "real-time" crop health claims', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'field-usable interface', note: 'Design for outdoor use in bright sunlight, gloved hands, and mobile-first field workers rather than desk-bound office staff', category: 'functionalRequirements' },
    { aspect: 'low-literacy accessibility', note: 'Consider iconography and multi-language support for farm workers with varying literacy or language backgrounds', category: 'preferences' },
    { aspect: 'alerting and thresholds', note: 'Provide clear, actionable alerts (e.g. low soil moisture, frost warning, pest risk) rather than raw sensor dumps', category: 'functionalRequirements' },
    { aspect: 'offline-first UX', note: 'Ensure core field workflows (data entry, task checklists) remain usable without a live connection, syncing later', category: 'constraints' },
    { aspect: 'seasonal workflow guidance', note: 'Adapt UI/task prompts to the current stage of the crop or livestock cycle (planting, growing, harvest, dormancy)', category: 'preferences' },
    { aspect: 'map-based navigation', note: 'Use field/plot maps as a primary navigation metaphor rather than lists, since farmers think spatially about land', category: 'preferences' },
    { aspect: 'device durability context', note: 'Account for rugged/ruggedized device usage (dust, moisture, drops) affecting touch-target sizing and input methods', category: 'preferences' },
    { aspect: 'multi-generational users', note: 'Design for a wide skill/age range on the same farm, from long-time operators unfamiliar with apps to younger tech-savvy staff, without dumbing down the tool for either group', category: 'preferences' },
    { aspect: 'task-list vs monitoring modes', note: 'Distinguish a discrete scheduled task-list workflow (e.g. daily chores, spray schedule) from continuous ambient monitoring, since farmers open the app differently for each', category: 'functionalRequirements' },
  ],
  securityConsiderations: [
    { aspect: 'field device authentication', note: 'Ensure IoT sensors and actuators authenticate to the backend (device certificates or signed tokens) to prevent spoofed telemetry or unauthorized irrigation/feeding triggers', category: 'constraints' },
    { aspect: 'data ownership', note: 'Clarify who owns farm operational data (grower vs. platform vs. equipment vendor) and consent for third-party data sharing (e.g. to input suppliers or insurers)', category: 'constraints' },
    { aspect: 'supply chain traceability integrity', note: 'Protect traceability/compliance records (pesticide application logs, harvest dates) from tampering, since they may be audited', category: 'constraints' },
    { aspect: 'network exposure of control systems', note: 'Isolate irrigation/actuator control networks from general internet exposure to prevent remote hijacking of physical equipment', category: 'constraints' },
    { aspect: 'GPS/location privacy', note: 'Treat precise field/farm location and yield data as sensitive competitive/business information, not casually shared or exported', category: 'constraints' },
    { aspect: 'firmware update integrity', note: 'Require signed firmware updates for field sensors/controllers to prevent malicious over-the-air tampering', category: 'functionalRequirements' },
    { aspect: 'application record liability', note: 'Protect pesticide/fertilizer application logs from post-hoc editing, since they can become evidence in drift-damage or contamination liability disputes with neighboring growers', category: 'constraints' },
    { aspect: 'imagery and telematics vendor lock-in', note: 'Clarify data export rights for satellite/drone imagery and machine telematics pulled from third-party platforms, since some vendor agreements restrict re-sharing or long-term retention', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'visual data density', note: 'Balance rich agronomic data (soil charts, NDVI maps, yield heatmaps) with clarity so dashboards read fast in the field, not as a data dump', category: 'preferences' },
    { aspect: 'brand tone', note: 'Favor a grounded, trustworthy visual tone (earth tones, clean iconography) over generic corporate SaaS styling, to resonate with agricultural users', category: 'preferences' },
    { aspect: 'imagery authenticity', note: 'Use real or realistic crop/field/livestock imagery rather than generic stock photography that reads as disconnected from actual farm operations', category: 'preferences' },
    { aspect: 'data visualization originality', note: 'Design distinctive, legible visualizations for time-series agronomic data (growth stages, moisture trends) rather than default chart-library styling', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'contradiction check', note: 'Check for contradictions such as "fully offline" alongside "real-time dashboard alerts" that require connectivity', category: 'constraints' },
    { aspect: 'seasonal edge cases', note: 'Test behavior across full crop-cycle transitions (pre-planting, mid-season, harvest, fallow) not just steady-state operation', category: 'functionalRequirements' },
    { aspect: 'sensor failure handling', note: 'Define expected behavior when a sensor goes offline, reports out-of-range values, or the battery dies mid-season', category: 'constraints' },
    { aspect: 'data gap handling', note: 'Test how analytics/forecasts behave with missing or delayed field data from a sync outage', category: 'functionalRequirements' },
    { aspect: 'extreme weather scenarios', note: 'Generate test cases for extreme conditions: drought, flood, frost, or hail events affecting sensor readings and automation triggers', category: 'preferences' },
    { aspect: 'acceptance criteria', note: 'Define concrete testable criteria per core flow (e.g. "irrigation triggers within 5 minutes of soil moisture dropping below threshold")', category: 'functionalRequirements' },
    { aspect: 'multi-field scaling', note: 'Verify the system behaves correctly when scaled from a single test plot to hundreds of fields/herds', category: 'preferences' },
    { aspect: 'unit conversion accuracy', note: 'Test acre/hectare, imperial/metric, and bushel/tonne conversions at their edges, since a silent rounding error compounds across large-acreage yield reports', category: 'functionalRequirements' },
    { aspect: 'cross-field data isolation', note: 'Verify that one field/herd/customer\'s data cannot leak into another\'s analytics or reports in a multi-tenant deployment', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'connectivity vs real-time features',
      note: 'Stating both "fully offline / no connectivity" and "real-time dashboard/live alerts" is an infeasible combination — real-time features require some form of live data transport.',
      category: 'constraints',
      triggerA: /\b(fully offline|no connectivity|no internet|no signal)\b/i,
      triggerB: /\b(real-?time (?:dashboard|alerts?|monitoring)|live (?:feed|alerts?|dashboard))\b/i,
    },
    {
      aspect: 'budget vs sensor network scale',
      note: 'A minimal/near-zero budget alongside a large-scale sensor/IoT deployment across many fields is a known-infeasible combination — hardware, connectivity, and maintenance costs scale with sensor count.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(hundreds of|large[- ]scale|farm[- ]wide|county[- ]wide)\s+(sensors?|iot|deployment)\b/i,
    },
    {
      aspect: 'automation autonomy vs safety oversight',
      note: 'Fully autonomous irrigation/feeding control with no human oversight or fail-safe is high-risk — automated actuator failures can cause crop loss or livestock harm without manual intervention paths.',
      category: 'constraints',
      triggerA: /\b(fully autonomous|no human (?:oversight|intervention)|unattended)\b/i,
      triggerB: /\b(irrigation|feeding|actuator|automated control)\b/i,
    },
    {
      aspect: 'organic certification vs synthetic inputs',
      note: 'Requesting "organic certified" alongside synthetic pesticide/herbicide or synthetic fertilizer use is an infeasible combination — organic certification standards (e.g. USDA NOP) prohibit most synthetic input applications.',
      category: 'constraints',
      triggerA: /\b(organic certif\w*|certified organic)\b/i,
      triggerB: /\b(synthetic (?:pesticide|herbicide|fertilizer)s?)\b/i,
    },
  ],
};
