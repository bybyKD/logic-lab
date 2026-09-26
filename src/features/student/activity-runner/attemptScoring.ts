import type { LanguageId } from '../../../data/languages'
import {
  type Activity,
  type Attempt,
  type ChallengeActivity,
  type TestOutcome,
} from '../../../domain'
import { scoreOutcomes } from '../../../services/execution'
import { detectMisconception } from '../../../services/learning/misconceptionDetector'

/**
 * The answer a learner is submitting, in whatever shape the variant needs.
 *
 * Kept as one optional-field bag rather than a union so a component can hand over
 * whatever it collected without branching, and so the scoring functions below can
 * each ignore the fields that are not theirs.
 */
export interface RunnerAnswer {
  /** Code lab. */
  language?: LanguageId
  code?: string
  outcomes?: TestOutcome[]
  /** Single-answer challenge: choose, predict, debug. */
  choiceId?: string
  /** Ordered step ids for an algorithm challenge. */
  sequence?: readonly string[]
  /** 1-based line picked in a debug challenge, for the Attempt's own record. */
  selectedLines?: number[]
}

export interface ScoredAnswer {
  /** 0–100. */
  score: number
  passed: boolean
}

/**
 * Score a code lab, or return null when nothing could be scored.
 *
 * Null matters: a run the prototype cannot evaluate is not a zero. Recording 0
 * would put a false failure into mastery and into the teacher's gradebook, so
 * the caller must not record an attempt at all.
 */
export function scoreCodeLab(outcomes: readonly TestOutcome[]): number | null {
  return scoreOutcomes([...outcomes])
}

/**
 * Score a challenge variant.
 *
 * `null` means "not answered yet", which the runner treats the same as an
 * incomplete answer: the submit button stays disabled rather than recording a
 * blank attempt.
 */
export function scoreChallenge(
  activity: ChallengeActivity,
  answer: RunnerAnswer,
): number | null {
  if (activity.challengeType === 'algorithm') {
    if (!answer.sequence) return null
    return scoreOrdering(answer.sequence, activity.choices.map((c) => c.id))
  }
  if (!answer.choiceId) return null
  return answer.choiceId === activity.correctChoiceId ? 100 : 0
}

/**
 * Partial credit for an ordering exercise, by position.
 *
 * A learner who gets four of five steps in the right place has understood most of
 * the algorithm, and a bare 0 would throw that away. Positions are compared from
 * the front, so getting the first step right is worth more than the last, which
 * matches how a program fails once something is out of order.
 */
export function scoreOrdering(
  chosen: readonly string[],
  solution: readonly string[],
): number {
  if (solution.length === 0) return 0
  const comparable = Math.min(chosen.length, solution.length)
  let hits = 0
  for (let i = 0; i < comparable; i += 1) {
    if (chosen[i] === solution[i]) hits += 1
  }
  return Math.round((hits / solution.length) * 100)
}

/**
 * The line a debug challenge's answer points at, if any.
 *
 * A debug answer is a line number, but the activity stores its correct answer as
 * a choice id, so the runner has to be able to report back which line the
 * learner actually picked for the Attempt record.
 */
export function selectedLinesFor(
  activity: ChallengeActivity,
  choiceId: string | undefined,
): number[] | undefined {
  if (activity.challengeType !== 'debug' || !choiceId) return undefined
  const choice = activity.choices.find((c) => c.id === choiceId)
  if (!choice) return undefined
  const line = Number.parseInt(choice.label.replace(/^L/i, ''), 10)
  return Number.isNaN(line) ? undefined : [line]
}

export interface BuildAttemptInput extends RunnerAnswer {
  activity: Activity
  studentId: string
  attemptId: string
  /** Injected so a test can pin the clock; `Date.now()` at the call site. */
  now: number
  durationMs: number
  /** Ids of hints revealed before submitting. Feeds the mastery hint penalty. */
  hintsUsed: readonly string[]
  score: number
}

/**
 * Assemble the `Attempt` — the atomic unit of evidence the rest of the app reads.
 *
 * The misconception tag is resolved here rather than in the component, so a code
 * lab and a challenge cannot drift apart in how they are classified.
 */
export function buildAttempt(input: BuildAttemptInput): Attempt {
  const { activity } = input
  const attempt: Attempt = {
    id: input.attemptId,
    activityId: activity.id,
    studentId: input.studentId,
    kind: activity.kind,
    submittedAt: new Date(input.now).toISOString(),
    passed: input.score === 100,
    score: input.score,
    durationMs: input.durationMs,
    hintsUsed: [...input.hintsUsed],
  }

  if (input.language !== undefined) attempt.language = input.language
  if (input.code !== undefined) attempt.code = input.code
  if (input.choiceId !== undefined) attempt.choiceId = input.choiceId
  if (input.selectedLines !== undefined) attempt.selectedLines = input.selectedLines

  if (activity.kind === 'challenge') {
    const lines = selectedLinesFor(activity, input.choiceId)
    if (lines) attempt.selectedLines = lines
  }

  // Only code carries a misconception: a challenge has no code to read.
  if (input.code !== undefined) {
    const misconceptionId = detectMisconception({
      code: input.code,
      outcomes: input.outcomes ?? [],
    })
    if (misconceptionId) attempt.misconceptionId = misconceptionId
  }

  return attempt
}

/**
 * A stable, collision-resistant id for a new attempt or submission.
 *
 * Ids are caller-minted because the repositories upsert by id and nothing in the
 * codebase owns id generation. The clock alone would collide on two submits
 * inside the same millisecond, so a monotonic counter is mixed in.
 */
let sequence = 0
export function nextRecordId(prefix: string, now: number): string {
  sequence += 1
  return `${prefix}-${now.toString(36)}-${sequence.toString(36)}`
}

/** Test seam so id tests do not depend on counter state. */
export function resetRecordIdSequence(): void {
  sequence = 0
}
