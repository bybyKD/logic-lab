import type { Activity, CodeLabActivity, TestOutcome } from '../../../domain'
import { describeOutcome, viewOutcomes } from './outcomeMasking'

/** One piece of machine-written feedback, before it is given an id and a clock. */
export interface AutoFeedbackDraft {
  /** Matches `Feedback.kind`, so the writer does not have to re-decide it. */
  kind: 'auto'
  body: string
}

const pct = (n: number) => `${n}%`

/**
 * The per-test-case feedback a learner reads after submitting a code lab.
 *
 * Written per case rather than as one verdict, because "one of two tests failed"
 * does not tell anyone what to do next while "the visible case still prints Remaja
 * for age 20" does. A case the prototype runner could not evaluate produces a line
 * that says exactly that, instead of being silently dropped — a dropped case
 * would read as a case that did not matter.
 */
export function codeLabFeedback(
  activity: CodeLabActivity,
  outcomes: readonly TestOutcome[],
  score: number,
): AutoFeedbackDraft[] {
  const views = viewOutcomes(outcomes, 'status')
  const drafts: AutoFeedbackDraft[] = []

  for (const view of views) {
    if (view.status === null) continue

    if (view.status === 'not-evaluated') {
      drafts.push({
        kind: 'auto',
        body:
          view.hidden
            ? `${view.label} could not be run: this prototype runner cannot apply a per-input test yet. It is not counted against you.`
            : `${view.label} could not be run by the prototype runner.`,
      })
      continue
    }

    if (view.status === 'passed') {
      drafts.push({ kind: 'auto', body: `${view.label} passed.` })
      continue
    }

    // A failed visible case can say what it wanted. A failed hidden case cannot:
    // that is the whole point of hiding it, and naming the input here would give
    // the answer away the moment the learner fails.
    drafts.push({
      kind: 'auto',
      body: view.hidden
        ? `${view.label} failed. Your code does not handle every case the activity checks — re-read the expected behaviour.`
        : `${view.label} failed: expected “${view.expected}”, got “${view.actual}”.`,
    })
  }

  drafts.push({
    kind: 'auto',
    body:
      score === 100
        ? `All runnable tests passed (${pct(score)}). Submitting records this attempt for your teacher.`
        : `Scored ${pct(score)} on the tests this runner could evaluate. ${
            activity.expectedBehavior
          }`,
  })

  return drafts
}

/** The feedback for a challenge, which is a verdict plus the seeded explanation. */
export function challengeFeedback(
  activity: Extract<Activity, { kind: 'challenge' }>,
  score: number,
  pickedLabel: string | null,
): AutoFeedbackDraft[] {
  const correct = score === 100
  return [
    {
      kind: 'auto',
      body: correct
        ? 'Correct.'
        : `Not quite — you picked ${pickedLabel ?? 'nothing'}.`,
    },
    { kind: 'auto', body: activity.explanation },
  ]
}

/** Dispatch on kind, so the writer never has to branch. */
export function autoFeedbackFor(params: {
  activity: Activity
  score: number
  outcomes: readonly TestOutcome[]
  pickedLabel: string | null
}): AutoFeedbackDraft[] {
  const { activity, score, outcomes, pickedLabel } = params
  if (activity.kind === 'codeLab') return codeLabFeedback(activity, outcomes, score)
  if (activity.kind === 'challenge') return challengeFeedback(activity, score, pickedLabel)
  return [{ kind: 'auto', body: `Recorded at ${pct(score)}.` }]
}

/** A short label for the outcome, used in the summary line. */
export function outcomeSummary(outcomes: readonly TestOutcome[]): string {
  const views = viewOutcomes(outcomes, 'status')
  const counts = { passed: 0, failed: 0, skipped: 0 }
  for (const view of views) {
    if (view.status === 'passed') counts.passed += 1
    else if (view.status === 'failed') counts.failed += 1
    else counts.skipped += 1
  }
  const parts: string[] = []
  if (counts.passed) parts.push(`${counts.passed} passed`)
  if (counts.failed) parts.push(`${counts.failed} failed`)
  if (counts.skipped) parts.push(`${counts.skipped} not evaluated`)
  return parts.length > 0 ? parts.join(' · ') : 'nothing was evaluated'
}

/** Re-exported so the UI does not import two modules for one sentence. */
export { describeOutcome }
