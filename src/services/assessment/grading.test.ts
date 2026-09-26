import { describe, expect, it } from 'vitest'
import type { Activity, Submission } from '../../domain'
import { ACTIVITIES, ENROLLMENTS, LAB_CLASS, STUDENTS } from '../../data/seed'
import {
  autoScore,
  gradeSubmission,
  isPending,
  resolveScore,
  rubricMaxPoints,
  rubricPercentage,
} from './grading'

const NOW = Date.parse('2026-03-16T09:00:00.000Z')

const codeLab = ACTIVITIES.find((a) => a.id === 'act-s04-cl-age')!
const challenge = ACTIVITIES.find((a) => a.id === 'act-s04-c8')!

const submissionFor = (over: Partial<Submission> = {}): Submission => ({
  id: 'sub-1',
  activityId: codeLab.id,
  studentId: STUDENTS[0].id,
  attemptId: 'att-1',
  status: 'submitted',
  submittedAt: new Date(NOW - 86_400_000).toISOString(),
  score: 80,
  ...over,
})

describe('rubricMaxPoints', () => {
  it('is null for an activity with no rubric rather than zero', () => {
    expect(rubricMaxPoints(challenge)).toBeNull()
  })

  it('reports the rubric ceiling when there is one', () => {
    expect(rubricMaxPoints(codeLab)).toBe(codeLab.rubric!.maxPoints)
  })
})

describe('autoScore', () => {
  it('uses the score already on the submission', () => {
    expect(autoScore(submissionFor({ score: 80 }))).toBe(80)
  })

  it('clamps a score that escaped its range', () => {
    expect(autoScore(submissionFor({ score: 140 }))).toBe(100)
    expect(autoScore(submissionFor({ score: -20 }))).toBe(0)
  })
})

describe('rubricPercentage', () => {
  const rubric = codeLab.rubric!

  it('is null when the teacher has not scored anything yet', () => {
    expect(rubricPercentage(rubric, undefined)).toBeNull()
  })

  it('is 100 when every criterion is at full marks', () => {
    const full = Object.fromEntries(rubric.criteria.map((c) => [c.id, c.maxPoints]))
    expect(rubricPercentage(rubric, full)).toBe(100)
  })

  it('is 0 when every criterion is at zero', () => {
    const zero = Object.fromEntries(rubric.criteria.map((c) => [c.id, 0]))
    expect(rubricPercentage(rubric, zero)).toBe(0)
  })

  it('weights criteria by their max points, not by counting them', () => {
    const [big, small] = rubric.criteria
    // Half marks on a 6-point criterion and none on the 4-point one.
    const scores = { [big.id]: 3, [small.id]: 0 }
    expect(rubricPercentage(rubric, scores)).toBe(30)
  })

  it('treats a missing criterion as zero rather than ignoring it', () => {
    const [big] = rubric.criteria
    expect(rubricPercentage(rubric, { [big.id]: big.maxPoints })).toBe(60)
  })

  it('clamps a score above the criterion ceiling', () => {
    const [big] = rubric.criteria
    // 999 clamps to that criterion's own 6, and the untouched 4-point criterion
    // counts as zero: 6 out of 10.
    expect(rubricPercentage(rubric, { [big.id]: 999 })).toBe(60)
  })
})

describe('resolveScore', () => {
  it('falls back to the submission score when the teacher types nothing', () => {
    expect(resolveScore(submissionFor({ score: 80 }), codeLab, {}).score).toBe(80)
  })

  it('uses the rubric when levels are picked', () => {
    const rubric = codeLab.rubric!
    const [big, small] = rubric.criteria
    const result = resolveScore(submissionFor({ score: 80 }), codeLab, {
      rubricScores: { [big.id]: big.maxPoints, [small.id]: 0 },
    })
    expect(result.score).toBe(60)
    expect(result.rubricScores).toEqual({ [big.id]: 6, [small.id]: 0 })
  })

  it('lets an explicit score override the rubric, as the more deliberate input', () => {
    const rubric = codeLab.rubric!
    const [big] = rubric.criteria
    const result = resolveScore(submissionFor({ score: 80 }), codeLab, {
      rubricScores: { [big.id]: 0 },
      scoreOverride: 95,
    })
    expect(result.score).toBe(95)
  })

  it('ignores a NaN override instead of grading a student NaN', () => {
    const result = resolveScore(submissionFor({ score: 80 }), codeLab, { scoreOverride: Number.NaN })
    expect(result.score).toBe(80)
  })

  it('rounds and clamps an override', () => {
    expect(resolveScore(submissionFor(), codeLab, { scoreOverride: 72.6 }).score).toBe(73)
    expect(resolveScore(submissionFor(), codeLab, { scoreOverride: 900 }).score).toBe(100)
    expect(resolveScore(submissionFor(), codeLab, { scoreOverride: -5 }).score).toBe(0)
  })

  it('drops rubric scores for an activity that has no rubric', () => {
    const result = resolveScore(submissionFor({ activityId: challenge.id, score: 100 }), challenge, {
      rubricScores: { 'made-up': 5 },
    })
    expect(result.rubricScores).toBeUndefined()
    expect(result.score).toBe(100)
  })

  it('strips unknown criteria from a stale form', () => {
    const rubric = codeLab.rubric!
    const [big] = rubric.criteria
    const result = resolveScore(submissionFor(), codeLab, {
      rubricScores: { [big.id]: 3, 'criterion-that-was-deleted': 10 },
    })
    expect(Object.keys(result.rubricScores!)).toEqual([big.id])
  })
})

