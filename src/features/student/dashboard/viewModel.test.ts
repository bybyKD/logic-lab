import { describe, expect, it } from 'vitest'
import type {
  Activity,
  Attempt,
  Course,
  Feedback,
  Section,
  Skill,
  Student,
  Submission,
} from '../../../domain'
import {
  buildLearnDashboard,
  buildSkillForest,
  computeDashboardStats,
  dashboardStatTiles,
  dayKey,
  orderedActivities,
  pickContinueTarget,
  pickRecommended,
  practiceStreakDays,
  type OrderedActivity,
} from './viewModel'

/**
 * Synthetic records only.
 *
 * The point of these tests is that the dashboard's numbers are *traceable*: a
 * fixture says exactly which attempts exist, and the assertion says exactly which
 * number they produce. Deriving the fixture from the real seed data would make
 * the suite pass while the learner in front of it has a different history.
 */

const NOW = Date.parse('2026-03-16T09:00:00.000Z')
const DAY = 86_400_000
const at = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString()

const STUDENT: Student = {
  id: 's1',
  role: 'student',
  name: 'Test Learner',
  email: 'test@example.com',
  cohort: '2026-A',
  joinedAt: at(90),
}

const COURSE: Course = {
  id: 'c1',
  code: 'LOGIC-101',
  title: 'Logic',
  description: '',
  languageIds: ['python'],
  skillIds: ['domain'],
  status: 'published',
  version: 1,
  updatedAt: at(200),
}

const SKILLS: Skill[] = [
  { id: 'domain', name: 'Control flow', parentId: null, domain: 'control-flow', description: '' },
  { id: 'branching', name: 'Branching', parentId: 'domain', domain: 'control-flow', description: '' },
  { id: 'loops', name: 'Loops', parentId: 'domain', domain: 'control-flow', description: '' },
  { id: 'range-loop', name: 'Range loop', parentId: 'loops', domain: 'control-flow', description: '' },
  { id: 'unused', name: 'Unused', parentId: null, domain: 'variables', description: '' },
]

const section = (id: string, title: string, order: number): Section => ({
  id,
  courseId: 'c1',
  title,
  summary: '',
  order,
  activityIds: [],
})

const SECTIONS: Section[] = [section('sec-1', 'First', 1), section('sec-2', 'Second', 2)]

let activityCounter = 0
function activity(partial: Partial<Activity> & Pick<Activity, 'id' | 'sectionId'>): Activity {
  activityCounter += 1
  return {
    kind: 'codeLab',
    title: `Activity ${partial.id}`,
    objective: '',
    instructions: '',
    difficulty: 'core',
    estimatedMinutes: 10,
    skillIds: ['branching'],
    points: 10,
    order: activityCounter,
    status: 'published',
    ...partial,
  } as Activity
}

const ACTIVITIES: Activity[] = [
  activity({ id: 'a1', sectionId: 'sec-1', order: 1, skillIds: ['branching'] }),
  activity({ id: 'a2', sectionId: 'sec-1', order: 2, skillIds: ['loops', 'range-loop'] }),
  activity({ id: 'a3', sectionId: 'sec-2', order: 3, skillIds: ['branching'] }),
  activity({ id: 'draft', sectionId: 'sec-2', order: 4, status: 'draft' }),
]

let attemptCounter = 0
function attempt(partial: Partial<Attempt> & Pick<Attempt, 'activityId' | 'score'>): Attempt {
  attemptCounter += 1
  return {
    id: `att-${attemptCounter}`,
    studentId: 's1',
    kind: 'codeLab',
    submittedAt: at(1),
    passed: true,
    durationMs: 1000,
    hintsUsed: [],
    ...partial,
  }
}

let submissionCounter = 0
function submission(partial: Partial<Submission> & Pick<Submission, 'activityId'>): Submission {
  submissionCounter += 1
  return {
    id: `sub-${submissionCounter}`,
    studentId: 's1',
    attemptId: `att-${submissionCounter}`,
    status: 'submitted',
    submittedAt: at(1),
    score: 70,
    ...partial,
  }
}

