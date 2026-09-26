import { simulateCode } from '../../utils/codeSimulator'
import {
  evaluateTestCases,
  UNSUPPORTED_NOTE,
  type ExecutionRequest,
  type ExecutionResult,
  type ExecutionService,
  type ExecutionStatus,
} from './types'

/**
 * Wraps the legacy pattern-matching simulator in the ExecutionService contract.
 *
 * `codeSimulator.ts` recognises a fixed set of program shapes and returns canned
 * output. That is a prototype, not a runtime: it cannot run code a learner
 * writes freely. This adapter exists so that limitation is contained here and
 * reported honestly, rather than leaking into the UI as a wrong answer.
 */
export class SimulatedExecutionService implements ExecutionService {
  readonly id = 'simulated'
  readonly isAuthoritative = false

  async run(request: ExecutionRequest): Promise<ExecutionResult> {
    const startedAt = Date.now()
    const simulated = simulateCode(request.language, request.code)
    const durationMs = Date.now() - startedAt

    // The simulator signals "I don't know this program" with an error flag and a
    // message, not a null. Both are handled: null is defensive, the flag is real.
    const unrecognised = simulated === null || simulated.error === true

    if (unrecognised || !simulated) {
      return {
        status: 'unsupported',
        stdout: '',
        stderr: '',
        testOutcomes: [],
        durationMs,
        exitCode: -1,
        trace: [],
        note: UNSUPPORTED_NOTE,
      }
    }

    const threw = simulated.errorType !== undefined
    const testOutcomes = request.testCases
      ? evaluateTestCases(request.testCases, simulated.output, false)
      : []
    // A recognised program that ran cleanly but got a case wrong is `failed`, not
    // `ok`: the caller should not have to derive pass/fail from testOutcomes when
    // the contract already says which it was.
    const failedCase = testOutcomes.some((o) => o.status === 'failed')
    const status: ExecutionStatus = threw ? 'error' : failedCase ? 'failed' : 'ok'

    return {
      status,
      stdout: simulated.output,
      stderr: threw ? simulated.output : '',
      testOutcomes,
      durationMs,
      exitCode: threw ? 1 : 0,
      trace: simulated.trace,
      note: threw ? simulated.output : undefined,
    }
  }
}
