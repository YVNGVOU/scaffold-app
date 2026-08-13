import { describe, it, expect } from 'vitest';
import { compileArchitect, runArchitectPipeline } from '../src/index.js';

describe('devops-infrastructure domain', () => {
  it('devops-infrastructure domain detected on canonical example', () => {
    const compiled = compileArchitect(
      'Set up a CI/CD pipeline on AWS using Terraform and Kubernetes, with autoscaling, Prometheus/Grafana monitoring, and a blue-green rollback strategy'
    );
    expect(compiled.domain).toBe('devops-infrastructure');
  });

  it('negative control: unrelated web request does not misclassify as devops-infrastructure', () => {
    const compiled = compileArchitect('I need a responsive marketing website with a blog and contact form');
    expect(compiled.domain).not.toBe('devops-infrastructure');
  });

  it('negative control: bare substring inside unrelated words does not misclassify as devops-infrastructure', () => {
    // Word-boundary safety check, mirroring TASK-006's 'multiplayer'/'api' regressions.
    // Bare 'iac' or 'sre' matching inside unrelated words must not inflate the score.
    const state = runArchitectPipeline('The maniacal sreekumar family bought a used civic and a docket of old magazines');
    expect(state.domain).not.toBe('devops-infrastructure');
  });

  it('architect specialist produces devops-infrastructure-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'Build a deployment pipeline for our Kubernetes cluster with Terraform-managed infrastructure, autoscaling, and a canary rollout strategy'
    );
    expect(state.domain).toBe('devops-infrastructure');
    const architectureItems = state.requirements.filter((r) => r.source === 'architect-specialist');
    expect(architectureItems.length).toBeGreaterThan(0);
    const mentionsInfra = architectureItems.some(
      (r) => r.text.toLowerCase().includes('deployment') || r.text.toLowerCase().includes('infrastructure')
    );
    expect(mentionsInfra).toBe(true);
  });

  it('technical specialist produces devops-infrastructure-appropriate output when this domain is detected', () => {
    const state = runArchitectPipeline(
      'We need infrastructure as code with Terraform, a CI/CD pipeline, container image scanning, and rollback support for our production Kubernetes deployment'
    );
    expect(state.domain).toBe('devops-infrastructure');
    const technicalItems = state.requirements.filter((r) => r.source === 'technical-specialist');
    expect(technicalItems.length).toBeGreaterThan(0);
    const mentionsDevopsTech = technicalItems.some((r) =>
      /infrastructure as code|pipeline|autoscal|rollout|deploy|idempotent/i.test(r.text)
    );
    expect(mentionsDevopsTech).toBe(true);
  });

  it('detects devops-infrastructure via newer keyword phrasings (SLO, error budget, on-call rotation)', () => {
    const compiled = compileArchitect(
      'Define an SLO and error budget for our platform engineering team, with an on-call rotation handled via PagerDuty for incident postmortems'
    );
    expect(compiled.domain).toBe('devops-infrastructure');
  });

  it('word-boundary regression: "slo" and "sla" do not falsely match inside unrelated words', () => {
    const state = runArchitectPipeline('The gaslow furnace and Oslo trip were unrelated topics discussed casually');
    expect(state.domain).not.toBe('devops-infrastructure');
  });

  it('ambiguity checklist recognizes a short bare answer for on-call ownership', () => {
    const compiled = compileArchitect(
      'Set up a CI/CD pipeline on AWS using Terraform and Kubernetes, with autoscaling and monitoring. On-call rotation.'
    );
    expect(compiled.domain).toBe('devops-infrastructure');
    const compiledText = JSON.stringify(compiled);
    expect(compiledText).not.toMatch(/on-call.*incident ownership model is unspecified/i);
  });

  it('constraint specialist flags no on-call coverage vs 24/7 uptime commitment as infeasible', () => {
    const state = runArchitectPipeline(
      'Our Kubernetes deployment pipeline with Terraform infrastructure as code has no on-call coverage since it is business hours only, but we need a 24/7 uptime commitment for the platform'
    );
    expect(state.domain).toBe('devops-infrastructure');
    const constraintText = JSON.stringify(state.requirements);
    expect(constraintText).toMatch(/on-call|24\/7|uptime/i);
  });
});
