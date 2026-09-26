/**
 * Course content, modelled as Course → Section → Activity.
 *
 * A course is NOT Module → Lesson. A teacher assembles a learning experience out
 * of ordered Activities, and each Activity declares the Skills it exercises so
 * the learning engine can derive mastery from evidence.
 */

import type { LanguageId } from '../data/languages'
import type { Hint, Rubric, TestCase } from './assessment'

export type ActivityKind =
  | 'lesson'
  | 'interactive'
  | 'codeLab'
  | 'challenge'
  | 'quiz'
  | 'assignment'
  | 'project'
  | 'simulation'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type ContentStatus = 'draft' | 'published'

export type VisualizerId = 'logicFlow' | 'languageCompare' | 'trace'

export interface Course {
  id: string
  code: string
  title: string
  description: string
  languageIds: LanguageId[]
  /** Root skills this course is built around. */
  skillIds: string[]
  status: ContentStatus
  version: number
  updatedAt: string
}

export interface Section {
  id: string
  courseId: string
  title: string
  summary: string
  order: number
  activityIds: string[]
}

export interface ActivityBase {
  id: string
  sectionId: string
  kind: ActivityKind
  title: string
  /** One sentence: what the learner should be able to do afterwards. */
  objective: string
  instructions: string
  difficulty: Difficulty
  estimatedMinutes: number
  skillIds: string[]
  points: number
  order: number
  status: ContentStatus
  /** Days after the activity is assigned before it is due. */
  dueOffsetDays?: number
  rubric?: Rubric
}

/**
 * Lesson content as typed blocks rather than markdown.
 *
 * Deliberate: rendering markdown would need a new dependency and would make
 * "interactive" blocks impossible to express.
 */
export type LessonBlock =
  | { kind: 'text'; heading?: string; body: string }
  | { kind: 'code'; language: LanguageId; caption?: string; code: string }
  | { kind: 'callout'; tone: 'info' | 'warning' | 'success'; body: string }
  | { kind: 'visualizer'; visualizer: VisualizerId; caption?: string }
  | { kind: 'check'; prompt: string; expected: string[] }

export interface LessonActivity extends ActivityBase {
  kind: 'lesson'
  blocks: LessonBlock[]
}

export interface InteractiveActivity extends ActivityBase {
  kind: 'interactive'
  visualizer: VisualizerId
  /** Ids into the code-example library the visualizer can display. */
  snippetIds: string[]
  guidance: string
}

export interface CodeLabActivity extends ActivityBase {
  kind: 'codeLab'
  languages: LanguageId[]
  starterCode: Partial<Record<LanguageId, string>>
  testCases: TestCase[]
  hints: Hint[]
  /** Plain-language description of what correct code must do. */
  expectedBehavior: string
}

export type ChallengeType = 'predict' | 'choose' | 'debug' | 'algorithm' | 'truth'

export interface ChallengeChoice {
  id: string
  /** A / B / C … shown on the choice card. */
  label: string
  text: string
}

export interface ChallengeActivity extends ActivityBase {
  kind: 'challenge'
  challengeType: ChallengeType
  prompt: string
  snippet: Partial<Record<LanguageId, string>>
  choices: ChallengeChoice[]
  correctChoiceId: string
  /** 1-based line the learner must identify in a `debug` challenge. */
  faultyLine?: number
  explanation: string
}

export interface QuizQuestion {
  id: string
  prompt: string
  choices: ChallengeChoice[]
  correctChoiceId: string
  explanation: string
  skillId?: string
}

export interface QuizActivity extends ActivityBase {
  kind: 'quiz'
  questions: QuizQuestion[]
  passMark: number
}

export interface AssignmentActivity extends ActivityBase {
  kind: 'assignment'
  brief: string
  deliverables: string[]
  languages: LanguageId[]
  starterCode: Partial<Record<LanguageId, string>>
  testCases: TestCase[]
  hints: Hint[]
  dueOffsetDays: number
  expectedBehavior: string
}

export interface ProjectMilestone {
  id: string
  title: string
  description: string
}

export interface ProjectActivity extends ActivityBase {
  kind: 'project'
  brief: string
  milestones: ProjectMilestone[]
  rubric: Rubric
  dueOffsetDays: number
}

export interface SimulationParameter {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
}

export interface SimulationActivity extends ActivityBase {
  kind: 'simulation'
  /** Identifier of the simulation model the runner should mount. */
  model: string
  parameters: SimulationParameter[]
  prompt: string
}

export type Activity =
  | LessonActivity
  | InteractiveActivity
  | CodeLabActivity
  | ChallengeActivity
  | QuizActivity
  | AssignmentActivity
  | ProjectActivity
  | SimulationActivity

/** Narrowing helper — `activity.kind === 'codeLab'` already narrows; this is
 *  for code that receives an untyped Activity from a repository. */
export function isActivityKind<K extends ActivityKind>(
  activity: Activity,
  kind: K,
): activity is Extract<Activity, { kind: K }> {
  return activity.kind === kind
}
