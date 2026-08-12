import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching let 'multiplayer' match
// inside 'player'-related terms and 'api' match inside 'rapid'/'therapist' —
// the same discipline is required here so e.g. 'cli' does not match inside
// 'client' and 'sdk' does not match inside some unrelated compound word.
const KEYWORDS = [
  'backend', 'back-end', 'back end', 'microservice', 'microservices', 'cli',
  'command-line', 'command line', 'library', 'sdk', 'systems programming',
  'rest api', 'graphql api', 'grpc', 'database schema', 'server-side',
  'server side', 'daemon', 'cron job', 'batch job', 'library package',
  'npm package', 'python package', 'go module', 'rust crate', 'devops',
  'ci/cd', 'containerize', 'dockerize', 'kubernetes', 'unit tests', 'refactor',
  'algorithm', 'data structure', 'compiler', 'interpreter', 'multithreading',
  'concurrency', 'distributed system', 'message queue', 'orm',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const softwareDevelopmentDomain: DomainModule = {
  id: 'software-development',
  label: 'Software Development',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define the target runtime/environment (OS, language version, deployment host)', category: 'constraint' },
    { text: 'Include automated tests covering core logic paths', category: 'functional' },
    { text: 'Provide structured logging/error handling for failure diagnosis', category: 'functional' },
    { text: 'Document setup, build, and usage instructions', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'language/runtime',
      description: 'The programming language or runtime is unspecified',
      isResolved: (input) => /\b(python|node\.?js|typescript|javascript|java|go(?:lang)?|rust|c\+\+|c#|ruby|php|kotlin|swift)\b/i.test(input),
    },
    {
      field: 'interface type',
      description: 'Whether this is a CLI tool, library/package, or long-running service is unspecified',
      isResolved: (input) => /\b(cli|command[- ]line|library|package|module|service|daemon|api|server)\b/i.test(input),
    },
    {
      field: 'persistence',
      description: 'Whether the system needs to persist data (and to what store) is unspecified',
      isResolved: (input) => /\b(database|persist|storage|file system|in-memory|stateless)\b/i.test(input),
    },
    {
      field: 'deployment target',
      description: 'How/where the software will be deployed or distributed is unspecified',
      isResolved: (input) => /\b(deploy|package|docker|kubernetes|cloud|on-premise|self-hosted|npm|pip|cargo|distribute)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'core logic module', dependsOn: [], note: 'Domain logic isolated from I/O and framework concerns' },
    { component: 'interface layer', dependsOn: ['core logic module'], note: 'CLI/API/library entry points that expose the core logic' },
    { component: 'persistence layer', dependsOn: ['core logic module'], note: 'Database/file/storage access, if the system holds state' },
    { component: 'test suite', dependsOn: ['core logic module', 'interface layer'], note: 'Unit and integration tests for logic and interface behavior' },
    { component: 'build/packaging', dependsOn: ['core logic module', 'interface layer'], note: 'Compilation, bundling, and dependency packaging for distribution' },
    { component: 'CI/CD pipeline', dependsOn: ['build/packaging', 'test suite'], note: 'Automated build, test, and deployment/publish pipeline' },
  ],
  technicalConsiderations: [
    { aspect: 'language/runtime', note: 'Select a language/runtime version appropriate to performance, ecosystem, and team familiarity constraints', category: 'constraints' },
    { aspect: 'dependency management', note: 'Define a dependency management and lockfile strategy to keep builds reproducible', category: 'functionalRequirements' },
    { aspect: 'error handling', note: 'Establish a consistent error-handling/propagation strategy (exceptions vs. result types, exit codes for CLIs)', category: 'functionalRequirements' },
    { aspect: 'concurrency model', note: 'Decide on a concurrency/parallelism model (threads, async I/O, worker processes) appropriate to the workload', category: 'preferences' },
    { aspect: 'versioning', note: 'Define a versioning/release strategy (semver, changelog) especially if this is a published library', category: 'preferences' },
    { aspect: 'observability', note: 'Add structured logging, metrics, and/or tracing so failures in production are diagnosable', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'developer experience', note: 'Design a clear, discoverable interface (CLI flags/help text, API signatures, error messages) for the people who will actually call this code', category: 'functionalRequirements' },
    { aspect: 'documentation', note: 'Provide usage examples and setup instructions so a new consumer can get started without reading the source', category: 'preferences' },
    { aspect: 'error messages', note: 'Make error messages actionable (what went wrong, how to fix it) rather than raw stack traces surfaced to end users', category: 'preferences' },
    { aspect: 'configuration', note: 'Keep configuration (flags, env vars, config files) predictable and consistently named across the tool/service', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'input validation', note: 'Validate and sanitize all external input (CLI args, API payloads, file contents) before use, especially anything passed to a shell or query', category: 'constraints' },
    { aspect: 'secrets management', note: 'Never hardcode credentials/API keys in source; load secrets from environment/vault at runtime', category: 'constraints' },
    { aspect: 'dependency risk', note: 'Audit third-party dependencies for known vulnerabilities and pin versions to avoid supply-chain surprises', category: 'constraints' },
    { aspect: 'least privilege', note: 'Run processes and access external resources (files, databases, network) with the minimum permissions required', category: 'constraints' },
    { aspect: 'injection risk', note: 'Avoid constructing shell commands or queries via string concatenation of untrusted input', category: 'functionalRequirements' },
  ],
  creativeConsiderations: [
    { aspect: 'API ergonomics', note: 'Favor a small, composable, well-named public interface over a sprawling one so the software is pleasant to build on top of', category: 'preferences' },
    { aspect: 'naming and clarity', note: 'Choose consistent, intention-revealing names for modules, functions, and commands rather than terse or ambiguous ones', category: 'preferences' },
    { aspect: 'extensibility', note: 'Consider where future extension points (plugins, hooks, config) genuinely belong versus speculative over-engineering', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'contradiction check', note: 'Check stated requirements for contradictions (e.g. "stateless service" alongside "must persist user sessions")', category: 'constraints' },
    { aspect: 'missing requirement', note: 'Identify requirements the spec implies but never states outright (e.g. a CLI implying non-zero exit codes on failure)', category: 'functionalRequirements' },
    { aspect: 'test coverage', note: 'Define what constitutes adequate test coverage for this component: unit tests for core logic, integration tests across module boundaries', category: 'functionalRequirements' },
    { aspect: 'edge cases', note: 'Enumerate edge cases: empty input, malformed input, network/dependency failure, concurrent access, resource exhaustion', category: 'preferences' },
    { aspect: 'failure states', note: 'Identify failure states the spec does not address: process crash mid-operation, partial writes, upstream API timeout', category: 'constraints' },
    { aspect: 'backward compatibility', note: 'If this is a library/API, define what breaking a public contract means and how changes will be versioned', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs system complexity',
      note: 'An extremely short delivery timeline alongside a distributed/highly concurrent system is high-risk — correctness under concurrency and failure modes typically requires substantially more time than a straightforward script.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(distributed system|microservices|multithreading|concurrency|message queue|kubernetes)\b/i,
    },
    {
      aspect: 'no tests requested vs production use',
      note: 'Explicitly skipping tests while also targeting production/live deployment is a high-risk combination — untested code deployed to production carries elevated regression and outage risk.',
      category: 'constraints',
      triggerA: /\b(no tests?|skip tests?|without tests?)\b/i,
      triggerB: /\b(production|live deployment|go live|ship to users)\b/i,
    },
  ],
};
