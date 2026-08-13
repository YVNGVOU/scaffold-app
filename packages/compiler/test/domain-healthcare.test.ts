import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('healthcare domain', () => {
  it('detects healthcare domain on a realistic healthcare-specific request', () => {
    const compiled = compileArchitect(
      'Build a patient portal for a clinic where patients can view medical records, message their clinician, and schedule telehealth appointments, integrated with our EHR via FHIR and fully HIPAA-compliant'
    );
    expect(compiled.domain).toBe('healthcare');
  });

  it('negative control: an unrelated web-focused request does not misclassify as healthcare', () => {
    const compiled = compileArchitect(
      'I need a responsive marketing website with a React frontend for a bakery, targeting mobile and desktop customers'
    );
    expect(compiled.domain).not.toBe('healthcare');
    expect(compiled.domain).toBe('web');
  });

  it('negative control: a generic business request does not misclassify as healthcare', () => {
    const compiled = compileArchitect(
      'Draft a business plan for a subscription coffee delivery service, including pricing tiers and a go-to-market strategy'
    );
    expect(compiled.domain).not.toBe('healthcare');
  });

  it('word-boundary regression: unrelated words do not falsely trigger healthcare keywords', () => {
    const state = runArchitectPipeline('The therapist wants a rapid prototype of an emergency escape room game with a triangle logo');
    expect(state.domain).not.toBe('healthcare');
  });

  it('architect specialist produces healthcare-appropriate architecture output', () => {
    const compiled = compileArchitect(
      'Build a clinical decision support tool for providers with a patient intake flow, EHR/FHIR integration, audit logging for HIPAA compliance, and a provider dashboard showing care plans'
    );
    expect(compiled.domain).toBe('healthcare');
    const architectureText = JSON.stringify(compiled.architecture);
    expect(architectureText).toMatch(/clinical data layer|EHR\/FHIR integration layer|provider dashboard|audit and compliance logging/i);
  });

  it('technical specialist surfaces a healthcare-specific consideration', () => {
    const compiled = compileArchitect(
      'Build a clinical decision support tool for providers with a patient intake flow, EHR/FHIR integration, audit logging for HIPAA compliance, and a provider dashboard showing care plans'
    );
    expect(compiled.domain).toBe('healthcare');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/HIPAA|HL7 FHIR|Business Associate Agreement|ICD-10/i);
  });

  it('detects healthcare domain via remote patient monitoring / wearable / billing phrasing', () => {
    const compiled = compileArchitect(
      'Build a remote patient monitoring app that ingests wearable device data for chronic disease management patients at an urgent care clinic, plus medical billing and claims processing'
    );
    expect(compiled.domain).toBe('healthcare');
  });

  it('word-boundary regression: new keywords do not falsely trigger on unrelated words', () => {
    const state = runArchitectPipeline(
      'The mechanic gave the clinical-sounding technobabble a pharmacy-adjacent brand name for the hospitality startup pitch deck'
    );
    // "clinic" must not bare-match inside "clinical-sounding" or "pharmacy" inside "pharmacy-adjacent" in a way
    // that misclassifies an unrelated hospitality/branding pitch as healthcare.
    expect(state.domain).not.toBe('healthcare');
  });

  it('ambiguity checklist recognizes short bare answers for the new reimbursement and RPM fields', () => {
    const compiled = compileArchitect(
      'Build a remote patient monitoring platform for chronic disease management, billed via insurance billing, using wearables for continuous monitoring'
    );
    expect(compiled.domain).toBe('healthcare');
    const compiledText = JSON.stringify(compiled);
    // new considerations should surface: claims transaction format / RPM device trust boundary
    expect(compiledText).toMatch(/X12 837|NCPDP|RPM device data trust boundary|clearinghouse/i);
  });

  it('constraint specialist flags infeasible consumer-wearable diagnostic-grade claim', () => {
    const compiled = compileArchitect(
      'Build a health app using an Apple Watch as the sole vitals source, marketed as FDA-cleared diagnostic-grade accuracy for arrhythmia detection'
    );
    expect(compiled.domain).toBe('healthcare');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/consumer wearable|diagnostic-grade|FDA-cleared/i);
  });
});
