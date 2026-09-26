import type { Activity } from '../../domain'
import { getActivity } from '../../data/selectors'
import { cn } from '../../utils/cn'
import type { MisconceptionTally } from '../../services/learning/mastery'

/**
 * The "common issue" panel — the line that makes this screen worth building.
 *
 * Instead of "32% failed", the teacher sees which wrong mental model is costing
 * the class the most, how many students hold it, and the one action that
 * addresses it. Every row is derived from tagged `Attempt` records; the detector
 * only tags code-bearing attempts, so each claim here is traceable to source a
 * student actually wrote.
 */

interface MisconceptionPanelProps {
  tallies: MisconceptionTally[]
  /** Activity the tallies were measured against, for the "Open activity" action. */
  activity: Activity
  onViewStudents?: (misconceptionId: string) => void
  onOpenActivity?: (activityId: string) => void
  onExplainToClass?: (misconceptionId: string) => void
}

export function MisconceptionPanel({
  tallies,
  activity,
  onViewStudents,
  onOpenActivity,
  onExplainToClass,
}: MisconceptionPanelProps) {
  const [top, ...rest] = tallies

  if (!top) {
    return (
      <section aria-labelledby="issue-heading" className="panel p-6">
        <h2 id="issue-heading" className="font-display text-xl text-ink-100">
          Common issue
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          No misconceptions detected yet. Flags appear once students submit code —
          multiple-choice answers on their own never establish a cause.
        </p>
      </section>
    )
  }

  const recommended = top.recommendedActivityId
    ? getActivity(top.recommendedActivityId)
    : undefined

  return (
    <section aria-labelledby="issue-heading" className="panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="issue-heading" className="font-display text-xl text-ink-100">
          Common issue
        </h2>
        <p className="font-mono text-xs text-ink-600">
          {tallies.reduce((sum, t) => sum + t.studentCount, 0)} students flagged
        </p>
      </div>

      {/* Headline: the one sentence from §16 */}
      <div className="mt-5 rounded-lg border border-warning/25 bg-warning/5 p-4">
        <p className="text-base leading-relaxed text-ink-100">
          Students are confusing{' '}
          <span className="text-warning">{top.label.toLowerCase()}</span>.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-400">{top.description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.625rem] text-ink-600">
          <span>
            <span className="text-ink-200">{top.studentCount}</span> students
          </span>
          <span>
            <span className="text-ink-200">{top.occurrences}</span> submissions
          </span>
          <span>skill: {top.skillId}</span>
        </div>
      </div>

      {/* The remedy, stated as something a teacher can act on */}
      <div className="mt-4 rounded-lg border border-lab-700 bg-lab-850/60 p-4">
        <p className="technical-label">SUGGESTED MOVE</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-300">{top.remediationHint}</p>
        {recommended && (
          <p className="mt-2 text-xs text-ink-500">
            Best addressed by{' '}
            <span className="text-ink-300">{recommended.title}</span>
          </p>
        )}
      </div>

      {/* §16 actions */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Action
          onClick={() => onViewStudents?.(top.id)}
          disabled={!onViewStudents}
          primary
        >
          View students
        </Action>
        <Action
          onClick={() => onOpenActivity?.(activity.id)}
          disabled={!onOpenActivity}
          unavailableReason="The student view of this activity is not published yet."
        >
          Open activity
        </Action>
        <Action
          onClick={() => onExplainToClass?.(top.id)}
          disabled={!onExplainToClass}
          unavailableReason="Sending feedback to the class is not available yet."
        >
          Explain to class
        </Action>
      </div>

      {/* Runner-up issues, so the teacher can see it is ranked */}
      {rest.length > 0 && (
        <ul className="mt-6 border-t border-lab-800 pt-4">
          {rest.map((tally) => (
            <li
              key={tally.id}
              className="flex items-center gap-3 border-b border-lab-800/60 py-2.5 last:border-0"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink-300">{tally.label}</span>
                <span className="block truncate text-xs text-ink-600">{tally.description}</span>
              </span>
              <span className="shrink-0 font-mono text-xs text-ink-400 tabular-nums">
                {tally.studentCount}
              </span>
              <button
                type="button"
                onClick={() => onViewStudents?.(tally.id)}
                disabled={!onViewStudents}
                className="shrink-0 rounded-pill border border-lab-700 px-2.5 py-1 font-mono text-[0.5625rem] text-ink-500 transition-colors enabled:hover:border-accent-400/50 enabled:hover:text-accent-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                VIEW
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Action({
  children,
  onClick,
  disabled,
  unavailableReason,
  primary,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  /**
   * Why the action is unavailable. A greyed-out button with no explanation reads
   * as a bug, so the reason is exposed to both hover and screen readers.
   */
  unavailableReason?: string
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? unavailableReason : undefined}
      aria-label={disabled && unavailableReason ? `${String(children)} — unavailable: ${unavailableReason}` : undefined}
      className={cn(
        'rounded-pill px-4 py-2 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        primary
          ? 'bg-accent-400 text-lab-950 hover:bg-accent-300'
          : 'border border-lab-600 text-ink-300 hover:border-accent-400/50 hover:text-accent-300',
      )}
    >
      {children}
    </button>
  )
}
