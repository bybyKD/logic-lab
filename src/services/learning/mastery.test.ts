import { describe, expect, it } from 'vitest'
import type { Attempt, Skill, Submission } from '../../domain'
import {
  aggregateMisconceptions,
  buildActivitySkillMap,
  classProgressSummary,
  computeSkillMastery,
  deriveActivityProgress,
  studentEngagement,
  weakestSkills,
} from './mastery'
import { MISCONCEPTIONS } from './misconceptions'

const NOW = Date.parse('2026-03-16T00:00:00.000Z')
const DAY = 86_400_000

const SKILLS: Skill[] = [
  { id: 'root', name: 'Root', parentId: null, domain: 'variables', description: '' },
  { id: 'child', name: 'Child', parentId: 'root', domain: 'variables', description: '' },
  { id: 'leaf', name: 'Leaf', parentId: 'child', domain: 'variables', description: '' },
]

const ACTIVITY_SKILLS = { a1: ['child'], a2: ['leaf'], a3: ['root'] }

let counter = 0
function attempt(partial: Partial<Attempt> = {}): Attempt {
  counter += 1
  return {
    id: `att-${counter}`,
    activityId: 'a1',
    studentId: 's1',
    kind: 'codeLab',
    submittedAt: new Date(NOW - DAY).toISOString(),
    passed: true,
    score: 100,
    durationMs: 1000,
    hintsUsed: [],
    ...partial,
  }
}

const masteryFor = (attempts: Attempt[], now = NOW) =>
  computeSkillMastery(attempts, SKILLS, ACTIVITY_SKILLS, { now })

const scoreOf = (attempts: Attempt[], skillId: string) =>
  masteryFor(attempts).find((m) => m.skillId === skillId)?.score ?? -1

describe('computeSkillMastery', () => {
  it('reports a perfect recent attempt as 100', () => {
    expect(scoreOf([attempt({ score: 100 })], 'child')).toBe(100)
  })

  it('lets recent evidence outweigh evidence from weeks ago', () => {
    const mastery = masteryFor([
      attempt({ score: 100, submittedAt: new Date(NOW - DAY).toISOString() }),
      attempt({ score: 0, submittedAt: new Date(NOW - 60 * DAY).toISOString() }),
    ]).find((m) => m.skillId === 'child')

    expect(mastery?.score).toBeGreaterThan(90)
    expect(mastery?.score).toBeLessThanOrEqual(100)
  })

  it('discounts an attempt that needed hints, but never below the floor', () => {
    const withHints = scoreOf([attempt({ score: 100, hintsUsed: ['h1', 'h2', 'h3', 'h4'] })], 'child')
    const withoutHints = scoreOf([attempt({ score: 100, hintsUsed: [] })], 'child')
    const manyHints = scoreOf([attempt({ score: 100, hintsUsed: Array(9).fill('h') })], 'child')

    expect(withoutHints).toBe(100)
    // 4 hints x 0.15 = 0.4 discount
    expect(withHints).toBe(60)
    // 9 hints would be -0.35, so the floor holds it at 0.6 rather than punishing
    // a student who asked for every hint
    expect(manyHints).toBe(60)
  })

  it('discounts a hinted perfect answer enough that it is not counted as mastered', () => {
    const progress = deriveActivityProgress(
      [attempt({ score: 100, passed: true, hintsUsed: ['h1', 'h2', 'h3', 'h4'] })],
      's1',
      ['a1'],
    )
    expect(progress[0].status).toBe('submitted')
  })

  it('ignores attempts on activities that declare no skills', () => {
    const score = scoreOf([attempt({ activityId: 'unknown-activity', score: 0 })], 'child')
    expect(score).toBe(0)
  })

  it('ignores attempts with an unparseable timestamp rather than trusting them', () => {
    const score = scoreOf([attempt({ submittedAt: 'not-a-date', score: 0 })], 'child')
    expect(score).toBe(0)
  })

  it('rolls a parent up from its children when the parent has no own evidence', () => {
    const attempts = [attempt({ activityId: 'a1', score: 80 })]
    const mastery = masteryFor(attempts)
    const root = mastery.find((m) => m.skillId === 'root')
    const child = mastery.find((m) => m.skillId === 'child')

    expect(root?.score).toBe(child?.score)
    expect(root?.score).toBe(80)
  })

  it('prefers a parent’s own evidence over its children', () => {
    const attempts = [
      attempt({ activityId: 'a1', score: 20 }),
      attempt({ activityId: 'a3', score: 100 }),
    ]
    const root = masteryFor(attempts).find((m) => m.skillId === 'root')
    expect(root?.score).toBe(100)
  })

  it('reports no evidence for a skill nothing has touched', () => {
    const mastery = masteryFor([])
    for (const entry of mastery) {
      expect(entry.score).toBe(0)
      expect(entry.evidenceCount).toBe(0)
      expect(entry.confidence).toBe('low')
    }
  })

  it('raises confidence with the amount of evidence', () => {
    const one = masteryFor([attempt()]).find((m) => m.skillId === 'child')
    const four = masteryFor([attempt(), attempt(), attempt(), attempt()]).find(
      (m) => m.skillId === 'child',
    )
    const eight = masteryFor(Array.from({ length: 8 }, () => attempt())).find(
      (m) => m.skillId === 'child',
    )

    expect(one?.confidence).toBe('low')
    expect(four?.confidence).toBe('medium')
    expect(eight?.confidence).toBe('high')
    expect(eight?.evidenceCount).toBe(8)
  })

  it('survives a skill graph containing a cycle without hanging', () => {
    const cyclic: Skill[] = [
      { id: 'x', name: 'X', parentId: 'y', domain: 'variables', description: '' },
      { id: 'y', name: 'Y', parentId: 'x', domain: 'variables', description: '' },
    ]
    const mastery = computeSkillMastery([attempt()], cyclic, ACTIVITY_SKILLS, { now: NOW })
    expect(mastery).toHaveLength(2)
  })

  it('is deterministic for the same inputs', () => {
    const attempts = [attempt({ score: 70 }), attempt({ score: 90, hintsUsed: ['h1'] })]
    expect(masteryFor(attempts)).toEqual(masteryFor(attempts))
  })
})

