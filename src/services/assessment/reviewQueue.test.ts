import { describe, expect, it } from 'vitest'
import type { Activity, Student, Submission } from '../../domain'
import { ACTIVITIES, STUDENTS } from '../../data/seed'
import { buildReviewQueue, isRunnable, queueForActivity } from './reviewQueue'

const NOW = Date.parse('2026-03-16T09:00:00.000Z')
const DAY = 86_400_000

const codeLab = ACTIVITIES.find((a) => a.id === 'act-s04-cl-age')!
const challenge = ACTIVITIES.find((a) => a.id === 'act-s04-c8')!

const submission = (over: Partial<Submission> = {}): Submission => ({
  id: 'sub-1',
  activityId: codeLab.id,
  studentId: STUDENTS[0].id,
  attemptId: 'att-1',
  status: 'submitted',
  submittedAt: new Date(NOW - 2 * DAY).toISOString(),
  score: 90,
  ...over,
})

const graded = (score: number, over: Partial<Submission> = {}): Submission => ({
  ...submission(over),
  status: 'graded',
  score,
  grade: { score, maxScore: 100, gradedBy: 'teacher-01', gradedAt: new Date(NOW - DAY).toISOString() },
})

const build = (submissions: Submission[], activities = [codeLab, challenge], students = STUDENTS) =>
  buildReviewQueue({ activities, submissions, students, now: NOW })

describe('isRunnable', () => {
  it('is true for the kinds that carry code and test cases', () => {
    expect(isRunnable(codeLab)).toBe(true)
  })

  it('is false for a kind with nothing to execute', () => {
    expect(isRunnable(challenge)).toBe(false)
  })
})

describe('buildReviewQueue', () => {
  it('groups by activity and counts pending against graded', () => {
    const queue = build([
      submission({ id: 'a' }),
      submission({ id: 'b' }),
      graded(80, { id: 'c' }),
    ])

    expect(queue.assignments).toHaveLength(1)
    expect(queue.assignments[0]).toMatchObject({ total: 3, pending: 2, graded: 1 })
    expect(queue.totals).toEqual({ activities: 1, submissions: 3, pending: 2, graded: 1 })
  })

  it('averages only the graded scores, so a pending 0 cannot drag it down', () => {
    const queue = build([graded(100, { id: 'a' }), graded(50, { id: 'b' }), submission({ id: 'c' })])
    expect(queue.assignments[0].averageScore).toBe(75)
  })

  it('has no average rather than a zero when nothing is graded', () => {
    const queue = build([submission({ id: 'a' })])
    expect(queue.assignments[0].averageScore).toBeNull()
  })

  it('drops a submission whose activity or student no longer exists', () => {
    const queue = build([
      submission({ id: 'a' }),
      submission({ id: 'b', activityId: 'act-deleted' }),
      submission({ id: 'c', studentId: 'student-deleted' }),
    ])
    expect(queue.totals.submissions).toBe(1)
    expect(queue.assignments[0].total).toBe(1)
  })

  it('ignores an activity nobody has submitted', () => {
    const queue = build([submission({ id: 'a' })])
    expect(queue.assignments.map((a) => a.activity.id)).toEqual([codeLab.id])
  })

  it('orders the queue by how many submissions are waiting', () => {
    const queue = build([
      submission({ id: 'a', activityId: codeLab.id }),
      submission({ id: 'b', activityId: challenge.id }),
      submission({ id: 'c', activityId: challenge.id }),
    ])
    expect(queue.assignments[0].activity.id).toBe(challenge.id)
    expect(queue.assignments[0].pending).toBe(2)
  })

  it('puts the longest-waiting submission first', () => {
    const queue = build([
      submission({ id: 'new', submittedAt: new Date(NOW - 1 * DAY).toISOString() }),
      submission({ id: 'old', submittedAt: new Date(NOW - 9 * DAY).toISOString() }),
    ])
    expect(queue.pending.map((p) => p.submission.id)).toEqual(['old', 'new'])
  })

  it('reports whole days waiting, and never a negative wait', () => {
    const queue = build([
      submission({ id: 'a', submittedAt: new Date(NOW - 3.5 * DAY).toISOString() }),
      submission({ id: 'b', submittedAt: new Date(NOW + DAY).toISOString() }),
    ])
    expect(queue.pending.map((p) => p.waitingDays)).toEqual([3, 0])
  })

  it('counts a submission with a status but no grade as still waiting', () => {
    const queue = build([submission({ id: 'a', status: 'graded' })])
    expect(queue.totals.pending).toBe(1)
  })

  it('marks a pending code lab as runnable and a challenge as not', () => {
    const queue = build([
      submission({ id: 'a', activityId: codeLab.id }),
      submission({ id: 'b', activityId: challenge.id }),
    ])
    const runnable = Object.fromEntries(queue.pending.map((p) => [p.submission.id, p.runnable]))
    expect(runnable).toEqual({ a: true, b: false })
  })

  it('records the latest submission time per activity', () => {
    const queue = build([
      submission({ id: 'a', submittedAt: new Date(NOW - 5 * DAY).toISOString() }),
      submission({ id: 'b', submittedAt: new Date(NOW - 1 * DAY).toISOString() }),
    ])
    expect(queue.assignments[0].lastSubmittedAt).toBe(new Date(NOW - 1 * DAY).toISOString())
  })

  it('is empty, not broken, for a class with no submissions', () => {
    const queue = build([])
    expect(queue.assignments).toEqual([])
    expect(queue.pending).toEqual([])
    expect(queue.totals).toEqual({ activities: 0, submissions: 0, pending: 0, graded: 0 })
  })
})