function feedbackFor(submissionId: string, partial: Partial<Feedback> = {}): Feedback {
  return {
    id: `fb-${submissionId}`,
    submissionId,
    authorId: 't1',
    authorRole: 'teacher',
    kind: 'comment',
    body: 'Check the base case.',
    createdAt: at(1),
    ...partial,
  }
}

function build(overrides: Partial<Parameters<typeof buildLearnDashboard>[0]> = {}) {
  return buildLearnDashboard({
    student: STUDENT,
    course: COURSE,
    sections: SECTIONS,
    activities: ACTIVITIES,
    attempts: [],
    submissions: [],
    feedback: [],
    skills: SKILLS,
    authorNames: {},
    now: NOW,
    ...overrides,
  })
}

describe('orderedActivities', () => {
  it('orders by section then activity, not by id', () => {
    const ordered = orderedActivities(SECTIONS, ACTIVITIES).map((o) => o.activity.id)
    expect(ordered).toEqual(['a1', 'a2', 'a3'])
  })

  it('drops draft activities so teacher work-in-progress never reaches a learner', () => {
    const ordered = orderedActivities(SECTIONS, ACTIVITIES).map((o) => o.activity.id)
    expect(ordered).not.toContain('draft')
  })

  it('ignores activities whose section is not in the course', () => {
    const orphan = activity({ id: 'orphan', sectionId: 'sec-missing' })
    expect(orderedActivities(SECTIONS, [...ACTIVITIES, orphan])).toHaveLength(3)
  })

  it('breaks order ties on id so the resume card cannot jump between renders', () => {
    const tied = [
      activity({ id: 'zzz', sectionId: 'sec-1', order: 1 }),
      activity({ id: 'aaa', sectionId: 'sec-1', order: 1 }),
    ]
    expect(orderedActivities(SECTIONS, tied).map((o) => o.activity.id)).toEqual(['aaa', 'zzz'])
  })
})

describe('practiceStreakDays', () => {
  it('counts an unbroken run ending today', () => {
    expect(practiceStreakDays([dayKey(NOW), dayKey(NOW - DAY), dayKey(NOW - 2 * DAY)], NOW)).toBe(3)
  })

  it('keeps a run alive when today has no attempt yet', () => {
    expect(practiceStreakDays([dayKey(NOW - DAY), dayKey(NOW - 2 * DAY)], NOW)).toBe(2)
  })

  it('stops at a gap rather than counting the days before it', () => {
    expect(practiceStreakDays([dayKey(NOW), dayKey(NOW - 5 * DAY)], NOW)).toBe(1)
  })

  it('reports 0 when the last attempt is more than a day old', () => {
    expect(practiceStreakDays([dayKey(NOW - 3 * DAY)], NOW)).toBe(0)
  })

  it('reports 0 for no history at all', () => {
    expect(practiceStreakDays([], NOW)).toBe(0)
  })
})