describe('gradeSubmission', () => {
  it('marks the submission graded and records who and when', () => {
    const { submission } = gradeSubmission({
      submission: submissionFor({ score: 80 }),
      activity: challenge,
      input: {},
      gradedBy: 'teacher-01',
      now: NOW,
      feedbackId: 'fb-1',
    })

    expect(submission.status).toBe('graded')
    expect(submission.grade?.gradedBy).toBe('teacher-01')
    expect(submission.grade?.gradedAt).toBe(new Date(NOW).toISOString())
    expect(submission.grade?.maxScore).toBe(100)
  })

  it('does not mutate the submission it was given', () => {
    const original = submissionFor({ score: 80 })
    const snapshot = { ...original }
    gradeSubmission({
      submission: original,
      activity: challenge,
      input: { scoreOverride: 10 },
      gradedBy: 'teacher-01',
      now: NOW,
      feedbackId: 'fb-1',
    })
    expect(original).toEqual(snapshot)
  })

  it('keeps the attemptId, so a grade stays traceable to its code', () => {
    const { submission } = gradeSubmission({
      submission: submissionFor(),
      activity: challenge,
      input: {},
      gradedBy: 'teacher-01',
      now: NOW,
      feedbackId: 'fb-1',
    })
    expect(submission.attemptId).toBe('att-1')
  })

  it('writes no feedback when the teacher left no comment', () => {
    const { feedback } = gradeSubmission({
      submission: submissionFor(),
      activity: challenge,
      input: {},
      gradedBy: 'teacher-01',
      now: NOW,
      feedbackId: 'fb-1',
    })
    expect(feedback).toBeNull()
  })

  it('writes teacher feedback for a comment, ignoring whitespace', () => {
    const { feedback } = gradeSubmission({
      submission: submissionFor(),
      activity: challenge,
      input: { comment: '  Good use of the else branch.  ' },
      gradedBy: 'teacher-01',
      now: NOW,
      feedbackId: 'fb-1',
    })
    expect(feedback).toMatchObject({
      id: 'fb-1',
      submissionId: 'sub-1',
      authorId: 'teacher-01',
      authorRole: 'teacher',
      kind: 'comment',
      body: 'Good use of the else branch.',
    })
    expect(feedback?.createdAt).toBe(new Date(NOW).toISOString())
  })

  it('treats a whitespace-only comment as no comment', () => {
    const { feedback } = gradeSubmission({
      submission: submissionFor(),
      activity: challenge,
      input: { comment: '   \n  ' },
      gradedBy: 'teacher-01',
      now: NOW,
      feedbackId: 'fb-1',
    })
    expect(feedback).toBeNull()
  })

  it('carries the rubric breakdown onto the grade', () => {
    const rubric = codeLab.rubric!
    const scores = Object.fromEntries(rubric.criteria.map((c) => [c.id, c.maxPoints]))
    const { submission } = gradeSubmission({
      submission: submissionFor(),
      activity: codeLab,
      input: { rubricScores: scores },
      gradedBy: 'teacher-01',
      now: NOW,
      feedbackId: 'fb-1',
    })
    expect(submission.score).toBe(100)
    expect(submission.grade?.rubricScores).toEqual(scores)
  })

  it('grades a challenge with no rubric as a plain score', () => {
    const { submission, feedback } = gradeSubmission({
      submission: submissionFor({ activityId: challenge.id, score: 100 }),
      activity: challenge,
      input: { comment: 'Nice.' },
      gradedBy: 'teacher-01',
      now: NOW,
      feedbackId: 'fb-2',
    })
    expect(submission.score).toBe(100)
    expect(submission.grade?.rubricScores).toBeUndefined()
    expect(feedback?.kind).toBe('comment')
  })

  it('is deterministic for a fixed clock', () => {
    const args = {
      submission: submissionFor(),
      activity: challenge,
      input: { comment: 'Same note.' },
      gradedBy: 'teacher-01',
      now: NOW,
      feedbackId: 'fb-1',
    }
    expect(gradeSubmission(args)).toEqual(gradeSubmission(args))
  })
})

describe('isPending', () => {
  it('is true for an untouched submission', () => {
    expect(isPending(submissionFor())).toBe(true)
  })

  it('is true when the status drifted but no grade exists', () => {
    expect(isPending(submissionFor({ status: 'graded' }))).toBe(true)
  })

  it('is false once a grade is attached', () => {
    const graded = gradeSubmission({
      submission: submissionFor(),
      activity: challenge,
      input: {},
      gradedBy: 'teacher-01',
      now: NOW,
      feedbackId: 'fb-1',
    }).submission
    expect(isPending(graded)).toBe(false)
  })
})

describe('the seeded course can actually be graded', () => {
  it('gives every code lab a rubric the grading maths agrees with', () => {
    const labs = ACTIVITIES.filter((a: Activity) => a.kind === 'codeLab')
    expect(labs.length).toBeGreaterThan(0)
    for (const lab of labs) {
      const rubric = lab.rubric!
      const full = Object.fromEntries(rubric.criteria.map((c) => [c.id, c.maxPoints]))
      expect(rubricPercentage(rubric, full)).toBe(100)
      expect(rubricMaxPoints(lab)).toBe(rubric.maxPoints)
    }
  })

  it('has a teacher to attribute grades to, and enrolments that resolve', () => {
    expect(LAB_CLASS.teacherIds.length).toBeGreaterThan(0)
    const ids = new Set(STUDENTS.map((s) => s.id))
    expect(ENROLLMENTS.length).toBeGreaterThan(0)
    expect(ENROLLMENTS.every((e) => ids.has(e.studentId))).toBe(true)
  })
})
