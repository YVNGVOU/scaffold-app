import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching let 'multiplayer' match
// inside unrelated text and 'player' double-count inside "multiplayer" — do
// not repeat that bug here (e.g. a bare 'ci' or 'aws' keyword would match
// inside unrelated words if not word-boundary-safe).
const KEYWORDS = [
  'ci/cd', 'ci/cd pipeline', 'continuous integration', 'continuous deployment',
  'continuous delivery', 'infrastructure as code', 'iac', 'terraform',
  'pulumi', 'cloudformation', 'ansible', 'kubernetes', 'k8s', 'helm chart',
  'docker', 'dockerfile', 'container registry', 'container orchestration',
  'devops', 'sre', 'site reliability', 'observability', 'monitoring',
  'prometheus', 'grafana', 'datadog', 'log aggregation', 'alerting',
  'rollback strategy', 'blue-green deployment', 'canary deployment',
  'canary release', 'load balancer', 'autoscaling', 'auto-scaling',
  'horizontal pod autoscaler', 'deployment pipeline', 'build pipeline',
  'github actions', 'gitlab ci', 'jenkins', 'circleci', 'argo cd', 'argocd',
  'gitops', 'aws', 'azure', 'gcp', 'cloud infrastructure', 'vpc',
  'ec2 instance', 'ecs cluster', 'eks cluster', 'lambda function',
  'serverless deployment', 'secrets manager', 'vault', 'iam role',
  'disaster recovery', 'high availability', 'uptime sla', 'incident response',
  'runbook', 'infrastructure provisioning', 'immutable infrastructure',
  'reverse proxy', 'nginx ingress', 'service mesh', 'zero-downtime deployment',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const devopsInfrastructureDomain: DomainModule = {
  id: 'devops-infrastructure',
  label: 'DevOps / Infrastructure',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Infrastructure must be defined as code and version-controlled, not provisioned via manual console clicks', category: 'constraint' },
    { text: 'Pipeline must fail closed: a failed test/build/security-scan stage blocks deployment rather than warning-and-continuing', category: 'constraint' },
    { text: 'Every deployment must have a documented, tested rollback path before it reaches production', category: 'functional' },
    { text: 'Secrets and credentials must be stored in a secrets manager/vault, never committed to the repo or baked into images', category: 'constraint' },
    { text: 'Production changes should be observable: logs, metrics, and alerts must exist before the system is considered production-ready', category: 'functional' },
    { text: 'Prefer immutable infrastructure (replace instances/containers) over in-place mutation of running servers', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'deployment target',
      description: 'Target environment (cloud provider, on-prem, hybrid, specific region) is unspecified',
      isResolved: (input) => /\b(aws|azure|gcp|google\s+cloud|on-?prem\w*|hybrid\s+cloud|self-?hosted|bare\s*metal)\b/i.test(input),
    },
    {
      field: 'scaling model',
      description: 'Expected scale and scaling strategy (fixed capacity, autoscaling, expected traffic/load) is unspecified',
      isResolved: (input) => /\b(auto-?scal\w*|horizontal\s+pod\s+autoscaler|fixed\s+capacity|expected\s+(traffic|load)|concurrent\s+users?|requests?\s+per\s+second|rps)\b/i.test(input),
    },
    {
      field: 'monitoring/observability requirements',
      description: 'Required monitoring, logging, and alerting depth (basic uptime checks vs full distributed tracing) is unspecified',
      isResolved: (input) => /\b(monitor\w*|observability|prometheus|grafana|datadog|alert\w*|distributed\s+tracing|log\s+aggregation)\b/i.test(input),
    },
    {
      field: 'rollback strategy',
      description: 'Rollback/recovery approach on failed deployment (automatic rollback, manual, blue-green, canary) is unspecified',
      isResolved: (input) => /\b(rollback|blue-?green|canary|revert\s+deployment|automatic\s+rollback)\b/i.test(input),
    },
    {
      field: 'environment topology',
      description: 'Number and purpose of environments (dev, staging, production, per-feature ephemeral) is unspecified',
      isResolved: (input) => /\b(staging|dev(?:elopment)?\s+environment|production\s+environment|multi-?environment|ephemeral\s+environment)\b/i.test(input),
    },
    {
      field: 'compliance/uptime target',
      description: 'Required uptime SLA or compliance regime (SOC 2, HIPAA, PCI-DSS) that constrains the infrastructure design is unspecified',
      isResolved: (input) => /\b(sla|uptime\s+target|soc\s*2|hipaa|pci-?dss|compliance\s+requirement|\d{2}\.\d+%\s+uptime)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'source control + branch strategy', dependsOn: [], note: 'Git repository with a defined branching model (trunk-based, gitflow) that the pipeline triggers off of' },
    { component: 'CI build/test stage', dependsOn: ['source control + branch strategy'], note: 'Automated build and test run on every push/PR (GitHub Actions, GitLab CI, Jenkins, CircleCI) before anything is eligible to deploy' },
    { component: 'container image build + registry', dependsOn: ['CI build/test stage'], note: 'Dockerfile builds a versioned, immutable image pushed to a container registry (ECR, GCR, Docker Hub) tagged by commit SHA' },
    { component: 'infrastructure-as-code layer', dependsOn: [], note: 'Terraform/Pulumi/CloudFormation modules defining networking, compute, and managed services declaratively, applied via a plan/apply pipeline' },
    { component: 'secrets management', dependsOn: ['infrastructure-as-code layer'], note: 'Vault/AWS Secrets Manager/Azure Key Vault holding credentials, injected at runtime rather than baked into images or IaC state' },
    { component: 'deployment orchestration', dependsOn: ['container image build + registry', 'infrastructure-as-code layer'], note: 'Kubernetes/ECS/serverless deployment target with a defined rollout strategy (rolling, blue-green, canary) and health-check gating' },
    { component: 'load balancer / ingress', dependsOn: ['deployment orchestration'], note: 'Traffic routing layer (ALB, nginx ingress, API gateway) handling TLS termination and routing to healthy instances only' },
    { component: 'observability stack', dependsOn: ['deployment orchestration'], note: 'Metrics (Prometheus/CloudWatch), logs (aggregated, structured), and dashboards (Grafana/Datadog) wired up before go-live, not after an incident' },
    { component: 'alerting + on-call', dependsOn: ['observability stack'], note: 'Alert rules tied to SLOs, routed to an on-call rotation (PagerDuty/Opsgenie) with documented runbooks per alert' },
    { component: 'rollback/disaster-recovery mechanism', dependsOn: ['deployment orchestration'], note: 'Automated or one-command rollback to the last known-good version, plus a tested backup/restore path for stateful data' },
  ],
  technicalConsiderations: [
    { aspect: 'infrastructure as code', note: 'Provision all infrastructure via Terraform/Pulumi/CloudFormation with state stored remotely (not local files) and locked to prevent concurrent apply conflicts', category: 'constraints' },
    { aspect: 'CI/CD pipeline design', note: 'Structure the pipeline as build → test → security scan → deploy-to-staging → smoke test → deploy-to-production, with each stage gating the next', category: 'functionalRequirements' },
    { aspect: 'container image hygiene', note: 'Use minimal base images, pin dependency versions, and scan images for known CVEs (Trivy, Grype) as a required pipeline stage, not an optional one', category: 'constraints' },
    { aspect: 'deployment strategy', note: 'Choose rolling, blue-green, or canary deployment based on risk tolerance; canary requires traffic-splitting infrastructure that must be built before it can be relied on', category: 'functionalRequirements' },
    { aspect: 'autoscaling configuration', note: 'Configure autoscaling on real signals (CPU/memory/queue depth/request latency), not arbitrary thresholds, and set sane min/max bounds to prevent runaway cost or capacity gaps', category: 'preferences' },
    { aspect: 'state management for stateful services', note: 'Databases and stateful workloads need a different scaling/deployment story than stateless services — plan managed database services or StatefulSets separately from the stateless deployment path', category: 'functionalRequirements' },
    { aspect: 'idempotent provisioning', note: 'IaC apply/plan operations must be idempotent and safe to re-run; avoid imperative provisioning scripts that produce different results on repeat runs', category: 'constraints' },
    { aspect: 'multi-environment parity', note: 'Keep staging and production infrastructure defined from the same IaC modules (parameterized, not duplicated/forked) to avoid config drift that causes "works in staging, breaks in prod"', category: 'preferences' },
    { aspect: 'cost visibility', note: 'Tag resources by environment/team/service and set up cost alerting, since autoscaling and multi-environment setups can silently run up cloud spend', category: 'preferences' },
  ],
  uxConsiderations: [
    { aspect: 'deployment feedback for engineers', note: 'Pipeline status (build/test/deploy) should be visible in the PR/commit UI, not require digging through a separate CI dashboard to know if a change is safe to merge', category: 'preferences' },
    { aspect: 'self-service environments', note: 'Give engineers a low-friction way to spin up ephemeral preview/staging environments per PR rather than a single shared staging environment that becomes a bottleneck', category: 'preferences' },
    { aspect: 'incident status communication', note: 'Maintain a status page or incident-comms channel so downstream users/teams learn about outages from an official source, not from symptoms', category: 'functionalRequirements' },
    { aspect: 'runbook discoverability', note: 'Runbooks linked directly from alert payloads so an on-call engineer isn\'t searching a wiki at 3am during an incident', category: 'functionalRequirements' },
    { aspect: 'dashboard signal-to-noise', note: 'Curate a small set of SLO-aligned dashboards for at-a-glance health rather than dumping every raw metric onto one screen', category: 'preferences' },
    { aspect: 'change approval friction', note: 'Balance deployment safety gates (approvals, manual gates) against developer velocity — excessive manual gates push teams toward risky out-of-band changes', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'secrets handling', note: 'Never commit credentials, API keys, or connection strings to source control or bake them into container images; use a secrets manager with scoped, rotatable access', category: 'constraints' },
    { aspect: 'least-privilege IAM', note: 'Scope IAM roles/service accounts to the minimum permissions each pipeline stage or workload actually needs, not broad admin/root credentials for convenience', category: 'constraints' },
    { aspect: 'supply chain security', note: 'Pin and verify third-party CI actions/plugins and base images; an untrusted or compromised build dependency can inject malicious code into every deploy', category: 'constraints' },
    { aspect: 'network segmentation', note: 'Place databases and internal services in private subnets with no direct public ingress; expose only what genuinely needs to be internet-facing behind a load balancer/API gateway', category: 'constraints' },
    { aspect: 'image vulnerability scanning', note: 'Scan container images and IaC plans (tfsec, checkov) for known vulnerabilities and misconfigurations as a blocking pipeline stage before deployment', category: 'functionalRequirements' },
    { aspect: 'audit logging', note: 'Log who deployed what, when, and from what pipeline run — infrastructure changes and deployments must be attributable for incident forensics and compliance', category: 'functionalRequirements' },
    { aspect: 'TLS everywhere', note: 'Terminate TLS at the load balancer/ingress and encrypt service-to-service traffic where compliance or threat model requires it, not just the public-facing edge', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'naming conventions', note: 'Establish a consistent, predictable naming scheme for resources (environment-service-component) so infrastructure stays navigable as it grows', category: 'preferences' },
    { aspect: 'dashboard clarity', note: 'Design observability dashboards for quick human comprehension during an incident (clear color coding for healthy/degraded/down), not just raw data density', category: 'preferences' },
    { aspect: 'documentation as a first-class artifact', note: 'Treat architecture diagrams and runbooks as living documentation updated alongside infrastructure changes, not a one-time onboarding doc that goes stale', category: 'preferences' },
    { aspect: 'developer experience polish', note: 'Invest in clear pipeline failure messages and self-service tooling so infrastructure friction doesn\'t become a tax on every engineer\'s daily workflow', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'pipeline failure testing', note: 'Deliberately break the build/test/deploy stages to verify the pipeline actually blocks a bad deploy rather than only being validated on the happy path', category: 'functionalRequirements' },
    { aspect: 'rollback drill', note: 'Actually exercise the rollback procedure (not just document it) before relying on it during a real incident — an untested rollback path is a false sense of safety', category: 'functionalRequirements' },
    { aspect: 'chaos/failure injection', note: 'Test resilience to instance termination, zone failure, or dependency outage (e.g. via chaos engineering practices) rather than assuming redundancy works until an incident proves otherwise', category: 'functionalRequirements' },
    { aspect: 'load/scaling testing', note: 'Load-test the autoscaling configuration against realistic traffic spikes to confirm it scales in time, not just that the rules are syntactically correct', category: 'functionalRequirements' },
    { aspect: 'disaster recovery testing', note: 'Periodically test backup restoration end-to-end (not just that backups are being created) to catch silent backup corruption or missing data before it matters', category: 'constraints' },
    { aspect: 'alert accuracy', note: 'Validate that alerts fire for real incidents and stay quiet otherwise — both alert fatigue from false positives and silent gaps are QA failures for an observability setup', category: 'functionalRequirements' },
    { aspect: 'config drift detection', note: 'Regularly diff live infrastructure against the IaC definition (terraform plan with no expected changes) to catch manual out-of-band changes before they cause a confusing incident', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs full observability buildout',
      note: 'An extremely short delivery timeline alongside a full observability stack (distributed tracing, custom dashboards, SLO-based alerting) is high-risk — a properly wired monitoring/alerting setup typically takes real integration time, not a same-day add-on.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(distributed\s+tracing|full\s+observability|slo-?based\s+alerting|complete\s+monitoring\s+stack)\b/i,
    },
    {
      aspect: 'no budget vs multi-region high availability',
      note: 'A "no budget"/minimal-cost constraint alongside multi-region high-availability infrastructure is unrealistic scope — cross-region redundancy (duplicated compute, data replication, failover routing) has real, non-trivial cloud cost regardless of engineering effort.',
      category: 'constraints',
      triggerA: /\b(no\s+budget|minimal\s+cost|free\s+tier\s+only|zero\s+cost)\b/i,
      triggerB: /\b(multi-?region|cross-?region\s+failover|active-?active\s+high\s+availability)\b/i,
    },
    {
      aspect: 'manual deployment vs zero-downtime claim',
      note: 'Manually SSH-ing into servers to deploy while also requiring zero-downtime deployment is contradictory — zero-downtime rollouts require an automated, health-checked deployment mechanism (rolling/blue-green/canary), which manual server access cannot reliably provide.',
      category: 'constraints',
      triggerA: /\b(ssh\s+in|manual\w*\s+deploy\w*|deploy\w*\s+by\s+hand)\b/i,
      triggerB: /\b(zero-?downtime|no\s+downtime|100%\s+uptime)\b/i,
    },
    {
      aspect: 'solo maintainer vs enterprise compliance regime',
      note: 'A solo-developer/no-dedicated-ops-team constraint alongside strict compliance requirements (SOC 2, HIPAA, PCI-DSS) is a high-risk combination — those regimes typically require ongoing audit logging, access reviews, and incident processes that are difficult for one person to sustain alongside feature work.',
      category: 'constraints',
      triggerA: /\b(no\s+budget|solo\s+developer|just\s+me|one[- ]person\s+team|no\s+ops\s+team)\b/i,
      triggerB: /\b(soc\s*2|hipaa|pci-?dss|compliance\s+requirement)\b/i,
    },
  ],
};