describe('weakestSkills', () => {
  it('returns the lowest scores that have evidence, weakest first', () => {
    const attempts = [
      attempt({ activityId: 'a1', score: 90 }),
      attempt({ activityId: 'a2', score: 20 }),
    ]
    const weakest = weakestSkills(masteryFor(attempts), 2)
    const scores = weakest.map((m) => m.score)

    // 'root' legitimately ties with 'leaf' here by rolling up its only descendant
    // with evidence, so assert the ordering rather than the exact set.
    expect(weakest[0].skillId).toBe('leaf')
    expect(scores).toEqual([...scores].sort((a, b) => a - b))
    expect(weakest.map((m) => m.skillId)).not.toContain('child')
  })

  it('excludes skills with no evidence so they cannot be "recommended"', () => {
    expect(weakestSkills(masteryFor([]), 3)).toEqual([])
  })
})

describe('deriveActivityProgress', () => {
  const activityIds = ['a1', 'a2']

  it('marks an untouched activity as not started', () => {
    const progress = deriveActivityProgress([], 's1', activityIds)
    expect(progress.map((p) => p.status)).toEqual(['not-started', 'not-started'])
  })

  it('marks a failed attempt as in progress', () => {
    const progress = deriveActivityProgress(
      [attempt({ activityId: 'a1', passed: false, score: 30 })],
      's1',
      activityIds,
    )
    expect(progress[0].status).toBe('in-progress')
    expect(progress[0].attempts).toBe(1)
  })

  it('marks a passing attempt below the mastery threshold as submitted', () => {
    const progress = deriveActivityProgress(
      [attempt({ activityId: 'a1', passed: true, score: 70 })],
      's1',
      activityIds,
    )
    expect(progress[0].status).toBe('submitted')
  })

  it('marks a high-scoring pass as mastered', () => {
    const progress = deriveActivityProgress(
      [attempt({ activityId: 'a1', passed: true, score: 95 })],
      's1',
      activityIds,
    )
    expect(progress[0].status).toBe('mastered')
  })

  it('prefers a teacher grade over the automatic status', () => {
    const submission: Submission = {
      id: 'sub-1',
      activityId: 'a1',
      studentId: 's1',
      attemptId: 'att-1',
      status: 'graded',
      submittedAt: new Date(NOW).toISOString(),
      score: 40,
    }
    const progress = deriveActivityProgress(
      [attempt({ activityId: 'a1', passed: false, score: 40 })],
      's1',
      activityIds,
      [submission],
    )
    expect(progress[0].status).toBe('graded')
  })

  it('keeps the best score rather than the latest', () => {
    const progress = deriveActivityProgress(
      [
        attempt({ activityId: 'a1', score: 100, submittedAt: new Date(NOW - 2 * DAY).toISOString() }),
        attempt({ activityId: 'a1', score: 20, submittedAt: new Date(NOW - DAY).toISOString() }),
      ],
      's1',
      activityIds,
    )
    expect(progress[0].bestScore).toBe(100)
    expect(progress[0].attempts).toBe(2)
  })

  it('ignores other students’ attempts', () => {
    const progress = deriveActivityProgress(
      [attempt({ activityId: 'a1', studentId: 'someone-else', score: 100 })],
      's1',
      activityIds,
    )
    expect(progress[0].status).toBe('not-started')
  })
})

