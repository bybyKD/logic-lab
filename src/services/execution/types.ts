import type { TestCase, TestOutcome } from '../../domain'
import type { LanguageId } from '../../data/languages'
import type { TraceStep } from '../../utils/codeSimulator'

/**
 * The execution contract.
 *
 * Today the only implementation is `SimulatedExecutionService`, which pattern
 * matches a handful of known programs. It is deliberately NOT an interpreter,
 * and it is deliberately behind this interface: a real sandboxed runner
 * (§14 — container isolation, CPU/memory/time limits, no network) implements the
 * same three methods and nothing above this line has to change.
 */

export type ExecutionStatus = 'ok' | 'failed' | 'error' | 'unsupported'

export interface ExecutionRequest {
  language: LanguageId
  code: string
  /** When present, stdout is compared against each case's expectedOutput. */
  testCases?: TestCase[]
}

export interface ExecutionResult {
  status: ExecutionStatus
  stdout: string
  stderr: string
  testOutcomes: TestOutcome[]
  durationMs: number
  exitCode: number
  trace: TraceStep[]
  /** Plain-language explanation, always set when status is not `ok`. */
  note?: string
}

export interface ExecutionService {
  readonly id: string
  /** True when this service can only evaluate a known set of programs. */
  readonly isAuthoritative: boolean
  run(request: ExecutionRequest): Promise<ExecutionResult>
}

/** Collapse whitespace and trim so `10\n` and ` 10 ` compare equal. */
export function normalizeOutput(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

/**
 * Compares a run against test cases.
 *
 * A case carrying an `input` needs the program to be run once per input. The
 * simulated service cannot do that, so those cases are reported `not-evaluated`
 * rather than guessed at. Only evaluated cases contribute to a score.
 */
export function evaluateTestCases(
  testCases: TestCase[],
  stdout: string,
  canEvaluateInputs: boolean,
): TestOutcome[] {
  const actual = normalizeOutput(stdout)
  return testCases.map((testCase) => {
    if (testCase.input !== undefined && !canEvaluateInputs) {
      return {
        testCaseId: testCase.id,
        name: testCase.name,
        hidden: testCase.hidden,
        status: 'not-evaluated' as const,
        expected: testCase.expectedOutput,
        actual: '',
        skillId: testCase.skillId,
        weight: testCase.weight,
      }
    }

    const passed = actual === normalizeOutput(testCase.expectedOutput)
    return {
      testCaseId: testCase.id,
      name: testCase.name,
      hidden: testCase.hidden,
      status: passed ? ('passed' as const) : ('failed' as const),
      expected: testCase.expectedOutput,
      actual,
      skillId: testCase.skillId,
      weight: testCase.weight,
    }
  })
}

/**
 * Weighted score across evaluated cases only, as a 0–100 percentage.
 *
 * Only `passed` and `failed` cases are in the denominator, so a runner limitation
 * never costs the learner points. Returns null when nothing could be evaluated, so
 * callers must handle "unknown" instead of defaulting to zero — a 0 would be
 * indistinguishable from a wrong answer.
 */
export function scoreOutcomes(outcomes: TestOutcome[]): number | null {
  let earned = 0
  let available = 0
  for (const outcome of outcomes) {
    if (outcome.status === 'not-evaluated') continue
    available += outcome.weight
    if (outcome.status === 'passed') earned += outcome.weight
  }
  if (available === 0) return null
  return Math.round((earned / available) * 100)
}

export const UNSUPPORTED_NOTE =
  'This prototype runner can only evaluate a few known example programs. ' +
  'Recognised programs run and are graded; anything else is reported as unsupported rather than guessed at.'
