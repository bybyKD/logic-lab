import { describe, expect, it } from 'vitest'
import type { Activity, ChallengeActivity, CodeLabActivity, QuizActivity } from '../../domain'
import { LANGUAGE_ORDER } from '../../data/languages'
import { ACTIVITIES, SKILLS } from '../../data/seed'
import { canPublish, validateActivityDraft, type DraftContext } from './activityDraft'

const context: DraftContext = {
  knownSkillIds: new Set(SKILLS.map((s) => s.id)),
  knownLanguageIds: new Set<string>(LANGUAGE_ORDER),
}

const codeLab = ACTIVITIES.find((a) => a.id === 'act-s04-cl-age') as CodeLabActivity
const challenge = ACTIVITIES.find((a) => a.id === 'act-s04-c8') as ChallengeActivity
const lesson = ACTIVITIES.find((a) => a.kind === 'lesson')!
const quiz = ACTIVITIES.find((a) => a.kind === 'quiz') as QuizActivity
const interactive = ACTIVITIES.find((a) => a.kind === 'interactive')!

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const check = (original: Activity, draft: Activity) => validateActivityDraft(original, draft, context)
const allErrors = (original: Activity, draft: Activity) =>
  check(original, draft).filter((i) => i.severity === 'error')
const errorsFor = (original: Activity, draft: Activity, field: string) =>
  allErrors(original, draft).filter((i) => i.field === field)

describe('validateActivityDraft', () => {
  it('accepts the seeded activities unchanged', () => {
    for (const activity of ACTIVITIES) {
      const issues = check(activity, clone(activity))
      expect(issues.filter((i) => i.severity === 'error'), `${activity.id}`).toEqual([])
    }
  })

  it('requires a title, an objective and instructions', () => {
    const draft = { ...clone(codeLab), title: '  ', objective: '', instructions: '' }
    const fields = allErrors(codeLab, draft).map((i) => i.field)
    expect(fields).toEqual(expect.arrayContaining(['title', 'objective', 'instructions']))
  })

  it('requires a positive time estimate', () => {
    const draft = { ...clone(codeLab), estimatedMinutes: 0 }
    expect(errorsFor(codeLab, draft, 'estimatedMinutes')).toHaveLength(1)
  })

  it('allows an ungraded lesson to be worth zero points', () => {
    expect(lesson.points).toBe(0)
    expect(check(lesson, clone(lesson)).filter((i) => i.field === 'points')).toEqual([])
  })

  it('refuses to let an assessed activity be worth nothing', () => {
    const draft = { ...clone(codeLab), points: 0 }
    expect(errorsFor(codeLab, draft, 'points')).toHaveLength(1)
  })

  it('refuses negative points on anything', () => {
    const draft = { ...clone(lesson), points: -1 }
    expect(errorsFor(lesson, draft, 'points')[0].message).toMatch(/negative/)
  })

  it('requires at least one skill, so mastery can be attributed', () => {
    expect(errorsFor(codeLab, { ...clone(codeLab), skillIds: [] }, 'skillIds')).toHaveLength(1)
  })

  it('rejects a skill id that does not exist', () => {
    const issues = errorsFor(codeLab, { ...clone(codeLab), skillIds: ['not-a-skill'] }, 'skillIds')
    expect(issues[0].message).toMatch(/Unknown skill/)
  })

  it('warns rather than blocks on an over-long title', () => {
    const draft = { ...clone(codeLab), title: 'x'.repeat(200) }
    const issues = check(codeLab, draft).filter((i) => i.field === 'title')
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('warning')
    expect(canPublish(issues)).toBe(true)
  })

  it('refuses to change the kind of an activity that already has attempts', () => {
    const draft = { ...clone(codeLab), kind: 'quiz' } as unknown as Activity
    expect(errorsFor(codeLab, draft, 'kind')).toHaveLength(1)
  })
})

describe('challenge drafts', () => {
  it('needs at least two choices', () => {
    const draft = { ...clone(challenge), choices: [challenge.choices[0]] }
    expect(errorsFor(challenge, draft, 'choices').length).toBeGreaterThan(0)
  })

  it('needs a correct choice that exists, or nobody can pass', () => {
    const draft = { ...clone(challenge), correctChoiceId: 'nope' }
    const issue = errorsFor(challenge, draft, 'correctChoiceId')[0]
    expect(issue?.message).toMatch(/nobody can pass/)
  })

  it('rejects duplicate choice ids', () => {
    const draft = clone(challenge)
    draft.choices[1].id = draft.choices[0].id
    expect(allErrors(challenge, draft).map((i) => i.message).join(' ')).toMatch(/share an id/)
  })

  it('rejects a choice with no text', () => {
    const draft = clone(challenge)
    draft.choices[0].text = '   '
    expect(errorsFor(challenge, draft, 'choices').length).toBeGreaterThan(0)
  })
})