describe('classProgressSummary', () => {
  const enrollments = [
    { id: 'e1', classId: 'c1', studentId: 's1', status: 'active' as const, enrolledAt: '' },
    { id: 'e2', classId: 'c1', studentId: 's2', status: 'active' as const, enrolledAt: '' },
    { id: 'e3', classId: 'c1', studentId: 's3', status: 'active' as const, enrolledAt: '' },
    { id: 'e4', classId: 'c1', studentId: 's4', status: 'active' as const, enrolledAt: '' },
  ]

  it('splits the class by engagement with the focus activity', () => {
    const summary = classProgressSummary(
      enrollments,
      [
        attempt({ studentId: 's1', activityId: 'a1', passed: true }),
        attempt({ studentId: 's2', activityId: 'a1', passed: false }),
        attempt({ studentId: 's3', activityId: 'a2', passed: true }),
      ],
      'a1',
    )

    expect(summary.enrolled).toBe(4)
    expect(summary.completed).toBe(1)
    expect(summary.struggling).toBe(1)
    expect(summary.inProgress).toBe(1)
    expect(summary.notStarted).toBe(1)
    expect(summary.focusCompletionRate).toBe(25)
  })

  it('reports 0% rather than dividing by zero for an empty class', () => {
    const summary = classProgressSummary([], [], 'a1')
    expect(summary.focusCompletionRate).toBe(0)
    expect(summary.enrolled).toBe(0)
  })

  it('ignores attempts from students who are not enrolled', () => {
    const summary = classProgressSummary(
      enrollments,
      [attempt({ studentId: 'outsider', activityId: 'a1', passed: true })],
      'a1',
    )
    expect(summary.completed).toBe(0)
    expect(summary.notStarted).toBe(4)
  })
})

