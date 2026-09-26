import type { Activity, Attempt, ChallengeActivity, Feedback, Submission } from '../../domain'
import { ACTIVITIES } from './course'
import { DEFAULT_STUDENT_ID, ENROLLMENTS, PRIMARY_TEACHER_ID } from './people'
import { mulberry32, pick } from './random'

/**
 * Seeded learning history.
 *
 * This is what the teacher classroom screen (§16) actually reads. Every number
 * it shows — 42 enrolled, the completed / struggling / not-started split, the
 * completion rate, the common issue — is computed from these records, not
 * written down anywhere.
 *
 * Timestamps are relative to `now` at call time rather than absolute, so the
 * classroom still looks like an active class whenever the prototype is opened.
 * A fixed date would let the 14-day recency decay in `mastery.ts` drain every
 * score to zero weeks after the demo was written.
 */

const DAY_MS = 86_400_000
const SEED = 20260216

/** The activity the class is currently working on (§16 "Conditional Logic Challenge"). */
export const FOCUS_ACTIVITY_ID = 'act-s04-c8'

/** Cohort shape from the plan. Derived at runtime, asserted by the seed test. */
export const COHORT_PLAN = { completed: 29, struggling: 8, notStarted: 5 } as const

/** Sections a student works through before reaching the focus activity. */
const EARLY_SECTION_IDS = ['sec-01', 'sec-02', 'sec-03']

const CODE_LAB_AGE = 'act-s04-cl-age'

const CORRECT_AGE_CODE = `age = 18

if age >= 18:
    print("Dewasa")
else:
    print("Remaja")`

/** Prints the right answer, but the condition is an assignment, not a test. */
const ASSIGNMENT_AGE_CODE = `age = 18

if age = 18:
    print("Dewasa")
else:
    print("Remaja")`

/** Right logic, wrong boundary: 18 itself falls into the else branch. */
const BOUNDARY_AGE_CODE = `age = 18

if age > 18:
    print("Dewasa")
else:
    print("Remaja")`

const activityById = new Map(ACTIVITIES.map((a) => [a.id, a]))

function activity(id: string): Activity {
  const found = activityById.get(id)
  if (!found) throw new Error(`seed references unknown activity: ${id}`)
  return found
}

function challengesIn(sectionIds: string[]): ChallengeActivity[] {
  return ACTIVITIES.filter(
    (a): a is ChallengeActivity => a.kind === 'challenge' && sectionIds.includes(a.sectionId),
  )
}

interface AttemptSeed {
  studentId: string
  activity: Activity
  passed: boolean
  score: number
  daysAgo: number
  hintsUsed?: number
  choiceId?: string
  code?: string
  misconceptionId?: string
  language?: string
  durationMs?: number
}

function toAttempt(seed: AttemptSeed, index: number, now: number): Attempt {
  const submittedAt = new Date(now - seed.daysAgo * DAY_MS - index * 90_000).toISOString()
  return {
    id: `att-${seed.studentId}-${seed.activity.id}-${index}`,
    activityId: seed.activity.id,
    studentId: seed.studentId,
    kind: seed.activity.kind,
    submittedAt,
    language: seed.language,
    code: seed.code,
    choiceId: seed.choiceId,
    passed: seed.passed,
    score: seed.score,
    durationMs: seed.durationMs ?? 60_000 + (index * 7_000) % 120_000,
    hintsUsed: Array.from({ length: seed.hintsUsed ?? 0 }, (_, h) => `${seed.activity.id}-h${h + 1}`),
    misconceptionId: seed.misconceptionId,
  }
}

/**
 * Builds the whole class history. Called with an injected `now` so tests are
 * deterministic; module scope calls it with the real clock.
 */
