import type { Activity, Student, Submission } from '../../domain'
import { isPending } from '../assessment/grading'

/**
 * The teacher's review queue.
 *
 * "Assignments" in this prototype are the activities that actually have student
 * submissions — there is no separate `Assignment` entity, because the domain does
 * not have one and inventing it would mean a second thing that can disagree with
 * `Submission.activityId`. An activity nobody has submitted has nothing to review.
 */

export interface QueueItem {
  submission: Submission
  student: Student
  activity: Activity
  /** Whole days since the submission landed, for a "waiting 3 days" column. */
  waitingDays: number
  /** Does the submission carry something a teacher can run tests on. */
  runnable: boolean
}

export interface AssignmentSummary {
  activity: Activity
  total: number
  pending: number
  graded: number
  /** Mean of graded scores, or null when nothing is graded yet. */
  averageScore: number | null
  lastSubmittedAt: string | null
}

export interface ReviewQueue {
  /** One entry per activity with at least one submission. */
  assignments: AssignmentSummary[]
  /** Every submission still waiting, oldest first. */
  pending: QueueItem[]
  totals: {
    activities: number
    submissions: number
    pending: number
    graded: number
  }
}

const dayMs = 86_400_000

/** Activities whose submissions can be re-run through the execution service. */
export function isRunnable(activity: Activity): boolean {
  return activity.kind === 'codeLab' || activity.kind === 'assignment'
}

export function buildReviewQueue(options: {
  activities: Activity[]
  students: Student[]
  submissions: Submission[]
  now: number
}): ReviewQueue {
  const { activities, students, submissions, now } = options

  const activityById = new Map(activities.map((a) => [a.id, a]))
  const studentById = new Map(students.map((s) => [s.id, s]))

  // Submissions pointing at content that no longer exists are dropped rather than
  // rendered as a row with a blank title.
  const live = submissions.filter((s) => activityById.has(s.activityId) && studentById.has(s.studentId))

  const byActivity = new Map<string, Submission[]>()
  for (const submission of live) {
    const list = byActivity.get(submission.activityId) ?? []
    list.push(submission)
    byActivity.set(submission.activityId, list)
  }

  const assignments: AssignmentSummary[] = []
  const pending: QueueItem[] = []

  for (const [activityId, list] of byActivity) {
    const activity = activityById.get(activityId)!
    const waiting = list.filter(isPending)
    const graded = list.filter((s) => s.status === 'graded' && s.grade)

    assignments.push({
      activity,
      total: list.length,
      pending: waiting.length,
      graded: graded.length,
      averageScore:
        graded.length === 0
          ? null
          : Math.round(graded.reduce((sum, s) => sum + (s.grade?.score ?? 0), 0) / graded.length),
      lastSubmittedAt: list.reduce<string | null>(
        (latest, s) => (latest === null || s.submittedAt > latest ? s.submittedAt : latest),
        null,
      ),
    })

    for (const submission of waiting) {
      pending.push({
        submission,
        student: studentById.get(submission.studentId)!,
        activity,
        waitingDays: Math.max(0, Math.floor((now - Date.parse(submission.submittedAt)) / dayMs)),
        runnable: isRunnable(activity),
      })
    }
  }

  // Oldest first: a teacher triages by what has been waiting longest.
  pending.sort((a, b) => a.submission.submittedAt.localeCompare(b.submission.submittedAt))

  assignments.sort((a, b) => {
    // Needs attention first, then most submitted.
    if (a.pending !== b.pending) return b.pending - a.pending
    return b.total - a.total
  })

  return {
    assignments,
    pending,
    totals: {
      activities: assignments.length,
      submissions: live.length,
      pending: pending.length,
      graded: live.length - pending.length,
    },
  }
}

/** The queue for one activity, oldest first. Drives `/teacher/assignments/:id/review`. */
export function queueForActivity(
  queue: ReviewQueue,
  activityId: string,
): { items: QueueItem[]; summary: AssignmentSummary | undefined } {
  return {
    items: queue.pending.filter((item) => item.submission.activityId === activityId),
    summary: queue.assignments.find((a) => a.activity.id === activityId),
  }
}