describe('studentEngagement', () => {
  const enrollments = [
    { id: 'e1', classId: 'c1', studentId: 'strong', status: 'active' as const, enrolledAt: '' },
    { id: 'e2', classId: 'c1', studentId: 'weak', status: 'active' as const, enrolledAt: '' },
    { id: 'e3', classId: 'c1', studentId: 'mid', status: 'active' as const, enrolledAt: '' },
    { id: 'e4', classId: 'c1', studentId: 'none', status: 'active' as const, enrolledAt: '' },
  ]

  it('segments students by their pass rate', () => {
    const rows = studentEngagement(enrollments, [
      attempt({ studentId: 'strong', passed: true }),
      attempt({ studentId: 'strong', passed: true }),
      attempt({ studentId: 'weak', passed: false }),
      attempt({ studentId: 'weak', passed: false }),
      attempt({ studentId: 'mid', passed: true }),
      attempt({ studentId: 'mid', passed: false }),
    ])
    const byId = new Map(rows.map((r) => [r.studentId, r]))

    expect(byId.get('strong')?.segment).toBe('completed')
    expect(byId.get('weak')?.segment).toBe('struggling')
    expect(byId.get('mid')?.segment).toBe('in-progress')
    expect(byId.get('none')?.segment).toBe('not-started')
  })

  it('does not call a single lucky pass "completed"', () => {
    const rows = studentEngagement(
      [{ id: 'e', classId: 'c', studentId: 'one-shot', status: 'active', enrolledAt: '' }],
      [attempt({ studentId: 'one-shot', passed: true })],
    )
    expect(rows[0].segment).toBe('in-progress')
  })

  it('collects the distinct misconceptions a student showed', () => {
    const rows = studentEngagement(
      [{ id: 'e', classId: 'c', studentId: 's', status: 'active', enrolledAt: '' }],
      [
        attempt({ studentId: 's', passed: false, misconceptionId: 'strict-boundary' }),
        attempt({ studentId: 's', passed: false, misconceptionId: 'strict-boundary' }),
        attempt({ studentId: 's', passed: false, misconceptionId: 'logic-error' }),
      ],
    )
    expect(rows[0].misconceptionIds.sort()).toEqual(['logic-error', 'strict-boundary'])
  })

  it('still lists a misconception from a passing attempt, matching the class panel', () => {
    const rows = studentEngagement(
      [{ id: 'e', classId: 'c', studentId: 's', status: 'active', enrolledAt: '' }],
      [attempt({ studentId: 's', passed: true, misconceptionId: 'assignment-in-condition' })],
    )
    expect(rows[0].misconceptionIds).toEqual(['assignment-in-condition'])
  })
})

describe('aggregateMisconceptions', () => {
  it('ranks by how many distinct students are affected', () => {
    const tallies = aggregateMisconceptions(
      [
        attempt({ studentId: 'a', passed: false, misconceptionId: 'strict-boundary' }),
        attempt({ studentId: 'b', passed: false, misconceptionId: 'strict-boundary' }),
        attempt({ studentId: 'c', passed: false, misconceptionId: 'logic-error' }),
      ],
      MISCONCEPTIONS,
    )

    expect(tallies[0].id).toBe('strict-boundary')
    expect(tallies[0].studentCount).toBe(2)
    expect(tallies[1].id).toBe('logic-error')
  })

  it('counts a passing attempt that was flagged, because the misconception is real', () => {
    const tallies = aggregateMisconceptions(
      [attempt({ passed: true, misconceptionId: 'assignment-in-condition' })],
      MISCONCEPTIONS,
    )
    expect(tallies).toHaveLength(1)
    expect(tallies[0].id).toBe('assignment-in-condition')
  })

  it('ignores attempts with no tag or an unknown tag', () => {
    const tallies = aggregateMisconceptions(
      [attempt({ misconceptionId: undefined }), attempt({ misconceptionId: 'not-a-thing' })],
      MISCONCEPTIONS,
    )
    expect(tallies).toEqual([])
  })

  it('carries the remediation hint and suggested activity through to the teacher', () => {
    const tallies = aggregateMisconceptions(
      [attempt({ passed: false, misconceptionId: 'assignment-in-condition' })],
      MISCONCEPTIONS,
    )
    expect(tallies[0].remediationHint).toBeTruthy()
    expect(tallies[0].recommendedActivityId).toBe('act-s04-cl-age')
  })
})

describe('buildActivitySkillMap', () => {
  it('indexes activities by id', () => {
    const map = buildActivitySkillMap([
      { id: 'x', skillIds: ['a', 'b'] },
      { id: 'y', skillIds: [] },
    ] as never)
    expect(map.x).toEqual(['a', 'b'])
    expect(map.y).toEqual([])
  })
})