export function buildSeedAttempts(now: number): Attempt[] {
  const random = mulberry32(SEED)
  const earlyChallenges = challengesIn(EARLY_SECTION_IDS)
  const focus = activity(FOCUS_ACTIVITY_ID) as ChallengeActivity
  const codeLab = activity(CODE_LAB_AGE)
  const seeds: AttemptSeed[] = []

  const enrolled = ENROLLMENTS.map((e) => e.studentId)
  const completedIds = enrolled.slice(0, COHORT_PLAN.completed)
  const strugglingIds = enrolled.slice(
    COHORT_PLAN.completed,
    COHORT_PLAN.completed + COHORT_PLAN.struggling,
  )
  // The remaining COHORT_PLAN.notStarted students are enrolled and have no
  // attempts at all, which is what puts them in the not-started bucket.

  // ---- Students who have started: history through the early sections ----
  // These are multiple-choice challenges: no code, so no misconception is tagged.
  // Naming a cause we cannot see in the submission would be a guess, and the
  // classroom panel is only worth building if its claims are evidence-backed.
  const startedIds = [...completedIds, ...strugglingIds]
  startedIds.forEach((studentId, i) => {
    earlyChallenges.forEach((challenge, k) => {
      // A minority of students are genuinely shaky and get some wrong.
      const weak = i % 7 === 3
      const failedOnce = weak && k % 2 === 1
      seeds.push({
        studentId,
        activity: challenge,
        passed: !failedOnce,
        score: failedOnce ? 40 : 100,
        daysAgo: 21 - k * 2,
        hintsUsed: failedOnce ? 1 : 0,
        choiceId: failedOnce
          ? pick(
              random,
              challenge.choices
                .filter((c) => c.id !== challenge.correctChoiceId)
                .map((c) => c.id),
            )
          : challenge.correctChoiceId,
      })
    })
  })

  // ---- Code lab: where the class's real mistakes are visible ----
  // Every student who has started has attempted it, and it is the only place a
  // misconception is *provable*: the source is right here. The `=` variant even
  // passes the visible test, which is exactly why the classroom reports
  // misconceptions on passing submissions as well as failing ones.
  const labStudents = [...completedIds, ...strugglingIds]
  labStudents.forEach((studentId, i) => {
    // Weighted so the assignment slip is the plurality: it is the mistake this
    // lab exists to surface, and §16's headline "common issue".
    const variant = i % 4
    const code =
      variant === 0
        ? CORRECT_AGE_CODE
        : variant === 1 || variant === 3
          ? ASSIGNMENT_AGE_CODE
          : BOUNDARY_AGE_CODE

    seeds.push({
      studentId,
      activity: codeLab,
      passed: true,
      score: variant === 0 ? 100 : 70,
        daysAgo: 1.5 + (i % 3) * 0.5,
        hintsUsed: variant === 0 ? 0 : 1,
      code,
      language: 'python',
      misconceptionId:
        variant === 0 ? undefined : variant === 2 ? 'strict-boundary' : 'assignment-in-condition',
    })
  })

  // ---- Focus activity ----
  // Recent, on purpose: the teacher header reports submissions in the last 24
  // hours, and a class demo that reads "0" is not showing an active class.
  completedIds.forEach((studentId, i) => {
    seeds.push({
      studentId,
      activity: focus,
      passed: true,
      score: 100,
      daysAgo: 0.15 + (i % 3) * 0.3,
      hintsUsed: i % 6 === 0 ? 1 : 0,
      choiceId: focus.correctChoiceId,
    })
  })

  const wrongChoices = focus.choices.filter((c) => c.id !== focus.correctChoiceId).map((c) => c.id)
  strugglingIds.forEach((studentId, i) => {
    const attempts = 2 + (i % 2)
    for (let n = 0; n < attempts; n += 1) {
      const last = n === attempts - 1
      seeds.push({
        studentId,
        activity: focus,
        passed: false,
        score: 30 + n * 10,
        daysAgo: 0.5 + n * 0.75,
        hintsUsed: last ? 1 : 0,
        choiceId: pick(random, wrongChoices),
        // Untagged: which distractor someone picked does not establish a cause.
      })
    }
  })

  // ---- A few students are already blocked on loops, further along ----
  // Untagged for the same reason: a wrong distractor on a challenge is not proof
  // of an off-by-one. The detector earns that tag in Phase 5, from real code.
  const loopStrugglers = completedIds.filter((_, i) => i % 9 === 4).slice(0, 5)
  const loopChallenges = challengesIn(['sec-05'])
  loopStrugglers.forEach((studentId, i) => {
    const challenge = loopChallenges[i % Math.max(1, loopChallenges.length)]
    if (!challenge) return
    seeds.push({
      studentId,
      activity: challenge,
      passed: false,
      score: 50,
      daysAgo: 1,
      choiceId: pick(
        random,
        challenge.choices.filter((c) => c.id !== challenge.correctChoiceId).map((c) => c.id),
      ),
    })
  })

  // ---- The signed-in learner gets a visible trail of teacher feedback ----
  if (DEFAULT_STUDENT_ID && completedIds.includes(DEFAULT_STUDENT_ID)) {
    seeds.push({
      studentId: DEFAULT_STUDENT_ID,
      activity: focus,
      passed: true,
      score: 100,
      daysAgo: 2,
      choiceId: focus.correctChoiceId,
    })
  }

  return seeds.map((seed, i) => toAttempt(seed, i, now))
}

export function buildSeedSubmissions(attempts: Attempt[]): Submission[] {
  const graded = attempts.filter((a) => a.passed)
  return graded.map((attempt, i) => {
    // A handful stay ungraded so the teacher's review queue is not empty.
    const pending = i % 9 === 4
    return {
      id: `sub-${attempt.id}`,
      activityId: attempt.activityId,
      studentId: attempt.studentId,
      attemptId: attempt.id,
      status: pending ? 'submitted' : 'graded',
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      grade: pending
        ? undefined
        : {
            score: attempt.score,
            maxScore: 100,
            gradedBy: PRIMARY_TEACHER_ID,
            gradedAt: new Date(Date.parse(attempt.submittedAt) + 3_600_000).toISOString(),
          },
    }
  })
}

const FEEDBACK_BODIES = [
  'Good reasoning on the boundary. Next, write the boundary value down before you decide which branch it takes.',
  'Your condition reads like an instruction, not a question. Try `==` for equality and check what a test with a different value does.',
  'Nice catch on the accumulator — you initialised it before the loop. That is the habit to keep.',
  'The loop runs one time too many. Count the values first, then write the bound.',
  'Solid explanation. Try rewriting this in a second language to see the same logic in different syntax.',
]

export function buildSeedFeedback(submissions: Submission[], now: number): Feedback[] {
  const graded = submissions.filter((s) => s.status === 'graded' && s.grade)
  return graded
    .filter((_, i) => i % 11 === 3)
    .slice(0, FEEDBACK_BODIES.length)
    .map((submission, i) => ({
      id: `fb-${submission.id}`,
      submissionId: submission.id,
      authorId: PRIMARY_TEACHER_ID,
      authorRole: 'teacher' as const,
      kind: 'comment' as const,
      body: FEEDBACK_BODIES[i],
      createdAt: new Date(now - (1 + i) * DAY_MS).toISOString(),
    }))
}

export const SEED_ATTEMPTS = buildSeedAttempts(Date.now())
export const SEED_SUBMISSIONS = buildSeedSubmissions(SEED_ATTEMPTS)
export const SEED_FEEDBACK = buildSeedFeedback(SEED_SUBMISSIONS, Date.now())
