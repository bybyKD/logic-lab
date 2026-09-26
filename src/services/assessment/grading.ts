import type { Activity, Feedback, Grade, Rubric, Submission } from '../../domain'

/**
 * Grading a submission.
 *
 * Kept pure: it takes a submission, an activity and the teacher's input, and
 * returns new objects. Nothing here reads a repository or touches storage, so
 * every rule below is testable without a browser, and the review screen stays a
 * thin shell over it.
 */

/** What the teacher filled in on the review screen. */
export interface GradeInput {
  /** Criterion id → points. Partial input is allowed; missing criteria score 0. */
  rubricScores?: Record<string, number>
  /** Free-text note saved as teacher feedback. */
  comment?: string
  /**
   * Overrides the auto score. Used when a teacher disagrees with the test
   * result, which happens — a passing program can still be poor work.
   */
  scoreOverride?: number
}

export interface GradeResult {
  submission: Submission
  feedback: Feedback | null
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

/**
 * Points a rubric is worth, or null when the activity has no rubric.
 *
 * Auto-graded activities (a challenge, a quiz) are scored by their own pass/fail,
 * so asking a teacher for a rubric score there would be theatre.
 */
export function rubricMaxPoints(activity: Activity): number | null {
  return activity.rubric ? activity.rubric.maxPoints : null
}

/**
 * The score a submission carries before a teacher touches it.
 *
 * A graded attempt is worth its own score out of 100. Everything the student
 * actually did is already in `submission.score`; re-deriving it here would be a
 * second, subtly different definition.
 */
export function autoScore(submission: Submission, maxScore = 100): number {
  return clamp(submission.score, 0, maxScore)
}

/** Rubric total as a 0–100 percentage, or null when there is no rubric. */
export function rubricPercentage(rubric: Rubric, scores: Record<string, number> | undefined): number | null {
  if (!scores) return null
  const total = rubric.criteria.reduce((sum, criterion) => {
    return sum + clamp(scores[criterion.id] ?? 0, 0, criterion.maxPoints)
  }, 0)
  return rubric.maxPoints === 0 ? 0 : Math.round((total / rubric.maxPoints) * 100)
}

/**
 * Resolves the final score from the teacher's input.
 *
 * Precedence is deliberate: an explicit override beats the rubric, and the rubric
 * beats the auto score. A teacher who picks rubric levels and then also types a
 * score has said what they mean twice; the typed number is the more deliberate of
 * the two.
 */
export function resolveScore(
  submission: Submission,
  activity: Activity,
  input: GradeInput,
): { score: number; maxScore: number; rubricScores?: Record<string, number> } {
  const maxScore = 100

  if (typeof input.scoreOverride === 'number' && !Number.isNaN(input.scoreOverride)) {
    return {
      score: clamp(Math.round(input.scoreOverride), 0, maxScore),
      maxScore,
      rubricScores: normaliseRubricScores(activity.rubric, input.rubricScores),
    }
  }

  if (activity.rubric && input.rubricScores) {
    const percentage = rubricPercentage(activity.rubric, input.rubricScores)
    if (percentage !== null) {
      return {
        score: percentage,
        maxScore,
        rubricScores: normaliseRubricScores(activity.rubric, input.rubricScores),
      }
    }
  }

  return { score: autoScore(submission, maxScore), maxScore }
}

/** Drops unknown criteria and clamps the rest, so a stale form cannot poison a grade. */
function normaliseRubricScores(
  rubric: Rubric | undefined,
  scores: Record<string, number> | undefined,
): Record<string, number> | undefined {
  if (!rubric || !scores) return undefined
  const out: Record<string, number> = {}
  for (const criterion of rubric.criteria) {
    const value = scores[criterion.id]
    if (typeof value === 'number' && !Number.isNaN(value)) {
      out[criterion.id] = clamp(value, 0, criterion.maxPoints)
    }
  }
  return out
}

/**
 * Grades a submission and, when the teacher left a note, the feedback that goes
 * with it.
 *
 * Returns a new submission with `status: 'graded'` rather than mutating, so the
 * caller decides whether to persist. `submission.attemptId` is preserved, which is
 * what keeps a grade traceable back to the code that earned it.
 */
export function gradeSubmission(options: {
  submission: Submission
  activity: Activity
  input: GradeInput
  gradedBy: string
  /** Injected so tests do not depend on the wall clock. */
  now: number
  feedbackId: string
}): GradeResult {
  const { submission, activity, input, gradedBy, now, feedbackId } = options

  const { score, maxScore, rubricScores } = resolveScore(submission, activity, input)

  const grade: Grade = {
    score,
    maxScore,
    gradedBy,
    gradedAt: new Date(now).toISOString(),
    ...(rubricScores ? { rubricScores } : {}),
  }

  const comment = input.comment?.trim()
  const feedback: Feedback | null = comment
    ? {
        id: feedbackId,
        submissionId: submission.id,
        authorId: gradedBy,
        authorRole: 'teacher',
        kind: 'comment',
        body: comment,
        createdAt: grade.gradedAt,
      }
    : null

  return {
    submission: { ...submission, status: 'graded', score, grade },
    feedback,
  }
}

/**
 * Whether a submission is still waiting on a teacher.
 *
 * A submission with no grade counts as waiting even if something set the status,
 * because the status is the thing that can drift.
 */
export function isPending(submission: Submission): boolean {
  return submission.status === 'submitted' || submission.grade === undefined
}
