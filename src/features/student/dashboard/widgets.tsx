import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ProgressRing } from '../../../components/dashboard/ProgressRing'
import { StatCard } from '../../../components/dashboard/StatCard'
import { KindBadge } from '../../../components/teacher/TeacherPage'
import { cn } from '../../../utils/cn'
import { activityHref } from '../paths'
import type {
  ContinueTarget,
  FeedbackItem,
  Recommendation,
  StatTile,
  UpNextItem,
  WaitingItem,
} from './viewModel'

/**
 * The dashboard's panels.
 *
 * Every value rendered here arrives as a prop that the view model already
 * derived. No panel computes a percentage, formats a score, or decides what
 * "next" means — that is the only way the tile, the ring, and the graph are
 * guaranteed to be talking about the same thing.
 */

export function StatTiles({ tiles }: { tiles: readonly StatTile[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map((tile) => (
        <StatCard
          key={tile.id}
          label={tile.label}
          value={tile.value}
          hint={tile.hint}
          accent={tile.accent}
        />
      ))}
    </div>
  )
}

const CONTINUE_COPY: Record<ContinueTarget['reason'], { label: string; hint: string }> = {
  unfinished: { label: 'PICK UP WHERE YOU LEFT OFF', hint: 'Started, not finished yet.' },
  'awaiting-grade': {
    label: 'AWAITING YOUR TEACHER',
    hint: 'Submitted. Your teacher will grade this one.',
  },
  'next-up': { label: 'START HERE', hint: 'Nothing in progress — this is next in the course.' },
  review: { label: 'REVIEW', hint: 'You have finished everything. Revisit your latest work.' },
}

export function ContinueCard({
  target,
  coverage,
  courseId,
}: {
  target: ContinueTarget
  coverage: number
  courseId: string
}) {
  const { activity, section, progress, reason } = target
  const copy = CONTINUE_COPY[reason]
  const started = progress.attempts > 0

  return (
    <div className="panel relative overflow-hidden p-8">
      <div aria-hidden className="absolute -top-16 right-0 h-48 w-48 rounded-full bg-accent-400/10 blur-3xl" />
      <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row">
        <div className="min-w-0">
          <p className="font-mono text-[0.6875rem] tracking-widest text-ink-600 uppercase">
            {copy.label}
          </p>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-ink-100">
            {activity.title}
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
            <span>{section.title}</span>
            <span aria-hidden>·</span>
            <KindBadge kind={activity.kind} />
            <span aria-hidden>·</span>
            <span>{activity.estimatedMinutes} min</span>
          </p>
          <p className="mt-3 max-w-md text-sm text-ink-400">{copy.hint}</p>
          <p className="mt-1 max-w-md text-sm text-ink-500">{activity.objective}</p>

          <Link
            to={activityHref(courseId, section.id, activity.id)}
            className="group mt-6 inline-flex items-center gap-2 rounded-pill bg-accent-400 px-6 py-2.5 font-mono text-sm font-medium text-lab-950 transition-all hover:bg-accent-300 focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-lab-900 focus-visible:outline-none"
          >
            {started ? 'Continue' : 'Start activity'}
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* The ring is course coverage, not this activity's score: a per-activity
            ring would need a denominator the learner cannot see, and would read
            as "you are 8% through this activity" when it is not. */}
        <ProgressRing
          value={coverage}
          size={110}
          label={`${coverage}% of the course opened`}
        />
      </div>
    </div>
  )
}

