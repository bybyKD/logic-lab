import { cn } from '../../utils/cn'
import type { ClassProgressSummary } from '../../services/learning/mastery'

/**
 * The cohort split from §16: 29 completed · 8 struggling · 5 haven't started.
 *
 * All four counts come from `classProgressSummary`, which measures engagement with
 * the activity the class is currently working on. The percentages are of the
 * enrolled count, and the bar is the same data as the three numbers — not a
 * separate hand-drawn gauge.
 */

interface CohortSplitProps {
  summary: ClassProgressSummary
}

interface Segment {
  key: 'completed' | 'struggling' | 'inProgress' | 'notStarted'
  label: string
  bar: string
  text: string
}

export function CohortSplit({ summary }: CohortSplitProps) {
  const { enrolled, completed, struggling, notStarted } = summary

  const segments: Segment[] = [
    { key: 'completed', label: 'completed', bar: 'bg-success', text: 'text-success' },
    { key: 'struggling', label: 'struggling', bar: 'bg-error', text: 'text-error' },
    { key: 'inProgress', label: 'working elsewhere', bar: 'bg-accent-400', text: 'text-accent-300' },
    { key: 'notStarted', label: "haven't started", bar: 'bg-lab-600', text: 'text-ink-500' },
  ]

  const countFor = (key: Segment['key']) => summary[key]
  const pct = (n: number) => (enrolled === 0 ? 0 : Math.round((n / enrolled) * 100))

  return (
    <section aria-labelledby="cohort-heading" className="panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="cohort-heading" className="font-display text-xl text-ink-100">
          Cohort
        </h2>
        <p className="font-mono text-xs text-ink-500">
          <span className="text-ink-200">{enrolled}</span> students enrolled
        </p>
      </div>

      {/* The §16 numbers */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Bucket value={completed} label="completed" tone="text-success" />
        <Bucket value={struggling} label="struggling" tone="text-error" />
        <Bucket value={notStarted} label="haven't started" tone="text-ink-400" />
      </div>

      {/* Same data as a proportional bar */}
      <div className="mt-6">
        <div
          className="flex h-2.5 w-full overflow-hidden rounded-full bg-lab-800"
          role="img"
          aria-label={segments
            .filter((s) => countFor(s.key) > 0)
            .map((s) => `${countFor(s.key)} ${s.label}`)
            .join(', ')}
        >
          {segments.map((segment) => {
            const count = countFor(segment.key)
            if (count === 0) return null
            return (
              <div
                key={segment.key}
                className={cn('h-full', segment.bar)}
                style={{ width: `${pct(count)}%` }}
              />
            )
          })}
        </div>

        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {segments.map((segment) => {
            const count = countFor(segment.key)
            return (
              <li key={segment.key} className="flex items-center gap-2.5 text-sm">
                <span aria-hidden className={cn('h-2 w-2 shrink-0 rounded-pill', segment.bar)} />
                <span className={cn('font-mono text-sm tabular-nums', segment.text)}>{count}</span>
                <span className="text-ink-500">{segment.label}</span>
                {count > 0 && (
                  <span className="ml-auto font-mono text-[0.625rem] text-ink-700 tabular-nums">
                    {pct(count)}%
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function Bucket({
  value,
  label,
  tone,
}: {
  value: number
  label: string
  tone: string
}) {
  return (
    <div className="rounded-lg border border-lab-700 bg-lab-850/60 p-4">
      <p className={cn('font-display text-3xl font-medium tabular-nums', tone)}>{value}</p>
      <p className="mt-1 text-xs leading-snug text-ink-500">{label}</p>
    </div>
  )
}
