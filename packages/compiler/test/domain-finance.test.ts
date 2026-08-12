import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('finance domain', () => {
  it('detects finance domain on a realistic fintech request', () => {
    const compiled = compileArchitect(
      'Build a fintech payments platform with a double-entry ledger, KYC/AML onboarding, payment processing integration, and PCI DSS compliant card handling'
    );
    expect(compiled.domain).toBe('finance');
  });

  it('negative control: an unrelated web-focused request does not misclassify as finance', () => {
    const compiled = compileArchitect(
      'I need a responsive marketing website with a React frontend for a bakery, targeting mobile and desktop customers'
    );
    expect(compiled.domain).not.toBe('finance');
    expect(compiled.domain).toBe('web');
  });

  it('word-boundary regression: unrelated words do not falsely trigger finance keywords', () => {
    const state = runArchitectPipeline('The loaner car was parked near the banker box in the garage during the renovation');
    expect(state.domain).not.toBe('finance');
  });

  it('architect specialist produces finance-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Build a neobank app with core banking accounts, a payment gateway integration, KYC/AML identity verification, fraud detection, and automated reconciliation against processor statements'
    );
    expect(compiled.domain).toBe('finance');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/ledger service|reconciliation engine|kyc\/aml service|payment gateway/i);
  });

  it('technical specialist surfaces a finance-specific consideration', () => {
    const compiled = compileArchitect(
      'Build a neobank app with core banking accounts, a payment gateway integration, KYC/AML identity verification, fraud detection, and automated reconciliation against processor statements'
    );
    expect(compiled.domain).toBe('finance');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/idempotency|double-entry ledger|fixed-point|reconciliation|settlement timing/i);
  });
});
