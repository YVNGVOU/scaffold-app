import type { DomainModule } from '../types.js';

// NOTE: word-boundary matching (not plain substring `includes`) is required
// here, for the same reason documented in domains/game/index.ts (TASK-006)
// and domains/web/index.ts. Bare substring matching let 'multiplayer' match
// 'player', and would similarly let e.g. a bare 'course' match inside
// "intercourse" or 'quiz' inside unrelated tokens — silently inflating scores
// on inputs that have nothing to do with education.
const KEYWORDS = [
  'course', 'curriculum', 'lesson', 'lesson plan', 'syllabus', 'quiz', 'exam',
  'assessment', 'e-learning', 'elearning', 'online course', 'tutorial',
  'student', 'students', 'learner', 'learners', 'classroom', 'teach',
  'teaching', 'instructor', 'training module', 'learning objective',
  'learning objectives', 'flashcards', 'study guide', 'certification program',
  'onboarding training', 'employee training', 'lms', 'learning management system',
  'coursework', 'homework assignment', 'rubric', 'grading', 'gradebook',
  'k-12', 'higher ed', 'higher education', 'MOOC', 'cohort-based course',
  'workshop curriculum', 'test bank', 'question bank', 'lecture notes',
  'instructional design', 'microlearning', 'continuing education',
];

function wordBoundaryRegex(keyword: string): RegExp {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i');
}

const KEYWORD_PATTERNS = KEYWORDS.map((kw) => wordBoundaryRegex(kw));

