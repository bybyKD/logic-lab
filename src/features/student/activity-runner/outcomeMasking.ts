import type { TestCase, TestOutcome, TestOutcomeStatus } from '../../../domain'

/**
 * How much of a test case the learner is allowed to see.
 *
 * `none`   before running anything: a hidden case is just "a hidden test".
 * `status` after submitting: you learn whether it passed, not what it wanted.
 * `full`   once a teacher has graded, so the answer is no longer a secret.
 */
export type OutcomeReveal = 'none' | 'status' | 'full'

/** A test case as the learner is allowed to see it. */
export interface TestCaseView {
  id: string
  /**
   * The real name for a visible case. A neutral `Hidden test N` for a hidden
   * one, because the seeded hidden cases are named after their answer
   * ("age 17 prints Remaja") — showing the name would show the expected output.
   */
  label: string
  hidden: boolean
  /** Null while masked. */
  expectedOutput: string | null
  /** Null while masked. */
  input: string | null
  /** Relative weight, so the UI can say why a hidden case counts double. */
  weight: number
}

export interface TestOutcomeView {
  testCaseId: string
  label: string
  hidden: boolean
  /** Null while masked, and always null when nothing has been run yet. */
  status: TestOutcomeStatus | null
  /** Null while masked. */
  expected: string | null
  /** Null while masked. */
  actual: string | null
  weight: number
}

/** "Hidden test 1", "Hidden test 2", counting only the hidden cases. */
function hiddenLabel(ordinal: number): string {
  return `Hidden test ${ordinal}`
}

/**
 * The test case list before anything has run.
 *
 * A visible case shows its expected output from the start — that is the whole
 * point of a visible case. A hidden case shows nothing but its existence, so the
 * learner knows what they are being held to without being told the answer.
 */
export function viewTestCases(
  testCases: readonly TestCase[],
  reveal: OutcomeReveal = 'none',
): TestCaseView[] {
  let hiddenSeen = 0
  return testCases.map((testCase) => {
    if (!testCase.hidden) {
      return {
        id: testCase.id,
        label: testCase.name,
        hidden: false,
        expectedOutput: testCase.expectedOutput,
        input: testCase.input ?? null,
        weight: testCase.weight,
      }
    }
    hiddenSeen += 1
    const open = reveal === 'full'
    return {
      id: testCase.id,
      label: open ? testCase.name : hiddenLabel(hiddenSeen),
      hidden: true,
      expectedOutput: open ? testCase.expectedOutput : null,
      input: open ? (testCase.input ?? null) : null,
      weight: testCase.weight,
    }
  })
}

/**
 * Run outcomes, filtered through the same masking rules.
 *
 * `status` for a hidden case is the useful half of the answer: the learner learns
 * that their code did not generalise without being handed the input that proved
 * it. `full` is reserved for after a teacher has graded.
 */
export function viewOutcomes(
  outcomes: readonly TestOutcome[],
  reveal: OutcomeReveal = 'status',
): TestOutcomeView[] {
  let hiddenSeen = 0
  return outcomes.map((outcome) => {
    if (!outcome.hidden) {
      return {
        testCaseId: outcome.testCaseId,
        label: outcome.name,
        hidden: false,
        status: outcome.status,
        expected: outcome.expected,
        actual: outcome.actual,
        weight: outcome.weight,
      }
    }
    hiddenSeen += 1
    const open = reveal === 'full'
    return {
      testCaseId: outcome.testCaseId,
      label: open ? outcome.name : hiddenLabel(hiddenSeen),
      hidden: true,
      // Pass/fail is the signal; the expected and actual values are not.
      status: outcome.status,
      expected: open ? outcome.expected : null,
      actual: open ? outcome.actual : null,
      weight: outcome.weight,
    }
  })
}

/** How many hidden cases an activity has, for the "held to this too" summary. */
export function hiddenTestCount(testCases: readonly TestCase[]): number {
  return testCases.filter((testCase) => testCase.hidden).length
}

/**
 * Why a case is not being scored, in words.
 *
 * `not-evaluated` is a limitation of the runner, not a wrong answer, and the
 * copy has to say so — otherwise the learner reads "failed" and concludes their
 * code is wrong when the prototype simply cannot run that input.
 */
export function describeOutcome(status: TestOutcomeStatus): string {
  switch (status) {
    case 'passed':
      return 'Passed'
    case 'failed':
      return 'Failed'
    case 'not-evaluated':
      return 'Not evaluated by the prototype runner'
  }
}
