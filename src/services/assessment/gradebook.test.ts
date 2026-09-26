import { describe, expect, it } from 'vitest'
import type { Attempt, Submission } from '../../domain'
import { ACTIVITIES, ENROLLMENTS, STUDENTS } from '../../data/seed'
import { FOCUS_ACTIVITY_ID } from '../../data/seed/attempts'
import { buildGradebook } from './gradebook'

const NOW = Date.parse('2026-03-16T09:00:00.000Z')
const DAY = 86_400_000

const codeLab = ACTIVITIES.find((a) => a.id === 'act-s04-cl-age')!
const challenge = ACTIVITIES.find((a) => a.id === 'act-s04-c8')!

const two: typeof STUDENTS = [STUDENTS[0], STUDENTS[1]]

const submission = (over: Partial<Submission> = {}): Submission => ({
  id: 'sub-1',
  activityId: codeLab.id,
  studentId: two[0].id,
  attemptId: 'att-1',
  status: 'graded',
  submittedAt: new Date(NOW - 2 * DAY).toISOString(),
  score: 80,
  grade: { score: 80, maxScore: 100, gradedBy: 'teacher-01', gradedAt: new Date(NOW - DAY).toISOString() },
  ...over,
})

const build = (submissions: Submission[], attempts: Record<string, Attempt[]> = {}, students = two) =>
  buildGradebook({
    activities: [codeLab, challenge],
    students,
    enrollments: ENROLLMENTS.filter((e) => students.some((s) => s.id === e.studentId)),
    submissions,
    attemptsByStudent: attempts,
    focusActivityId: FOCUS_ACTIVITY_ID,
  })

describe('buildGradebook', () => {
  it('makes a column only for activities someone submitted', () => {
    const book = build([submission()])
    expect(book.columns.map((c) => c.id)).toEqual([codeLab.id])
  })

  it('gives one row per enrolled student, including the one with no work', () => {
    const book = build([submission()])
    expect(book.rows).toHaveLength(2)
    expect(book.rows[0].gradedCount).toBe(1)
    expect(book.rows[1].gradedCount).toBe(0)
  })

  it('distinguishes "not submitted" from "submitted, not graded"', () => {
    const book = build([
      submission({ id: 'a', studentId: two[0].id }),
      submission({ id: 'b', studentId: two[1].id, status: 'submitted', grade: undefined }),
    ])
    const gradedCell = book.rows[0].cells[codeLab.id]
    const awaitingCell = book.rows[1].cells[codeLab.id]

    expect(gradedCell).toMatchObject({ score: 80, awaitingGrade: false })
    expect(awaitingCell).toMatchObject({ score: null, awaitingGrade: true })
  })

  it('counts a missing cell as missing, not as a zero', () => {
    const book = build([submission()])
    expect(book.rows[1].cells[codeLab.id]).toEqual({
      score: null,
      awaitingGrade: false,
      submissionId: null,
    })
    expect(book.totals.missing).toBe(1)
    expect(book.totals.gradedCells).toBe(1)
  })

  it('averages only the graded cells', () => {
    const book = build([
      submission({ id: 'a', score: 100, grade: { score: 100, maxScore: 100, gradedBy: 't', gradedAt: new Date(NOW - DAY).toISOString() } }),
      submission({ id: 'b', status: 'submitted', grade: undefined, score: 0 }),
    ])
    expect(book.rows[0].average).toBe(100)
  })

  it('has no average for a student who has nothing graded', () => {
    const book = build([submission({ id: 'a', status: 'submitted', grade: undefined })])
    expect(book.rows[0].average).toBeNull()
  })

  it('prefers the most recently graded submission when a student resubmits', () => {
    const book = build([
      submission({
        id: 'first',
        score: 40,
        grade: { score: 40, maxScore: 100, gradedBy: 't', gradedAt: new Date(NOW - 5 * DAY).toISOString() },
      }),
      submission({
        id: 'second',
        score: 95,
        grade: { score: 95, maxScore: 100, gradedBy: 't', gradedAt: new Date(NOW - 1 * DAY).toISOString() },
      }),
    ])
    expect(book.rows[0].cells[codeLab.id].score).toBe(95)
  })

  it('does not let an ungraded resubmission erase a grade already given', () => {
    const book = build([
      submission({ id: 'graded', score: 70, grade: { score: 70, maxScore: 100, gradedBy: 't', gradedAt: new Date(NOW - 2 * DAY).toISOString() } }),
      submission({ id: 'resubmitted', status: 'submitted', grade: undefined, submittedAt: new Date(NOW - 1 * DAY).toISOString() }),
    ])
    expect(book.rows[0].cells[codeLab.id].score).toBe(70)
  })

  it('ignores submissions pointing at deleted activities', () => {
    const book = build([submission({ id: 'a', activityId: 'act-deleted' })])
    expect(book.columns).toEqual([])
    expect(book.rows[0].gradedCount).toBe(0)
  })

  it('labels a student with no attempts as not started, using the same rule as the classroom', () => {
    const book = build([submission()], {})
    expect(book.rows[1].segment).toBe('not-started')
  })

  it('labels a student who passed the focus activity as completed', () => {
    const attempts: Record<string, Attempt[]> = {
      [two[0].id]: [
        {
          id: 'att-f',
          activityId: FOCUS_ACTIVITY_ID,
          studentId: two[0].id,
          kind: 'challenge',
          submittedAt: new Date(NOW - DAY).toISOString(),
          passed: true,
          score: 100,
          durationMs: 1000,
          hintsUsed: [],
        },
      ],
    }
    const book = build([submission()], attempts)
    expect(book.rows[0].segment).toBe('completed')
  })

  it('tracks the last time each student submitted anything', () => {
    const book = build([
      submission({ id: 'a', activityId: codeLab.id, submittedAt: new Date(NOW - 5 * DAY).toISOString() }),
      submission({ id: 'b', activityId: challenge.id, submittedAt: new Date(NOW - 1 * DAY).toISOString() }),
    ])
    expect(book.rows[0].lastSubmittedAt).toBe(new Date(NOW - 1 * DAY).toISOString())
  })

  it('is empty, not broken, for a class that has submitted nothing', () => {
    const book = build([])
    expect(book.columns).toEqual([])
    expect(book.rows.every((r) => r.average === null)).toBe(true)
    expect(book.totals).toEqual({ students: 2, gradedCells: 0, awaitingGrade: 0, missing: 0 })
  })

  it('is deterministic', () => {
    expect(build([submission()])).toEqual(build([submission()]))
  })
})

describe('the seeded classroom', () => {
  it('fills a gradebook from the real submissions', async () => {
    const { SEED_ATTEMPTS, SEED_SUBMISSIONS } = await import('../../data/seed/attempts')

    const attemptsByStudent: Record<string, Attempt[]> = {}
    for (const attempt of SEED_ATTEMPTS) {
      const list = attemptsByStudent[attempt.studentId] ?? []
      list.push(attempt)
      attemptsByStudent[attempt.studentId] = list
    }

    const book = buildGradebook({
      activities: ACTIVITIES,
      students: STUDENTS,
      enrollments: ENROLLMENTS,
      submissions: SEED_SUBMISSIONS,
      attemptsByStudent,
      focusActivityId: FOCUS_ACTIVITY_ID,
    })

    expect(book.columns.length).toBeGreaterThan(0)
    expect(book.rows).toHaveLength(ENROLLMENTS.length)
    expect(book.totals.gradedCells).toBeGreaterThan(0)
    // A gradebook that shows no pending work would mean the review queue and the
    // gradebook disagree.
    expect(book.totals.awaitingGrade).toBeGreaterThan(0)
  })
})