describe('code lab drafts', () => {
  it('needs a language the runtime can actually run', () => {
    const draft = { ...clone(codeLab), languages: ['python', 'brainfuck'] } as unknown as Activity
    const issue = allErrors(codeLab, draft).find((i) => i.message.includes('cannot run'))
    expect(issue).toBeDefined()
  })

  it('needs starter code for every allowed language', () => {
    const draft = clone(codeLab)
    draft.starterCode = { ...draft.starterCode, python: '' }
    expect(allErrors(codeLab, draft).map((i) => i.message).join(' ')).toMatch(/No starter code/)
  })

  it('needs at least one test case', () => {
    expect(errorsFor(codeLab, { ...clone(codeLab), testCases: [] }, 'testCases')).toHaveLength(1)
  })

  it('warns when there is no hidden case, since the visible one can be hard-coded', () => {
    const draft = clone(codeLab)
    draft.testCases = draft.testCases.map((t) => ({ ...t, hidden: false }))
    const issues = check(codeLab, draft).filter((i) => i.field === 'testCases')
    expect(issues[0].severity).toBe('warning')
    expect(canPublish(issues)).toBe(true)
  })

  it('rejects duplicate test case ids and a missing expected output', () => {
    const draft = clone(codeLab)
    draft.testCases[1].id = draft.testCases[0].id
    draft.testCases[0].expectedOutput = '  '
    const messages = allErrors(codeLab, draft).map((i) => i.message).join(' ')
    expect(messages).toMatch(/Duplicate test case id/)
    expect(messages).toMatch(/no expected output/)
  })

  it('rejects a test case with no weight', () => {
    const draft = clone(codeLab)
    draft.testCases[0].weight = 0
    expect(allErrors(codeLab, draft).map((i) => i.message).join(' ')).toMatch(/weight above zero/)
  })

  it('rejects two hints at the same order, which would hide one forever', () => {
    const draft = clone(codeLab)
    draft.hints[1].order = draft.hints[0].order
    expect(allErrors(codeLab, draft).map((i) => i.message).join(' ')).toMatch(/same order/)
  })
})

describe('other kinds', () => {
  it('needs content blocks on a lesson', () => {
    expect(errorsFor(lesson, { ...clone(lesson), blocks: [] }, 'blocks')).toHaveLength(1)
  })

  it('needs a snippet on an interactive', () => {
    expect(
      errorsFor(interactive, { ...clone(interactive), snippetIds: [] }, 'snippetIds'),
    ).toHaveLength(1)
  })

  it('needs a correct answer on every quiz question', () => {
    const draft = clone(quiz)
    draft.questions[0].correctChoiceId = 'missing'
    expect(allErrors(quiz, draft).map((i) => i.message).join(' ')).toMatch(/no correct choice/)
  })
})

describe('rubric validation', () => {
  it('rejects criteria that do not add up to maxPoints', () => {
    const draft = clone(codeLab)
    draft.rubric!.maxPoints = 99
    expect(allErrors(codeLab, draft).map((i) => i.message).join(' ')).toMatch(/add up to/)
  })

  it('rejects a criterion worth nothing', () => {
    const draft = clone(codeLab)
    draft.rubric!.criteria[0].maxPoints = 0
    draft.rubric!.maxPoints = draft.rubric!.criteria[1].maxPoints
    expect(allErrors(codeLab, draft).map((i) => i.message).join(' ')).toMatch(/more than zero/)
  })

  it('rejects a criterion with no levels to pick', () => {
    const draft = clone(codeLab)
    draft.rubric!.criteria[0].levels = []
    expect(allErrors(codeLab, draft).map((i) => i.message).join(' ')).toMatch(/no levels/)
  })

  it('warns on an empty rubric without blocking', () => {
    const draft = clone(codeLab)
    draft.rubric = { ...draft.rubric!, criteria: [], maxPoints: 0 }
    const issues = check(codeLab, draft).filter((i) => i.field === 'rubric')
    expect(issues[0].severity).toBe('warning')
  })
})

describe('a draft that came back from storage in a bad shape', () => {
  it('reports missing fields instead of throwing', () => {
    // Drafts are persisted as JSON and read back without a schema check, so the
    // validator has to survive a kind/fields mismatch rather than crash the
    // studio on a rename.
    const broken = {
      id: 'act-s04-cl-age',
      sectionId: 'sec-04',
      kind: 'quiz',
      title: 'Quiz',
      objective: 'o',
      instructions: 'i',
      difficulty: 'beginner',
      estimatedMinutes: 5,
      points: 5,
      skillIds: ['if-else'],
      order: 0,
      status: 'draft',
    } as unknown as Activity

    const issues = check(broken, broken)
    expect(issues.some((i) => i.field === 'questions')).toBe(true)
    expect(issues.filter((i) => i.severity === 'error').length).toBeGreaterThan(0)
  })

  it('reports a null list rather than reading through it', () => {
    const draft = { ...clone(codeLab), testCases: null, hints: null } as unknown as Activity
    const fields = allErrors(codeLab, draft).map((i) => i.field)
    expect(fields).toContain('testCases')
    expect(fields).toContain('hints')
  })

  it('survives a null choice inside the choices array', () => {
    const draft = {
      ...clone(challenge),
      choices: [challenge.choices[0], null, challenge.choices[1]],
    } as unknown as Activity
    expect(() => check(challenge, draft)).not.toThrow()
    expect(allErrors(challenge, draft).length).toBeGreaterThan(0)
  })
})

describe('canPublish', () => {
  it('is true only when no error survives', () => {
    expect(canPublish([])).toBe(true)
    expect(canPublish([{ field: 'a', message: 'm', severity: 'warning' }])).toBe(true)
    expect(canPublish([{ field: 'a', message: 'm', severity: 'error' }])).toBe(false)
  })
})
