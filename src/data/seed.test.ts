import { describe, expect, it } from 'vitest'
import { SKILLS } from './seed/skills'
import { ACTIVITIES, SECTIONS, COURSE, SNIPPETS } from './seed/course'
import { ENROLLMENTS, STUDENTS, TEACHERS, LAB_CLASS } from './seed/people'
import {
  COHORT_PLAN,
  FOCUS_ACTIVITY_ID,
  buildSeedAttempts,
  buildSeedFeedback,
  buildSeedSubmissions,
} from './seed/attempts'
import { listSectionActivities, listSkillWithDescendants } from './selectors'
import type { Activity, Skill } from '../domain'
import {
  aggregateMisconceptions,
  buildActivitySkillMap,
  classProgressSummary,
} from '../services/learning/mastery'
import { MISCONCEPTIONS } from '../services/learning/misconceptions'

const NOW = Date.parse('2026-03-16T09:00:00.000Z')

const skillIds = new Set(SKILLS.map((s) => s.id))
const activityIds = new Set(ACTIVITIES.map((a) => a.id))
const snippetIds = new Set(SNIPPETS.map((s) => s.id))

describe('seed: skills', () => {
  it('has no broken parents or cycles', () => {
    for (const skill of SKILLS) {
      if (skill.parentId) {
        expect(skillIds.has(skill.parentId), `${skill.id} parent ${skill.parentId}`).toBe(true)
      }
      expect(skill.parentId).not.toBe(skill.id)
    }
  })

  it('resolves descendants depth-first without repeating a node', () => {
    for (const root of SKILLS.filter((s) => s.parentId === null)) {
      const chain = listSkillWithDescendants(root.id)
      expect(chain[0].id).toBe(root.id)
      expect(new Set(chain.map((s) => s.id)).size).toBe(chain.length)
    }
  })

  it('exposes the nesting the plan calls for', () => {
    const controlFlow = listSkillWithDescendants('control-flow').map((s) => s.id)
    expect(controlFlow).toContain('if-else')
    expect(controlFlow).toContain('nested-loops')
    expect(controlFlow.indexOf('conditionals')).toBeLessThan(controlFlow.indexOf('if-else'))
  })
})

describe('seed: course graph', () => {
  it('keeps every section inside the one course', () => {
    for (const section of SECTIONS) {
      expect(section.courseId).toBe(COURSE.id)
    }
  })

  it('places every activity in exactly one section and back-references correctly', () => {
    for (const activity of ACTIVITIES) {
      const owners = SECTIONS.filter((s) => s.activityIds.includes(activity.id))
      expect(owners.length, `${activity.id} section count`).toBe(1)
      expect(owners[0].id).toBe(activity.sectionId)
    }
  })

  it('lists section activities in the declared order', () => {
    for (const section of SECTIONS) {
      const listed = listSectionActivities(section.id).map((a) => a.id)
      expect(listed).toEqual(section.activityIds)
    }
  })

  it('only references known skills', () => {
    for (const activity of ACTIVITIES) {
      for (const skillId of activity.skillIds) {
        expect(skillIds.has(skillId), `${activity.id} → ${skillId}`).toBe(true)
      }
    }
  })

  it('gives code labs starter code in every declared language and both test kinds', () => {
    for (const activity of ACTIVITIES) {
      if (activity.kind !== 'codeLab') continue
      for (const language of activity.languages) {
        expect(activity.starterCode[language], `${activity.id}/${language}`).toBeTruthy()
      }
      expect(activity.testCases.some((t) => !t.hidden)).toBe(true)
      expect(activity.testCases.some((t) => t.hidden)).toBe(true)
      expect(activity.hints.length).toBeGreaterThan(0)
    }
  })

  it('resolves every interactive snippet and every answer id', () => {
    for (const activity of ACTIVITIES) {
      if (activity.kind === 'interactive') {
        for (const snippetId of activity.snippetIds) {
          expect(snippetIds.has(snippetId), `${activity.id} → ${snippetId}`).toBe(true)
        }
      }
      if (activity.kind === 'challenge') {
        expect(activity.choices.length).toBeGreaterThan(0)
        expect(activity.choices.some((c) => c.id === activity.correctChoiceId)).toBe(true)
      }
      if (activity.kind === 'quiz') {
        for (const question of activity.questions) {
          expect(question.choices.some((c) => c.id === question.correctChoiceId)).toBe(true)
        }
      }
    }
  })
})

