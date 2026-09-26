import { describe, expect, it } from 'vitest'
import { ACTIVITIES, STUDENTS } from '../../../data/seed'
import type { ChallengeActivity, CodeLabActivity, TestOutcome } from '../../../domain'
import {
  buildAttempt,
  nextRecordId,
  resetRecordIdSequence,
  scoreChallenge,
  scoreCodeLab,
  scoreOrdering,
  selectedLinesFor,
} from './attemptScoring'

const NOW = Date.parse('2026-03-18T10:00:00.000Z')
const STUDENT = STUDENTS[0].id

const codeLab = ACTIVITIES.find((a) => a.id === 'act-s04-cl-age') as CodeLabActivity
const chooseChallenge = ACTIVITIES.find((a) => a.id === 'act-s01-c1') as ChallengeActivity
const debugChallenge = ACTIVITIES.find(
  (a) => a.id === 'act-s10-dbg-accumulator',
) as ChallengeActivity
const algorithmChallenge = ACTIVITIES.find(
  (a) => a.id === 'act-s10-alg-largest',
) as ChallengeActivity

const outcome = (
  testCaseId: string,
  status: TestOutcome['status'],
  hidden = false,
): TestOutcome => ({
  testCaseId,
  name: testCaseId,
  hidden,
  status,
  expected: 'Dewasa',
  actual: status === 'passed' ? 'Dewasa' : 'Remaja',
  weight: 1,
})

describe('scoreCodeLab', () => {
  it('is 100 when every evaluated case passed', () => {
    expect(scoreCodeLab([outcome('a', 'passed')])).toBe(100)
  })

  it('is 0 when every evaluated case failed', () => {
    expect(scoreCodeLab([outcome('a', 'failed')])).toBe(0)
  })

  it('ignores cases the runner could not evaluate', () => {
    // The prototype cannot run a hidden input, so a passing visible case must not
    // be dragged below 100 by a case that never ran.
    expect(scoreCodeLab([outcome('a', 'passed'), outcome('b', 'not-evaluated', true)])).toBe(100)
  })

  it('is null when nothing could be evaluated, so no attempt is recorded', () => {
    expect(scoreCodeLab([outcome('a', 'not-evaluated', true)])).toBeNull()
  })

  it('is null for an empty run rather than a misleading zero', () => {
    expect(scoreCodeLab([])).toBeNull()
  })

  it('weights a heavier case above a lighter one', () => {
    const outcomes: TestOutcome[] = [
      { ...outcome('light', 'passed'), weight: 1 },
      { ...outcome('heavy', 'failed'), weight: 3 },
    ]
    expect(scoreCodeLab(outcomes)).toBe(25)
  })
})

describe('scoreChallenge', () => {
  it('is 100 for the correct single answer', () => {
    const correct = chooseChallenge.correctChoiceId
    expect(scoreChallenge(chooseChallenge, { choiceId: correct })).toBe(100)
  })

  it('is 0 for a wrong single answer', () => {
    const wrong = chooseChallenge.choices.find((c) => c.id !== chooseChallenge.correctChoiceId)!
    expect(scoreChallenge(chooseChallenge, { choiceId: wrong.id })).toBe(0)
  })

  it('is null when a single-answer challenge has not been answered', () => {
    expect(scoreChallenge(chooseChallenge, {})).toBeNull()
  })

  it('scores an ordering challenge by position', () => {
    const solution = algorithmChallenge.choices.map((c) => c.id)
    expect(scoreChallenge(algorithmChallenge, { sequence: solution })).toBe(100)
    // Swap the first two steps: three of five positions still line up.
    const swapped = [solution[1], solution[0], ...solution.slice(2)]
    expect(scoreChallenge(algorithmChallenge, { sequence: swapped })).toBe(60)
  })

  it('is not 100 for an order that is merely a rotation of the right one', () => {
    // A program cannot start halfway through, so a rotated order is not a pass.
    const solution = algorithmChallenge.choices.map((c) => c.id)
    const rotated = [...solution.slice(2), ...solution.slice(0, 2)]
    expect(scoreChallenge(algorithmChallenge, { sequence: rotated })).toBeLessThan(100)
  })

  it('is null when an ordering challenge has not been arranged', () => {
    expect(scoreChallenge(algorithmChallenge, {})).toBeNull()
  })
})

describe('scoreOrdering', () => {
  it('awards nothing for an empty arrangement', () => {
    expect(scoreOrdering([], ['a', 'b', 'c'])).toBe(0)
  })

  it('gives partial credit for a mostly correct order', () => {
    expect(scoreOrdering(['a', 'b', 'x'], ['a', 'b', 'c'])).toBe(67)
  })

  it('penalises a short arrangement even when the prefix matches', () => {
    expect(scoreOrdering(['a'], ['a', 'b', 'c'])).toBe(33)
  })

  it('is 0 when there is nothing to compare against', () => {
    expect(scoreOrdering(['a'], [])).toBe(0)
  })
})

