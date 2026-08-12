import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching would let e.g. 'chart'
// match inside "charter" or 'kpi' match inside a hypothetical longer token,
// silently inflating scores on unrelated inputs.
const KEYWORDS = [
  'data analysis', 'data analytics', 'dashboard', 'visualization', 'chart',
  'graph', 'dataset', 'data set', 'spreadsheet', 'csv', 'sql', 'pivot table',
  'statistics', 'statistical', 'regression', 'correlation', 'data pipeline',
  'etl', 'bi tool', 'business intelligence', 'kpi', 'metrics dashboard',
  'time series', 'data viz', 'analytics report', 'data cleaning',
  'exploratory data analysis', 'plot', 'histogram', 'scatter plot',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const dataAnalysisDomain: DomainModule = {
  id: 'data-analysis',
  label: 'Data Analysis',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define the data source(s) and format(s) to be ingested', category: 'functional' },
    { text: 'Specify the analysis method or statistical approach to be applied', category: 'functional' },
    { text: 'Handle missing, malformed, or outlier data explicitly rather than assuming clean input', category: 'constraint' },
    { text: 'Define how results/visualizations will be delivered (report, dashboard, export)', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'data source',
      description: 'The data source and format (CSV, database, API, spreadsheet, live feed) is unspecified',
      isResolved: (input) => /(csv|database|sql|api|spreadsheet|excel|data ?set|data source|json file|warehouse|live feed)/i.test(input),
    },
    {
      field: 'analysis method',
      description: 'The intended analysis method (descriptive stats, regression, forecasting, clustering, etc.) is unspecified',
      isResolved: (input) => /(regression|correlation|clustering|forecast|trend|hypothesis test|statistical|descriptive|predictive|classification|anomaly detection)/i.test(input),
    },
    {
      field: 'visualization needs',
      description: 'Whether visual output is required, and in what form (charts, dashboard, static report), is unspecified',
      isResolved: (input) => /(chart|graph|dashboard|plot|visuali[sz]ation|report|table|heatmap)/i.test(input),
    },
    {
      field: 'statistical rigor',
      description: 'The expected level of statistical rigor (exploratory eyeballing vs. significance testing/confidence intervals) is unspecified',
      isResolved: (input) => /(significance|confidence interval|p-?value|rigorous|exploratory|hypothesis|sample size|statistically)/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'data ingestion', dependsOn: [], note: 'Load/connect to raw data source(s) and validate schema on entry' },
    { component: 'data cleaning', dependsOn: ['data ingestion'], note: 'Handle missing values, outliers, type coercion, and deduplication' },
    { component: 'analysis engine', dependsOn: ['data cleaning'], note: 'Apply the chosen statistical/analytical method to the cleaned data' },
    { component: 'visualization layer', dependsOn: ['analysis engine'], note: 'Render charts/tables/dashboard views of the analysis output' },
    { component: 'reporting/export', dependsOn: ['visualization layer'], note: 'Package results into the requested delivery format (report, dashboard, file export)' },
  ],
  technicalConsiderations: [
    { aspect: 'data source integration', note: 'Define how data is retrieved (batch file, live database connection, API pull) and how often it refreshes', category: 'functionalRequirements' },
    { aspect: 'data volume and performance', note: 'Consider dataset size — in-memory processing may not scale to large datasets and could require chunked/streaming or database-side aggregation', category: 'constraints' },
    { aspect: 'schema and type validation', note: 'Validate incoming data types/schema before analysis to avoid silent miscalculation from malformed or mistyped fields', category: 'functionalRequirements' },
    { aspect: 'statistical library/tooling choice', note: 'Select tooling (e.g. pandas, SQL, R, a BI tool) appropriate to the analysis complexity and team familiarity', category: 'preferences' },
    { aspect: 'reproducibility', note: 'Ensure the analysis pipeline is reproducible (versioned queries/scripts) rather than one-off manual manipulation', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'chart legibility', note: 'Choose chart types that match the data relationship being shown (avoid pie charts for trends, avoid 3D effects that distort magnitude)', category: 'functionalRequirements' },
    { aspect: 'dashboard information density', note: 'Prioritize a small number of key metrics per view rather than overwhelming the user with every available field', category: 'preferences' },
    { aspect: 'filtering and drill-down', note: 'Provide filtering/date-range/drill-down controls so users can interrogate the data rather than viewing only a static snapshot', category: 'functionalRequirements' },
    { aspect: 'empty and loading states', note: 'Handle the no-data, loading, and query-error states in dashboards so the UI never shows a blank or broken chart', category: 'preferences' },
    { aspect: 'accessible color encoding', note: 'Use colorblind-safe palettes and non-color-only encodings (labels, patterns) when charts convey categorical distinctions', category: 'constraints' },
  ],
  securityConsiderations: [
    { aspect: 'data access control', note: 'Restrict which users/roles can query or export sensitive datasets, especially for financial, health, or PII-containing data', category: 'constraints' },
    { aspect: 'PII handling', note: 'Identify whether the dataset contains personally identifiable information and whether it needs anonymization/aggregation before display or export', category: 'constraints' },
    { aspect: 'query injection', note: 'Parameterize any user-influenced query construction (SQL/filter inputs) to prevent injection when building dynamic queries', category: 'functionalRequirements' },
    { aspect: 'export/download controls', note: 'Audit whether raw-data export/download is appropriate for all users or should be restricted/logged', category: 'preferences' },
    { aspect: 'credential storage', note: 'Ensure database/API credentials used for data source connections are stored securely, not hardcoded or embedded in client-visible code', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'visual clarity over decoration', note: 'Favor clean, minimal chart styling that foregrounds the data pattern over decorative gradients, 3D, or excessive chrome', category: 'preferences' },
    { aspect: 'consistent visual language', note: 'Use a consistent color/typography system across all charts and dashboard views so the analysis reads as one coherent product', category: 'constraints' },
    { aspect: 'narrative framing', note: 'Consider whether the deliverable should tell a narrative (executive summary, key takeaways) rather than presenting raw charts without interpretation', category: 'preferences' },
    { aspect: 'annotation and context', note: 'Annotate notable inflection points, anomalies, or benchmarks directly on charts so viewers do not have to infer significance themselves', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'statistical validity check', note: 'Verify that the chosen statistical method fits the data (sample size, distribution assumptions) rather than applying a method inappropriately', category: 'functionalRequirements' },
    { aspect: 'contradiction check', note: 'Check for contradictions such as requesting "real-time" analysis alongside a data source that only updates daily/weekly', category: 'constraints' },
    { aspect: 'edge case: empty or sparse data', note: 'Test behavior when the dataset is empty, has a single row, or has heavy missingness in the key analyzed fields', category: 'preferences' },
    { aspect: 'edge case: outliers and duplicates', note: 'Test behavior with extreme outliers and duplicate records to confirm they do not silently skew aggregate results', category: 'preferences' },
    { aspect: 'acceptance criteria', note: 'Define concrete acceptance criteria for accuracy (e.g. totals must reconcile with source system to within a defined tolerance)', category: 'functionalRequirements' },
  ],
  constraintConsiderations: [
    {
      aspect: 'real-time vs static source',
      note: 'Requesting "real-time" or "live" dashboards alongside a static/manually-uploaded data source (spreadsheet, CSV export) is a common but infeasible-as-stated combination — real-time requires a live-updating pipeline.',
      category: 'constraints',
      triggerA: /\b(real-time|real time|live)\s+(dashboard|analytics|data)\b/i,
      triggerB: /\b(csv|spreadsheet|excel|manual(?:ly)? upload(?:ed)?|static file)\b/i,
    },
    {
      aspect: 'timeline vs statistical rigor',
      note: 'An extremely short delivery timeline (hours or a single day) alongside a request for rigorous statistical validation (significance testing, confidence intervals, peer-reviewable methodology) is high-risk — rigorous analysis requires time for validation and review.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|today|this afternoon|in (?:a|one) (?:hour|day)|asap)\b/i,
      triggerB: /\b(statistically significant|confidence interval|p-?value|rigorous(?:ly)?|peer-review(?:ed)?)\b/i,
    },
  ],
};
