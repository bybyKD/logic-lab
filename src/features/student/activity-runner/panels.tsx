import type { ReactNode } from 'react'
import type { Activity, Feedback, Hint, TestCase, TestOutcome } from '../../../domain'
import { cn } from '../../../utils/cn'
import type { OutcomeReveal, TestOutcomeView } from './outcomeMasking'
import { describeOutcome, viewOutcomes, viewTestCases } from './outcomeMasking'
import type { SkillDelta } from '../../../services/learning/masteryDelta'
import { deltaTone } from '../../../services/learning/masteryDelta'
import { outcomeSummary } from './autoFeedback'

const OUTCOME_STYLES: Record<string, string> = {
  passed: 'border-success/30 bg-success/5 text-success',
  failed: 'border-error/30 bg-error/5 text-error',
  'not-evaluated': 'border-warning/30 bg-warning/5 text-warning',
}

function Card({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-lg border border-lab-700 bg-lab-850 p-5', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="technical-label">{title}</p>
        {action}
      </div>
      {children}
    </section>
  )
}

/**
 * Hints, one at a time.
 *
 * Revealing them progressively rather than as a list is the point: the plan asks
 * for hints that teach, and a learner who can see all of them up front will scroll
 * to the last one. Every id revealed is recorded on the attempt, because
 * `computeSkillMastery` discounts a score reached with hints showing.
 */
export function HintPanel({
  hints,
  revealed,
  onReveal,
  locked,
}: {
  hints: readonly Hint[]
  revealed: readonly string[]
  onReveal: () => void
  locked: boolean
}) {
  if (hints.length === 0) return null
  const ordered = [...hints].sort((a, b) => a.order - b.order)
  const next = ordered.find((hint) => !revealed.includes(hint.id))
  const done = ordered.filter((hint) => revealed.includes(hint.id))

  return (
    <Card
      title={`Hints · ${done.length}/${ordered.length} revealed`}
      action={
        next && !locked ? (
          <button
            type="button"
            onClick={onReveal}
            className="rounded-pill border border-lab-600 px-3 py-1 font-mono text-[0.6875rem] text-ink-300 transition-colors hover:border-accent-400/50 hover:text-accent-300 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none"
          >
            {done.length === 0 ? 'Show the first hint' : 'Show the next hint'}
          </button>
        ) : null
      }
    >
      <ol className="space-y-2.5">
        {done.map((hint, index) => (
          <li
            key={hint.id}
            className="rounded-md border border-lab-700 bg-lab-800/60 px-4 py-3 text-sm text-ink-300"
          >
            <span className="font-mono text-[0.625rem] text-accent-400">
              HINT {index + 1}
            </span>
            <p className="mt-1">{hint.text}</p>
          </li>
        ))}
      </ol>
      {!next && done.length > 0 && (
        <p className="mt-3 font-mono text-xs text-ink-600">
          That is every hint for this activity.
        </p>
      )}
      {done.length === 0 && (
        <p className="text-sm text-ink-600">
          Stuck? Revealing a hint lowers the score this attempt contributes to your
          skill mastery, but it is better than guessing.
        </p>
      )}
    </Card>
  )
}

/**
 * The test cases, masked according to how far the learner has got.
 *
 * `reveal` is the whole security model of this screen: `none` before a run,
 * `status` after submitting, `full` only once a teacher has graded. Hidden cases
 * are counted and named but never described until then.
 */
