import type { Enrollment } from '../../domain'
import { segmentLabel, type StudentRow } from '../teacher/classroomViewModel'

/**
 * Adapter from the derived classroom row to the shapes `components/admin/*`
 * already understand.
 *
 * Phase 3 adapts rather than rewrites the admin components, so this is the seam:
 * the old table and stat tiles keep working against a row type they already
 * accept, while the numbers behind them become derived instead of mocked. When
 * the admin components are replaced, this file goes with them.
 *
 * It takes a `StudentRow`, not a raw `StudentEngagement`, on purpose: the row
 * already carries the cohort segment (tried the focus activity, not passed it
 * yet). Re-deriving a different notion of "struggling" here would put the admin
 * screen and the teacher classroom at odds with each other.
 */

export interface AdminStat {
  label: string
  value: string
  hint: string
  accent?: boolean
}

export interface StudentRowView {
  id: string
  name: string
  /** 100 once this student has passed the current activity, otherwise 0. */
  progress: number
  score: number
  challenges: number
  lastActive: string
  /** Matches the legacy `ParticipantStatus` union used by the status badge. */
  status: 'Active' | 'Asisten' | 'Tidak Aktif'
  segment: StudentRow['segment']
  segmentLabel: string
  attempts: number
  passRate: number
  flagged: number
  cohort: string
  email: string
}

const STATUS_BY_SEGMENT: Record<StudentRow['segment'], StudentRowView['status']> = {
  completed: 'Active',
  'in-progress': 'Active',
  struggling: 'Asisten',
  'not-started': 'Tidak Aktif',
}

export function toStudentRow(row: StudentRow, now: number): StudentRowView {
  return {
    id: row.student.id,
    name: row.student.name,
    // Binary on purpose: a single activity is either passed or not, so there is
    // no honest partial value to show.
    progress: row.segment === 'completed' ? 100 : 0,
    score: row.bestScore,
    challenges: row.attempts,
    lastActive: relativeLastActive(row.lastActivityAt, now),
    status: STATUS_BY_SEGMENT[row.segment],
    segment: row.segment,
    segmentLabel: segmentLabel(row.segment),
    attempts: row.attempts,
    passRate: row.passRate,
    flagged: row.misconceptionIds.length,
    cohort: row.student.cohort,
    email: row.student.email,
  }
}

export function toStudentRows(rows: StudentRow[], now: number): StudentRowView[] {
  return rows.map((row) => toStudentRow(row, now))
}

const relativeLastActive = (iso: string, now: number): string => {
  if (!iso) return 'never'
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return 'never'
  const days = Math.floor(Math.max(0, now - then) / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

export interface AdminStatsInput {
  enrolled: Enrollment[]
  rows: StudentRowView[]
  attemptsLast24h: number
}

/** Replaces the admin screen's hardcoded numbers with derived ones. */
export function toAdminStats({ enrolled, rows, attemptsLast24h }: AdminStatsInput): AdminStat[] {
  const struggling = rows.filter((r) => r.segment === 'struggling').length
  const completed = rows.filter((r) => r.segment === 'completed').length
  const avgPassRate =
    rows.length === 0 ? 0 : Math.round(rows.reduce((sum, r) => sum + r.passRate, 0) / rows.length)

  return [
    {
      label: 'Enrolled',
      value: String(enrolled.length),
      hint: 'students in this class',
      accent: true,
    },
    { label: 'Completed', value: String(completed), hint: 'passed the current activity' },
    { label: 'Struggling', value: String(struggling), hint: 'need a reteach' },
    { label: 'Avg pass rate', value: `${avgPassRate}%`, hint: `${attemptsLast24h} attempts in 24h` },
  ]
}
