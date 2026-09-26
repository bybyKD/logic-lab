import { describe, expect, it } from 'vitest'
import type { TestCase, TestOutcome } from '../../../domain'
import {
  describeOutcome,
  hiddenTestCount,
  viewOutcomes,
  viewTestCases,
} from './outcomeMasking'

const visibleCase: TestCase = {
  id: 'tc-visible',
  name: 'age 20 prints Dewasa',
  hidden: false,
  expectedOutput: 'Dewasa',
  skillId: 'if-else',
  weight: 1,
}

const hiddenCase: TestCase = {
  id: 'tc-hidden',
  name: 'age 17 prints Remaja',
  hidden: true,
  input: 'age = 17',
  expectedOutput: 'Remaja',
  skillId: 'if-else',
  weight: 2,
}

const cases = [visibleCase, hiddenCase]

const outcomeFor = (testCase: TestCase, status: TestOutcome['status']): TestOutcome => ({
  testCaseId: testCase.id,
  name: testCase.name,
  hidden: testCase.hidden,
  status,
  expected: testCase.expectedOutput,
  actual: status === 'passed' ? testCase.expectedOutput : 'Dewasa',
  skillId: testCase.skillId,
  weight: testCase.weight,
})

describe('viewTestCases', () => {
  it('shows a visible case in full, before anything has run', () => {
    const [view] = viewTestCases([visibleCase])
    expect(view).toMatchObject({
      label: 'age 20 prints Dewasa',
      hidden: false,
      expectedOutput: 'Dewasa',
    })
  })

  it('reduces a hidden case to its existence', () => {
    const [view] = viewTestCases([hiddenCase])
    expect(view).toMatchObject({ label: 'Hidden test 1', hidden: true })
    expect(view.expectedOutput).toBeNull()
    expect(view.input).toBeNull()
  })

  it('does not leak the answer through the hidden case name', () => {
    // The seeded hidden cases are named after what they expect, so masking the
    // expected output but keeping the name would hand over the answer.
    const [view] = viewTestCases([hiddenCase])
    expect(view.label).not.toContain('Remaja')
  })

  it('numbers the hidden cases so their order stays readable', () => {
    const second: TestCase = { ...hiddenCase, id: 'tc-hidden-2', name: 'age 9 prints Remaja' }
    const views = viewTestCases([hiddenCase, visibleCase, second])
    expect(views.map((v) => v.label)).toEqual([
      'Hidden test 1',
      'age 20 prints Dewasa',
      'Hidden test 2',
    ])
  })

  it('opens the real name and input only once the case is fully revealed', () => {
    const [view] = viewTestCases([hiddenCase], 'full')
    expect(view).toMatchObject({
      label: 'age 17 prints Remaja',
      expectedOutput: 'Remaja',
      input: 'age = 17',
    })
  })

  it('still hides a hidden case when only outcomes are revealed', () => {
    const [view] = viewTestCases([hiddenCase], 'status')
    expect(view.expectedOutput).toBeNull()
  })
})

describe('viewOutcomes', () => {
  it('shows a visible outcome in full', () => {
    const [view] = viewOutcomes([outcomeFor(visibleCase, 'failed')])
    expect(view).toMatchObject({
      label: 'age 20 prints Dewasa',
      status: 'failed',
      expected: 'Dewasa',
      actual: 'Dewasa',
    })
  })

  it('reveals a hidden outcome status but never its expected or actual value', () => {
    const [view] = viewOutcomes([outcomeFor(hiddenCase, 'failed')], 'status')
    expect(view.status).toBe('failed')
    expect(view.expected).toBeNull()
    expect(view.actual).toBeNull()
    expect(view.label).toBe('Hidden test 1')
  })

  it('opens a hidden outcome completely only at full reveal', () => {
    const [view] = viewOutcomes([outcomeFor(hiddenCase, 'passed')], 'full')
    expect(view).toMatchObject({ label: 'age 17 prints Remaja', expected: 'Remaja' })
  })

  it('keeps the weight, so the UI can explain why a case counts double', () => {
    const [view] = viewOutcomes([outcomeFor(hiddenCase, 'passed')])
    expect(view.weight).toBe(2)
  })

  it('carries an unevaluated hidden case through as unevaluated, not failed', () => {
    const [view] = viewOutcomes([outcomeFor(hiddenCase, 'not-evaluated')])
    expect(view.status).toBe('not-evaluated')
  })
})

describe('hiddenTestCount', () => {
  it('counts only the hidden cases', () => {
    expect(hiddenTestCount(cases)).toBe(1)
    expect(hiddenTestCount([visibleCase])).toBe(0)
  })
})

describe('describeOutcome', () => {
  it('blames the runner, not the learner, for an unevaluated case', () => {
    expect(describeOutcome('not-evaluated')).toMatch(/prototype runner/i)
    expect(describeOutcome('not-evaluated')).not.toMatch(/fail/i)
  })
})
