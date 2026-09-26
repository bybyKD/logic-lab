import type {
  Activity,
  Attempt,
  CohortSegment,
  Enrollment,
  Student,
  Submission,
} from '../../domain'
import { cohortSegmentForStudent } from '../learning/mastery'

/**
 * The gradebook.
 *
 * Every cell is derived: a score exists because a submission was graded, and a
 * blank cell means the student has not handed anything in. Nothing is stored as a
 * "grade" independently of the submission that produced it, so the gradebook
 * cannot drift from the review screen.
 */

export interface GradebookCell {
  /** Graded score 0–100, or null when nothing is graded. */
  score: number | null
  /** Submitted but not yet graded — the cell is not blank, the grade is missing. */
  awaitingGrade: boolean
  submissionId: string | null
}

export interface GradebookRow {
  student: Student
  segment: CohortSegment
  /** Column id → cell, only for columns where this student has any history. */
  cells: Record<string, GradebookCell>
  gradedCount: number
  /** Mean of graded scores, or null when the student has nothing graded. */
  average: number | null
  lastSubmittedAt: string | null
}

export interface Gradebook {
  /** Only activities that have at least one submission, so the table stays honest. */
  columns: Activity[]
  rows: GradebookRow[]
  totals: {
    students: number
    gradedCells: number
    awaitingGrade: number
    /** Cells with no submission at all, across every row and column. */
    missing: number
  }
}

export function buildGradebook(options: {
  activities: Activity[]
  students: Student[]
  enrollments: Enrollment[]
  submissions: Submission[]
  /** Used for the segment labels so the gradebook agrees with the classroom. */
  attemptsByStudent: Record<string, Attempt[]>
  focusActivityId: string
}): Gradebook {
  const { activities, students, enrollments, submissions, attemptsByStudent, focusActivityId } = options

  const activityById = new Map(activities.map((a) => [a.id, a]))

  // Group by student, then by activity. A student may have several submissions
  // for one activity; the most recently graded one is the one that counts.
  const byStudent = new Map<string, Map<string, Submission>>()
  for (const submission of submissions) {
    if (!activityById.has(submission.activityId)) continue
    const forStudent = byStudent.get(submission.studentId) ?? new Map<string, Submission>()
    const existing = forStudent.get(submission.activityId)
    if (!existing || preferIncoming(submission, existing)) {
      forStudent.set(submission.activityId, submission)
    }
    byStudent.set(submission.studentId, forStudent)
  }

  // Columns: activities anyone has submitted. Sorted by section order then the
  // activity's own order, so the table reads like the course does.
  const usedActivityIds = new Set<string>()
  for (const forStudent of byStudent.values()) {
    for (const activityId of forStudent.keys()) usedActivityIds.add(activityId)
  }
  const columns = activities.filter((a) => usedActivityIds.has(a.id))

  // A gradebook lists the enrolled cohort, not every student record that happens
  // to exist. Falling back to the full list keeps the function usable before
  // enrollments have loaded.
  const enrolledIds = new Set(enrollments.map((e) => e.studentId))
  const roster = enrolledIds.size > 0 ? students.filter((s) => enrolledIds.has(s.id)) : students

  let gradedCells = 0
  let awaitingGrade = 0
  let missing = 0

  const rows: GradebookRow[] = roster.map((student) => {
    const forStudent = byStudent.get(student.id) ?? new Map<string, Submission>()
    const cells: Record<string, GradebookCell> = {}

    let gradedCount = 0
    let scoreSum = 0
    let lastSubmittedAt: string | null = null

    for (const activity of columns) {
      const submission = forStudent.get(activity.id)
      if (!submission) {
        cells[activity.id] = { score: null, awaitingGrade: false, submissionId: null }
        missing += 1
        continue
      }

      const isGraded = submission.status === 'graded' && submission.grade !== undefined
      const score = isGraded ? (submission.grade?.score ?? null) : null

      if (isGraded && score !== null) {
        gradedCount += 1
        scoreSum += score
        gradedCells += 1
      } else {
        awaitingGrade += 1
      }

      if (lastSubmittedAt === null || submission.submittedAt > lastSubmittedAt) {
        lastSubmittedAt = submission.submittedAt
      }

      cells[activity.id] = {
        score,
        awaitingGrade: !isGraded,
        submissionId: submission.id,
      }
    }

    return {
      student,
      segment: cohortSegmentForStudent(attemptsByStudent[student.id] ?? [], student.id, focusActivityId),
      cells,
      gradedCount,
      average: gradedCount === 0 ? null : Math.round(scoreSum / gradedCount),
      lastSubmittedAt,
    }
  })

  return {
    columns,
    rows,
    totals: {
      students: roster.length,
      gradedCells,
      awaitingGrade,
      missing,
    },
  }
}

/**
 * Latest graded submission wins; a graded one beats an ungraded one.
 *
 * A resubmission should not silently keep the old grade, and an ungraded
 * resubmission should not erase a grade the teacher already gave.
 */
function preferIncoming(incoming: Submission, existing: Submission): boolean {
  const incomingGraded = incoming.status === 'graded' && incoming.grade !== undefined
  const existingGraded = existing.status === 'graded' && existing.grade !== undefined
  if (incomingGraded !== existingGraded) return incomingGraded
  if (incomingGraded && existingGraded) {
    return Date.parse(incoming.grade!.gradedAt) > Date.parse(existing.grade!.gradedAt)
  }
  return Date.parse(incoming.submittedAt) > Date.parse(existing.submittedAt)
}
