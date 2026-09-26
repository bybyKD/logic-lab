import type { Misconception } from '../../domain'

/**
 * Known wrong mental models.
 *
 * This is the remediation side of the learning engine: it turns a failed attempt
 * into a named misconception with a skill, a hint, and a place to practise, so a
 * teacher sees "students confuse `=` with `==`" instead of "32% failed".
 *
 * Prototype scope: the detector that fires these ids is a small set of source
 * patterns. A real runtime (which reports its own error types) replaces it.
 */
export const MISCONCEPTIONS: Misconception[] = [
  {
    id: 'assignment-in-condition',
    label: 'Assignment used where comparison was meant',
    description:
      'Writing `if x = 5` instead of `if x == 5`. The condition is not a question, it is an instruction — and it is almost always true.',
    skillId: 'comparison-operators',
    remediationHint: 'A condition needs a comparison. Use `==` to test equality and `>=` when a boundary should be included.',
    recommendedActivityId: 'act-s04-cl-age',
  },
  {
    id: 'strict-boundary',
    label: 'Boundary treated as exclusive',
    description:
      'Using `>` where `>=` was meant, so the exact boundary value falls into the wrong branch.',
    skillId: 'if-else',
    remediationHint: 'Trace the boundary value itself — 18, not 17 — and check which branch it takes.',
    recommendedActivityId: 'act-s04-cl-age',
  },
  {
    id: 'off-by-one-range',
    label: 'Off-by-one loop bound',
    description:
      'Counting one iteration too many or too few: `range(n + 1)`, or forgetting that `range(n)` starts at zero.',
    skillId: 'for-loops',
    remediationHint: '`range(5)` yields 0,1,2,3,4. Write the values down before writing the loop.',
    recommendedActivityId: 'act-s05-cl-accumulator',
  },
  {
    id: 'accumulator-reset',
    label: 'Accumulator reset inside the loop',
    description:
      'Setting the running total to zero inside the loop body, so every iteration overwrites the previous sum.',
    skillId: 'variable-assignment',
    remediationHint: 'Initialise the accumulator before the loop starts, never inside it.',
    recommendedActivityId: 'act-s05-cl-accumulator',
  },
  {
    id: 'logic-error',
    label: 'Right syntax, wrong logic',
    description:
      'The program runs but produces the wrong result — the steps are in the wrong order or a condition is inverted.',
    skillId: 'algorithm-design',
    remediationHint: 'Trace it line by line and write down the value of each variable after every step.',
  },
]

export const MISCONCEPTION_BY_ID: Record<string, Misconception> = Object.fromEntries(
  MISCONCEPTIONS.map((m) => [m.id, m]),
)

export function getMisconception(id: string): Misconception | undefined {
  return MISCONCEPTION_BY_ID[id]
}
