import { describe, expect, it } from 'vitest'
import type { TestOutcome } from '../../domain'
import {
  MISCONCEPTION_RULES,
  detectMisconception,
  detectMisconceptions,
  detectStaticWarnings,
} from './misconceptionDetector'
import { MISCONCEPTION_BY_ID, MISCONCEPTIONS } from './misconceptions'

const outcome = (status: 'passed' | 'failed' | 'not-evaluated'): TestOutcome => ({
  testCaseId: 't1',
  name: 't1',
  hidden: false,
  status,
  expected: 'x',
  actual: 'y',
  weight: 1,
})

const ASSIGNMENT_IN_CONDITION = `age = 18

if age = 18:
    print("Dewasa")`

const CORRECT_PROGRAM = `age = 18

if age >= 18:
    print("Dewasa")`

const ACCUMULATOR_RESET = `total = 0
for i in range(5):
    total = 0
    total = total + i`

const CORRECT_ACCUMULATOR = `total = 0
for i in range(5):
    total = total + i`

describe('catalog', () => {
  it('is internally consistent and complete', () => {
    expect(MISCONCEPTIONS.length).toBeGreaterThan(0)
    for (const m of MISCONCEPTIONS) {
      expect(MISCONCEPTION_BY_ID[m.id]).toBe(m)
      expect(m.remediationHint.length).toBeGreaterThan(0)
      expect(m.description.length).toBeGreaterThan(0)
    }
  })

  it('gives every rule a catalog entry to point at', () => {
    for (const rule of MISCONCEPTION_RULES) {
      expect(MISCONCEPTION_BY_ID[rule.id], rule.id).toBeDefined()
    }
  })
})

describe('assignment-in-condition', () => {
  it('fires on a bare = in a condition', () => {
    expect(detectStaticWarnings(ASSIGNMENT_IN_CONDITION)).toContain('assignment-in-condition')
  })

  it('does not fire on the real comparisons', () => {
    for (const op of ['==', '!=', '>=', '<=', ':=']) {
      const code = `age = 18\n\nif age ${op} 18:\n    print("x")`
      expect(detectStaticWarnings(code), op).not.toContain('assignment-in-condition')
    }
  })

  it('does not fire on plain assignment outside a condition', () => {
    const code = `age = 18\n\nif age >= 18:\n    print("x")`
    expect(detectStaticWarnings(code)).toEqual([])
  })

  it('reports the most specific rule first when several match', () => {
    const code = `total = 0
for i in range(5 + 1):
    total = 0
    if x = 1:
        total = total + i`
    const hits = detectMisconceptions({ code })
    expect(hits[0]).toBe('assignment-in-condition')
    expect(hits).toContain('accumulator-reset')
    expect(hits).toContain('off-by-one-range')
  })
})

describe('accumulator-reset', () => {
  it('fires when the total is re-zeroed inside the loop', () => {
    expect(detectStaticWarnings(ACCUMULATOR_RESET)).toContain('accumulator-reset')
  })

  it('stays quiet when the total is initialised before the loop', () => {
    expect(detectStaticWarnings(CORRECT_ACCUMULATOR)).toEqual([])
  })
})

describe('off-by-one-range', () => {
  it('fires on a shifted range bound', () => {
    expect(detectStaticWarnings('for i in range(n + 1):\n    print(i)')).toContain(
      'off-by-one-range',
    )
    expect(detectStaticWarnings('for i in range(n - 1):\n    print(i)')).toContain(
      'off-by-one-range',
    )
  })

  it('fires on an inclusive comparison bound', () => {
    expect(detectStaticWarnings('for (let i = 0; i <= n; i++) {\n  print(i);\n}')).toContain(
      'off-by-one-range',
    )
  })

  it('stays quiet on a conventional range', () => {
    expect(detectStaticWarnings('for i in range(n):\n    print(i)')).toEqual([])
  })
})

describe('strict-boundary', () => {
  it('is a heuristic, so it needs a failure to be reported', () => {
    const code = 'if age > 18:\n    print("x")'
    expect(detectMisconceptions({ code })).toContain('strict-boundary')
    expect(detectStaticWarnings(code)).toEqual([])
  })

  it('is not reported for a passing submission', () => {
    const result = detectMisconception({
      code: 'if age > 18:\n    print("x")',
      outcomes: [outcome('passed')],
    })
    expect(result).toBeNull()
  })

  it('is not reported when the code uses an inclusive bound anywhere', () => {
    expect(detectMisconceptions({ code: 'if age > 18 and limit <= 10:\n    print("x")' })).not.toContain(
      'strict-boundary',
    )
  })
})

describe('detectMisconception', () => {
  it('trusts an explicit preset over the source', () => {
    expect(
      detectMisconception({ code: CORRECT_PROGRAM, presetId: 'strict-boundary' }),
    ).toBe('strict-boundary')
  })

  it('ignores a preset that is not in the catalog', () => {
    expect(detectMisconception({ code: CORRECT_PROGRAM, presetId: 'made-up' })).toBeNull()
  })

  it('falls back to the generic bucket for a failure with no recognisable pattern', () => {
    expect(
      detectMisconception({
        code: 'print("hello")',
        outcomes: [outcome('failed')],
      }),
    ).toBe('logic-error')
  })

  it('reports a provable mistake even when the submission passed', () => {
    // The case the static path exists for: prints the right answer, wrong rule.
    expect(
      detectMisconception({
        code: ASSIGNMENT_IN_CONDITION,
        outcomes: [outcome('passed')],
      }),
    ).toBe('assignment-in-condition')
  })

  it('stays quiet for clean passing code', () => {
    expect(
      detectMisconception({ code: CORRECT_PROGRAM, outcomes: [outcome('passed')] }),
    ).toBeNull()
  })

  it('makes no claim when there is no evidence either way', () => {
    expect(detectMisconception({ code: 'print("hello")' })).toBeNull()
    expect(detectMisconception({ code: CORRECT_PROGRAM, outcomes: [outcome('not-evaluated')] })).toBeNull()
  })

  it('returns null when there is no code and no preset', () => {
    expect(detectMisconception({ code: '' })).toBeNull()
  })
})
