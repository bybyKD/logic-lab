import { describe, expect, it } from 'vitest'
import { CHALLENGES } from '../data/challenges'
import { ACTIVITIES, SECTIONS } from '../data/seed'
import { COURSE_ID } from '../data/seed/course'
import { CHALLENGES_REDIRECT, challengeRedirectTo, moduleRedirectTo } from './legacyRoutes'

/**
 * The legacy redirects are only useful if their targets exist.
 *
 * Asserting the resolved id resolves is the whole test: a redirect to an id the
 * seed never produced would send a learner to the catch-all landing page and look
 * like a broken link rather than like a bug in here.
 */

const ACTIVITY_IDS = new Set(ACTIVITIES.map((a) => a.id))
const SECTION_IDS = new Set(SECTIONS.map((s) => s.id))

describe('moduleRedirectTo', () => {
  it('sends a module to a real section and a real activity', () => {
    const target = moduleRedirectTo('4')!
    const match = /^\/learn\/c\/([^/]+)\/s\/([^/]+)\/a\/([^/]+)$/.exec(target)
    expect(match).not.toBeNull()
    const [, courseId, sectionId, activityId] = match!
    expect(courseId).toBe(COURSE_ID)
    expect(SECTION_IDS.has(sectionId)).toBe(true)
    expect(ACTIVITY_IDS.has(activityId)).toBe(true)
  })

  it('points at the section whose id matches the module number', () => {
    expect(moduleRedirectTo('4')).toContain('/s/sec-04/')
    expect(moduleRedirectTo('1')).toContain('/s/sec-01/')
  })

  it('lands on the lesson that opens that section', () => {
    const activityId = /\/a\/([^/]+)$/.exec(moduleRedirectTo('7')!)![1]
    const activity = ACTIVITIES.find((a) => a.id === activityId)!
    expect(activity.kind).toBe('lesson')
    expect(activity.sectionId).toBe('sec-07')
  })

  it('rejects anything that is not a module number', () => {
    for (const bad of ['0', '-1', 'abc', '', '4.5', 'NaN', '1e3']) {
      expect(moduleRedirectTo(bad)).toBeNull()
    }
  })
})

describe('challengeRedirectTo', () => {
  it('resolves every seeded challenge to a real activity', () => {
    for (const challenge of CHALLENGES) {
      const target = challengeRedirectTo(String(challenge.id))!
      const activityId = /\/a\/([^/]+)$/.exec(target)![1]
      expect(ACTIVITY_IDS.has(activityId), `challenge ${challenge.id} → ${activityId}`).toBe(true)
    }
  })

  it('keeps the activity in the section that holds the challenge', () => {
    const challenge = CHALLENGES[6]
    const activityId = /\/a\/([^/]+)$/.exec(challengeRedirectTo(String(challenge.id))!)![1]
    const activity = ACTIVITIES.find((a) => a.id === activityId)!
    expect(activity.sectionId).toBe(`sec-${String(challenge.moduleId).padStart(2, '0')}`)
  })

  it('rejects a challenge id that does not exist instead of guessing', () => {
    expect(challengeRedirectTo('9999')).toBeNull()
    expect(challengeRedirectTo('nope')).toBeNull()
    expect(challengeRedirectTo('')).toBeNull()
  })
})

describe('CHALLENGES_REDIRECT', () => {
  it('points at the dashboard, which is what replaced the index', () => {
    expect(CHALLENGES_REDIRECT).toBe('/learn')
  })
})
