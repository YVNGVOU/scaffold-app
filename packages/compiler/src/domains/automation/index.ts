import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/web/index.ts and
// domains/game/index.ts (TASK-006). Plain substring matching would let bare
// keywords like 'bot' or 'flow' match inside unrelated words, silently
// inflating scores on inputs that have nothing to do with automation.
const KEYWORDS = [
  'automation', 'automate', 'automated', 'workflow', 'workflows', 'trigger',
  'triggers', 'webhook', 'webhooks', 'zapier', 'n8n', 'integration',
  'integrations', 'cron', 'scheduled job', 'scheduled task', 'pipeline',
  'orchestration', 'rpa', 'bot', 'if this then that', 'event-driven',
  'batch job', 'retry logic', 'error handling', 'make.com', 'ifttt',
  'power automate', 'auto-sync', 'auto sync', 'nightly job', 'recurring task',
  'scheduled run', 'no-code automation', 'low-code automation', 'runbook',
  'playbook automation', 'workflow engine', 'workflow automation',
  'business process automation', 'task automation', 'auto-trigger',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const automationDomain: DomainModule = {
  id: 'automation',
  label: 'Automation',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define the trigger condition(s) that start the workflow', category: 'functional' },
    { text: 'Define behavior on failure (retry, alert, skip, dead-letter)', category: 'constraint' },
    { text: 'Specify monitoring/alerting for silent failures', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'trigger',
      description: 'Trigger condition (schedule, webhook, event, manual) is unspecified',
      isResolved: (input) => /\b(trigger|schedule|scheduled|cron|webhook|event[- ]driven|on (?:new|every|each)|whenever|manual(?:ly)?|nightly|hourly|daily|weekly|real-?time)\b/i.test(input),
    },
    {
      field: 'integration points',
      description: 'Which external systems/services this workflow connects to is unspecified',
      isResolved: (input) => /\b(integrat|api|connect(?:s|ed|ion)?|zapier|n8n|make\.com|ifttt|webhook|third[- ]party|slack|salesforce|hubspot|sheets|airtable)\b/i.test(input),
    },
    {
      field: 'error handling',
      description: 'What happens when a step fails (retry, alert, rollback) is unspecified',
      isResolved: (input) => /\b(retry|retries|error handling|failure|fallback|rollback|dead[- ]letter|alert(?:s|ing)?)\b/i.test(input),
    },
    {
      field: 'monitoring',
      description: 'How the workflow is monitored/observed once running is unspecified',
      isResolved: (input) => /\b(monitor(?:ing)?|logging|log|alert(?:s|ing)?|dashboard|observab(?:le|ility)|notify|notification)\b/i.test(input),
    },
    {
      field: 'execution mode',
      description: 'Whether the workflow runs synchronously (blocking) or asynchronously in the background is unspecified',
      isResolved: (input) => /\b(synchronous(?:ly)?|asynchronous(?:ly)?|async|background job|blocking|non-?blocking|queue(?:d|ing)?)\b/i.test(input),
    },
    {
      field: 'concurrency',
      description: 'Whether multiple runs can execute at the same time, or must be serialized, is unspecified',
      isResolved: (input) => /\b(concurrent(?:ly)?|concurrency|parallel(?:ism)?|serial(?:ize|ized|ly)?|single[- ]instance|overlap(?:ping)?|one at a time)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'trigger source', dependsOn: [], note: 'Event, schedule, or webhook that initiates the workflow' },
    { component: 'orchestration engine', dependsOn: ['trigger source'], note: 'Executes workflow steps in order, manages state between steps' },
    { component: 'integration connectors', dependsOn: ['orchestration engine'], note: 'Auth and API calls to third-party systems/services' },
    { component: 'error handling layer', dependsOn: ['orchestration engine'], note: 'Retry logic, fallback paths, and dead-letter handling for failed steps' },
    { component: 'monitoring/alerting', dependsOn: ['orchestration engine'], note: 'Logs, metrics, and notifications for run status and failures' },
    { component: 'credential store', dependsOn: ['integration connectors'], note: 'Secure storage for API keys/tokens used by connectors' },
  ],
  technicalConsiderations: [
    { aspect: 'trigger mechanism', note: 'Choose the correct trigger type (polling, webhook, cron schedule, event bus) for the required latency and system constraints', category: 'functionalRequirements' },
    { aspect: 'idempotency', note: 'Ensure workflow steps are idempotent so retries or duplicate trigger firings do not cause duplicate side effects (double charges, duplicate emails)', category: 'constraints' },
    { aspect: 'rate limits', note: 'Account for third-party API rate limits and quota exhaustion when the workflow runs at scale or in bursts', category: 'constraints' },
    { aspect: 'state persistence', note: 'Define where in-progress workflow state is stored so a crash mid-run can resume rather than silently losing progress', category: 'functionalRequirements' },
    { aspect: 'orchestration tooling', note: 'Select an orchestration approach (managed platform like Zapier/n8n, or custom queue/worker system) matching complexity and maintenance appetite', category: 'preferences' },
    { aspect: 'execution timeout', note: 'Set a maximum execution time per run/step to prevent runaway or hung workflows from blocking downstream triggers', category: 'constraints' },
    { aspect: 'concurrency control', note: 'Decide whether overlapping runs of the same workflow are allowed or must be serialized with a lock, especially for triggers that can fire faster than a single run completes', category: 'constraints' },
    { aspect: 'clock/timezone handling', note: 'Pin cron/schedule definitions to an explicit timezone and account for daylight saving transitions, which silently shift wall-clock trigger times by an hour twice a year', category: 'constraints' },
    { aspect: 'ordering guarantees', note: 'Determine whether step/message ordering must be preserved (e.g. FIFO queue) or whether out-of-order processing is acceptable for correctness', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'run visibility', note: 'Provide a way for operators to see workflow run history, current status, and which step failed', category: 'functionalRequirements' },
    { aspect: 'manual override', note: 'Allow a human to manually trigger, pause, or retry a run when automated conditions are not met', category: 'preferences' },
    { aspect: 'configuration clarity', note: 'Make trigger conditions and step logic legible to non-engineers who will maintain the workflow over time', category: 'preferences' },
    { aspect: 'notification fatigue', note: 'Tune alert thresholds so failure notifications are actionable rather than noisy enough to be ignored', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'credential storage', note: 'Store API keys/tokens for integrated services in a secrets manager, never hardcoded or logged in plaintext', category: 'constraints' },
    { aspect: 'least privilege', note: 'Scope each integration connector to the minimum permissions needed rather than broad account-wide access', category: 'constraints' },
    { aspect: 'webhook verification', note: 'Verify webhook signatures/secrets on inbound triggers so the workflow cannot be triggered by spoofed requests', category: 'constraints' },
    { aspect: 'audit trail', note: 'Log who/what triggered each run and what actions it took, for accountability when the workflow touches sensitive data or money', category: 'functionalRequirements' },
    { aspect: 'data exposure', note: 'Review what data passes through third-party automation platforms and whether that violates data residency or compliance requirements', category: 'constraints' },
    { aspect: 'credential rotation', note: 'Plan for token/API key expiry and rotation so an expired credential fails loudly at auth time rather than causing silent partial failures mid-workflow', category: 'constraints' },
    { aspect: 'destructive action guardrails', note: 'Require confirmation, dry-run mode, or an approval step before a workflow performs irreversible actions (deleting records, sending customer-facing messages, moving money)', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'workflow naming', note: 'Use clear, descriptive names for workflows and steps so their purpose is obvious months later during maintenance', category: 'preferences' },
    { aspect: 'notification tone', note: 'Write alert/notification copy that states the failure and next action plainly rather than raw stack traces', category: 'preferences' },
    { aspect: 'dashboard presentation', note: 'If a status dashboard is part of the deliverable, present run health at a glance rather than a raw log dump', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'failure injection', note: 'Test behavior when an integrated service is down, slow, or returns malformed data, not just the happy path', category: 'constraints' },
    { aspect: 'duplicate trigger handling', note: 'Test what happens when the same trigger event fires twice (duplicate webhook delivery, re-run after timeout)', category: 'functionalRequirements' },
    { aspect: 'partial failure', note: 'Define expected behavior when a multi-step workflow fails partway through: does it roll back, resume, or leave partial state', category: 'constraints' },
    { aspect: 'acceptance criteria', note: 'Define concrete pass/fail criteria for each trigger-to-completion path, including expected latency', category: 'functionalRequirements' },
    { aspect: 'contradiction check', note: 'Check for contradictions such as "no monitoring needed" alongside "must alert on failure within minutes"', category: 'constraints' },
    { aspect: 'idempotency test', note: 'Replay the same trigger event twice and confirm the workflow produces no duplicate side effects (double-sent email, double charge, duplicate record)', category: 'constraints' },
    { aspect: 'schema drift', note: 'Test workflow behavior when an upstream API response adds, removes, or renames fields, since automations that parse by field name silently break on drift', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'no monitoring vs critical process',
      note: 'Requesting no monitoring/alerting for a workflow that handles payments, data sync, or other critical processes is high-risk — silent failures in critical automations go unnoticed until damage is done.',
      category: 'constraints',
      triggerA: /\bno\s+(?:monitoring|alerts?|alerting|logging)\b/i,
      triggerB: /\b(payment|billing|critical|production|customer data)\b/i,
      },
    {
      aspect: 'real-time trigger vs polling-only tooling',
      note: 'Requiring real-time/instant triggering while also specifying a polling-only integration or platform is an infeasible-as-stated combination — polling has inherent latency and cannot deliver sub-second reaction times.',
      category: 'constraints',
      triggerA: /\b(real-?time|instant(?:ly)?|sub-second)\b/i,
      triggerB: /\bpolling\b/i,
    },
    {
      aspect: 'timeline vs multi-system orchestration',
      note: 'An extremely short delivery timeline alongside orchestration across many third-party systems is high-risk — each integration typically requires its own auth setup, testing, and failure-mode handling.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(multiple systems|several integrations|many (?:apis|services)|end-to-end orchestration)\b/i,
    },
    {
      aspect: 'no credential storage vs authenticated integrations',
      note: 'Refusing to store any credentials/secrets while also requiring the workflow to authenticate against third-party APIs is contradictory as stated — some form of durable credential storage (secrets manager, OAuth token store) is required for any non-public integration to keep running unattended.',
      category: 'constraints',
      triggerA: /\bno\s+(?:credential|password|secret|token)\s+(?:storage|stored|storing)\b/i,
      triggerB: /\b(integrat|authenticat|oauth|api key)/i,
    },
  ],
};
