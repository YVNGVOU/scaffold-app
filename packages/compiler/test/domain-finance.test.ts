import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('finance domain', () => {
  it('detects finance domain on a realistic fintech payments request', () => {
    const compiled = compileArchitect(
      'Build a payments platform with a wallet, ledger, and payment processing integration for peer-to-peer payments, including KYC/AML onboarding'
    );
    expect(compiled.domain).toBe('finance');
  });

  it('negative control: an unrelated game-development request does not misclassify as finance', () => {
    const compiled = compileArchitect(
      'Build a 2D platformer game with a multiplayer mode, level editor, and physics-based movement'
    );
    expect(compiled.domain).not.toBe('finance');
  });

  it('word-boundary regression: new finance keywords do not falsely trigger on unrelated words', () => {
    const state = runArchitectPipeline(
      'The multiplayer forexample tool has a 401kite icon and a p2peer review workflow for content moderation'
    );
    expect(state.domain).not.toBe('finance');
  });

  it('detects finance domain from newly added keyword phrasings (BNPL, payroll, open banking)', () => {
    const compiled = compileArchitect(
      'Design a buy now pay later checkout flow with payroll processing and open banking account linking'
    );
    expect(compiled.domain).toBe('finance');
  });

  it('ambiguity checklist recognizes bare short answers for currency and settlement fields', () => {
    const compiled = compileArchitect(
      'Build a lending platform, multi-currency, with instant payout for approved loans'
    );
    expect(compiled.domain).toBe('finance');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).not.toMatch(/currency and locale scope[\s\S]*unspecified/i);
  });

  it('surfaces new technical and security considerations (webhooks, step-up auth)', () => {
    const compiled = compileArchitect(
      'Build a fintech platform with a ledger service, payment gateway integration, and KYC/AML onboarding for a lending product'
    );
    expect(compiled.domain).toBe('finance');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/webhook|step-up authentication/i);
  });

  it('constraint specialist flags instant settlement promised on standard ACH rails', () => {
    const compiled = compileArchitect(
      'Build a payout product offering instant payout to users, processed via standard ACH transfer'
    );
    expect(compiled.domain).toBe('finance');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/instant settlement vs traditional rails|instant.*ach/i);
  });
});
