import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, same discipline as domains/web/index.ts and domains/roblox/index.ts
// (TASK-006 'multiplayer'/'player' bug). Bare substring matching would let
// e.g. 'rep' match inside unrelated words, or 'run' match inside 'running'
// twice — word boundaries prevent that class of misclassification.
const KEYWORDS = [
  'workout', 'workout plan', 'training program', 'training plan',
  'fitness app', 'fitness tracker', 'exercise program', 'exercise routine',
  'strength training', 'resistance training', 'hypertrophy', 'powerlifting',
  'weightlifting', 'bodybuilding', 'crossfit', 'cardio', 'hiit',
  'personal trainer', 'athlete', 'sports team', 'sports league',
  'reps and sets', 'rep max', 'one-rep max', '1rm', 'progressive overload',
  'heart rate zone', 'vo2 max', 'macros', 'calorie tracker',
  'wearable', 'fitbit', 'garmin', 'strava', 'running app', 'marathon training',
  'injury prevention', 'rehab program', 'physical therapy', 'nutrition plan',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const sportsFitnessDomain: DomainModule = {
  id: 'sports-fitness',
  label: 'Sports / Fitness',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Support structured workout/training program design (exercises, sets, reps, rest periods, progression scheme)', category: 'functional' },
    { text: 'Track user metrics over time (weight lifted, distance, pace, heart rate, body measurements) with historical trend views', category: 'functional' },
    { text: 'Surface injury/safety guidance (proper form cues, contraindications, rest/deload recommendations) rather than only raw prescriptions', category: 'constraint' },
    { text: 'Distinguish athlete/competitive users from casual/general-fitness users in program intensity and terminology', category: 'preference' },
    { text: 'Include a clear disclaimer that the app does not replace medical or physical-therapy advice', category: 'constraint' },
    { text: 'Support offline logging during a workout with sync once connectivity returns', category: 'preference' },
  ],
  ambiguityChecklist: [
    {
      field: 'user skill level',
      description: 'Target user population (beginner, recreational, competitive athlete, coached team) is unspecified',
      isResolved: (input) => /\b(beginner|novice|recreational|intermediate|advanced|competitive|athlete|elite)\b/i.test(input),
    },
    {
      field: 'training modality',
      description: 'Primary training modality (strength, endurance/running, team sport, group class, general fitness) is unspecified',
      isResolved: (input) => /\b(strength\s+training|resistance\s+training|running|endurance|team\s+sport|group\s+class|crossfit|yoga|cardio)\b/i.test(input),
    },
    {
      field: 'tracked metrics',
      description: 'Which metrics must be tracked (reps/sets/weight, distance/pace, heart rate, body composition) is unspecified',
      isResolved: (input) => /\b(reps?\s+and\s+sets?|1rm|one-rep\s+max|heart\s+rate|vo2\s*max|body\s+composition|pace|distance)\b/i.test(input),
    },
    {
      field: 'wearable/device integration',
      description: 'Whether the product integrates with wearables or third-party fitness platforms (Fitbit, Garmin, Strava, Apple Health) is unspecified',
      isResolved: (input) => /\b(fitbit|garmin|strava|apple\s+health|google\s+fit|wearable|smartwatch)\b/i.test(input),
    },
    {
      field: 'injury/medical liability posture',
      description: 'Whether the product gives prescriptive medical/rehab guidance vs general fitness guidance (affects liability and disclaimer requirements) is unspecified',
      isResolved: (input) => /\b(rehab\w*|physical\s+therapy|physio|medical\s+advice|injury\s+prevention|liability|disclaimer)\b/i.test(input),
    },
    {
      field: 'coach/trainer involvement',
      description: 'Whether a human coach/trainer assigns and reviews programs, or the app is fully self-directed, is unspecified',
      isResolved: (input) => /\b(personal\s+trainer|coach\w*|trainer[- ]?assigned|self[- ]?directed|self[- ]?guided)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'workout/program builder', dependsOn: [], note: 'Structured data model for exercises, sets, reps, weight/intensity, rest intervals, and progression rules across a multi-week program' },
    { component: 'exercise library', dependsOn: [], note: 'Catalog of exercises with form cues, target muscle groups, equipment needs, and video/image demonstrations' },
    { component: 'metrics/logging service', dependsOn: ['workout/program builder'], note: 'Captures per-session logged sets, distance/pace, heart rate, and body metrics; stores time-series data for trend analysis' },
    { component: 'wearable/device integration layer', dependsOn: ['metrics/logging service'], note: 'Syncs with Apple Health, Google Fit, Fitbit, Garmin, or Strava APIs for automatic activity and heart-rate ingestion' },
    { component: 'progress dashboard', dependsOn: ['metrics/logging service'], note: 'Visualizes trends (strength progression, pace improvement, weekly volume) and highlights plateaus or regressions' },
    { component: 'program progression engine', dependsOn: ['workout/program builder', 'metrics/logging service'], note: 'Applies progressive-overload or periodization rules to auto-adjust future sessions based on logged performance' },
    { component: 'coach/athlete assignment layer', dependsOn: ['workout/program builder'], note: 'If a coach assigns programs to athletes, models the coach-athlete relationship, program review, and feedback loop' },
    { component: 'safety/injury guardrails module', dependsOn: ['workout/program builder'], note: 'Flags contraindicated exercises for reported injuries, enforces rest-day minimums, and surfaces deload recommendations' },
    { component: 'nutrition/recovery tracking (optional)', dependsOn: ['metrics/logging service'], note: 'Macro/calorie logging and recovery indicators (sleep, soreness) if the product scope includes nutrition' },
    { component: 'notifications/reminders engine', dependsOn: ['workout/program builder'], note: 'Session reminders, streak nudges, and rest-day/deload alerts to support adherence' },
  ],
  technicalConsiderations: [
    { aspect: 'wearable API integration', note: 'Integrate with Apple HealthKit, Google Fit, Garmin Connect, Fitbit Web API, or Strava API for automatic activity/heart-rate sync, each with distinct auth flows (OAuth) and rate limits', category: 'functionalRequirements' },
    { aspect: 'time-series metric storage', note: 'Store logged workout/performance data as time-series (per-set, per-session) to support trend charts and progression calculations efficiently, not as flat unindexed logs', category: 'functionalRequirements' },
    { aspect: 'offline-first logging', note: 'Support logging a workout with no connectivity (gym basements, trail runs) and syncing once back online, since athletes frequently train in low-signal environments', category: 'functionalRequirements' },
    { aspect: 'unit system handling', note: 'Support both metric (kg, km) and imperial (lb, mi) units consistently across logging, display, and stored data, converting rather than duplicating records', category: 'functionalRequirements' },
    { aspect: 'GPS/route tracking accuracy', note: 'For running/cycling features, account for GPS drift and battery drain trade-offs when sampling location at high frequency', category: 'constraints' },
    { aspect: 'progression algorithm design', note: 'Define the periodization/progressive-overload logic (linear, undulating, autoregulated) explicitly rather than leaving auto-progression as an unspecified black box', category: 'functionalRequirements' },
    { aspect: 'exercise database licensing', note: 'Clarify whether exercise demo media/data comes from a licensed third-party library or must be produced in-house', category: 'constraints' },
    { aspect: 'device sync conflict resolution', note: 'Define how conflicting data from multiple sources (manual entry vs wearable sync) is reconciled to avoid duplicate or contradictory logged sessions', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'in-workout logging speed', note: 'Minimize taps/screens needed to log a set mid-workout — users are often sweaty, out of breath, or between sets on a timer', category: 'constraints' },
    { aspect: 'rest timer visibility', note: 'Surface rest timers prominently (large text, audio/haptic cues) so users can glance from across the gym floor', category: 'functionalRequirements' },
    { aspect: 'progress visualization clarity', note: 'Present strength/endurance trends as clear charts (e.g. estimated 1RM over time, weekly mileage) rather than raw logged numbers alone', category: 'preferences' },
    { aspect: 'beginner vs athlete UI complexity', note: 'Avoid overwhelming a casual/beginner user with athlete-level metrics (RPE, %1RM, periodization phase) by default; expose advanced fields progressively', category: 'preferences' },
    { aspect: 'onboarding fitness assessment', note: 'Collect baseline fitness level, goals, and available equipment during onboarding to tailor the initial program rather than assuming a generic starting point', category: 'functionalRequirements' },
    { aspect: 'motivational feedback loops', note: 'Use streaks, PRs (personal records), and milestone celebrations to reinforce adherence without becoming guilt-inducing when a session is missed', category: 'preferences' },
    { aspect: 'accessible exercise demonstrations', note: 'Pair video demonstrations with text-based form cues and captions so the guidance is usable without sound and accessible to users with visual/hearing impairments', category: 'constraints' },
  ],
  securityConsiderations: [
    { aspect: 'health data sensitivity', note: 'Treat heart rate, body composition, and injury/medical fields as sensitive personal data requiring encryption at rest and in transit, and minimal third-party sharing', category: 'constraints' },
    { aspect: 'wearable OAuth token handling', note: 'Store third-party wearable API tokens (Fitbit, Garmin, Strava, HealthKit) securely and support revocation when a user disconnects an integration', category: 'constraints' },
    { aspect: 'location data from GPS tracking', note: 'Treat recorded running/cycling routes as sensitive location data (can reveal home address via route start/end points); allow users to obscure start/end points before sharing publicly', category: 'constraints' },
    { aspect: 'coach access to athlete data', note: 'Scope coach/trainer visibility into athlete data explicitly (which metrics, which time range) rather than granting blanket access, and let athletes revoke coach access', category: 'functionalRequirements' },
    { aspect: 'regulatory data classification', note: 'Determine whether health/fitness data collected falls under HIPAA (if paired with clinical/rehab features) or general consumer privacy law, since obligations differ materially', category: 'constraints' },
    { aspect: 'public profile leakage', note: 'Default social/leaderboard features to private or friends-only, since public workout logs can reveal daily routine, home gym location, or injury status', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'motivational tone', note: 'Set a tone (aggressive/competitive vs supportive/encouraging) consistent with the target audience — competitive athletes and casual beginners respond to very different voice and visual energy', category: 'preferences' },
    { aspect: 'data visualization style', note: 'Design progress charts and dashboards to feel energizing and clear rather than clinical/spreadsheet-like, while still being accurate', category: 'preferences' },
    { aspect: 'exercise demonstration production', note: 'Decide on demonstration format (illustrated diagrams, short looping video, motion-capture animation) balancing production cost against clarity of form guidance', category: 'preferences' },
    { aspect: 'brand identity across sport verticals', note: 'If covering multiple sports/training styles, keep a consistent visual system while allowing sport-specific accent elements (e.g. running vs lifting iconography)', category: 'preferences' },
    { aspect: 'achievement and reward visuals', note: 'Design badges, PR celebrations, and milestone moments that feel earned and specific to the activity rather than generic gamification stickers', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'progression calculation correctness', note: 'Test progressive-overload/periodization math (e.g. 1RM estimation formulas, next-session weight suggestions) against known reference values for correctness', category: 'functionalRequirements' },
    { aspect: 'wearable sync edge cases', note: 'Test behavior when a wearable sync fails, returns partial data, or reports conflicting metrics with manually logged data', category: 'functionalRequirements' },
    { aspect: 'unit conversion accuracy', note: 'Test metric/imperial conversions (weight, distance, pace) for rounding and consistency across logging, storage, and display', category: 'functionalRequirements' },
    { aspect: 'offline logging sync integrity', note: 'Test that workouts logged offline sync correctly without duplication or data loss once connectivity returns', category: 'functionalRequirements' },
    { aspect: 'injury flag enforcement', note: 'Test that reported injuries/contraindications actually suppress or flag conflicting exercise prescriptions rather than being cosmetic-only fields', category: 'constraints' },
    { aspect: 'edge-case metric values', note: 'Test extreme/invalid inputs (zero reps, negative weight, implausible heart rate) are rejected or flagged rather than silently accepted and corrupting trend data', category: 'functionalRequirements' },
    { aspect: 'cross-device consistency', note: 'Verify logged data and progress views stay consistent when a user logs a session on mobile and reviews it on web/desktop', category: 'preferences' },
  ],
  constraintConsiderations: [
    {
      aspect: 'medical/rehab claims vs no clinical oversight',
      note: 'Offering rehab/physical-therapy-grade prescriptive guidance without licensed clinical oversight is a liability and regulatory risk — such features typically require involvement of licensed professionals or clear scope limitation to general fitness guidance.',
      category: 'constraints',
      triggerA: /\b(rehab\w*|physical\s+therapy|physio|medical\s+diagnos\w*)\b/i,
      triggerB: /\b(no\s+(?:clinical|medical)\s+(?:oversight|review|professional)|self[- ]?directed\s+only|without\s+a\s+doctor)\b/i,
    },
    {
      aspect: 'timeline vs full wearable ecosystem integration',
      note: 'An extremely short delivery timeline alongside integrating multiple wearable ecosystems (Apple Health, Garmin, Fitbit, Strava) simultaneously is high-risk — each integration has its own OAuth flow, data model, and approval process that individually take real time to implement and certify.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(fitbit|garmin|strava|apple\s+health).{0,40}(fitbit|garmin|strava|apple\s+health)/i,
    },
    {
      aspect: 'elite athlete precision vs casual-app budget',
      note: 'Claiming elite-athlete-grade precision (VO2 max lab-accuracy, competition-ready periodization) on a minimal/casual-app budget is unrealistic — sports-science-grade accuracy typically requires validated sensors and methodology beyond typical consumer wearable data.',
      category: 'constraints',
      triggerA: /\b(no\s+budget|minimal\s+budget|shoestring\s+budget|casual\s+app)\b/i,
      triggerB: /\b(elite[- ]?athlete|lab[- ]?accurate|competition[- ]?grade|professional[- ]?grade\s+vo2)\b/i,
    },
  ],
};
