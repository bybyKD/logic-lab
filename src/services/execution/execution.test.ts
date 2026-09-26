import { describe, expect, it } from 'vitest'
import type { TestCase } from '../../domain'
import {
  evaluateTestCases,
  normalizeOutput,
  scoreOutcomes,
  UNSUPPORTED_NOTE,
} from './types'
import { SimulatedExecutionService } from './simulatedExecutionService'
import { getExecutionService, setExecutionService } from './index'

function testCase(partial: Partial<TestCase> & { id: string; expectedOutput: string }): TestCase {
  return {
    name: partial.id,
    hidden: false,
    weight: 1,
    ...partial,
  }
}

/** A program the pattern simulator recognises (age check, prints "Dewasa"). */
const KNOWN_PROGRAM = `age = 18

if age >= 18:
    print("Dewasa")
else:
    print("Remaja")`

const service = new SimulatedExecutionService()

describe('normalizeOutput', () => {
  it('treats trailing newlines and padding as equal', () => {
    expect(normalizeOutput('10\n')).toBe('10')
    expect(normalizeOutput('  10  ')).toBe('10')
    expect(normalizeOutput('a\n\nb')).toBe('a b')
  })
})

describe('evaluateTestCases', () => {
  const cases = [
    testCase({ id: 't1', name: 'prints Dewasa', expectedOutput: 'Dewasa' }),
    testCase({ id: 't2', name: 'prints Remaja', expectedOutput: 'Remaja' }),
  ]

  it('marks matching cases passed and others failed', () => {
    const outcomes = evaluateTestCases(cases, 'Dewasa', false)
    expect(outcomes.map((o) => o.status)).toEqual(['passed', 'failed'])
  })

  it('reports a case needing stdin as not-evaluated rather than failed', () => {
    const withInput = [
      testCase({ id: 't1', name: 'reads input', expectedOutput: '7', input: '7' }),
    ]
    const outcomes = evaluateTestCases(withInput, '', false)

    expect(outcomes[0].status).toBe('not-evaluated')
    expect(outcomes[0].actual).toBe('')
  })

  it('evaluates input cases when the runner says it can', () => {
    const withInput = [
      testCase({ id: 't1', name: 'reads input', expectedOutput: '7', input: '7' }),
    ]
    expect(evaluateTestCases(withInput, '7', true)[0].status).toBe('passed')
  })

  it('carries the case weight through to the outcome', () => {
    const outcomes = evaluateTestCases(
      [testCase({ id: 't1', name: 'weighted', expectedOutput: 'x', weight: 3 })],
      'x',
      false,
    )
    expect(outcomes[0].weight).toBe(3)
  })

  it('preserves the hidden flag', () => {
    const outcomes = evaluateTestCases(
      [testCase({ id: 't1', name: 'hidden', expectedOutput: 'x', hidden: true })],
      'x',
      false,
    )
    expect(outcomes[0].hidden).toBe(true)
  })
})

describe('scoreOutcomes', () => {
  const outcomes = (statuses: ('passed' | 'failed' | 'not-evaluated')[], weights?: number[]) =>
    statuses.map((status, i) => ({
      testCaseId: `t${i}`,
      name: `t${i}`,
      hidden: false,
      status,
      expected: '',
      actual: '',
      weight: weights?.[i] ?? 1,
    }))

  it('is a plain pass ratio for equal weights', () => {
    expect(scoreOutcomes(outcomes(['passed', 'passed', 'failed']))).toBe(67)
  })

  it('weights heavy cases more heavily than light ones', () => {
    // A missed case worth 3 should cost more than a missed case worth 1.
    expect(scoreOutcomes(outcomes(['failed', 'passed'], [3, 1]))).toBe(25)
    expect(scoreOutcomes(outcomes(['failed', 'passed'], [1, 3]))).toBe(75)
  })

  it('excludes not-evaluated cases from the denominator', () => {
    // The runner's limitation must not cost the learner points.
    expect(scoreOutcomes(outcomes(['passed', 'not-evaluated', 'not-evaluated']))).toBe(100)
  })

  it('returns null when nothing could be evaluated', () => {
    expect(scoreOutcomes(outcomes(['not-evaluated', 'not-evaluated']))).toBeNull()
  })

  it('returns null for an empty list rather than 0', () => {
    expect(scoreOutcomes([])).toBeNull()
  })
})

describe('SimulatedExecutionService', () => {
  it('declares itself non-authoritative', () => {
    expect(service.isAuthoritative).toBe(false)
    expect(service.id).toBe('simulated')
  })

  it('runs a recognised program and grades it', async () => {
    const result = await service.run({
      language: 'python',
      code: KNOWN_PROGRAM,
      testCases: [testCase({ id: 't1', name: 'age 18 is an adult', expectedOutput: 'Dewasa' })],
    })

    expect(result.status).toBe('ok')
    expect(result.exitCode).toBe(0)
    expect(result.testOutcomes[0].status).toBe('passed')
    expect(result.trace.length).toBeGreaterThan(0)
  })

  it('reports a recognised program with a wrong answer as failed, not ok', async () => {
    const result = await service.run({
      language: 'python',
      code: KNOWN_PROGRAM,
      testCases: [testCase({ id: 't1', name: 'wrong expectation', expectedOutput: 'Remaja' })],
    })

    expect(result.status).toBe('failed')
    expect(result.exitCode).toBe(0)
    expect(result.testOutcomes[0].status).toBe('failed')
  })

  it('reports unrecognised code as unsupported instead of guessing', async () => {
    const result = await service.run({
      language: 'python',
      code: 'import socket\ns = socket.socket()\ns.connect(("example.com", 80))',
    })

    expect(result.status).toBe('unsupported')
    expect(result.exitCode).toBe(-1)
    expect(result.stdout).toBe('')
    expect(result.trace).toEqual([])
    expect(result.note).toBe(UNSUPPORTED_NOTE)
  })

  it('produces no test outcomes for unsupported code', async () => {
    const result = await service.run({
      language: 'python',
      code: 'while True: pass',
      testCases: [testCase({ id: 't1', name: 'anything', expectedOutput: 'x' })],
    })
    expect(result.testOutcomes).toEqual([])
    expect(scoreOutcomes(result.testOutcomes)).toBeNull()
  })

  it('sets exit code 0 and no note for a clean run', async () => {
    const result = await service.run({ language: 'python', code: KNOWN_PROGRAM })
    expect(result.status).toBe('ok')
    expect(result.note).toBeUndefined()
    expect(result.stderr).toBe('')
  })
})

describe('execution service registry', () => {
  it('defaults to the simulated service', () => {
    expect(getExecutionService().id).toBe('simulated')
  })

  it('can be swapped for a real runner without touching callers', async () => {
    const original = getExecutionService()
    const fake = {
      id: 'sandboxed',
      isAuthoritative: true,
      run: async () => ({
        status: 'ok' as const,
        stdout: 'real output',
        stderr: '',
        testOutcomes: [],
        durationMs: 5,
        exitCode: 0,
        trace: [],
      }),
    }

    setExecutionService(fake)
    const result = await getExecutionService().run({ language: 'python', code: 'anything' })
    expect(result.stdout).toBe('real output')
    expect(getExecutionService().isAuthoritative).toBe(true)

    setExecutionService(original)
    expect(getExecutionService().id).toBe('simulated')
  })
})
