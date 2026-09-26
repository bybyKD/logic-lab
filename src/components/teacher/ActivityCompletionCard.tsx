import type { Activity } from '../../domain'
import type { ClassProgressSummary } from '../../services/learning/mastery'
import { cn } from '../../utils/cn'

/**
 * "CURRENT ACTIVITY" from §16 — the activity the class is working on, and how
 * far through it they are.
 *
 * The completion figure is `completed / enrolled` from the same derived summary
 * as the cohort split, so the card and the buckets above it can never disagree.
 */

const KIND_LABELS: Record<Activity['kind'], string> = {
  lesson: 'Lesson',
  interactive: 'Interactive',
  codeLab: 'Code lab',
  challenge: 'Challenge',
  quiz: 'Quiz',
  assignment: 'Assignment',
  project: 'Project',
  simulation: 'Simulation',
}

export function ActivityCompletionCard({
  activity,
  summary,
  onOpen,
}: {
  activity: Activity
  summary: ClassProgressSummary
  onOpen?: (activityId: string) => void
}) {
  const { completed, enrolled, struggling, notStarted } = summary
  const percent = enrolled === 0 ? 0 : Math.round((completed / enrolled) * 100)

  return (
    <section aria-labelledby="activity-heading" className="panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="technical-label">CURRENT ACTIVITY</p>
          <h2 id="activity-heading" className="mt-2 font-display text-xl text-ink-100">
            {activity.title}
          </h2>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.625rem] text-ink-600">
            <span className="rounded-pill border border-lab-600 px-2 py-0.5 uppercase">
              {KIND_LABELS[activity.kind]}
            </span>
            {activity.estimatedMinutes && <span>{activity.estimatedMinutes} min</span>}
            {activity.difficulty && <span>{activity.difficulty}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpen?.(activity.id)}
          disabled={!onOpen}
          title={onOpen ? undefined : 'The student view of this activity is not published yet.'}
          aria-label={
            onOpen ? undefined : 'Open activity — unavailable: the student view is not published yet.'
          }
          className="rounded-pill border border-lab-600 px-4 py-2 font-mono text-xs text-ink-300 transition-colors enabled:hover:border-accent-400/50 enabled:hover:text-accent-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Open activity
        </button>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-500">{activity.objective}</p>

      {/* Completion, drawn from the same counts as the cohort buckets */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <p className="technical-label">COMPLETION</p>
          <p className="font-display text-2xl text-ink-100 tabular-nums">{percent}%</p>
        </div>
        <div
          className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-lab-800"
          role="img"
          aria-label={`${percent} percent complete, ${completed} of ${enrolled} students`}
        >
          <div
            className="h-full rounded-full bg-accent-400 transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 font-mono text-[0.625rem] text-ink-600">
          {completed} of {enrolled} students · {struggling} still working · {notStarted} not
          started
        </p>
      </div>

      {/* Per-case test results, when the activity has any */}
      {activity.kind === 'codeLab' && activity.testCases.length > 0 && (
        <div className="mt-6 border-t border-lab-800 pt-4">
          <p className="technical-label">TEST CASES</p>
          <ul className="mt-3 flex flex-col gap-2">
            {activity.testCases.map((testCase) => (
              <li key={testCase.id} className="flex items-center gap-3 text-sm">
                <span
                  aria-hidden
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-pill',
                    testCase.hidden ? 'bg-accent-400' : 'bg-lab-600',
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-ink-300">{testCase.name}</span>
                {testCase.hidden && (
                  <span className="shrink-0 font-mono text-[0.5625rem] text-ink-700 uppercase">
                    hidden
                  </span>
                )}
                <span className="shrink-0 font-mono text-[0.625rem] text-ink-700 tabular-nums">
                  ×{testCase.weight}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