describe('computeDashboardStats', () => {
  it('counts nothing as coverage when there are no attempts', () => {
    const stats = computeDashboardStats(
      [
        { activityId: 'a1', studentId: 's1', status: 'not-started', bestScore: 0, effectiveScore: 0, attempts: 0 },
      ],
      [],
      NOW,
    )
    expect(stats.coverage).toBe(0)
    expect(stats.averageBestScore).toBeNull()
    expect(stats.bestScore).toBeNull()
  })

  it('distinguishes "no attempts" from "scored zero" with a dash, not a 0', () => {
    const tiles = dashboardStatTiles(
      computeDashboardStats(
        [
          { activityId: 'a1', studentId: 's1', status: 'not-started', bestScore: 0, effectiveScore: 0, attempts: 0 },
        ],
        [],
        NOW,
      ),
    )
    const score = tiles.find((t) => t.id === 'average-score')
    expect(score?.value).toBe('—')
    expect(score?.hint).toBe('No scored attempts yet')
  })

  it('averages best scores rather than every attempt, so retries do not skew it', () => {
    const stats = computeDashboardStats(
      [
        { activityId: 'a1', studentId: 's1', status: 'mastered', bestScore: 100, effectiveScore: 100, attempts: 4 },
        { activityId: 'a2', studentId: 's1', status: 'submitted', bestScore: 60, effectiveScore: 60, attempts: 2 },
      ],
      [attempt({ activityId: 'a1', score: 100 }), attempt({ activityId: 'a2', score: 60 })],
      NOW,
    )
    expect(stats.averageBestScore).toBe(80)
    expect(stats.bestScore).toBe(100)
    expect(stats.coverage).toBe(100)
  })

  it('treats an activity with a failing attempt as touched', () => {
    const stats = computeDashboardStats(
      [
        { activityId: 'a1', studentId: 's1', status: 'in-progress', bestScore: 20, effectiveScore: 20, attempts: 1 },
        { activityId: 'a2', studentId: 's1', status: 'not-started', bestScore: 0, effectiveScore: 0, attempts: 0 },
      ],
      [attempt({ activityId: 'a1', score: 20 })],
      NOW,
    )
    expect(stats.touched).toBe(1)
    expect(stats.coverage).toBe(50)
  })
})

describe('pickContinueTarget', () => {
  const entry = (o: OrderedActivity) => o

  it('prefers unfinished work over untouched work', () => {
    const ordered = orderedActivities(SECTIONS, ACTIVITIES)
    const progress = new Map([
      ['a1', { activityId: 'a1', studentId: 's1', status: 'in-progress', bestScore: 40, effectiveScore: 40, attempts: 1 }],
      ['a2', { activityId: 'a2', studentId: 's1', status: 'not-started', bestScore: 0, effectiveScore: 0, attempts: 0 }],
    ] as const)
    expect(pickContinueTarget(ordered, progress)?.activity.id).toBe('a1')
    expect(pickContinueTarget(ordered, progress)?.reason).toBe('unfinished')
    expect(entry(ordered[0]).section.id).toBe('sec-1')
  })

  it('falls back to the next untouched activity when everything started is finished', () => {
    const ordered = orderedActivities(SECTIONS, ACTIVITIES)
    const progress = new Map([
      ['a1', { activityId: 'a1', studentId: 's1', status: 'mastered', bestScore: 100, effectiveScore: 100, attempts: 1 }],
      ['a2', { activityId: 'a2', studentId: 's1', status: 'graded', bestScore: 70, effectiveScore: 70, attempts: 1 }],
      ['a3', { activityId: 'a3', studentId: 's1', status: 'not-started', bestScore: 0, effectiveScore: 0, attempts: 0 }],
    ] as const)
    const target = pickContinueTarget(ordered, progress as unknown as ReadonlyMap<string, never>)
    expect(target?.activity.id).toBe('a3')
    expect(target?.reason).toBe('next-up')
  })

  it('offers the most recent activity for review rather than going blank', () => {
    const ordered = orderedActivities(SECTIONS, ACTIVITIES)
    const progress = new Map(
      ordered.map((o) => [
        o.activity.id,
        {
          activityId: o.activity.id,
          studentId: 's1',
          status: 'mastered',
          bestScore: 100,
          effectiveScore: 100,
          attempts: 1,
          lastActivityAt: o.activity.id === 'a2' ? at(0) : at(9),
        },
      ]),
    ) as unknown as ReadonlyMap<string, never>
    const target = pickContinueTarget(ordered, progress)
    expect(target?.activity.id).toBe('a2')
    expect(target?.reason).toBe('review')
  })

  it('returns null when there is no activity to point at', () => {
    expect(pickContinueTarget([], new Map())).toBeNull()
  })
})

