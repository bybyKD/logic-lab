/**
 * Assessment entities: what a learner does, what evidence it produces, and how
 * a teacher responds.
 *
 * These types are shared by the student loop (Phase 5) and the teacher loop
 * (Phase 4), so they are defined once here and imported by both.
 */

import type { ActivityKind } from './course'

export interface Hint {
  id: string
  /** 1 = first hint shown. Progressive hints are revealed in order. */
  order: number
  text: string
  skillId?: string
}

export interface TestCase {
  id: string
  name: string
  /** Hidden cases are not revealed to the learner before grading. */
  hidden: boolean
  input?: string
  expectedOutput: string
  skillId?: string
  /** Relative weight when scoring. Defaults to 1. */
  weight: number
}

/**
 * Whether a test case was actually checked.
 *
 * `not-evaluated` exists so a limitation of the execution environment is never
 * reported as a student failure. Treating an unrunnable case as `failed` would
 * feed a false negative into mastery and could mark a learner as struggling for
 * something the sandbox could not do.
 */
export type TestOutcomeStatus = 'passed' | 'failed' | 'not-evaluated'

export interface TestOutcome {
  testCaseId: string
  name: string
  hidden: boolean
  status: TestOutcomeStatus
  expected: string
  /** Empty when status is `not-evaluated`. */
  actual: string
  skillId?: string
  /**
   * Carried over from the test case so scoring does not have to re-look-up the
   * case. Defaults to 1.
   */
  weight: number
}

/** One learner's one try at one activity. The atomic unit of evidence. */
export interface Attempt {
  id: string
  activityId: string
  studentId: string
  kind: ActivityKind
  submittedAt: string
  language?: string
  code?: string
  /** Selected answer for quiz / challenge activities. */
  choiceId?: string
  /** Line numbers picked in a "find the bug" challenge. */
  selectedLines?: number[]
  passed: boolean
  /** 0–100, normalised across activity types. */
  score: number
  durationMs: number
  /** Ids of Hints revealed before this attempt. Evidence of struggle. */
  hintsUsed: string[]
  /** Set by the misconception detector when a failure is recognised. */
  misconceptionId?: string
}

export type SubmissionStatus = 'submitted' | 'graded'

export interface Grade {
  score: number
  maxScore: number
  /** Per-criterion score, keyed by RubricCriterion id. */
  rubricScores?: Record<string, number>
  gradedBy: string
  gradedAt: string
}

/** A graded (or awaiting grading) answer to an assigned activity. */
export interface Submission {
  id: string
  activityId: string
  studentId: string
  attemptId: string
  status: SubmissionStatus
  submittedAt: string
  grade?: Grade
  /** Convenience copy so lists need not join back to Attempt. */
  score: number
}

export type FeedbackAuthorRole = 'auto' | 'teacher'
export type FeedbackKind = 'comment' | 'rubric' | 'auto'

export interface Feedback {
  id: string
  submissionId: string
  authorId: string
  authorRole: FeedbackAuthorRole
  kind: FeedbackKind
  body: string
  createdAt: string
}

export interface RubricLevel {
  label: string
  points: number
  descriptor: string
}

export interface RubricCriterion {
  id: string
  label: string
  description: string
  maxPoints: number
  levels: RubricLevel[]
}

export interface Rubric {
  id: string
  title: string
  criteria: RubricCriterion[]
  maxPoints: number
}
