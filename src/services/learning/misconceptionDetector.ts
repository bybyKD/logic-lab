import { MISCONCEPTION_BY_ID } from './misconceptions'
import type { TestCase, TestOutcome } from '../../domain'

/**
 * Names the wrong mental model behind a failed attempt.
 *
 * These are **source heuristics**, not a compiler. Each rule looks for a text
 * pattern that reliably accompanies one misconception in beginner code. They
 * exist so the classroom screen can say something more useful than "32% failed";
 * a real runtime reports error kinds directly and replaces this file.
 *
 * Rules are ordered most-specific first: `matchesAll` returns the first hit, so
 * adding a rule means inserting it above the generic fallback, not rewriting it.
 */

export interface DetectorInput {
  code: string
  testCases?: TestCase[]
  outcomes?: TestOutcome[]
  /** Challenge / quiz attempts carry no code; a seed or teacher may tag them. */
  presetId?: string
}

export interface MisconceptionRule {
  id: string
  description: string
  matchesAll(input: DetectorInput): boolean
}

const failed = (input: DetectorInput) =>
  (input.outcomes ?? []).some((o) => o.status === 'failed')

/** Text of every `if` / `elif` condition in the program. */
function conditionTexts(code: string): string[] {
  const out: string[] = []
  const re = /\b(?:el)?if\s*\(?([^\n{(]+)/g
  let match = re.exec(code)
  while (match !== null) {
    out.push(match[1])
    match = re.exec(code)
  }
  return out
}

/**
 * True when a condition contains a bare `=`, i.e. assignment where a comparison
 * was meant. Excludes `==`, `>=`, `<=`, `!=` and `:=`.
 */
function hasAssignmentInCondition(code: string): boolean {
  return conditionTexts(code).some((text) => /(^|[^\w=<>!:])=(?!=)/.test(text))
}

/** A loop body that re-zeroes a running total, so each iteration overwrites it. */
function hasAccumulatorReset(code: string): boolean {
  const lines = code.split('\n')
  const loopStart = lines.findIndex((l) => /\b(for|while|range)\b/.test(l))
  if (loopStart < 0) return false
  return lines
    .slice(loopStart + 1)
    .some((l) => /^\s+[\w]*(total|sum|acc|hasil|jumlah|x)\w*\s*=\s*0\s*$/.test(l))
}

function hasOffByOneBound(code: string): boolean {
  const rangeShifted = /range\(\s*[^)]*[+-]\s*1\s*\)/.test(code)
  const inclusiveBound = /for\s*\([^)]*<=\s*[\w.]+/.test(code)
  return rangeShifted || inclusiveBound
}

/**
 * A bare `>` / `<` against a number with no `>=` / `<=` anywhere — the shape of
 * someone who has not met an inclusive boundary yet.
 */
function hasExclusiveBoundaryOnly(code: string): boolean {
  const usesInclusive = /[<>]=/.test(code)
  return !usesInclusive && /[<>]\s*-?\d+/.test(code)
}

export const MISCONCEPTION_RULES: MisconceptionRule[] = [
  {
    id: 'assignment-in-condition',
    description: 'A bare `=` inside a condition',
    matchesAll: (input) => input.code.length > 0 && hasAssignmentInCondition(input.code),
  },
  {
    id: 'accumulator-reset',
    description: 'The running total is re-zeroed inside the loop',
    matchesAll: (input) => input.code.length > 0 && hasAccumulatorReset(input.code),
  },
  {
    id: 'off-by-one-range',
    description: 'The loop bound is shifted by one',
    matchesAll: (input) => input.code.length > 0 && hasOffByOneBound(input.code),
  },
  {
    id: 'strict-boundary',
    description: 'A bare `>` / `<` where the boundary is inclusive',
    matchesAll: (input) => input.code.length > 0 && hasExclusiveBoundaryOnly(input.code),
  },
]

/** Every rule that fires, most specific first. */
export function detectMisconceptions(input: DetectorInput): string[] {
  if (input.presetId && MISCONCEPTION_BY_ID[input.presetId]) {
    return [input.presetId]
  }
  if (input.code.length === 0) return []
  return MISCONCEPTION_RULES.filter((rule) => rule.matchesAll(input)).map((r) => r.id)
}

/** Rules decidable from the source alone, so they hold regardless of test results. */
const PROVABLE_FROM_SOURCE = new Set([
  'assignment-in-condition',
  'accumulator-reset',
  'off-by-one-range',
])

/**
 * Warnings that hold regardless of what the tests said.
 *
 * `if age = 18` prints the right answer for age 18, so a visible test can pass
 * while the program is still wrong. These three patterns are decidable from the
 * source alone — exactly the cases a compiler warning would catch — so they are
 * reported even on a passing submission. Heuristic rules are not, because
 * "used `>`" is only wrong at a particular boundary.
 */
export function detectStaticWarnings(code: string): string[] {
  const input: DetectorInput = { code }
  return MISCONCEPTION_RULES.filter((rule) => PROVABLE_FROM_SOURCE.has(rule.id))
    .filter((rule) => rule.matchesAll(input))
    .map((rule) => rule.id)
}

/**
 * The single most likely misconception, or null when there is no evidence.
 *
 * A heuristic needs a failure to act on: "used `>`" is only wrong at a particular
 * boundary, so a passing submission cannot be blamed for it. A provable mistake
 * is the exception — it is wrong in every case, so a passing submission carrying
 * one is still reported.
 */
export function detectMisconception(input: DetectorInput): string | null {
  if (input.presetId && MISCONCEPTION_BY_ID[input.presetId]) {
    return input.presetId
  }
  if (input.code.length === 0) return null

  // null = unknown, because the caller gave us nothing to judge against.
  const isFailing = input.outcomes && input.outcomes.length > 0 ? failed(input) : null

  if (isFailing === false) {
    return detectStaticWarnings(input.code)[0] ?? null
  }

  const hits = detectMisconceptions(input)
  if (hits.length > 0) return hits[0]
  return isFailing === true ? 'logic-error' : null
}
