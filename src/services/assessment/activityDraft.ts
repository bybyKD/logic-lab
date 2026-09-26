import type {
  Activity,
  ActivityKind,
  AssignmentActivity,
  ChallengeActivity,
  ChallengeChoice,
  CodeLabActivity,
  Difficulty,
  Hint,
  InteractiveActivity,
  LessonActivity,
  LessonBlock,
  QuizActivity,
  QuizQuestion,
  Rubric,
  TestCase,
} from '../../domain'
import type { LanguageId } from '../../data/languages'

/**
 * Validating what a teacher typed in the Content Studio.
 *
 * Publishing content that a student then cannot complete is the expensive
 * mistake, so the checks are about whether the activity is *usable*, not about
 * style. Each kind is held to its own rule because a lesson has no answer key and
 * a challenge without one is unpassable.
 */

export interface DraftIssue {
  field: string
  message: string
  /** Publishing is blocked by errors; warnings only nag. */
  severity: 'error' | 'warning'
}

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced']

/** Kinds a student is actually assessed on, as opposed to reading. */
const GRADED_KINDS = new Set<ActivityKind>([
  'codeLab',
  'challenge',
  'quiz',
  'assignment',
  'project',
])

/** Ids the studio lets a teacher add freely; anything else is a broken reference. */
export interface DraftContext {
  knownSkillIds: ReadonlySet<string>
  /** Languages the runtime can actually run, so a lab cannot be authored unusable. */
  knownLanguageIds: ReadonlySet<string>
}

const blank = (value: string | undefined | null): boolean => !value || value.trim().length === 0

export function validateActivityDraft(
  original: Activity,
  draft: Activity,
  context: DraftContext,
): DraftIssue[] {
  const issues: DraftIssue[] = []

  const requireText = (field: string, value: string | undefined | null, label: string) => {
    if (blank(value)) issues.push({ field, message: `${label} is required.`, severity: 'error' })
  }

  requireText('title', draft.title, 'Title')
  requireText('objective', draft.objective, 'Learning objective')
  requireText('instructions', draft.instructions, 'Instructions')

  if (blank(draft.title)) {
    // already reported
  } else if (draft.title.trim().length > 120) {
    issues.push({
      field: 'title',
      message: 'Titles over 120 characters get truncated in every list.',
      severity: 'warning',
    })
  }

  if (!DIFFICULTIES.includes(draft.difficulty)) {
    issues.push({ field: 'difficulty', message: 'Pick a difficulty.', severity: 'error' })
  }

  if (!Number.isFinite(draft.estimatedMinutes) || draft.estimatedMinutes <= 0) {
    issues.push({
      field: 'estimatedMinutes',
      message: 'Time estimate must be greater than zero.',
      severity: 'error',
    })
  }

  if (!Number.isFinite(draft.points) || draft.points < 0) {
    issues.push({ field: 'points', message: 'Points cannot be negative.', severity: 'error' })
  } else if (GRADED_KINDS.has(draft.kind) && draft.points === 0) {
    // Lessons and interactives are reading, and carry 0 points on purpose. An
    // assessed activity worth nothing is a grading mistake, not a style choice.
    issues.push({
      field: 'points',
      message: 'An assessed activity needs to be worth at least one point.',
      severity: 'error',
    })
  }

  if (draft.skillIds.length === 0) {
    issues.push({
      field: 'skillIds',
      message: 'Pick at least one skill, or mastery cannot be attributed.',
      severity: 'error',
    })
  }
  for (const skillId of draft.skillIds) {
    if (!context.knownSkillIds.has(skillId)) {
      issues.push({
        field: 'skillIds',
        message: `Unknown skill "${skillId}".`,
        severity: 'error',
      })
    }
  }

  if (draft.order < 0) {
    issues.push({ field: 'order', message: 'Order cannot be negative.', severity: 'error' })
  }

  issues.push(...validateKind(draft, context))
  issues.push(...validateRubric(draft.rubric))

  // Changing the kind of published content would orphan the attempts already
  // recorded against it, so it is flagged rather than silently allowed.
  if (draft.kind !== original.kind) {
    issues.push({
      field: 'kind',
      message: 'Changing the kind of an activity that already has attempts is not supported.',
      severity: 'error',
    })
  }

  return issues
}

/**
 * Reads a list off a draft that may have come back from `localStorage`.
 *
 * A persisted draft can disagree with its own `kind` — a `quiz` with no
 * `questions`, say, if a future field is renamed. Reporting that as a validation
 * error is the whole point of this function; letting it throw would take the
 * studio down instead of telling the teacher what is wrong.
 */
function listField<T>(
  value: unknown,
  field: string,
  label: string,
  issues: DraftIssue[],
): T[] {
  if (Array.isArray(value)) return value as T[]
  issues.push({
    field,
    message: `${label} are missing from this activity.`,
    severity: 'error',
  })
  return []
}