export function TestCasePanel({
  testCases,
  outcomes,
  reveal,
}: {
  testCases: readonly TestCase[]
  outcomes: readonly TestOutcome[] | null
  reveal: OutcomeReveal
}) {
  const cases = viewTestCases(testCases, reveal)
  const views = outcomes ? viewOutcomes(outcomes, reveal) : []
  const byId = new Map(views.map((v) => [v.testCaseId, v]))

  return (
    <Card
      title="Tests"
      action={
        <span className="font-mono text-[0.625rem] text-ink-600">
          {outcomes ? outcomeSummary(outcomes) : 'not run yet'}
        </span>
      }
    >
      <ul className="space-y-2.5">
        {cases.map((view, index) => {
          const result: TestOutcomeView | undefined = byId.get(view.id)
          return (
            <li
              key={view.id}
              className="rounded-md border border-lab-700 bg-lab-800/40 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs text-ink-200">
                  <span className="text-ink-600">{String(index + 1).padStart(2, '0')} · </span>
                  {view.label}
                </p>
                {view.hidden && (
                  <span className="rounded-pill border border-lab-600 px-2 py-0.5 font-mono text-[0.5625rem] tracking-widest text-ink-500 uppercase">
                    hidden · counts {view.weight > 1 ? `${view.weight}×` : '1×'}
                  </span>
                )}
              </div>

              {view.expectedOutput !== null && (
                <p className="mt-2 font-mono text-xs text-ink-500">
                  expects <span className="text-ink-300">{view.expectedOutput}</span>
                  {view.input && <span className="text-ink-600"> · input {view.input}</span>}
                </p>
              )}
              {view.hidden && view.expectedOutput === null && (
                <p className="mt-2 font-mono text-xs text-ink-600">
                  Input and expected output stay sealed until your teacher grades this.
                </p>
              )}

              {result && result.status !== null && (
                <p
                  className={cn(
                    'mt-2.5 inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono text-[0.6875rem]',
                    OUTCOME_STYLES[result.status],
                  )}
                >
                  {describeOutcome(result.status)}
                  {reveal === 'full' && result.status === 'failed' && (
                    <span className="text-ink-400">
                      · expected “{result.expected}”, got “{result.actual}”
                    </span>
                  )}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/** The recorded feedback: what the system said, then what the teacher said. */
export function FeedbackPanel({
  activity,
  feedback,
}: {
  activity: Activity
  feedback: readonly Feedback[]
}) {
  const auto = feedback.filter((f) => f.authorRole === 'auto')
  const teacher = feedback.filter((f) => f.authorRole === 'teacher')
  if (auto.length === 0 && teacher.length === 0) return null

  return (
    <div className="space-y-4">
      {auto.length > 0 && (
        <Card title="What your run showed">
          <ul className="space-y-2">
            {auto.map((item) => (
              <li key={item.id} className="flex gap-2.5 text-sm text-ink-300">
                <span aria-hidden className="mt-0.5 text-accent-400">
                  →
                </span>
                <span>{item.body}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {teacher.length > 0 && (
        <Card title="From your teacher">
          <ul className="space-y-3">
            {teacher.map((item) => (
              <li
                key={item.id}
                className="rounded-md border border-accent-400/30 bg-accent-400/5 px-4 py-3"
              >
                <p className="text-sm text-ink-100">{item.body}</p>
                <p className="mt-1.5 font-mono text-[0.625rem] text-ink-600">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {activity.rubric && (
        <p className="font-mono text-[0.6875rem] text-ink-600">
          Rubric: {activity.rubric.title} · {activity.rubric.criteria.length} criteria,{' '}
          {activity.rubric.maxPoints} points. Your teacher scores these on top of the
          automated result.
        </p>
      )}
    </div>
  )
}

/**
 * What this attempt did to skill mastery.
 *
 * Derived from the persisted attempts on every render rather than held in state,
 * so the numbers are still here after a reload and still correct once later
 * attempts move the same skills.
 */
export function MasteryDeltaPanel({
  deltas,
  limit = 4,
}: {
  deltas: readonly SkillDelta[]
  limit?: number
}) {
  if (deltas.length === 0) return null
  const shown = deltas.slice(0, limit)
  const hidden = deltas.length - shown.length

  return (
    <Card title="What this moved">
      <ul className="space-y-2.5">
        {shown.map((delta) => {
          const tone = deltaTone(delta.delta)
          return (
            <li key={delta.skillId} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-ink-200">{delta.name}</p>
                <p className="font-mono text-[0.625rem] text-ink-600">
                  {delta.before} → {delta.after} · {delta.evidenceCount} piece
                  {delta.evidenceCount === 1 ? '' : 's'} of evidence ·{' '}
                  {delta.confidence} confidence
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 font-mono text-sm',
                  tone === 'up' && 'text-success',
                  tone === 'down' && 'text-warning',
                  tone === 'flat' && 'text-ink-600',
                )}
              >
                {delta.delta > 0 ? '+' : ''}
                {delta.delta}
              </span>
            </li>
          )
        })}
      </ul>
      {hidden > 0 && (
        <p className="mt-3 font-mono text-[0.625rem] text-ink-700">
          and {hidden} more skill{hidden === 1 ? '' : 's'} in the same tree
        </p>
      )}
    </Card>
  )
}

/** A small pill row for the objective / points / time metadata. */
export function ActivityMeta({ activity }: { activity: Activity }) {
  const items: { label: string; value: string }[] = [
    { label: 'points', value: String(activity.points) },
    { label: 'about', value: `${activity.estimatedMinutes} min` },
    { label: 'difficulty', value: activity.difficulty },
  ]
  if (activity.rubric) {
    items.push({ label: 'rubric', value: `${activity.rubric.maxPoints} pts` })
  }
  return (
    <ul className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <li
          key={item.label}
          className="rounded-pill border border-lab-700 bg-lab-850 px-2.5 py-0.5 font-mono text-[0.625rem] text-ink-400"
        >
          {item.label} <span className="text-ink-200">{item.value}</span>
        </li>
      ))}
    </ul>
  )
}

/** Confirmation of a persisted submission, in a live region. */
export function SubmitConfirmation({
  score,
  recorded,
  reason,
}: {
  score: number
  recorded: boolean
  reason?: string
}) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-md border px-4 py-3 font-mono text-sm',
        recorded
          ? 'border-success/30 bg-success/5 text-success'
          : 'border-warning/30 bg-warning/5 text-warning',
      )}
    >
      {recorded
        ? `Submitted and recorded at ${score}%. Your teacher can see it now, and it survives a reload.`
        : reason}
    </p>
  )
}
