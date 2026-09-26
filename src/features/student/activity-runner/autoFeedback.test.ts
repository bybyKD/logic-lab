import { describe, expect, it } from 'vitest'
import { ACTIVITIES } from '../../../data/seed'
import type { ChallengeActivity, CodeLabActivity, TestOutcome } from '../../../domain'
import { autoFeedbackFor, codeLabFeedback, outcomeSummary } from './autoFeedback'

const codeLab = ACTIVITIES.find((a) => a.id === 'act-s04-cl-age') as CodeLabActivity
const challenge = ACTIVITIES.find((a) => a.id === 'act-s01-c1') as ChallengeActivity

const outcome = (
  testCaseId: string,
  name: string,
  status: TestOutcome['status'],
  hidden: boolean,
  expected: string,
  actual: string,
): TestOutcome => ({
  testCaseId,
  name,
  hidden,
  status,
  expected,
  actual,
  weight: hidden ? 2 : 1,
})

const passedVisible = outcome('v', 'age 20 prints Dewasa', 'passed', false, 'Dewasa', 'Dewasa')
const failedVisible = outcome('v', 'age 20 prints Dewasa', 'failed', false, 'Dewasa', 'Remaja')
const failedHidden = outcome('h', 'age 17 prints Remaja', 'failed', true, 'Remaja', 'Dewasa')
const skippedHidden = outcome('h', 'age 17 prints Remaja', 'not-evaluated', true, 'Remaja', '')

describe('codeLabFeedback', () => {
  it('writes one line per test case, not a single verdict', () => {
    const drafts = codeLabFeedback(codeLab, [passedVisible, failedHidden], 50)
    // Two cases plus the closing summary.
    expect(drafts).toHaveLength(3)
  })

  it('tells a failed visible case exactly what it wanted', () => {
    const [first] = codeLabFeedback(codeLab, [failedVisible], 0)
    expect(first.body).toContain('expected “Dewasa”')
    expect(first.body).toContain('got “Remaja”')
  })

  it('never reveals a hidden case input or expected output on failure', () => {
    // The seeded hidden cases are named after their answer, so a line saying
    // "Hidden test 1 failed" is fine but naming the input is not.
    const [first] = codeLabFeedback(codeLab, [failedHidden], 0)
    expect(first.body).toContain('Hidden test 1')
    expect(first.body).not.toContain('age 17')
    expect(first.body).not.toContain('Remaja')
  })

  it('says a case was not run rather than dropping it or calling it failed', () => {
    const [first] = codeLabFeedback(codeLab, [skippedHidden], 100)
    expect(first.body).toMatch(/could not be run/i)
    expect(first.body).not.toMatch(/failed/i)
  })

  it('repeats the expected behaviour on an imperfect score, as the next thing to try', () => {
    const drafts = codeLabFeedback(codeLab, [failedVisible], 0)
    expect(drafts[drafts.length - 1].body).toContain(codeLab.expectedBehavior)
  })

  it('confirms a clean run without repeating the brief', () => {
    const drafts = codeLabFeedback(codeLab, [passedVisible], 100)
    const last = drafts[drafts.length - 1].body
    expect(last).toContain('100%')
    expect(last).not.toContain(codeLab.expectedBehavior)
  })

  it('has nothing to say about a case that never ran', () => {
    const drafts = codeLabFeedback(codeLab, [], 0)
    expect(drafts).toHaveLength(1)
  })
})

describe('challengeFeedback', () => {
  it('gives a short verdict and then the seeded explanation', () => {
    const drafts = autoFeedbackFor({
      activity: challenge,
      score: 100,
      outcomes: [],
      pickedLabel: 'B',
    })
    expect(drafts).toHaveLength(2)
    expect(drafts[1].body).toBe(challenge.explanation)
  })

  it('names what the learner picked when they were wrong', () => {
    const drafts = autoFeedbackFor({
      activity: challenge,
      score: 0,
      outcomes: [],
      pickedLabel: 'A',
    })
    expect(drafts[0].body).toContain('A')
  })

  it('does not claim a pick when nothing was selected', () => {
    const drafts = autoFeedbackFor({
      activity: challenge,
      score: 0,
      outcomes: [],
      pickedLabel: null,
    })
    expect(drafts[0].body).toContain('nothing')
  })
})

describe('outcomeSummary', () => {
  it('counts each status', () => {
    expect(outcomeSummary([passedVisible, passedVisible, failedVisible, skippedHidden])).toBe(
      '2 passed · 1 failed · 1 not evaluated',
    )
  })

  it('says so when nothing was evaluated, instead of showing an empty summary', () => {
    expect(outcomeSummary([])).toBe('nothing was evaluated')
    expect(outcomeSummary([skippedHidden])).toBe('1 not evaluated')
  })
})