describe('seed: people', () => {
  it('enrolls exactly the planned class size and nothing else', () => {
    expect(ENROLLMENTS).toHaveLength(42)
    expect(new Set(ENROLLMENTS.map((e) => e.studentId)).size).toBe(42)
  })

  it('only enrolls real students into a class with real teachers', () => {
    const studentIds = new Set(STUDENTS.map((s) => s.id))
    for (const enrollment of ENROLLMENTS) {
      expect(studentIds.has(enrollment.studentId)).toBe(true)
      expect(enrollment.classId).toBe(LAB_CLASS.id)
    }
    const teacherIds = new Set(TEACHERS.map((t) => t.id))
    for (const id of LAB_CLASS.teacherIds) {
      expect(teacherIds.has(id)).toBe(true)
    }
  })
})

describe('seed: learning history', () => {
  it('is deterministic for a fixed clock', () => {
    expect(buildSeedAttempts(NOW)).toEqual(buildSeedAttempts(NOW))
  })

  it('places attempts in the past relative to the clock it is given', () => {
    for (const attempt of buildSeedAttempts(NOW)) {
      expect(Date.parse(attempt.submittedAt)).toBeLessThanOrEqual(NOW)
    }
  })

  it('stays recent enough for the recency decay to matter', () => {
    const oldest = Math.min(
      ...buildSeedAttempts(NOW).map((a) => Date.parse(a.submittedAt)),
    )
    const ageDays = (NOW - oldest) / 86_400_000
    expect(ageDays).toBeLessThan(60)
  })

  it('only references known students and activities', () => {
    const studentIds = new Set(STUDENTS.map((s) => s.id))
    for (const attempt of buildSeedAttempts(NOW)) {
      expect(studentIds.has(attempt.studentId)).toBe(true)
      expect(activityIds.has(attempt.activityId)).toBe(true)
    }
  })

  it('never lets a passing attempt carry a score above 100', () => {
    for (const attempt of buildSeedAttempts(NOW)) {
      expect(attempt.score).toBeGreaterThanOrEqual(0)
      expect(attempt.score).toBeLessThanOrEqual(100)
    }
  })

  it('tags a misconception only where the submitted code proves it', () => {
    // A tag on a multiple-choice attempt would be a guess about why someone picked
    // a distractor. Only code-bearing attempts can carry a provable cause, so the
    // classroom panel's claims are traceable to something real.
    for (const attempt of buildSeedAttempts(NOW)) {
      if (attempt.misconceptionId) {
        expect(attempt.code, `${attempt.id} tagged without code`).toBeTruthy()
      }
    }
  })

  it('makes the lab the headline common issue, not a guess', () => {
    const tallies = aggregateMisconceptions(buildSeedAttempts(NOW), MISCONCEPTIONS)
    expect(tallies[0].id).toBe('assignment-in-condition')
    expect(tallies[0].studentCount).toBeGreaterThan(10)
  })

  it('derives the cohort split from the records rather than asserting it', () => {
    const summary = classProgressSummary(ENROLLMENTS, buildSeedAttempts(NOW), FOCUS_ACTIVITY_ID)
    expect(summary.enrolled).toBe(42)
    expect(summary.completed).toBe(COHORT_PLAN.completed)
    expect(summary.struggling).toBe(COHORT_PLAN.struggling)
    expect(summary.notStarted).toBe(COHORT_PLAN.notStarted)
  })

  it('leaves no enrolled student in a fourth bucket for the focus activity', () => {
    const summary = classProgressSummary(ENROLLMENTS, buildSeedAttempts(NOW), FOCUS_ACTIVITY_ID)
    expect(
      summary.completed + summary.struggling + summary.inProgress + summary.notStarted,
    ).toBe(summary.enrolled)
  })

  it('keeps submissions pointing at real attempts and feedback at real submissions', () => {
    const attempts = buildSeedAttempts(NOW)
    const submissions = buildSeedSubmissions(attempts)
    const attemptIds = new Set(attempts.map((a) => a.id))
    for (const submission of submissions) {
      expect(attemptIds.has(submission.attemptId)).toBe(true)
    }
    const submissionIds = new Set(submissions.map((s) => s.id))
    for (const feedback of buildSeedFeedback(submissions, NOW)) {
      expect(submissionIds.has(feedback.submissionId)).toBe(true)
      expect(feedback.body.length).toBeGreaterThan(0)
    }
  })
})

describe('seed: activity skill map', () => {
  it('maps every activity to its declared skills', () => {
    const map = buildActivitySkillMap(ACTIVITIES as Activity[])
    expect(Object.keys(map)).toHaveLength(ACTIVITIES.length)
    for (const activity of ACTIVITIES) {
      expect(map[activity.id]).toEqual(activity.skillIds)
    }
  })

  it('gives at least one activity a single specific skill', () => {
    const single = ACTIVITIES.filter((a) => a.skillIds.length === 1)
    expect(single.length).toBeGreaterThan(0)
    for (const activity of single) {
      const skill = SKILLS.find((s: Skill) => s.id === activity.skillIds[0])
      expect(skill).toBeDefined()
    }
  })
})
