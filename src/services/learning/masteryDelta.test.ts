import { describe, expect, it } from 'vitest'
import { ACTIVITIES, SKILLS } from '../../data/seed'
import type { Attempt } from '../../domain'
import { buildActivitySkillMap } from './mastery'
import { deltaTone, masteryDeltaForAttempt, type SkillDelta } from './masteryDelta'

const NOW = Date.parse('2026-03-18T10:00:00.000Z')
const SKILL_MAP = buildActivitySkillMap(ACTIVITIES)
const CODE_LAB = 'act-s04-cl-age'

const attempt = (over: Partial<Attempt> = {}): Attempt => ({
  id: 'att-new',
  activityId: CODE_LAB,
  studentId: 'student-001',
  kind: 'codeLab',
  submittedAt: new Date(NOW).toISOString(),
  passed: true,
  score: 100,
  durationMs: 1000,
  hintsUsed: [],
  ...over,
})

const deltaFor = (attempts: Attempt[], over: Partial<Attempt> = {}) =>
  masteryDeltaForAttempt({
    attempts,
    attempt: attempt(over),
    skills: SKILLS,
    activitySkills: SKILL_MAP,
    now: NOW,
  })

const find = (deltas: SkillDelta[], skillId: string): SkillDelta | undefined =>
  deltas.find((d) => d.skillId === skillId)

describe('masteryDeltaForAttempt', () => {
  it('moves the skills an ordering challenge declares', () => {
    const deltas = deltaFor([], { activityId: 'act-s10-alg-largest' })
    expect(find(deltas, 'algorithm-design')!.delta).toBeGreaterThan(0)
    expect(find(deltas, 'decomposition')!.delta).toBeGreaterThan(0)
  })

  it('moves the skills a debug challenge declares', () => {
    const deltas = deltaFor([], { activityId: 'act-s10-dbg-accumulator' })
    expect(find(deltas, 'debugging')!.delta).toBeGreaterThan(0)
  })

  it('raises mastery on a first perfect score', () => {
    const deltas = deltaFor([])
    const ifElse = find(deltas, 'if-else')
    expect(ifElse).toBeDefined()
    expect(ifElse!.delta).toBeGreaterThan(0)
    expect(ifElse!.after).toBe(ifElse!.before + ifElse!.delta)
    expect(ifElse!.evidenceCount).toBe(1)
  })

  it('names the skill rather than only its id', () => {
    const deltas = deltaFor([])
    expect(find(deltas, 'if-else')!.name).toBe('if / else')
  })

  it('rolls the gain up into the parent skills', () => {
    const deltas = deltaFor([])
    // `if-else` sits under `conditionals`, which sits under `control-flow`.
    expect(find(deltas, 'conditionals')).toBeDefined()
    expect(find(deltas, 'control-flow')).toBeDefined()
  })

  it('counts the attempt as evidence even when it does not move the score', () => {
    // Two identical perfect attempts: the mean stays 100, but the evidence grows,
    // which is what promotes confidence from low to medium.
    const first = attempt({ id: 'att-1', submittedAt: new Date(NOW - 86_400_000).toISOString() })
    const deltas = deltaFor([first])
    const ifElse = find(deltas, 'if-else')
    expect(ifElse).toBeDefined()
    expect(ifElse!.delta).toBe(0)
    expect(ifElse!.evidenceCount).toBe(2)
  })

  it('discounts a score reached only after revealing hints', () => {
    const withHints = masteryDeltaForAttempt({
      attempts: [],
      attempt: attempt({ hintsUsed: ['h1', 'h2'] }),
      skills: SKILLS,
      activitySkills: SKILL_MAP,
      now: NOW,
    }).find((d) => d.skillId === 'if-else')
    const without = deltaFor([]).find((d) => d.skillId === 'if-else')!
    expect(withHints!.after).toBeLessThan(without.after)
  })

  it('lowers mastery when a strong learner has a bad attempt', () => {
    const good = attempt({
      id: 'att-1',
      score: 100,
      submittedAt: new Date(NOW - 2 * 86_400_000).toISOString(),
    })
    const deltas = deltaFor([good], { id: 'att-2', score: 0, passed: false })
    expect(find(deltas, 'if-else')!.delta).toBeLessThan(0)
  })

  it('sorts the largest movement first so a short list stays informative', () => {
    const deltas = deltaFor([])
    const magnitudes = deltas.map((d) => Math.abs(d.delta))
    expect(magnitudes).toEqual([...magnitudes].sort((a, b) => b - a))
  })

  it('is stable across calls, because it is derived from persisted attempts', () => {
    const attempts = [attempt({ id: 'att-1' })]
    expect(deltaFor(attempts, { id: 'att-2' })).toEqual(deltaFor(attempts, { id: 'att-2' }))
  })

  it('ignores attempts for activities outside the supplied skill map', () => {
    const stray = attempt({ id: 'att-x', activityId: 'act-that-was-deleted' })
    expect(deltaFor([stray], { activityId: 'act-that-was-deleted' })).toEqual([])
  })
})

describe('deltaTone', () => {
  it('names the three directions', () => {
    expect(deltaTone(5)).toBe('up')
    expect(deltaTone(-5)).toBe('down')
    expect(deltaTone(0)).toBe('flat')
  })
})
