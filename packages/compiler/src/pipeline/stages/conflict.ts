import type { PipelineState, RequirementCategory } from '../state.js';
import type { RequirementItem } from '@lucid/schema';

/**
 * Stage 9 (formerly the `conflictPassthrough` no-op): real, deterministic,
 * rule-based contradiction detection between different specialists' output.
 * Genuine conflicts are recorded — never silently dropped or auto-resolved —
 * as new RequirementItems with source: 'conflict-engine', kind:
 * 'recommendation' (conflict detection never fabricates user intent, so it
 * never emits kind: 'user'), status: 'pending', and evidence explicitly
 * naming both conflicting specialist sources.
 *
 * Rule (game domain): networked multiplayer vs. authored horror
 * pacing/tension curve.
 *
 * TECHNICAL's game-domain considerations (see
 * packages/compiler/src/domains/game/index.ts) include a "multiplayer
 * networking" constraint; UX's game-domain considerations include a
 * "pacing and tension curve" preference explicitly framed as an
 * information-architecture concern (difficulty ramp / rest beats across
 * levels). These two are in genuine, well-known game-design tension
 * specifically for horror games: a carefully authored solo tension curve
 * (scripted pacing of scares and rest beats) is structurally undercut by
 * live multiplayer networking — other players present can break scripted
 * pacing (rushing ahead of authored beats, voice/text chat puncturing
 * atmosphere), and netcode/latency tradeoffs compete with authored beat
 * timing. This tension does not exist for every game (a purely
 * action-multiplayer game has no authored solo tension curve to undercut),
 * so the rule only fires when the raw input signals BOTH "multiplayer" and
 * "horror" — this keeps it from false-positiving on ordinary game input that
 * mentions multiplayer without a curated horror-pacing concern, or horror
 * input with no multiplayer at all. Both signals are read directly off raw
 * input (not off a specialist decision's `kind`) because every game-domain
 * input always gets *some* multiplayer-networking and pacing decision from
 * TECHNICAL/UX (as a 'recommendation' if unaddressed) — gating on raw-input
 * keyword presence, not decision presence, is what keeps this rule
 * discriminating rather than firing on every game-domain input.
 */
const MULTIPLAYER_SIGNAL = /\bmultiplayer\b/i;
const HORROR_SIGNAL = /\bhorror\b/i;

/**
 * Rule 2 (web domain, TASK-007 verification pass): explicit "no login
 * required" style phrasing vs. SECURITY's own "unsafe assumptions"
 * consideration and UX's "onboarding" consideration.
 *
 * SECURITY's web `securityConsiderations` table (see
 * packages/compiler/src/domains/web/index.ts) already names this exact
 * scenario in its "unsafe assumptions" note text: an implicit "no login
 * required"/"trusted client" assumption that hasn't been explicitly
 * confirmed as intentional. UX's "onboarding" consideration recommends a
 * frictionless first-visit flow (signup, guided tour). When the user's raw
 * input explicitly states no login/account/signup is required, that is a
 * genuine, concrete tension worth surfacing rather than silently letting a
 * frictionless-onboarding recommendation and an unconfirmed no-auth
 * assumption coexist unresolved — this is a classic real access-control vs.
 * convenience tension, not a contrived one, and (like the horror/multiplayer
 * rule) it is gated on an explicit raw-input signal so it only fires when
 * the user actually said something that makes the tension concrete, not on
 * every web-domain input that happens to get an "onboarding" or "unsafe
 * assumptions" recommendation by default.
 */
const NO_AUTH_SIGNAL = /\bno\s+(?:login|signup|sign-up|account)\b|\bwithout\s+(?:an?\s+)?(?:login|signup|sign-up|account)\b/i;

export function conflict(state: PipelineState): PipelineState {
  const findings: RequirementItem[] = [];
  const findingCategories: RequirementCategory[] = [];

  if (state.domain === 'web' && NO_AUTH_SIGNAL.test(state.rawInput)) {
    const securityDecision = state.decisions.find(
      (d) =>
        d.type === 'requirement' &&
        d.item.source === 'security-specialist' &&
        d.item.text.toLowerCase().includes('unsafe assumptions')
    );
    const uxDecision = state.decisions.find(
      (d) =>
        d.type === 'requirement' &&
        d.item.source === 'ux-specialist' &&
        d.item.text.toLowerCase().includes('"onboarding"')
    );

    if (securityDecision?.type === 'requirement' && uxDecision?.type === 'requirement') {
      findings.push({
        text:
          'Potential conflict: the stated "no login required" intent conflicts with SECURITY\'s unsafe-assumptions ' +
          'flag on unconfirmed no-auth/trusted-client assumptions, while UX is separately recommending a ' +
          'frictionless first-visit onboarding flow. Needs an explicit resolution (confirm no-auth is intentional ' +
          'and scope what stays public vs. gated, or add lightweight auth) — not silently picked for you.',
        kind: 'recommendation',
        source: 'conflict-engine',
        confidence: 0.6,
        evidence: [
          `security-specialist: ${securityDecision.item.text}`,
          `ux-specialist: ${uxDecision.item.text}`,
          'trigger: raw input explicitly states no login/signup/account required',
        ],
        status: 'pending',
      });
      findingCategories.push('constraints');
    }
  }

  if (state.domain === 'game' && MULTIPLAYER_SIGNAL.test(state.rawInput) && HORROR_SIGNAL.test(state.rawInput)) {
    const technicalDecision = state.decisions.find(
      (d) =>
        d.type === 'requirement' &&
        d.item.source === 'technical-specialist' &&
        d.item.text.toLowerCase().includes('multiplayer networking')
    );
    const uxDecision = state.decisions.find(
      (d) =>
        d.type === 'requirement' &&
        d.item.source === 'ux-specialist' &&
        d.item.text.toLowerCase().includes('pacing and tension curve')
    );

    if (technicalDecision?.type === 'requirement' && uxDecision?.type === 'requirement') {
      findings.push({
        text:
          'Potential conflict: TECHNICAL\'s multiplayer networking consideration structurally tensions with UX\'s ' +
          'authored horror pacing/tension curve — a networked multiplayer session is hard to reconcile with a single ' +
          'scripted tension curve (other players can break authored pacing, and netcode/latency tradeoffs compete ' +
          'with authored beat timing). Needs an explicit resolution (e.g. per-mode pacing design, or scoping ' +
          'multiplayer out of the scripted horror path) — not silently picked for you.',
        kind: 'recommendation',
        source: 'conflict-engine',
        confidence: 0.6,
        evidence: [
          `technical-specialist: ${technicalDecision.item.text}`,
          `ux-specialist: ${uxDecision.item.text}`,
          'trigger: raw input mentions both "multiplayer" and "horror"',
        ],
        status: 'pending',
      });
      findingCategories.push('constraints');
    }
  }

  return {
    ...state,
    requirements: [...state.requirements, ...findings],
    requirementCategories: [...state.requirementCategories, ...findingCategories],
    stagesRun: [...state.stagesRun, 'conflict'],
  };
}
