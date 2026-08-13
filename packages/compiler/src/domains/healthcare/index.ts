import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/web/index.ts and
// domains/game/index.ts (TASK-006). Plain substring matching would let a
// keyword like 'ehr' match inside unrelated words, and short clinical
// acronyms are especially prone to false positives, so every keyword is
// tested via a `\b`-delimited regex, never `.includes()`.
const KEYWORDS = [
  'healthcare', 'health care', 'patient', 'clinician', 'HIPAA',
  'EHR', 'EMR', 'telehealth', 'telemedicine', 'diagnosis', 'diagnostic',
  'medical record', 'prescription', 'medication', 'HL7', 'FHIR', 'ICD-10',
  'CPT code', 'provider portal', 'care plan', 'symptom checker', 'PHI',
  'protected health information', 'triage', 'appointment scheduling',
  'hospital', 'medical clinic', 'pharmacy prescription', 'health insurance', 'medical billing',
  'remote patient monitoring', 'wearable device', 'population health',
  'care coordination', 'urgent care', 'chronic disease management',
  'claims processing', 'nurse', 'physician', 'lab results',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const healthcareDomain: DomainModule = {
  id: 'healthcare',
  label: 'Healthcare',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Application must not be presented as a substitute for professional medical advice, diagnosis, or treatment', category: 'constraint' },
    { text: 'Any storage or transmission of patient data must be HIPAA-compliant (or the equivalent regional regulation)', category: 'constraint' },
    { text: 'Clinical content must be reviewed for accuracy against current medical guidelines before release', category: 'functional' },
    { text: 'Audit logging of access to patient records for compliance and breach investigation', category: 'functional' },
    { text: 'Define escalation path for urgent/emergency symptoms surfaced by the product', category: 'functional' },
    { text: 'Accessible UI appropriate for patients with varying health literacy and ability levels', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'regulatory scope',
      description: 'Which regulatory framework applies (HIPAA, GDPR health data, FDA SaMD, state telehealth law) is unspecified',
      isResolved: (input) => /\b(HIPAA|GDPR|FDA|SaMD|HITECH|state law|regulation|compliance)\b/i.test(input),
    },
    {
      field: 'covered entity status',
      description: 'Whether the product itself is a covered entity/business associate handling PHI, or purely informational, is unspecified',
      isResolved: (input) => /\b(covered entity|business associate|PHI|patient data|de-?identified|anonymi[sz]ed)\b/i.test(input),
    },
    {
      field: 'clinical validation',
      description: 'Whether clinical content/logic will be reviewed or validated by a licensed clinician is unspecified',
      isResolved: (input) => /\b(clinician|physician|nurse|doctor|medical review|clinically validated|licensed provider)\b/i.test(input),
    },
    {
      field: 'user population',
      description: 'The target user population (patients, clinicians, administrators, caregivers) is unspecified',
      isResolved: (input) => /\b(patients?|clinicians?|providers?|caregivers?|administrators?|nurses?|physicians?)\b/i.test(input),
    },
    {
      field: 'data integration',
      description: 'Whether the system needs to integrate with existing EHR/EMR systems or health data standards (HL7/FHIR) is unspecified',
      isResolved: (input) => /\b(EHR|EMR|HL7|FHIR|integration|interoperab\w*)\b/i.test(input),
    },
    {
      field: 'emergency handling',
      description: 'How the product handles or escalates emergency/urgent symptoms is unspecified',
      isResolved: (input) => /\b(emergency|urgent|911|escalat|red flag|crisis)\b/i.test(input),
    },
    {
      field: 'reimbursement model',
      description: 'How the product is paid for (fee-for-service, value-based care, self-pay, insurance billing) is unspecified',
      isResolved: (input) => /\b(fee-for-service|value-based care|self-?pay|insurance billing|reimbursement|billing model|cash pay|out-of-pocket|claims)\b/i.test(input),
    },
    {
      field: 'remote monitoring data source',
      description: 'Whether patient data originates from remote monitoring devices/wearables, and how that device data is ingested, is unspecified',
      isResolved: (input) => /\b(remote patient monitoring|RPM|wearables?|device data|bluetooth|continuous monitoring)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'patient intake', dependsOn: [], note: 'Structured intake/registration flow capturing demographics and consent' },
    { component: 'clinical data layer', dependsOn: ['patient intake'], note: 'PHI-aware data store with encryption at rest and field-level access control' },
    { component: 'EHR/FHIR integration layer', dependsOn: ['clinical data layer'], note: 'HL7/FHIR-compliant interface for exchanging records with external EHR systems' },
    { component: 'clinical decision support', dependsOn: ['clinical data layer'], note: 'Rules/alerts engine surfacing guideline-based recommendations, never presented as a diagnosis' },
    { component: 'provider dashboard', dependsOn: ['clinical data layer'], note: 'Clinician-facing view of patient status, care plans, and pending actions' },
    { component: 'patient portal', dependsOn: ['clinical data layer'], note: 'Patient-facing access to records, appointments, and secure messaging' },
    { component: 'audit and compliance logging', dependsOn: ['clinical data layer'], note: 'Immutable access logs for HIPAA audit trails and breach investigation' },
    { component: 'consent management', dependsOn: ['patient intake'], note: 'Tracks and enforces patient consent scope for data use and sharing' },
    { component: 'notification/escalation service', dependsOn: ['clinical decision support'], note: 'Routes urgent findings to on-call clinicians or emergency guidance' },
    { component: 'billing and claims module', dependsOn: ['clinical data layer'], note: 'Generates and tracks insurance claims (X12 837/835 transactions via a clearinghouse) or self-pay invoicing' },
    { component: 'remote monitoring ingestion service', dependsOn: ['clinical data layer'], note: 'Receives and normalizes data streams from wearables/RPM devices, flagging gaps in expected reporting cadence' },
    { component: 'deployment', dependsOn: ['clinical data layer', 'audit and compliance logging'], note: 'Hosting environment with a signed Business Associate Agreement (BAA) where PHI is involved' },
  ],
  technicalConsiderations: [
    { aspect: 'HIPAA compliance', note: 'Confirm hosting/vendor stack (cloud provider, analytics, email) can sign a Business Associate Agreement (BAA) if PHI is processed', category: 'constraints' },
    { aspect: 'interoperability standard', note: 'Adopt HL7 FHIR (or HL7 v2 for legacy systems) for any external clinical data exchange rather than a bespoke format', category: 'functionalRequirements' },
    { aspect: 'terminology coding', note: 'Use standard coding systems (ICD-10 for diagnoses, CPT/HCPCS for procedures, SNOMED CT/LOINC for clinical terms) rather than free text where structured data is needed', category: 'functionalRequirements' },
    { aspect: 'encryption', note: 'Encrypt PHI at rest and in transit (TLS 1.2+, AES-256) and manage keys separately from application data', category: 'constraints' },
    { aspect: 'data retention', note: 'Define retention and secure-deletion policy for medical records per applicable state/federal retention minimums', category: 'constraints' },
    { aspect: 'EHR integration', note: 'If integrating with an existing EHR (Epic, Cerner/Oracle Health, Athenahealth), account for that vendor\'s API limitations and certification requirements', category: 'functionalRequirements' },
    { aspect: 'uptime/reliability', note: 'Define availability SLA appropriate to clinical use — a scheduling tool tolerates more downtime than a bedside monitoring system', category: 'preferences' },
    { aspect: 'de-identification', note: 'Where data is used for analytics/research, apply a recognized de-identification method (Safe Harbor or Expert Determination) rather than ad-hoc redaction', category: 'preferences' },
    { aspect: 'claims transaction format', note: 'Insurance billing must use ANSI X12 837 (claim submission) and 835 (remittance advice) transaction sets through a clearinghouse, not a custom billing schema', category: 'functionalRequirements' },
    { aspect: 'pharmacy interoperability', note: 'E-prescribing or medication-list features should use NCPDP SCRIPT standard messaging to interoperate with pharmacy systems, not a proprietary format', category: 'functionalRequirements' },
    { aspect: 'RPM device data trust boundary', note: 'Treat data from consumer wearables (step counts, heart rate) as lower-confidence signal distinct from FDA-cleared medical devices; do not silently merge the two into one clinical data stream', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'health literacy', note: 'Write patient-facing copy at a widely accessible reading level (roughly 6th-8th grade) and avoid unexplained clinical jargon', category: 'preferences' },
    { aspect: 'accessibility', note: 'Meet WCAG accessibility requirements given the higher prevalence of visual, motor, and cognitive impairment among patient populations', category: 'constraints' },
    { aspect: 'clinician workflow', note: 'Design provider-facing screens to minimize clicks during time-constrained clinical encounters; avoid interrupting exam-room workflow', category: 'functionalRequirements' },
    { aspect: 'error tolerance for critical data', note: 'Require explicit confirmation steps for high-stakes entries (dosage, allergies, diagnoses) rather than silent auto-save', category: 'functionalRequirements' },
    { aspect: 'multilingual support', note: 'Consider language access needs (interpreter integration, translated content) for diverse patient populations', category: 'preferences' },
    { aspect: 'anxiety-aware design', note: 'Present sensitive results (abnormal labs, diagnoses) with calm, clear framing and a clear next step rather than raw clinical output', category: 'preferences' },
    { aspect: 'caregiver access', note: 'Support proxy/caregiver access flows (parents, guardians, powers of attorney) distinct from the patient\'s own account', category: 'functionalRequirements' },
    { aspect: 'telehealth session reliability', note: 'Design graceful degradation for video visits on poor bandwidth (audio-only fallback, reconnect without losing session state) rather than assuming reliable broadband', category: 'functionalRequirements' },
    { aspect: 'medication adherence nudges', note: 'Reminder/nudge cadence for medication or monitoring adherence should be configurable per care plan, not a single fixed schedule for every condition', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'PHI access control', note: 'Enforce role-based access control (RBAC) so only authorized clinical staff can view a given patient\'s records, on a minimum-necessary basis', category: 'constraints' },
    { aspect: 'audit logging', note: 'Log every access, view, and modification of PHI with user identity and timestamp, retained per HIPAA audit requirements', category: 'constraints' },
    { aspect: 'authentication strength', note: 'Require multi-factor authentication for clinician/administrator accounts with access to patient records', category: 'constraints' },
    { aspect: 'breach notification', note: 'Define a breach detection and notification process meeting HIPAA Breach Notification Rule timelines', category: 'constraints' },
    { aspect: 'third-party data sharing', note: 'Document any PHI shared with analytics, ad, or AI vendors, and confirm each has a signed BAA or the data is properly de-identified first', category: 'constraints' },
    { aspect: 'device security', note: 'Address security for clinical/mobile devices accessing patient data (auto-lock, remote wipe, no PHI in local caches)', category: 'functionalRequirements' },
    { aspect: 'minors and sensitive categories', note: 'Apply extra protection to sensitive categories (mental health, substance use, reproductive health, minors\' records) per applicable heightened-confidentiality laws (e.g. 42 CFR Part 2)', category: 'constraints' },
    { aspect: 'RPM/wearable transmission security', note: 'Secure the device-to-cloud channel for remote monitoring hardware (paired-device authentication, encrypted transport) since these endpoints are a common weak link outside the main application perimeter', category: 'constraints' },
    { aspect: 'billing data overlap', note: 'Insurance/payment data alongside PHI creates overlapping PCI-DSS and HIPAA obligations; do not assume PHI safeguards alone cover stored payment card data', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'clinical trust signaling', note: 'Use a visual language (typography, color, iconography) that reads as credible and calm rather than gimmicky, to build trust with patients and clinicians', category: 'preferences' },
    { aspect: 'data visualization clarity', note: 'Present clinical data (vitals trends, lab results) with clear, unambiguous charting — avoid chart types that could be misread in a health-consequential context', category: 'functionalRequirements' },
    { aspect: 'brand tone', note: 'Calibrate tone to the context: reassuring and plain for patient-facing content, precise and terse for clinician-facing tools', category: 'preferences' },
    { aspect: 'iconography accuracy', note: 'Avoid medical iconography/imagery that could be misinterpreted as diagnostic or alarming out of context', category: 'preferences' },
    { aspect: 'consistency across touchpoints', note: 'Keep visual and terminology consistency between patient portal, clinician dashboard, and any printed/exported documents', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'clinical accuracy review', note: 'Route any medical claims, dosing logic, or clinical decision rules through a licensed-clinician review before release, not just engineering QA', category: 'constraints' },
    { aspect: 'not-medical-advice disclaimer', note: 'Verify the product clearly states it is not a substitute for professional medical advice, especially near any symptom or diagnostic feature', category: 'functionalRequirements' },
    { aspect: 'edge case: emergency symptoms', note: 'Test the flow for a user reporting emergency symptoms (chest pain, suicidal ideation) to confirm it surfaces appropriate escalation guidance rather than a generic response', category: 'constraints' },
    { aspect: 'contradiction check', note: 'Check for contradictions such as "no PHI stored" alongside "full patient medical history in-app"', category: 'constraints' },
    { aspect: 'data validation', note: 'Test boundary and malformed inputs for clinical fields (dosage units, dates of birth, lab values) that could otherwise silently corrupt a record', category: 'functionalRequirements' },
    { aspect: 'access control testing', note: 'Test that a user account cannot access another patient\'s records via ID manipulation or insufficiently scoped queries', category: 'constraints' },
    { aspect: 'acceptance criteria', note: 'Define testable acceptance criteria for core clinical flows (e.g. "a provider can review and approve a care plan in under 2 minutes")', category: 'preferences' },
    { aspect: 'billing code accuracy', note: 'Test claims generation against known ICD-10/CPT code pairs to confirm no mismatched or unbillable code combinations reach the clearinghouse', category: 'functionalRequirements' },
    { aspect: 'RPM data gap handling', note: 'Test behavior when a monitoring device stops reporting (battery death, connectivity loss) — confirm the system flags the gap rather than treating "no data" as "no symptoms"', category: 'constraints' },
  ],
  constraintConsiderations: [
    {
      aspect: 'no compliance budget vs PHI handling',
      note: 'Stating a minimal/no compliance budget alongside handling real patient health information is infeasible — HIPAA-grade infrastructure, BAAs, and audit logging carry non-trivial, non-optional cost.',
      category: 'constraints',
      triggerA: /\b(no|zero|minimal|very tight)\s+(compliance\s+)?budget\b/i,
      triggerB: /\b(PHI|patient data|medical records?|protected health information)\b/i,
    },
    {
      aspect: 'diagnostic claims vs no clinical review',
      note: 'Offering diagnostic or treatment recommendations without any licensed clinical review/oversight is a high-risk regulatory and safety combination (potential FDA SaMD classification, liability exposure).',
      category: 'constraints',
      triggerA: /\b(diagnos(e|is|tic)|treatment recommendation|prescribe)\b/i,
      triggerB: /\b(no clinician|no medical review|without (a )?doctor|no licensed)\b/i,
    },
    {
      aspect: 'rapid timeline vs EHR integration',
      note: 'An extremely short delivery timeline alongside deep EHR/HL7-FHIR integration work is high-risk — certified integrations with systems like Epic or Cerner typically require weeks of vendor onboarding regardless of team size.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(EHR|EMR|HL7|FHIR)\s+integration\b/i,
    },
    {
      aspect: 'consumer wearable data vs clinical-grade claims',
      note: 'Sourcing vitals from consumer wearables (Fitbit, Apple Watch, off-the-shelf trackers) while claiming FDA-cleared or diagnostic-grade accuracy is infeasible — consumer wearables are not cleared for diagnostic use and the accuracy claim would misrepresent the underlying hardware.',
      category: 'constraints',
      triggerA: /\b(consumer wearable|fitbit|apple watch|off-the-shelf (?:wearable|tracker))\b/i,
      triggerB: /\b(FDA[- ]clear(?:ed|ance)|diagnostic[- ]grade|clinical[- ]grade accuracy)\b/i,
    },
  ],
};