export function UpNextPanel({
  items,
  courseId,
  className,
}: {
  items: readonly UpNextItem[]
  courseId: string
  className?: string
}) {
  return (
    <section aria-labelledby="up-next-heading" className={className}>
      <p className="technical-label mb-5">UP NEXT</p>
      <div className="panel p-6">
        <h2 id="up-next-heading" className="font-display text-lg font-medium text-ink-100">
          Still to do
        </h2>
        <p className="mt-1 text-xs text-ink-500">
          In course order. This prototype has no assignment calendar, so nothing here
          is a deadline.
        </p>

        {items.length === 0 ? (
          <Empty>Nothing left in the course. Every published activity is done.</Empty>
        ) : (
          <ul className="mt-5 space-y-2">
            {items.map(({ activity, section, progress }) => (
              <li key={activity.id}>
                <Link
                  to={activityHref(courseId, section.id, activity.id)}
                  className="group flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 transition-colors hover:border-lab-600 hover:bg-lab-800 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink-200 group-hover:text-ink-100">
                      {activity.title}
                    </span>
                    <span className="mt-0.5 block font-mono text-[0.625rem] text-ink-600">
                      {section.title} · {activity.estimatedMinutes} min
                      {progress.attempts > 0 ? ` · ${progress.attempts} attempt${progress.attempts === 1 ? '' : 's'}` : ''}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="shrink-0 text-ink-600 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-400"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export function AwaitingGradePanel({
  items,
  courseId,
  className,
}: {
  items: readonly WaitingItem[]
  courseId: string
  className?: string
}) {
  if (items.length === 0) return null

  return (
    <section aria-labelledby="awaiting-heading" className={className}>
      <p className="technical-label mb-5">WAITING ON YOUR TEACHER</p>
      <div className="panel p-6">
        <h2 id="awaiting-heading" className="font-display text-lg font-medium text-ink-100">
          Submitted, not graded
        </h2>
        <ul className="mt-5 space-y-2">
          {items.map((item) => (
            <li key={item.submission.id}>
              <Link
                to={activityHref(courseId, item.section.id, item.activity.id)}
                className="group flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 transition-colors hover:border-lab-600 hover:bg-lab-800 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink-200">{item.activity.title}</span>
                  <span className="mt-0.5 block font-mono text-[0.625rem] text-ink-600">
                    {item.section.title} · {item.feedbackCount > 0 ? `${item.feedbackCount} note` : 'no notes yet'}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="shrink-0 text-ink-600 transition-transform group-hover:translate-x-0.5 group-hover:text-accent-400"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function RecommendedPanel({
  items,
  courseId,
  className,
}: {
  items: readonly Recommendation[]
  courseId: string
  className?: string
}) {
  return (
    <section aria-labelledby="recommended-heading" className={className}>
      <p className="technical-label mb-5">RECOMMENDED PRACTICE</p>
      <div className="panel p-6">
        <h2 id="recommended-heading" className="font-display text-lg font-medium text-ink-100">
          Work on your weakest skills
        </h2>
        <p className="mt-1 text-xs text-ink-500">
          Ranked by mastery from your own attempts. Each one is an activity that
          actually practises the skill.
        </p>

        {items.length === 0 ? (
          <Empty>
            Nothing to recommend yet. Recommendations need at least one scored attempt.
          </Empty>
        ) : (
          <ul className="mt-5 space-y-3">
            {items.map((item) => (
              <li key={item.skill.id} className="rounded-md border border-lab-700 bg-lab-900/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-100">{item.skill.name}</p>
                    <p className="mt-0.5 font-mono text-[0.625rem] text-ink-600">
                      mastery {item.mastery.score} · {item.mastery.evidenceCount} attempt
                      {item.mastery.evidenceCount === 1 ? '' : 's'} · {item.mastery.confidence} confidence
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 font-mono text-sm tabular-nums',
                      item.mastery.score >= 70 ? 'text-warning' : 'text-error',
                    )}
                  >
                    {item.mastery.score}
                  </span>
                </div>
                <Link
                  to={activityHref(courseId, item.section.id, item.activity.id)}
                  className="group mt-3 flex min-w-0 items-center gap-2 text-sm text-accent-400 transition-colors hover:text-accent-300 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none"
                >
                  {/* min-w-0 is load-bearing: a flex item defaults to min-width:auto,
                      so `truncate` alone will not clip an unbroken activity title and
                      the row pushes the page wider at 390. */}
                  <span className="min-w-0 truncate">Practise: {item.activity.title}</span>
                  <span aria-hidden className="shrink-0 transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
                {item.drillsChild && (
                  <p className="mt-1 font-mono text-[0.625rem] text-ink-600">
                    via {item.drillsChild.name}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export function FeedbackPanel({
  items,
  courseId,
  className,
}: {
  items: readonly FeedbackItem[]
  courseId: string
  className?: string
}) {
  return (
    <section aria-labelledby="feedback-heading" className={className}>
      <p className="technical-label mb-5">RECENT FEEDBACK</p>
      <div className="panel p-6">
        <h2 id="feedback-heading" className="font-display text-lg font-medium text-ink-100">
          Notes on your work
        </h2>

        {items.length === 0 ? (
          <Empty>No feedback yet. It appears here once you submit an activity.</Empty>
        ) : (
          <ul className="mt-5 space-y-3">
            {items.map((item) => {
              const body = (
                <>
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <p className="min-w-0 truncate font-mono text-[0.625rem] tracking-widest text-ink-600 uppercase">
                      {item.activityTitle}
                    </p>
                    <span
                      className={cn(
                        'shrink-0 font-mono text-[0.625rem] tracking-widest uppercase',
                        item.fromTeacher ? 'text-accent-400' : 'text-ink-600',
                      )}
                    >
                      {item.fromTeacher ? 'teacher' : 'auto'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-ink-300">{item.feedback.body}</p>
                  <p className="mt-1.5 font-mono text-[0.625rem] text-ink-600">
                    {item.authorName}
                  </p>
                </>
              )

              return (
                <li
                  key={item.feedback.id}
                  className="rounded-md border border-lab-700 bg-lab-900/40 p-4"
                >
                  {item.activity && item.section ? (
                    <Link
                      to={activityHref(courseId, item.section.id, item.activity.id)}
                      className="block rounded focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none"
                    >
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 rounded-md border border-dashed border-lab-600 px-4 py-6 text-center text-sm text-ink-500">
      {children}
    </p>
  )
}
