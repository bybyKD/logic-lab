import { describe, expect, it } from 'vitest'
import type { Activity, Course, Section } from '../../../domain'
import { guardActivityOpenable } from './useActivityRunner'

/**
 * The four sentences a learner can be shown instead of a runner.
 *
 * They are worth asserting because they are the only errors on this screen that
 * are written for a person: everything else falls back to a generic line. A guard
 * that stops firing would quietly let a learner open a draft, so each one is
 * pinned here rather than trusted.
 */

const COURSE = { id: 'course-1', title: 'Logic Lab' } as Course
const SECTION = { id: 'sec-1', courseId: 'course-1' } as Section

const activity = (over: Partial<Activity> = {}): Activity =>
  ({
    id: 'act-1',
    sectionId: 'sec-1',
    kind: 'challenge',
    status: 'published',
    ...over,
  }) as Activity

const guard = (over: Partial<Parameters<typeof guardActivityOpenable>[0]> = {}) =>
  guardActivityOpenable({
    course: COURSE,
    activity: activity(),
    section: SECTION,
    courseId: 'course-1',
    sectionId: 'sec-1',
    ...over,
  })

describe('guardActivityOpenable', () => {
  it('lets a learner open a published activity in its own section', () => {
    expect(guard()).toBe(SECTION)
  })

  it('refuses an activity that belongs to another course', () => {
    expect(() => guard({ courseId: 'course-2' })).toThrow(/not part of Logic Lab/)
  })

  it('refuses a section that does not exist', () => {
    expect(() => guard({ section: undefined })).toThrow(/section does not exist/)
  })

  it('refuses an activity that is not in the section in the URL', () => {
    // The URL is the only thing tying the three ids together, so a mismatched
    // pair is a guess rather than a navigation.
    expect(() => guard({ activity: activity({ sectionId: 'sec-9' }) })).toThrow(
      /not in this section/,
    )
  })

  it('refuses a draft, so a teacher can work in progress without being seen', () => {
    expect(() => guard({ activity: activity({ status: 'draft' }) })).toThrow(
      /not been published/,
    )
  })

  it('checks the section before the activity, so a wrong section reads as a wrong section', () => {
    // Both are wrong at once; the learner should be told the one their URL got
    // wrong first rather than being sent after a draft that is not the problem.
    expect(() =>
      guard({ section: undefined, activity: activity({ sectionId: 'sec-9', status: 'draft' }) }),
    ).toThrow(/section does not exist/)
  })
})
