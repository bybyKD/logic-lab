/**
 * The learning graph.
 *
 * Skills are concepts, not modules. They form a DAG so the platform can answer
 * "which concepts does this student understand?" instead of "which modules did
 * they finish?".
 */

export type SkillDomain =
  | 'computational-thinking'
  | 'variables'
  | 'operators'
  | 'control-flow'
  | 'functions'
  | 'data-structures'
  | 'algorithms'

export interface Skill {
  id: string
  name: string
  /** null for a domain root. */
  parentId: string | null
  domain: SkillDomain
  description: string
}

export type MasteryConfidence = 'low' | 'medium' | 'high'

/** Derived from Attempt evidence. Never authored by hand. */
export interface SkillMastery {
  skillId: string
  /** 0–100. */
  score: number
  evidenceCount: number
  lastPracticedAt: string
  confidence: MasteryConfidence
}

export type ProgressStatus =
  | 'not-started'
  | 'in-progress'
  | 'submitted'
  | 'graded'
  | 'mastered'

/** Derived per (student, activity) pair from Attempt records. */
export interface ActivityProgress {
  activityId: string
  studentId: string
  status: ProgressStatus
  bestScore: number
  attempts: number
  lastActivityAt?: string
}

export type CohortSegment = 'completed' | 'struggling' | 'in-progress' | 'not-started'

/** A recognised wrong mental model, e.g. using `=` where `==` was meant. */
export interface Misconception {
  id: string
  label: string
  description: string
  skillId: string
  /** Shown when the detector fires. */
  remediationHint: string
  /** Activity that addresses it, when one exists. */
  recommendedActivityId?: string
}