describe('pickRecommended', () => {
  const ordered = orderedActivities(SECTIONS, ACTIVITIES)
  const progress = new Map(
    ordered.map((o) => [
      o.activity.id,
      { activityId: o.activity.id, studentId: 's1', status: 'not-started', bestScore: 0, effectiveScore: 0, attempts: 0 },
    ]),
  ) as unknown as ReadonlyMap<string, never>

  it('recommends an activity that practices the weak skill', () => {
    const mastery = [
      { skillId: 'branching', score: 30, evidenceCount: 2, lastPracticedAt: at(2), confidence: 'low' as const },
      { skillId: 'loops', score: 95, evidenceCount: 4, lastPracticedAt: at(1), confidence: 'high' as const },
    ]
    const rec = pickRecommended(mastery, SKILLS, ordered, progress)
    expect(rec[0].skill.id).toBe('branching')
    expect(['a1', 'a3']).toContain(rec[0].activity.id)
  })

  it('drills a child skill when the weak parent has no activity of its own', () => {
    const mastery = [
      { skillId: 'domain', score: 25, evidenceCount: 3, lastPracticedAt: at(2), confidence: 'low' as const },
    ]
    const rec = pickRecommended(mastery, SKILLS, ordered, progress)
    expect(rec).toHaveLength(1)
    expect(rec[0].skill.id).toBe('domain')
    expect(rec[0].drillsChild?.id).toBe('branching')
  })

  it('names the child it drills rather than leaking a slug', () => {
    const mastery = [
      { skillId: 'domain', score: 25, evidenceCount: 3, lastPracticedAt: at(2), confidence: 'low' as const },
    ]
    const rec = pickRecommended(mastery, SKILLS, ordered, progress)
    expect(rec[0].drillsChild?.name).toBe('Branching')
  })

  it('never recommends the same activity twice when skills share their only option', () => {
    // `domain` and `branching` overlap heavily: every branching activity is also a
    // domain activity. Recommending one of them twice reads as padding.
    const mastery = [
      { skillId: 'branching', score: 30, evidenceCount: 2, lastPracticedAt: at(2), confidence: 'low' as const },
      { skillId: 'domain', score: 35, evidenceCount: 3, lastPracticedAt: at(2), confidence: 'low' as const },
    ]
    const rec = pickRecommended(mastery, SKILLS, ordered, progress)
    const activityIds = rec.map((r) => r.activity.id)
    expect(new Set(activityIds).size).toBe(activityIds.length)
  })

  it('skips a weak skill whose every activity is already recommended', () => {
    // Two skills, one activity: the second weak skill has nothing left to offer
    // once the first has taken it, and must be dropped rather than duplicated.
    const overlapping: Skill[] = [
      { id: 'parent', name: 'Parent', parentId: null, domain: 'control-flow', description: '' },
      { id: 'twin', name: 'Twin', parentId: null, domain: 'control-flow', description: '' },
    ]
    const single = orderedActivities(SECTIONS, [
      activity({ id: 'only', sectionId: 'sec-1', order: 1, skillIds: ['parent', 'twin'] }),
    ])
    const onlyProgress = new Map([
      ['only', { activityId: 'only', studentId: 's1', status: 'not-started', bestScore: 0, effectiveScore: 0, attempts: 0 }],
    ]) as unknown as ReadonlyMap<string, never>
    const mastery = [
      { skillId: 'parent', score: 30, evidenceCount: 2, lastPracticedAt: at(2), confidence: 'low' as const },
      { skillId: 'twin', score: 35, evidenceCount: 2, lastPracticedAt: at(2), confidence: 'low' as const },
    ]

    const rec = pickRecommended(mastery, overlapping, single, onlyProgress)
    expect(rec).toHaveLength(1)
    expect(rec[0].skill.id).toBe('parent')
  })

  it('drops a weak skill with nothing published to practise', () => {
    const mastery = [
      { skillId: 'unused', score: 10, evidenceCount: 1, lastPracticedAt: at(2), confidence: 'low' as const },
    ]
    expect(pickRecommended(mastery, SKILLS, ordered, progress)).toEqual([])
  })

  it('never recommends work the learner already passed', () => {
    const mastery = [
      { skillId: 'branching', score: 30, evidenceCount: 2, lastPracticedAt: at(2), confidence: 'low' as const },
    ]
    const passed = new Map([
      ['a1', { activityId: 'a1', studentId: 's1', status: 'mastered', bestScore: 100, effectiveScore: 100, attempts: 1 }],
      ['a3', { activityId: 'a3', studentId: 's1', status: 'mastered', bestScore: 100, effectiveScore: 100, attempts: 1 }],
      ['a2', { activityId: 'a2', studentId: 's1', status: 'not-started', bestScore: 0, effectiveScore: 0, attempts: 0 }],
    ]) as unknown as ReadonlyMap<string, never>
    const rec = pickRecommended(mastery, SKILLS, ordered, passed)
    // branching is only on a1/a3, both passed, so there is nothing honest to offer.
    expect(rec).toEqual([])
  })
})

