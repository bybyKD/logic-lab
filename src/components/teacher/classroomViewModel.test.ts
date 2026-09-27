import { describe, expect, it } from 'vitest'
import { ACTIVITIES, ENROLLMENTS, LAB_CLASS, STUDENTS, COHORT_PLAN } from '../../data/seed'
import { FOCUS_ACTIVITY_ID, buildSeedAttempts } from '../../data/seed/attempts'
import {
  buildClassroom,
  relativeTime,
  segmentLabel,
  strugglingRows,
} from './classroomViewModel'

const NOW = Date.parse('2026-03-16T09:00:00.000Z')

const data = () =>
  buildClassroom({
    class: LAB_CLASS,
    students: STUDENTS,
    enrollments: ENROLLMENTS,
    attempts: buildSeedAttempts(NOW),
    activities: ACTIVITIES,
    now: NOW,
  })

describe('buildClassroom', () => {
  it('derives the §16 cohort split rather than restating it', () => {
    const { summary } = data()
    expect(summary.enrolled).toBe(42)
    expect(summary.completed).toBe(COHORT_PLAN.completed)
    expect(summary.struggling).toBe(COHORT_PLAN.struggling)
    expect(summary.notStarted).toBe(COHORT_PLAN.notStarted)
  })

  it('completes the arithmetic, with no bucket left over', () => {
    const { summary } = data()
    expect(summary.completed + summary.struggling + summary.inProgress + summary.notStarted).toBe(
      summary.enrolled,
    )
  })

  it('resolves the focus activity to a real activity', () => {
    const { focusActivity } = data()
    expect(focusActivity.id).toBe(FOCUS_ACTIVITY_ID)
    expect(focusActivity.title).toBeTruthy()
    expect(focusActivity.objective).toBeTruthy()
  })

  it('refuses to build without a resolvable focus activity', () => {
    expect(() =>
      buildClassroom({
        class: LAB_CLASS,
        students: STUDENTS,
        enrollments: ENROLLMENTS,
        attempts: [],
        activities: ACTIVITIES,
        now: NOW,
        focusActivityId: 'does-not-exist',
      }),
    ).toThrow(/focus activity/)
  })

  it('gives every enrolled student a row, and nobody else', () => {
    const { rows } = data()
    expect(rows).toHaveLength(ENROLLMENTS.length)
    const enrolledIds = new Set(ENROLLMENTS.map((e) => e.studentId))
    expect(rows.every((r) => enrolledIds.has(r.studentId))).toBe(true)
  })

  it('leaves a student with no attempts at zero rather than guessing', () => {
    const { rows } = data()
    const untouched = rows.find((r) => r.segment === 'not-started')
    expect(untouched).toBeDefined()
    expect(untouched?.attempts).toBe(0)
    expect(untouched?.bestScore).toBe(0)
    expect(untouched?.passRate).toBe(0)
    expect(untouched?.lastActivityAt).toBe('')
  })

  it('ranks the common issue by students affected, from code-backed tags only', () => {
    const { misconceptions } = data()
    expect(misconceptions[0].id).toBe('assignment-in-condition')
    for (let i = 1; i < misconceptions.length; i += 1) {
      expect(misconceptions[i - 1].studentCount).toBeGreaterThanOrEqual(
        misconceptions[i].studentCount,
      )
    }
  })

  it('carries a remediation hint and a recommended activity for the top issue', () => {
    const [top] = data().misconceptions
    expect(top.remediationHint).toBeTruthy()
    const recommended = ACTIVITIES.find((a) => a.id === top.recommendedActivityId)
    expect(recommended).toBeDefined()
  })

  it('returns no misconceptions for a class that has never submitted code', () => {
    const empty = buildClassroom({
      class: LAB_CLASS,
      students: STUDENTS,
      enrollments: ENROLLMENTS,
      attempts: [],
      activities: ACTIVITIES,
      now: NOW,
    })
    expect(empty.misconceptions).toEqual([])
  })

  it('derives class-wide weakest skills with evidence behind them', () => {
    const { weakestSkills } = data()
    expect(weakestSkills.length).toBeGreaterThan(0)
    expect(weakestSkills.length).toBeLessThanOrEqual(5)
    for (let i = 1; i < weakestSkills.length; i += 1) {
      expect(weakestSkills[i - 1].score).toBeLessThanOrEqual(weakestSkills[i].score)
    }
  })

  it('counts recent activity relative to the injected clock', () => {
    const { attemptsLast24h } = data()
    expect(attemptsLast24h).toBeGreaterThan(0)
    expect(attemptsLast24h).toBeLessThanOrEqual(408 + 1)
  })

  it('is deterministic for a fixed clock', () => {
    expect(data().summary).toEqual(data().summary)
    expect(data().rows).toEqual(data().rows)
  })
})

describe('strugglingRows', () => {
  it('returns only the struggling segment', () => {
    const rows = data().rows
    const struggling = strugglingRows(rows)
    expect(struggling).toHaveLength(COHORT_PLAN.struggling)
    expect(struggling.every((r) => r.segment === 'struggling')).toBe(true)
  })
})

describe('segmentLabel', () => {
  it('covers every segment', () => {
    expect(segmentLabel('completed')).toBe('Completed')
    expect(segmentLabel('in-progress')).toBe('In progress')
    expect(segmentLabel('struggling')).toBe('Struggling')
    expect(segmentLabel('not-started')).toBe('Not started')
  })
})

describe('relativeTime', () => {
  it('handles the buckets a dense table needs', () => {
    expect(relativeTime(new Date(NOW - 5_000).toISOString(), NOW)).toBe('just now')
    expect(relativeTime(new Date(NOW - 5 * 60_000).toISOString(), NOW)).toBe('5m ago')
    expect(relativeTime(new Date(NOW - 2 * 3_600_000).toISOString(), NOW)).toBe('2h 0m ago')
    expect(relativeTime(new Date(NOW - 3 * 86_400_000).toISOString(), NOW)).toBe('3d ago')
  })

  it('does not show a negative time for clock skew', () => {
    expect(relativeTime(new Date(NOW + 60_000).toISOString(), NOW)).toBe('just now')
  })

  it('degrades to a dash for missing or unparseable input', () => {
    expect(relativeTime('', NOW)).toBe('—')
    expect(relativeTime('nonsense', NOW)).toBe('—')
  })
})
