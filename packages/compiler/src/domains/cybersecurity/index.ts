import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. A bare substring keyword like 'pen test' could
// still be safe, but something like 'scan' would match inside 'landscape',
// and 'ir' (incident response) style short tokens would match all over the
// place — every keyword below is matched through the word-boundary regex
// helper, never plain .includes().
const KEYWORDS = [
  'penetration test', 'pentest', 'pen test', 'red team', 'blue team',
  'purple team', 'vulnerability assessment', 'vulnerability scan',
  'security audit', 'security assessment', 'threat model', 'threat modeling',
  'siem', 'soc analyst', 'incident response', 'exploit', 'exploitation',
  'ctf', 'capture the flag', 'owasp', 'burp suite', 'metasploit', 'nmap',
  'wireshark', 'nessus', 'cve', 'cvss', 'zero-day', 'zero day',
  'social engineering', 'phishing simulation', 'responsible disclosure',
  'bug bounty', 'malware analysis', 'reverse engineering', 'soc2',
  'iso 27001', 'pci-dss', 'pci dss', 'siem rules', 'ids/ips', 'firewall rules',
  'privilege escalation', 'lateral movement', 'attack surface',
  'security hardening', 'infosec', 'cybersecurity', 'cyber security',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const cybersecurityDomain: DomainModule = {
  id: 'cybersecurity',
  label: 'Cybersecurity',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'All offensive testing (penetration testing, scanning, exploitation) must be explicitly authorized in writing before any activity begins', category: 'constraint' },
    { text: 'Define and document the exact scope (IP ranges, hosts, applications, accounts) that testing is permitted to touch, and exclude everything else', category: 'constraint' },
    { text: 'Findings must be reported through a responsible/coordinated disclosure process with a defined remediation timeline', category: 'functional' },
    { text: 'Sensitive findings (credentials, PII, exploit details) must be handled and stored per an agreed confidentiality/data-handling standard', category: 'constraint' },
    { text: 'Maintain an audit trail/log of all testing activity performed (what, when, by whom) for accountability', category: 'functional' },
    { text: 'Distinguish clearly between defensive (hardening, detection) and offensive (exploitation, red-team) work in scope and deliverables', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'authorization scope',
      description: 'Written authorization / rules of engagement (what systems, accounts, and time window are in scope) is unspecified',
      isResolved: (input) => /\b(rules?\s+of\s+engagement|authoriz\w*|scope\s+(of\s+)?(testing|engagement)|written\s+permission|signed\s+off)\b/i.test(input),
    },
    {
      field: 'engagement type',
      description: 'The kind of engagement (penetration test, vulnerability assessment, red team, security audit, bug bounty) is unspecified',
      isResolved: (input) => /\b(pen(?:etration)?\s*test|vulnerability\s+assessment|red\s+team|blue\s+team|purple\s+team|security\s+audit|bug\s+bounty|compliance\s+audit)\b/i.test(input),
    },
    {
      field: 'target environment',
      description: 'Whether testing targets production, staging, or an isolated environment is unspecified',
      isResolved: (input) => /\b(production|staging|test\s+environment|isolated\s+environment|sandbox|lab\s+environment)\b/i.test(input),
    },
    {
      field: 'disclosure process',
      description: 'How discovered vulnerabilities will be reported/disclosed (to whom, on what timeline, coordinated vs public) is unspecified',
      isResolved: (input) => /\b(responsible\s+disclosure|coordinated\s+disclosure|disclosure\s+(policy|timeline|process)|report(?:ing)?\s+(vulnerabilit|finding))\b/i.test(input),
    },
    {
      field: 'compliance framework',
      description: 'Whether the work must satisfy a specific compliance/regulatory framework (SOC 2, ISO 27001, PCI-DSS, HIPAA) is unspecified',
      isResolved: (input) => /\b(soc\s*2|iso\s*27001|pci[- ]?dss|hipaa|nist|gdpr|compliance\s+framework)\b/i.test(input),
    },
    {
      field: 'data sensitivity handling',
      description: 'How sensitive data encountered during testing (credentials, PII, production secrets) will be handled/stored/destroyed is unspecified',
      isResolved: (input) => /\b(sensitive\s+data|pii|credentials?\s+handling|data\s+destruction|secure\s+storage\s+of\s+findings)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'rules of engagement document', dependsOn: [], note: 'Signed scope-and-authorization document defining in-scope targets, excluded systems, testing window, and emergency stop procedure — must exist before any technical work' },
    { component: 'reconnaissance / asset discovery', dependsOn: ['rules of engagement document'], note: 'Passive and active discovery of in-scope hosts, subdomains, services, and technologies (e.g. via nmap, subdomain enumeration) constrained to authorized scope' },
    { component: 'vulnerability scanning layer', dependsOn: ['reconnaissance / asset discovery'], note: 'Automated scanning (e.g. Nessus, OpenVAS, Burp Suite scanner) to enumerate known CVEs and misconfigurations across the discovered attack surface' },
    { component: 'manual testing / exploitation layer', dependsOn: ['vulnerability scanning layer'], note: 'Manual verification and controlled exploitation of scanner findings to confirm real impact and eliminate false positives, within the agreed rules of engagement' },
    { component: 'evidence and logging repository', dependsOn: ['manual testing / exploitation layer'], note: 'Secure, access-controlled storage of screenshots, logs, and proof-of-concept artifacts collected during testing, encrypted at rest' },
    { component: 'findings and risk-scoring report', dependsOn: ['evidence and logging repository'], note: 'Structured report scoring each finding (e.g. CVSS) with reproduction steps, business impact, and prioritized remediation guidance' },
    { component: 'remediation tracking', dependsOn: ['findings and risk-scoring report'], note: 'Ticketed tracking of remediation status per finding, with a defined re-test/verification step once a fix is deployed' },
    { component: 'detection and monitoring integration', dependsOn: [], note: 'SIEM/IDS rules and alerting to detect the tested attack techniques going forward, feeding the blue-team/defensive side of the engagement' },
    { component: 'disclosure and stakeholder communication', dependsOn: ['findings and risk-scoring report'], note: 'Defined communication channel and disclosure timeline for reporting findings to the system owner, and to any affected third party if applicable' },
  ],
  technicalConsiderations: [
    { aspect: 'scope enforcement', note: 'Technically constrain tooling (scanner target lists, VPN/network access) to the exact authorized IP ranges/domains so no in-scope tool can accidentally reach an out-of-scope system', category: 'constraints' },
    { aspect: 'tooling selection', note: 'Select tooling appropriate to the engagement type (e.g. Burp Suite/OWASP ZAP for web app testing, Nmap/Nessus for network scanning, Metasploit only where exploitation is explicitly authorized)', category: 'functionalRequirements' },
    { aspect: 'CVSS scoring', note: 'Score each finding using a consistent framework (CVSS v3.1/v4) so severity is comparable across findings and over time', category: 'functionalRequirements' },
    { aspect: 'false positive triage', note: 'Manually validate automated scanner output before reporting — unvalidated scanner results produce high false-positive rates that erode client/stakeholder trust', category: 'preferences' },
    { aspect: 'evidence integrity', note: 'Preserve logs and proof-of-concept evidence with timestamps and chain-of-custody discipline in case findings are disputed or used in a compliance audit', category: 'constraints' },
    { aspect: 'safe exploitation practices', note: 'Prefer proof-of-concept/non-destructive exploitation techniques (e.g. read-only proof over data exfiltration) unless full exploitation impact is explicitly authorized', category: 'constraints' },
    { aspect: 'network segmentation awareness', note: 'Understand target network segmentation before testing lateral movement/privilege escalation paths so testing does not inadvertently cross into an unauthorized segment', category: 'constraints' },
    { aspect: 'patch/CVE tracking', note: 'Cross-reference discovered software versions against current CVE databases (NVD) to identify known, unpatched vulnerabilities', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'report readability for non-technical stakeholders', note: 'Provide an executive summary in plain language alongside technical detail, since findings are often read by non-technical decision-makers who approve remediation budget', category: 'preferences' },
    { aspect: 'severity communication', note: 'Present risk severity visually (e.g. color-coded critical/high/medium/low) so priority is immediately clear without reading full technical detail', category: 'preferences' },
    { aspect: 'remediation guidance clarity', note: 'Pair every finding with concrete, actionable remediation steps, not just a description of the vulnerability, so engineering teams can act without follow-up clarification', category: 'functionalRequirements' },
    { aspect: 'alert fatigue in SOC tooling', note: 'If building SIEM/detection tooling, tune alert thresholds to minimize false-positive alert volume, which otherwise causes analysts to desensitize to real alerts', category: 'preferences' },
    { aspect: 'stakeholder communication cadence', note: 'Define a communication cadence (daily standup, critical-finding escalation path) during active testing so stakeholders are not surprised by results at the final report', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'authorization boundary', note: 'Never perform any scanning, exploitation, or data access without documented written authorization scoping exactly what is permitted — unauthorized testing is illegal under laws like the US CFAA regardless of intent', category: 'constraints' },
    { aspect: 'defensive vs offensive framing', note: 'Explicitly classify each deliverable as defensive (hardening, detection, monitoring) or offensive (exploitation, red-team simulation) so intent and authorization requirements are unambiguous throughout the engagement', category: 'constraints' },
    { aspect: 'responsible disclosure timeline', note: 'Follow a coordinated disclosure timeline (commonly 90 days) before any public disclosure of a discovered vulnerability, giving the affected party reasonable time to remediate', category: 'constraints' },
    { aspect: 'sensitive data minimization', note: 'Access, extract, and retain only the minimum data needed to prove a vulnerability\'s impact; avoid bulk-exfiltrating real customer/production data during proof-of-concept exploitation', category: 'constraints' },
    { aspect: 'credential and secrets handling', note: 'Store any credentials or secrets obtained during testing in an encrypted, access-controlled vault and destroy them at engagement close per the agreed data-handling terms', category: 'constraints' },
    { aspect: 'third-party impact', note: 'Consider whether testing could affect shared infrastructure or third parties (e.g. cloud provider, upstream vendor) outside the direct client relationship, and exclude or separately authorize those', category: 'constraints' },
    { aspect: 'legal and regulatory exposure', note: 'Confirm engagement compliance with applicable law and any regulatory framework in scope (e.g. HIPAA for healthcare targets, PCI-DSS for cardholder data environments)', category: 'constraints' },
    { aspect: 'insider/social engineering ethics', note: 'If social engineering or phishing simulation is in scope, define explicit limits (no coercion, no real harm, employee notification/opt-out policy per HR agreement)', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'report presentation design', note: 'Design the findings report with clear typography and visual severity indicators so it reads as a professional, trustworthy deliverable rather than a raw tool dump', category: 'preferences' },
    { aspect: 'attack narrative framing', note: 'For red-team engagements, present findings as a coherent attack narrative/kill chain (initial access through impact) rather than a disconnected findings list, which better communicates real business risk', category: 'preferences' },
    { aspect: 'dashboard visualization', note: 'If building an ongoing SOC/monitoring dashboard, prioritize clear visual hierarchy for active vs resolved incidents over decorative styling', category: 'preferences' },
    { aspect: 'brand-appropriate tone', note: 'Match report and communication tone to audience (formal/audit tone for compliance stakeholders vs a more technical tone for engineering teams)', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'scope boundary verification', note: 'Verify before testing begins that every target in the test plan matches the signed authorization scope exactly — test for scope drift as a first-class QA step, not an afterthought', category: 'constraints' },
    { aspect: 'finding reproducibility', note: 'Every reported finding must include reproduction steps that a third party can follow to independently verify the vulnerability exists', category: 'functionalRequirements' },
    { aspect: 'remediation re-test', note: 'Define a re-test step to confirm each fix actually closes the reported vulnerability rather than only suppressing its symptom', category: 'functionalRequirements' },
    { aspect: 'false negative risk', note: 'Consider what classes of vulnerability the chosen testing methodology cannot detect (e.g. business-logic flaws missed by automated scanners) and flag that gap explicitly in the report', category: 'preferences' },
    { aspect: 'compliance mapping accuracy', note: 'If findings are mapped to a compliance framework (PCI-DSS, ISO 27001), verify the mapping is accurate — misattributed compliance claims create legal/audit risk', category: 'constraints' },
    { aspect: 'incident response drill validation', note: 'If deliverables include incident response procedures, test them via a tabletop exercise or simulated drill rather than assuming an untested runbook will work under real incident pressure', category: 'preferences' },
    { aspect: 'contradiction check', note: 'Check for contradictions between stated scope and requested activity (e.g. "test only the staging environment" alongside "assess our live customer data")', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'exploitation without authorization',
      note: 'Requesting active exploitation or offensive testing (real or simulated) without documented written authorization/rules of engagement is not a technical scoping issue — it is a legal blocker (e.g. under the US CFAA) that must be resolved before any offensive activity is technically feasible.',
      category: 'constraints',
      triggerA: /\b(exploit|penetration\s*test|pentest|red\s+team|attack)\b/i,
      triggerB: /\b(no\s+authorization|without\s+permission|not\s+authorized|don't\s+have\s+(?:approval|permission))\b/i,
    },
    {
      aspect: 'timeline vs assessment depth',
      note: 'An extremely short delivery timeline (days or less) alongside a full penetration test or comprehensive security audit is high-risk — thorough manual testing and validated reporting typically takes one to several weeks depending on scope.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(penetration\s*test|pentest|comprehensive\s+(?:security\s+)?audit|full\s+security\s+assessment)\b/i,
    },
    {
      aspect: 'production testing vs zero downtime',
      note: 'Testing directly against a live production environment while also requiring zero downtime/zero disruption is a high-risk combination — active vulnerability scanning and exploitation attempts can crash services or degrade performance, so an isolated staging/replica environment is typically required to satisfy both goals.',
      category: 'constraints',
      triggerA: /\bproduction\s+(environment|system|server)\b/i,
      triggerB: /\b(zero\s+downtime|no\s+disruption|cannot\s+afford\s+downtime|must\s+stay\s+(?:up|online))\b/i,
    },
    {
      aspect: 'compliance certification claim vs scope',
      note: 'Claiming a resulting report will grant or guarantee formal compliance certification (e.g. "this will make us PCI-DSS certified") conflates a security assessment with a formal certification audit performed by an accredited assessor — a penetration test or vulnerability assessment alone cannot issue a compliance certification.',
      category: 'constraints',
      triggerA: /\b(pci[- ]?dss|soc\s*2|iso\s*27001)\b/i,
      triggerB: /\b(guarantee\s+certification|will\s+certify|makes?\s+us\s+compliant|grant\s+certification)\b/i,
    },
  ],
};