describe('buildSkillForest', () => {
  it('labels a skill with evidence but no activity of its own as a roll-up', () => {
    // `domain` is named by no activity, so a score there can only have come from
    // its children rolling up. Showing it as ordinary evidence would be a lie.
    const mastery = [{ skillId: 'domain', score: 60, evidenceCount: 2, lastPracticedAt: at(1), confidence: 'medium' as const }]
    const forest = buildSkillForest(SKILLS, mastery, ACTIVITIES)
    const domain = forest.find((g) => g.skill.id === 'domain')!
    expect(domain.role).toBe('rollup')
    expect(domain.children.every((c) => c.role === 'untouched')).toBe(true)
  })

  it('labels a skill that has its own evidence as practised', () => {
    const mastery = [{ skillId: 'branching', score: 55, evidenceCount: 2, lastPracticedAt: at(1), confidence: 'medium' as const }]
    const forest = buildSkillForest(SKILLS, mastery, ACTIVITIES)
    const branching = forest
      .find((g) => g.skill.id === 'domain')!
      .children.find((c) => c.skill.id === 'branching')!
    expect(branching.role).toBe('practised')
    expect(branching.activityCount).toBe(2)
  })

  it('nests depth 3 and counts the subtree', () => {
    const forest = buildSkillForest(SKILLS, [], ACTIVITIES)
    const domain = forest.find((g) => g.skill.id === 'domain')!
    expect(domain.subtreeSize).toBe(4)
    const rangeLoop = domain.children
      .find((c) => c.skill.id === 'loops')!
      .children.find((c) => c.skill.id === 'range-loop')!
    expect(rangeLoop.children).toEqual([])
  })

  it('does not count draft activities as practice targets', () => {
    const forest = buildSkillForest(SKILLS, [], ACTIVITIES)
    const branching = forest
      .find((g) => g.skill.id === 'domain')!
      .children.find((c) => c.skill.id === 'branching')!
    expect(branching.activityCount).toBe(2)
  })

  it('survives a cyclic graph instead of hanging', () => {
    const cyclic: Skill[] = [
      { id: 'x', name: 'X', parentId: 'y', domain: 'variables', description: '' },
      { id: 'y', name: 'Y', parentId: 'x', domain: 'variables', description: '' },
    ]
    expect(() => buildSkillForest(cyclic, [], [])).not.toThrow()
  })
})