function validateKind(draft: Activity, context: DraftContext): DraftIssue[] {
  const issues: DraftIssue[] = []

  switch (draft.kind) {
    case 'challenge': {
      const choices = listField<ChallengeChoice>(
        (draft as ChallengeActivity).choices,
        'choices',
        'Choices',
        issues,
      )

      if (choices.length < 2) {
        issues.push({
          field: 'choices',
          message: 'A challenge needs at least two choices.',
          severity: 'error',
        })
      }
      if (!choices.some((choice) => choice?.id === draft.correctChoiceId)) {
        issues.push({
          field: 'correctChoiceId',
          message: 'Pick which choice is correct — otherwise nobody can pass.',
          severity: 'error',
        })
      }
      const ids = new Set(choices.map((choice) => choice?.id).filter(Boolean))
      if (ids.size !== choices.length) {
        issues.push({
          field: 'choices',
          message: 'Two choices share an id.',
          severity: 'error',
        })
      }
      for (const choice of choices) {
        if (!choice || blank(choice.text)) {
          issues.push({ field: 'choices', message: 'A choice has no text.', severity: 'error' })
        }
      }
      return issues
    }

    case 'codeLab':
    case 'assignment': {
      const lab = draft as CodeLabActivity | AssignmentActivity
      const languages = listField<LanguageId>(lab.languages, 'languages', 'Languages', issues)

      if (languages.length === 0) {
        issues.push({
          field: 'languages',
          message: 'Allow at least one language, or there is nothing to run.',
          severity: 'error',
        })
      }
      for (const language of languages) {
        if (!context.knownLanguageIds.has(language)) {
          issues.push({
            field: 'languages',
            message: `The runtime cannot run "${language}".`,
            severity: 'error',
          })
        }
        if (blank(lab.starterCode?.[language])) {
          issues.push({
            field: 'starterCode',
            message: `No starter code for ${language}.`,
            severity: 'error',
          })
        }
      }

      const testCases = listField<TestCase>(lab.testCases, 'testCases', 'Test cases', issues)

      if (testCases.length === 0) {
        issues.push({
          field: 'testCases',
          message: 'Add at least one test case.',
          severity: 'error',
        })
      }
      if (testCases.length > 0 && !testCases.some((testCase) => testCase?.hidden)) {
        issues.push({
          field: 'testCases',
          message: 'No hidden test case, so students can pass by hard-coding the visible one.',
          severity: 'warning',
        })
      }
      const caseIds = new Set<string>()
      for (const testCase of testCases) {
        if (!testCase) continue
        if (caseIds.has(testCase.id)) {
          issues.push({
            field: 'testCases',
            message: `Duplicate test case id "${testCase.id}".`,
            severity: 'error',
          })
        }
        caseIds.add(testCase.id)
        if (blank(testCase.expectedOutput)) {
          issues.push({
            field: 'testCases',
            message: `Test "${testCase.name}" has no expected output.`,
            severity: 'error',
          })
        }
        if (!Number.isFinite(testCase.weight) || testCase.weight <= 0) {
          issues.push({
            field: 'testCases',
            message: `Test "${testCase.name}" needs a weight above zero.`,
            severity: 'error',
          })
        }
      }

      const hints = listField<Hint>(lab.hints, 'hints', 'Hints', issues)
      const orders = hints.map((hint) => hint?.order).filter((o) => typeof o === 'number')
      if (orders.length > 0 && new Set(orders).size !== orders.length) {
        issues.push({
          field: 'hints',
          message: 'Two hints have the same order, so one will never be reached.',
          severity: 'error',
        })
      }
      for (const hint of hints) {
        if (!hint || blank(hint.text)) {
          issues.push({ field: 'hints', message: 'A hint has no text.', severity: 'error' })
        }
      }

      return issues
    }

    case 'quiz': {
      const questions = listField<QuizQuestion>(
        (draft as QuizActivity).questions,
        'questions',
        'Questions',
        issues,
      )

      if (questions.length === 0) {
        issues.push({ field: 'questions', message: 'Add at least one question.', severity: 'error' })
      }
      for (const question of questions) {
        if (!question) continue
        const choices = listField<ChallengeChoice>(question.choices, 'questions', 'Choices', issues)
        if (!choices.some((choice) => choice?.id === question.correctChoiceId)) {
          issues.push({
            field: 'questions',
            message: `Question "${question.prompt}" has no correct choice.`,
            severity: 'error',
          })
        }
      }
      return issues
    }

    case 'lesson': {
      const blocks = listField<LessonBlock>(
        (draft as LessonActivity).blocks,
        'blocks',
        'Content blocks',
        issues,
      )
      if (blocks.length === 0) {
        issues.push({
          field: 'blocks',
          message: 'A lesson with no content blocks shows an empty page.',
          severity: 'error',
        })
      }
      return issues
    }

    case 'interactive': {
      const snippetIds = listField<string>(
        (draft as InteractiveActivity).snippetIds,
        'snippetIds',
        'Code samples',
        issues,
      )
      if (snippetIds.length === 0) {
        issues.push({
          field: 'snippetIds',
          message: 'Pick a code sample for the visualizer to show.',
          severity: 'error',
        })
      }
      return issues
    }

    default:
      return issues
  }
}

function validateRubric(rubric: Rubric | undefined): DraftIssue[] {
  if (!rubric) return []
  const issues: DraftIssue[] = []

  const summed = rubric.criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0)
  if (summed !== rubric.maxPoints) {
    issues.push({
      field: 'rubric',
      message: `Rubric criteria add up to ${summed}, but max points is ${rubric.maxPoints}.`,
      severity: 'error',
    })
  }
  for (const criterion of rubric.criteria) {
    if (criterion.levels.length === 0) {
      issues.push({
        field: 'rubric',
        message: `Criterion "${criterion.label}" has no levels to pick from.`,
        severity: 'error',
      })
    }
    if (criterion.maxPoints <= 0) {
      issues.push({
        field: 'rubric',
        message: `Criterion "${criterion.label}" must be worth more than zero.`,
        severity: 'error',
      })
    }
  }
  if (rubric.criteria.length === 0) {
    issues.push({
      field: 'rubric',
      message: 'A rubric with no criteria cannot be scored.',
      severity: 'warning',
    })
  }

  return issues
}

/** True when nothing blocks publishing. */
export function canPublish(issues: DraftIssue[]): boolean {
  return !issues.some((issue) => issue.severity === 'error')
}

export const KINDS: ActivityKind[] = [
  'lesson',
  'interactive',
  'codeLab',
  'challenge',
  'quiz',
  'assignment',
  'project',
  'simulation',
]