describe('queueForActivity', () => {
  it('narrows the queue to one activity and keeps its summary', () => {
    const queue = build([
      submission({ id: 'a', activityId: codeLab.id }),
      submission({ id: 'b', activityId: challenge.id }),
      graded(70, { id: 'c', activityId: codeLab.id }),
    ])
    const scoped = queueForActivity(queue, codeLab.id)
    expect(scoped.items.map((i) => i.submission.id)).toEqual(['a'])
    expect(scoped.summary?.total).toBe(2)
  })

  it('returns an undefined summary for an activity with no submissions', () => {
    const scoped = queueForActivity(build([submission()]), 'act-nothing')
    expect(scoped.items).toEqual([])
    expect(scoped.summary).toBeUndefined()
  })
})

describe('the seeded classroom', () => {
  it('produces a review queue with real work in it', async () => {
    const { SEED_SUBMISSIONS } = await import('../../data/seed/attempts')
    const queue = buildReviewQueue({
      activities: ACTIVITIES,
      students: STUDENTS,
      submissions: SEED_SUBMISSIONS,
      now: NOW,
    })

    expect(queue.totals.activities).toBeGreaterThan(0)
    expect(queue.totals.pending).toBeGreaterThan(0)
    // Every pending row must name a real student and a real activity, or the
    // review screen would render a blank.
    for (const item of queue.pending) {
      expect(item.student.id).toBeTruthy()
      expect(item.activity.title).toBeTruthy()
    }
  })

  it('leaves at least one runnable code lab in the queue', async () => {
    const { SEED_SUBMISSIONS } = await import('../../data/seed/attempts')
    const queue = buildReviewQueue({
      activities: ACTIVITIES,
      students: STUDENTS as Student[],
      submissions: SEED_SUBMISSIONS,
      now: NOW,
    })
    expect(queue.pending.some((p) => p.runnable)).toBe(true)
  })
})

describe('activity ids', () => {
  it('are unique across the course', () => {
    const ids = new Set(ACTIVITIES.map((a: Activity) => a.id))
    expect(ids.size).toBe(ACTIVITIES.length)
  })
})