describe('buildLearnDashboard', () => {
  it('derives every tile from the attempts it was given', () => {
    const dashboard = build({
      attempts: [
        attempt({ activityId: 'a1', score: 100, submittedAt: at(0) }),
        attempt({ activityId: 'a2', score: 60, passed: false, submittedAt: at(1) }),
        attempt({ activityId: 'a2', score: 40, passed: false, submittedAt: at(1) }),
      ],
    })

    expect(dashboard.stats.total).toBe(3)
    expect(dashboard.stats.attempts).toBe(3)
    expect(dashboard.stats.touched).toBe(2)
    expect(dashboard.stats.coverage).toBe(67)
    expect(dashboard.stats.averageBestScore).toBe(80)
    expect(dashboard.stats.streakDays).toBe(2)
    expect(dashboard.tiles.map((t) => t.value)).toEqual(['67%', '80', '1', '2d'])
  })

  it('points a brand new learner at the first activity and lists the rest', () => {
    const dashboard = build()
    expect(dashboard.continueWith?.activity.id).toBe('a1')
    expect(dashboard.continueWith?.reason).toBe('next-up')
    expect(dashboard.upNext.map((u) => u.activity.id)).toEqual(['a2', 'a3'])
    expect(dashboard.stats.coverage).toBe(0)
    expect(dashboard.tiles.find((t) => t.id === 'average-score')?.value).toBe('—')
    expect(dashboard.feedback).toEqual([])
    expect(dashboard.recommended).toEqual([])
    expect(dashboard.awaiting).toEqual([])
  })

  it('keeps awaiting-grade work out of up next and shows it as blocked', () => {
    const pending = submission({ activityId: 'a2', status: 'submitted' })
    const dashboard = build({
      attempts: [attempt({ activityId: 'a2', score: 60, passed: true })],
      submissions: [pending],
    })

    expect(dashboard.awaiting.map((w) => w.activity.id)).toEqual(['a2'])
    expect(dashboard.upNext.map((u) => u.activity.id)).not.toContain('a2')
    expect(dashboard.continueWith?.reason).toBe('awaiting-grade')
  })

  it('joins feedback back to the activity it is about and labels the author', () => {
    const graded = submission({ activityId: 'a1' })
    const dashboard = build({
      attempts: [attempt({ activityId: 'a1', score: 90 })],
      submissions: [graded],
      feedback: [
        feedbackFor(graded.id, { authorRole: 'teacher', authorId: 't1', body: 'Nice loop.' }),
        feedbackFor(graded.id, { id: 'fb-auto', authorRole: 'auto', authorId: 'system' }),
      ],
      authorNames: { t1: 'Pak Budi' },
    })

    expect(dashboard.feedback[0].authorName).toBe('Pak Budi')
    expect(dashboard.feedback[0].activityTitle).toBe('Activity a1')
    expect(dashboard.feedback[0].fromTeacher).toBe(true)
    expect(dashboard.feedback[1].authorName).toBe('Auto feedback')
    expect(dashboard.feedback[1].fromTeacher).toBe(false)
    expect(dashboard.awaiting[0].feedbackCount).toBe(2)
  })

  it('falls back to a generic author name for a teacher it cannot resolve', () => {
    const graded = submission({ activityId: 'a1' })
    const dashboard = build({
      attempts: [attempt({ activityId: 'a1', score: 90 })],
      submissions: [graded],
      feedback: [feedbackFor(graded.id, { authorId: 'teacher-999' })],
    })
    expect(dashboard.feedback[0].authorName).toBe('Your teacher')
  })

  it('still renders the skill graph for a learner with no history', () => {
    const dashboard = build()
    expect(dashboard.skillGroups.length).toBe(2)
    expect(dashboard.untouchedSkillCount).toBe(5)
  })

  it('reports untouched and total skills over the same population', () => {
    const dashboard = build()
    // The header divides one by the other, so they have to agree on what a "skill"
    // is. This failed once as "15 of 7 domains".
    expect(dashboard.totalSkillCount).toBe(5)
    expect(dashboard.untouchedSkillCount).toBeLessThanOrEqual(dashboard.totalSkillCount)
    expect(dashboard.skillGroups.length).toBeLessThanOrEqual(dashboard.totalSkillCount)
  })

  it('ignores another learner\'s attempts', () => {
    const other = attempt({ activityId: 'a1', score: 100, studentId: 's2' })
    const dashboard = build({ attempts: [other] })
    expect(dashboard.stats.touched).toBe(0)
  })
})
