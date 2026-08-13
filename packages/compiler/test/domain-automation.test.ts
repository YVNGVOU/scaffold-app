import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('automation domain', () => {
  it('detects automation domain on a realistic workflow request', () => {
    const compiled = compileArchitect(
      'Build an automated workflow that triggers on a new Stripe payment webhook, syncs the customer record to Salesforce, and retries on failure with alerting'
    );
    expect(compiled.domain).toBe('automation');
  });

  it('negative control: an unrelated menu-design request does not misclassify as automation', () => {
    const compiled = compileArchitect(
      'Design a menu for a coffee shop with pastries and drinks, organized into sections with prices and dietary tags'
    );
    expect(compiled.domain).not.toBe('automation');
  });

  it('word-boundary regression: new keywords do not false-positive inside unrelated words', () => {
    const state = runArchitectPipeline(
      'The robotic arm assembly line uses a synchronizer motor and an ifttt-like naming convention was rejected during code review, but nothing here is scheduled or triggered'
    );
    // 'synchronizer' should not match 'n8n'/'sync' style bare substrings, and none of the
    // new keywords (make.com, ifttt, power automate, runbook, etc.) should fire on this prose.
    expect(state.domain).not.toBe('automation');
  });

  it('new keyword phrasings are detected: power automate, make.com, ifttt, runbook', () => {
    const a = compileArchitect('Set up a Power Automate flow to move files between folders every night');
    const b = compileArchitect('Use Make.com to connect our form submissions to a Google Sheet automatically');
    const c = compileArchitect('Recreate our old IFTTT applet as a proper workflow with error handling');
    const d = compileArchitect('Write a runbook automation that restarts the service and pages on-call on failure');
    expect(a.domain).toBe('automation');
    expect(b.domain).toBe('automation');
    expect(c.domain).toBe('automation');
    expect(d.domain).toBe('automation');
  });

  it('ambiguity checklist recognizes bare short answers to execution-mode and concurrency questions', () => {
    const compiled = compileArchitect(
      'Automate nightly data sync from our warehouse to the CRM via webhook, run it async, and ensure runs are serialized so they never overlap'
    );
    expect(compiled.domain).toBe('automation');
    const compiledText = JSON.stringify(compiled);
    // execution mode ("async") and concurrency ("serialized") should be treated as resolved,
    // so they should not appear as unresolved-ambiguity-checklist source entries.
    expect(compiledText).not.toMatch(/ambiguity-checklist:execution mode/i);
    expect(compiledText).not.toMatch(/ambiguity-checklist:concurrency/i);
  });

  it('technical specialist surfaces new automation-specific considerations (timezone/DST, concurrency)', () => {
    const compiled = compileArchitect(
      'Build a scheduled automation pipeline that runs every day at 2am, pulls data from three APIs, and writes results to a database, with retries and monitoring'
    );
    expect(compiled.domain).toBe('automation');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/daylight saving|timezone|concurrency control|ordering guarantees/i);
  });

  it('constraint specialist flags no-credential-storage vs authenticated-integration contradiction', () => {
    const compiled = compileArchitect(
      'Build an automated workflow that triggers nightly and integrates with the Stripe API using OAuth to sync billing data, but do not store any credentials anywhere'
    );
    expect(compiled.domain).toBe('automation');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).toMatch(/credential storage|secrets manager|OAuth token store/i);
  });
});
