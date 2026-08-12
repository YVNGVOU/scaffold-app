import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006).
// Plain substring matching would let e.g. 'kyc' match inside unrelated tokens
// or 'loan' match inside 'loaned'/'loaner' variants incorrectly, and generic
// terms like 'payment' could bleed across domains. Every keyword below is
// tested with a `\b`-delimited regex, mirroring domains/web/index.ts.
const KEYWORDS = [
  'fintech', 'banking', 'bank account', 'brokerage', 'trading platform',
  'payment processing', 'payments', 'wallet', 'ledger', 'kyc', 'aml',
  'anti-money laundering', 'know your customer', 'pci dss', 'pci compliance',
  'stock trading', 'investing app', 'investment platform', 'lending', 'loan origination',
  'credit scoring', 'underwriting', 'money transfer', 'remittance', 'robo-advisor',
  'portfolio management', 'accounting software', 'invoicing', 'expense tracking',
  'financial statement', 'general ledger', 'crypto exchange', 'insurance underwriting',
  'reconciliation', 'clearing and settlement', 'card issuing', 'neobank', 'sec compliance',
  'finra',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const financeDomain: DomainModule = {
  id: 'finance',
  label: 'Finance / Fintech',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'System must maintain an immutable, append-only audit trail for all financial transactions', category: 'functional' },
    { text: 'Define applicable regulatory regime (e.g. PCI DSS, SOX, GLBA, SEC/FINRA, regional banking regulator)', category: 'constraint' },
    { text: 'All monetary values must use fixed-point/decimal arithmetic, never floating point', category: 'constraint' },
    { text: 'KYC/AML identity verification and transaction monitoring must be defined before onboarding real users', category: 'functional' },
    { text: 'Reconciliation process between internal ledger and external processor/bank records', category: 'functional' },
  ],
  ambiguityChecklist: [
    {
      field: 'regulatory scope',
      description: 'Which jurisdiction(s) and regulatory frameworks apply (e.g. US SEC/FINRA, EU PSD2, UK FCA) is unspecified',
      isResolved: (input) => /(sec|finra|psd2|fca|gdpr|gramm-leach-bliley|glba|sox|jurisdiction|regulat)/i.test(input),
    },
    {
      field: 'money movement model',
      description: 'Whether the product moves real money directly, uses a licensed payment processor/BaaS partner, or is read-only/advisory is unspecified',
      isResolved: (input) => /(payment processor|banking[- ]as[- ]a[- ]service|baas|stripe|plaid|read-only|non-custodial|custodial|licensed partner|money transmitter)/i.test(input),
    },
    {
      field: 'kyc/aml tier',
      description: 'The required level of identity verification and transaction monitoring (KYC/AML tier) is unspecified',
      isResolved: (input) => /\b(kyc|aml|identity verification|know your customer|anti-money laundering)\b/i.test(input),
    },
    {
      field: 'data classification',
      description: 'Whether the system handles cardholder data, bank account numbers, or SSNs (triggering PCI DSS/GLBA scope) is unspecified',
      isResolved: (input) => /(cardholder data|pci|ssn|social security|account number|routing number|tokeniz)/i.test(input),
    },
    {
      field: 'audit and reporting',
      description: 'Audit trail retention period and regulatory reporting obligations (e.g. suspicious activity reports) are unspecified',
      isResolved: (input) => /(audit trail|audit log|retention|suspicious activity report|sar|reporting requirement)/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'ledger service', dependsOn: [], note: 'Source-of-truth double-entry ledger recording every balance-affecting event' },
    { component: 'payment gateway integration', dependsOn: ['ledger service'], note: 'Integration with card networks/processors (e.g. Stripe, Adyen) or banking rails (ACH, wire, SEPA)' },
    { component: 'kyc/aml service', dependsOn: [], note: 'Identity verification, sanctions/watchlist screening, and ongoing transaction monitoring' },
    { component: 'reconciliation engine', dependsOn: ['ledger service', 'payment gateway integration'], note: 'Automated matching of internal ledger entries against processor/bank statements' },
    { component: 'fraud detection', dependsOn: ['ledger service'], note: 'Real-time and batch scoring of transactions for anomalous/fraudulent activity' },
    { component: 'reporting and audit trail', dependsOn: ['ledger service'], note: 'Immutable event log plus regulatory/financial reporting (statements, SARs, tax forms)' },
    { component: 'core banking / account service', dependsOn: ['ledger service'], note: 'Account lifecycle, balances, holds, and interest/fee calculation' },
    { component: 'encryption and key management', dependsOn: [], note: 'Encryption at rest/in transit and secure key management (HSM/KMS) for sensitive financial data' },
  ],
  technicalConsiderations: [
    { aspect: 'arithmetic precision', note: 'Use fixed-point/decimal types (never float/double) for all monetary calculations to avoid rounding errors', category: 'constraints' },
    { aspect: 'idempotency', note: 'All payment/transfer APIs must support idempotency keys so retried requests never double-charge or double-post', category: 'functionalRequirements' },
    { aspect: 'double-entry ledger', note: 'Model balances as a double-entry ledger (debits equal credits) rather than mutable account balance fields', category: 'functionalRequirements' },
    { aspect: 'processor integration', note: 'Choose a payment processor/banking-as-a-service partner (e.g. Stripe, Plaid, Unit, Marqeta) appropriate to the money-movement model', category: 'constraints' },
    { aspect: 'settlement timing', note: 'Account for settlement delays and holds (ACH T+1/T+3, card chargebacks) rather than assuming instant finality', category: 'functionalRequirements' },
    { aspect: 'reconciliation', note: 'Build automated reconciliation against processor/bank statements to catch drift between internal and external state', category: 'functionalRequirements' },
    { aspect: 'high availability', note: 'Define uptime/consistency requirements for the ledger and payment path, since downtime directly blocks money movement', category: 'preferences' },
    { aspect: 'sandbox vs production', note: 'Maintain a clear separation of sandbox/test credentials from production financial credentials and rails', category: 'constraints' },
  ],
  uxConsiderations: [
    { aspect: 'transaction transparency', note: 'Show clear, itemized transaction detail (fees, exchange rates, timing) so users are never surprised by a charge', category: 'functionalRequirements' },
    { aspect: 'error and decline messaging', note: 'Provide specific, actionable messaging for declines, holds, and failed transfers instead of a generic "something went wrong"', category: 'preferences' },
    { aspect: 'onboarding friction', note: 'Balance KYC/identity-verification friction against conversion — stage verification requirements to the risk/limit tier needed', category: 'preferences' },
    { aspect: 'trust signals', note: 'Surface security/compliance trust signals (encryption, insurance/FDIC coverage, licensing) prominently, especially at signup and before large transfers', category: 'preferences' },
    { aspect: 'confirmation flows', note: 'Require explicit confirmation steps (amount, recipient, fees) before irreversible money movement', category: 'functionalRequirements' },
    { aspect: 'statements and history', note: 'Provide clear, exportable transaction history and statements for user record-keeping and dispute resolution', category: 'functionalRequirements' },
    { aspect: 'accessibility of numbers', note: 'Format currency, dates, and numeric precision consistently and accessibly across locales', category: 'preferences' },
  ],
  securityConsiderations: [
    { aspect: 'pci dss scope', note: 'If handling cardholder data, define PCI DSS scope and prefer tokenization/processor-hosted fields to avoid storing raw card numbers', category: 'constraints' },
    { aspect: 'kyc/aml controls', note: 'Implement identity verification, sanctions/watchlist screening, and ongoing transaction monitoring proportional to risk', category: 'constraints' },
    { aspect: 'encryption', note: 'Encrypt sensitive financial data (account numbers, SSNs, balances) at rest and in transit, with keys managed via HSM/KMS', category: 'constraints' },
    { aspect: 'access control', note: 'Enforce least-privilege, role-based access to production financial data and require MFA for privileged/admin actions', category: 'constraints' },
    { aspect: 'audit logging', note: 'Log every balance-affecting action immutably with actor, timestamp, and reason, retained per regulatory requirements', category: 'constraints' },
    { aspect: 'fraud detection', note: 'Build real-time fraud/anomaly detection into the transaction path, not as an after-the-fact report', category: 'functionalRequirements' },
    { aspect: 'secrets management', note: 'Store API keys/credentials for payment processors and banking partners in a secrets manager, never in code or client bundles', category: 'constraints' },
    { aspect: 'third-party risk', note: 'Assess the security posture and compliance certifications of any processor, BaaS, or data provider before integration', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'trust-driven visual design', note: 'Use a visual language (color, typography, imagery) that communicates stability and trust rather than novelty, appropriate to a financial product', category: 'preferences' },
    { aspect: 'data visualization clarity', note: 'Design charts/graphs (balances, spending, portfolio performance) to be immediately legible and non-misleading, not decorative', category: 'functionalRequirements' },
    { aspect: 'brand differentiation', note: 'Differentiate visually from generic banking-template defaults while staying within the conservative expectations of financial UI', category: 'preferences' },
    { aspect: 'iconography consistency', note: 'Use a consistent, unambiguous icon system for transaction types, statuses, and account actions', category: 'preferences' },
    { aspect: 'tone of voice', note: 'Keep copy precise and unambiguous around money — avoid playful language in contexts involving fees, risk, or irreversible actions', category: 'preferences' },
    { aspect: 'empty and zero states', note: 'Design deliberate empty/zero-balance states so a new or empty account never looks broken or erroneous', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'rounding and precision tests', note: 'Test currency arithmetic for rounding errors across currencies with different minor-unit precision (e.g. JPY has no decimal places)', category: 'functionalRequirements' },
    { aspect: 'idempotency verification', note: 'Verify that retried/duplicate payment requests never result in double-charging or duplicate ledger entries', category: 'constraints' },
    { aspect: 'reconciliation mismatch', note: 'Test scenarios where internal ledger and external processor/bank records disagree and confirm the mismatch is surfaced, not silently dropped', category: 'constraints' },
    { aspect: 'regulatory edge cases', note: 'Test KYC/AML edge cases: sanctioned entities, high-risk jurisdictions, and threshold-triggered reporting obligations', category: 'constraints' },
    { aspect: 'failure and rollback states', note: 'Test partial-failure states: payment authorized but capture fails, transfer initiated but processor times out mid-transaction', category: 'constraints' },
    { aspect: 'contradiction check', note: 'Check stated requirements for contradictions (e.g. "no KYC required" alongside "accept direct bank transfers from users")', category: 'constraints' },
    { aspect: 'acceptance criteria', note: 'Define concrete, testable acceptance criteria for money-movement flows (e.g. "a failed transfer reverses the ledger entry within X seconds")', category: 'functionalRequirements' },
    { aspect: 'audit trail completeness', note: 'Verify every balance-affecting action produces a corresponding immutable audit log entry, including automated/system-triggered ones', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'no compliance vs real money movement',
      note: 'Stating no KYC/AML or compliance program alongside handling real user funds or bank transfers is a known-infeasible combination — money transmission and custodial services are regulated activities in most jurisdictions.',
      category: 'constraints',
      triggerA: /\b(no|skip|without)\s+(kyc|aml|compliance|regulatory)\b/i,
      triggerB: /\b(real money|user funds|bank transfers?|hold(?:ing)? (?:customer|user) funds|money transmission)\b/i,
    },
    {
      aspect: 'budget vs licensing/compliance scope',
      note: 'A near-zero/shoestring budget stated alongside building a licensed banking or brokerage product is high-risk — regulatory licensing, compliance staffing, and audits require substantial dedicated budget.',
      category: 'constraints',
      triggerA: /\b(no|zero|shoestring|minimal|very tight)\s+budget\b/i,
      triggerB: /\b(bank(?:ing)? charter|money transmitter license|broker-dealer|sec registration|banking license)\b/i,
    },
    {
      aspect: 'timeline vs regulatory approval',
      note: 'An extremely short delivery timeline alongside launching a regulated financial product (payments, lending, custody) is high-risk — licensing and compliance review typically take months, independent of engineering speed.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap|next week)\b/i,
      triggerB: /\b(money transmitter|banking license|broker-dealer|launch (?:the )?(?:bank|lending|brokerage) product)\b/i,
    },
  ],
};