describe('selectedLinesFor', () => {
  it('reads the line number back out of a debug choice label', () => {
    expect(selectedLinesFor(debugChallenge, 'l4')).toEqual([4])
  })

  it('is undefined for a non-debug challenge', () => {
    expect(selectedLinesFor(chooseChallenge, chooseChallenge.correctChoiceId)).toBeUndefined()
  })

  it('is undefined for an unknown choice rather than a wrong line', () => {
    expect(selectedLinesFor(debugChallenge, 'nope')).toBeUndefined()
  })

  it('is undefined when a debug label is not a line number', () => {
    const broken: ChallengeActivity = {
      ...debugChallenge,
      choices: [{ id: 'x', label: 'not-a-line', text: 'q' }],
    }
    expect(selectedLinesFor(broken, 'x')).toBeUndefined()
  })
})

describe('buildAttempt', () => {
  it('records the evidence the learning engine reads', () => {
    const attempt = buildAttempt({
      activity: codeLab,
      studentId: STUDENT,
      attemptId: 'att-1',
      now: NOW,
      durationMs: 4200,
      hintsUsed: ['h1'],
      language: 'python',
      code: 'age = 20\n\nif age >= 18:\n    print("Dewasa")',
      outcomes: [outcome('a', 'passed')],
      score: 100,
    })

    expect(attempt).toMatchObject({
      id: 'att-1',
      activityId: codeLab.id,
      studentId: STUDENT,
      kind: 'codeLab',
      language: 'python',
      passed: true,
      score: 100,
      durationMs: 4200,
      hintsUsed: ['h1'],
      submittedAt: new Date(NOW).toISOString(),
    })
  })

  it('passes only on a perfect score, so a partial code lab is not "passed"', () => {
    const attempt = buildAttempt({
      activity: codeLab,
      studentId: STUDENT,
      attemptId: 'att-2',
      now: NOW,
      durationMs: 1000,
      hintsUsed: [],
      score: 50,
    })
    expect(attempt.passed).toBe(false)
  })

  it('copies the hint list instead of aliasing the caller array', () => {
    const hints = ['h1']
    const attempt = buildAttempt({
      activity: codeLab,
      studentId: STUDENT,
      attemptId: 'att-3',
      now: NOW,
      durationMs: 1,
      hintsUsed: hints,
      score: 100,
    })
    hints.push('h2')
    expect(attempt.hintsUsed).toEqual(['h1'])
  })

  it('leaves optional fields off entirely when the variant has no value for them', () => {
    const attempt = buildAttempt({
      activity: chooseChallenge,
      studentId: STUDENT,
      attemptId: 'att-4',
      now: NOW,
      durationMs: 1,
      hintsUsed: [],
      choiceId: chooseChallenge.correctChoiceId,
      score: 100,
    })
    expect('language' in attempt).toBe(false)
    expect('code' in attempt).toBe(false)
    expect('selectedLines' in attempt).toBe(false)
  })

  it('fills in the picked line for a debug challenge', () => {
    const attempt = buildAttempt({
      activity: debugChallenge,
      studentId: STUDENT,
      attemptId: 'att-5',
      now: NOW,
      durationMs: 1,
      hintsUsed: [],
      choiceId: 'l4',
      score: 100,
    })
    expect(attempt.selectedLines).toEqual([4])
  })

  it('tags a recognised wrong code so the classroom can explain it', () => {
    const attempt = buildAttempt({
      activity: codeLab,
      studentId: STUDENT,
      attemptId: 'att-6',
      now: NOW,
      durationMs: 1,
      hintsUsed: [],
      language: 'python',
      // Assigning inside the condition is the seed's own top misconception.
      code: 'age = 20\n\nif age = 18:\n    print("Dewasa")',
      outcomes: [outcome('a', 'failed')],
      score: 0,
    })
    expect(attempt.misconceptionId).toBe('assignment-in-condition')
  })

  it('does not guess a misconception for a challenge, which carries no code', () => {
    const attempt = buildAttempt({
      activity: chooseChallenge,
      studentId: STUDENT,
      attemptId: 'att-7',
      now: NOW,
      durationMs: 1,
      hintsUsed: [],
      choiceId: 'c0',
      score: 0,
    })
    expect(attempt.misconceptionId).toBeUndefined()
  })
})

describe('nextRecordId', () => {
  it('never repeats, even inside one millisecond', () => {
    resetRecordIdSequence()
    const ids = new Set([
      nextRecordId('att', NOW),
      nextRecordId('att', NOW),
      nextRecordId('att', NOW),
    ])
    expect(ids.size).toBe(3)
  })

  it('keeps the prefix so a record is identifiable by eye', () => {
    resetRecordIdSequence()
    expect(nextRecordId('sub', NOW).startsWith('sub-')).toBe(true)
  })
})
