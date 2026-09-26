import type {
  Activity,
  Attempt,
  Class,
  Enrollment,
  SkillMastery,
  Student,
} from '../../domain'
import { FOCUS_ACTIVITY_ID } from '../../data/seed/attempts'
import { SKILLS } from '../../data/seed/skills'
import {
  aggregateMisconceptions,
  buildActivitySkillMap,
  classProgressSummary,
  cohortSegmentForStudent,
  computeSkillMastery,
  studentEngagement,
  weakestSkills,
  type ClassProgressSummary,
  type MisconceptionTally,
  type StudentEngagement,
} from '../../services/learning/mastery'
import { MISCONCEPTIONS } from '../../services/learning/misconceptions'

/**
 * The classroom view model.
 *
 * §16 is the screen that has to prove the product works, so nothing here may be
 * typed in by hand. Every number below is computed from `Attempt` records by the
 * Phase 2 learning engine; this module only chooses what to show and in what
 * shape. If a value cannot be derived, it does not appear.
 */

export interface StudentRow extends StudentEngagement {
  student: Student
  /** Best of this student's attempts, for the table's score column. */
  bestScore: number
}

export interface ClassroomData {
  class: Class
  students: Student[]
  enrollments: Enrollment[]
  focusActivity: Activity
  summary: ClassProgressSummary
  rows: StudentRow[]
  misconceptions: MisconceptionTally[]
  /** Attempts in the last 24h, for the "active" hint. */
  attemptsLast24h: number
  /** Class-wide mastery, weakest first, for "what to reteach next". */
  weakestSkills: SkillMastery[]
}

export interface BuildClassroomOptions {
  class: Class
  students: Student[]
  enrollments: Enrollment[]
  attempts: Attempt[]
  activities: Activity[]
  now: number
  /** Defaults to the seeded activity the class is currently working on. */
  focusActivityId?: string
}

export function buildClassroom(options: BuildClassroomOptions): ClassroomData {
  const { class: klass, students, enrollments, attempts, activities, now } = options
  const focusActivityId = options.focusActivityId ?? FOCUS_ACTIVITY_ID

  const focusActivity = activities.find((a) => a.id === focusActivityId)
  if (!focusActivity) {
    throw new Error(`classroom: focus activity ${focusActivityId} is not in the activity set`)
  }

  const summary = classProgressSummary(enrollments, attempts, focusActivity.id)

  // Engagement supplies the per-student numbers (pass rate, attempt count, last
  // activity, evidence-backed tags). The *label* comes from the cohort rule
  // instead of engagement's own pass-rate buckets: the roster must not disagree
  // with the split chart directly above it about who is struggling.
  const studentsById = new Map(students.map((s) => [s.id, s]))
  const rows: StudentRow[] = studentEngagement(enrollments, attempts)
    .map((engagement) => {
      const student = studentsById.get(engagement.studentId)
      if (!student) return undefined
      const own = attempts.filter((a) => a.studentId === engagement.studentId)
      return {
        ...engagement,
        student,
        segment: cohortSegmentForStudent(own, engagement.studentId, focusActivity.id),
        bestScore: own.length === 0 ? 0 : Math.max(...own.map((a) => a.score)),
      }
    })
    .filter((row): row is StudentRow => Boolean(row))

  const dayMs = 86_400_000
  const attemptsLast24h = attempts.filter((a) => {
    const submittedAt = Date.parse(a.submittedAt)
    return !Number.isNaN(submittedAt) && now - submittedAt < dayMs
  }).length

  // Class-wide mastery across every activity, so "weakest skill" reflects the
  // whole class rather than only the focus activity.
  const classMastery = computeSkillMastery(
    attempts,
    SKILLS,
    buildActivitySkillMap(activities),
    { now },
  )

  return {
    class: klass,
    students,
    enrollments,
    focusActivity,
    summary,
    rows,
    misconceptions: aggregateMisconceptions(attempts, MISCONCEPTIONS),
    attemptsLast24h,
    weakestSkills: weakestSkills(classMastery, 5),
  }
}

/** Rows for the struggling filter on the student table. */
export function strugglingRows(rows: StudentRow[]): StudentRow[] {
  return rows.filter((r) => r.segment === 'struggling')
}

const SEGMENT_LABELS: Record<StudentRow['segment'], string> = {
  completed: 'Completed',
  'in-progress': 'In progress',
  struggling: 'Struggling',
  'not-started': 'Not started',
}

export const segmentLabel = (segment: StudentRow['segment']): string => SEGMENT_LABELS[segment]

/** "2h 14m ago" / "3d ago" / "just now". Compact, for a dense table. */
export function relativeTime(iso: string, now: number): string {
  if (!iso) return '—'
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return '—'
  const seconds = Math.max(0, Math.round((now - then) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}