export const educationDomain: DomainModule = {
  id: 'education',
  label: 'Education',
  score(input: string): number {
    let score = 0;
    for (const pattern of KEYWORD_PATTERNS) {
      if (pattern.test(input)) score += 1;
    }
    return score;
  },
  defaultRequirements: [
    { text: 'Define the target audience and their prior skill level', category: 'functional' },
    { text: 'State clear, measurable learning objectives', category: 'functional' },
    { text: 'Specify the delivery format (self-paced course, live lesson, quiz, etc.)', category: 'constraint' },
    { text: 'Define how learner understanding will be assessed', category: 'preference' },
    { text: 'Define the completion timeline/pacing (self-paced vs. scheduled cohort)', category: 'constraint' },
  ],
  ambiguityChecklist: [
    {
      field: 'skill level',
      description: 'The audience skill level / prerequisite knowledge is unspecified',
      isResolved: (input) => /\b(beginner|intermediate|advanced|novice|no prior experience|prerequisite|skill level|entry.level)\b/i.test(input),
    },
    {
      field: 'learning objectives',
      description: 'What learners should be able to do after completing the content is unspecified',
      isResolved: (input) => /\b(learning objective|learning outcome|able to|will learn|by the end|learning goal)\b/i.test(input),
    },
    {
      field: 'format',
      description: 'The delivery format (course, lesson, quiz, workshop, self-paced) is unspecified',
      isResolved: (input) => /\b(course|lesson|quiz|workshop|self-paced|webinar|module|in-person|instructor-led|asynchronous|synchronous)\b/i.test(input),
    },
    {
      field: 'assessment approach',
      description: 'How learner progress or mastery will be assessed is unspecified',
      isResolved: (input) => /\b(quiz|exam|assessment|grading|rubric|test|graded|pass\/fail|ungraded|no assessment)\b/i.test(input),
    },
    {
      field: 'delivery timeline',
      description: 'The delivery/completion timeline or pacing cadence (self-paced vs. fixed schedule, course length) is unspecified',
      isResolved: (input) => /\b(self-paced|fixed schedule|weekly|daily|(?:\d+\s*[-\s]?week|(?:one|two|three|four)[-\s]?week)|due date|deadline|cohort start|rolling enrollment)\b/i.test(input),
    },
    {
      field: 'completion credential',
      description: 'Whether completing the content grants a credential (certificate, CE credits, badge) is unspecified',
      isResolved: (input) => /\b(certificate|certification|badge|credential|ce credits?|continuing education credit|no certificate)\b/i.test(input),
    },
  ],
  architectureTemplate: [
    { component: 'curriculum outline', dependsOn: [], note: 'Sequenced list of topics/modules mapped to learning objectives' },
    { component: 'lesson content', dependsOn: ['curriculum outline'], note: 'Instructional material (text, video, slides) for each module' },
    { component: 'practice activities', dependsOn: ['lesson content'], note: 'Exercises/labs that reinforce each lesson' },
    { component: 'assessment', dependsOn: ['curriculum outline'], note: 'Quizzes/exams/rubrics that measure mastery of objectives' },
    { component: 'progress tracking', dependsOn: ['assessment'], note: 'Mechanism for tracking learner completion and scores' },
  ],
  technicalConsiderations: [
    { aspect: 'delivery platform', note: 'Choose a delivery platform (LMS, static site, video hosting) suited to the audience and update cadence', category: 'constraints' },
    { aspect: 'content format', note: 'Decide the mix of text, video, and interactive content, and the tooling needed to produce/maintain each', category: 'functionalRequirements' },
    { aspect: 'scoring/grading logic', note: 'Define how quizzes/exams are scored and how results are recorded', category: 'functionalRequirements' },
    { aspect: 'accessibility of media', note: 'Provide captions/transcripts for video and alt text for diagrams so content is usable by all learners', category: 'constraints' },
    { aspect: 'versioning', note: 'Plan how curriculum content is versioned/updated as material becomes outdated', category: 'preferences' },
    { aspect: 'SCORM/xAPI packaging', note: 'If content must run inside a third-party LMS, decide whether it needs SCORM 1.2/2004 or xAPI (Tin Can) packaging for grade/progress reporting to interoperate with that LMS', category: 'constraints' },
    { aspect: 'offline/low-bandwidth access', note: 'Decide whether learners need downloadable/offline access (e.g. video download, printable PDFs) for low-connectivity or field settings', category: 'functionalRequirements' },
  ],
  uxConsiderations: [
    { aspect: 'learning path', note: 'Define a clear, linear or adaptive learning path so learners always know what to do next', category: 'functionalRequirements' },
    { aspect: 'pacing', note: 'Consider self-paced vs. cohort-paced structure and how that affects engagement and completion', category: 'preferences' },
    { aspect: 'feedback loop', note: 'Give learners immediate, actionable feedback after quizzes/exercises rather than a bare score', category: 'functionalRequirements' },
    { aspect: 'progress visibility', note: 'Show learners their progress (percent complete, badges, streaks) to sustain motivation', category: 'preferences' },
    { aspect: 'accessibility', note: 'Support screen readers, adjustable text size, and keyboard navigation for learners with disabilities', category: 'constraints' },
    { aspect: 'cognitive load pacing', note: 'Chunk lessons into short, single-concept units rather than long sessions — attention and retention drop sharply past ~10-15 minutes of continuous instruction', category: 'preferences' },
    { aspect: 're-engagement after a failed attempt', note: 'Define what a learner sees immediately after failing a quiz/exam (retry limits, cooldown, remediation content) rather than a dead-end failure screen', category: 'functionalRequirements' },
  ],
  securityConsiderations: [
    { aspect: 'learner data privacy', note: 'Handle student PII (names, grades, ages) in compliance with applicable regulations (e.g. FERPA/COPPA for minors)', category: 'constraints' },
    { aspect: 'academic integrity', note: 'Define safeguards against quiz/exam cheating (question randomization, time limits, proctoring) if assessment is graded', category: 'preferences' },
    { aspect: 'access control', note: 'Define who can view/edit course content and learner records (instructors vs. students vs. admins)', category: 'constraints' },
    { aspect: 'content authenticity', note: 'Flag unverified or AI-generated source material used in instructional content that has not been fact-checked', category: 'preferences' },
    { aspect: 'minors and parental consent', note: 'If learners include children under 13, require verifiable parental consent before collecting any data and avoid behavioral tracking/advertising (COPPA)', category: 'constraints' },
    { aspect: 'answer key exposure', note: 'Ensure quiz/exam answer keys and grading rubrics are not retrievable client-side (e.g. embedded in page source or API responses) where learners could inspect them before submitting', category: 'constraints' },
  ],
  creativeConsiderations: [
    { aspect: 'engagement design', note: 'Use varied formats (examples, stories, visuals) to keep material engaging rather than a wall of text', category: 'preferences' },
    { aspect: 'tone', note: 'Match tone and reading level to the stated audience (children, professionals, beginners)', category: 'preferences' },
    { aspect: 'visual aids', note: 'Use diagrams/illustrations to clarify complex concepts where text alone would be dense', category: 'preferences' },
    { aspect: 'memorable framing', note: 'Frame lessons around a memorable narrative or running example rather than isolated facts', category: 'preferences' },
    { aspect: 'worked-example progression', note: 'Pair each new concept with a fully worked example before asking learners to apply it unaided, rather than jumping straight to practice', category: 'preferences' },
  ],
  qaConsiderations: [
    { aspect: 'objective coverage', note: 'Verify every stated learning objective is actually taught and actually assessed somewhere in the curriculum', category: 'functionalRequirements' },
    { aspect: 'contradiction check', note: 'Check for contradictions such as "no assessment" alongside "graded certification"', category: 'constraints' },
    { aspect: 'difficulty progression', note: 'Verify lesson difficulty progresses sensibly and does not jump ahead of stated prerequisites', category: 'functionalRequirements' },
    { aspect: 'answer key accuracy', note: 'Verify quiz/exam answer keys are correct and unambiguous', category: 'preferences' },
    { aspect: 'edge cases', note: 'Consider edge cases: a learner who fails repeatedly, incomplete prerequisite knowledge, or accessibility needs not addressed in the spec', category: 'constraints' },
    { aspect: 'stale content drift', note: 'Verify there is a review cadence to catch factually outdated content (e.g. deprecated software versions, changed regulations) before it misleads learners', category: 'preferences' },
    { aspect: 'partial completion / dropout state', note: 'Verify the spec defines what happens to a learner\'s progress and grade if they abandon the course partway through and return weeks later', category: 'functionalRequirements' },
  ],
  constraintConsiderations: [
    {
      aspect: 'timeline vs curriculum depth',
      note: 'A very short delivery timeline (days) alongside a comprehensive, multi-module certification curriculum is a known-infeasible combination — quality instructional design and review takes weeks to months.',
      category: 'constraints',
      triggerA: /\b(by tomorrow|this week|in (?:a|one) day|overnight|asap)\b/i,
      triggerB: /\b(certification program|full curriculum|comprehensive course|multi-module)\b/i,
    },
    {
      aspect: 'no assessment vs graded certification',
      note: 'Stating "no quizzes/assessment" alongside a "graded certificate/certification" is contradictory — a certification implies some measurable proof of mastery.',
      category: 'constraints',
      triggerA: /\bno\s+(?:quizzes|exams|assessments?|testing)\b/i,
      triggerB: /\b(graded certificat\w*|certification program|pass\/fail certificat\w*)\b/i,
    },
    {
      aspect: 'self-paced vs proctored exam',
      note: 'A fully self-paced/asynchronous format alongside a proctored final exam is a known-infeasible combination — proctoring requires either scheduled live sessions or third-party proctoring infrastructure that self-paced-only plans typically don\'t account for.',
      category: 'constraints',
      triggerA: /\b(self-paced|asynchronous only|fully self-paced)\b/i,
      triggerB: /\b(proctored|proctoring)\b/i,
    },
  ],
};
