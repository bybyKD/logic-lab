import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyPanel, useAsync } from '../ui/AsyncBoundary'
import {
  classRepository,
  courseRepository,
  submissionRepository,
} from '../../services/repositories'
import { buildReviewQueue, isRunnable, type ReviewQueue } from '../../services/assessment/reviewQueue'
import { getSkill } from '../../data/selectors'
import { cn } from '../../utils/cn'
import { KindBadge, PageHeader, TeacherPage } from './TeacherPage'
import type { Activity, Student, Submission } from '../../domain'

/**
 * `/teacher/assignments` — the review queue.
 *
 * There is no `Assignment` entity in the domain, so an "assignment" here is an
 * activity that students have actually submitted work for. Showing an activity
 * nobody has attempted as an assignment to grade would be inventing work.
 */
export function AssignmentsScreen() {
  const [now] = useState(() => Date.now())
  const state = useAsync(() => loadQueue(now), [now])

  return (
    <TeacherPage
      state={state}
      errorMessage="The review queue could not be loaded. Local storage may be unavailable."
    >
      {(queue) => (
        <>
          <PageHeader
            eyebrow="ASSIGNMENTS"
            title="Review queue"
            description="Everything a class has handed in, oldest submission first. An assignment here is an activity students have actually submitted work for."
            meta={`${queue.totals.submissions} submissions · ${queue.totals.pending} waiting · ${queue.totals.graded} graded`}
          />
          <QueueTotals queue={queue} />
          <div className="mt-8 grid gap-6 [&>*]:min-w-0 xl:grid-cols-[1fr_1.1fr]">
            <AssignmentList queue={queue} />
            <PendingList queue={queue} />
          </div>
        </>
      )}
    </TeacherPage>
  )
}

async function loadQueue(now: number): Promise<ReviewQueue> {
  const [activities, students, submissions] = await Promise.all([
    courseRepository.listAllActivities(),
    classRepository.listStudents(),
    submissionRepository.list(),
  ])
  return buildReviewQueue({ activities, students, submissions, now })
}

function QueueTotals({ queue }: { queue: ReviewQueue }) {
  const cards: { label: string; value: string | number; sub: string }[] = [
    { label: 'Awaiting review', value: queue.totals.pending, sub: 'oldest first' },
    { label: 'Graded', value: queue.totals.graded, sub: 'of all submissions' },
    { label: 'With activity', value: queue.totals.activities, sub: 'activities' },
  ]

  return (
    <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 [&>*]:min-w-0">
      {cards.map((card) => (
        <div key={card.label} className="panel min-w-0 p-4">
          <dd className="font-display text-3xl text-ink-100 tabular-nums">{card.value}</dd>
          <dt className="mt-1 font-mono text-[0.5625rem] tracking-widest text-ink-500 uppercase">
            {card.label}
          </dt>
          <p className="mt-0.5 text-xs text-ink-700">{card.sub}</p>
        </div>
      ))}
    </dl>
  )
}

function AssignmentList({ queue }: { queue: ReviewQueue }) {
  return (
    <section aria-labelledby="assignments-heading" className="panel overflow-hidden">
      <div className="border-b border-lab-700 px-5 py-4">
        <h2 id="assignments-heading" className="font-display text-lg text-ink-100">
          By activity
        </h2>
        <p className="mt-0.5 text-sm text-ink-500">What each activity is waiting on.</p>
      </div>

      {queue.assignments.length === 0 ? (
        <div className="p-5">
          <EmptyPanel message="No activity has submissions yet. Once a class starts work, it appears here." />
        </div>
      ) : (
        <ul className="divide-y divide-lab-800/70">
          {queue.assignments.map((assignment) => (
            <li key={assignment.activity.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 truncate text-sm font-medium text-ink-100">
                      {assignment.activity.title}
                    </span>
                    <KindBadge kind={assignment.activity.kind} />
                    {isRunnable(assignment.activity) && (
                      <span className="font-mono text-[0.5625rem] tracking-widest text-ink-600 uppercase">
                        runnable
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[0.625rem] text-ink-600">
                    {assignment.activity.skillIds.map((id) => getSkill(id)?.name ?? id).join(', ')}
                  </p>
                </div>
                <Link
                  to={`/teacher/assignments/${assignment.activity.id}/review`}
                  className="shrink-0 rounded-pill border border-lab-700 px-3 py-1.5 font-mono text-[0.625rem] text-ink-400 transition-colors hover:border-accent-400/50 hover:text-accent-300"
                >
                  {assignment.pending > 0 ? `Review ${assignment.pending}` : 'Review'} →
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 font-mono text-[0.625rem] text-ink-600">
                <span className={cn(assignment.pending > 0 && 'text-warning')}>
                  {assignment.pending} waiting
                </span>
                <span>{assignment.graded} graded</span>
                <span>
                  {assignment.averageScore === null
                    ? 'no grades yet'
                    : `avg ${assignment.averageScore}%`}
                </span>
              </div>

              {assignment.averageScore !== null && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-lab-800">
                  <div
                    className="h-full rounded-full bg-accent-400"
                    style={{ width: `${assignment.averageScore}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function PendingList({ queue }: { queue: ReviewQueue }) {
  return (
    <section aria-labelledby="pending-heading" className="panel overflow-hidden">
      <div className="border-b border-lab-700 px-5 py-4">
        <h2 id="pending-heading" className="font-display text-lg text-ink-100">
          Waiting on you
        </h2>
        <p className="mt-0.5 text-sm text-ink-500">
          {queue.pending.length === 0
            ? 'Nothing outstanding.'
            : `Oldest first — ${queue.pending[0].waitingDays === 0 ? 'submitted today' : `waiting ${queue.pending[0].waitingDays} days`}.`}
        </p>
      </div>

      {queue.pending.length === 0 ? (
        <div className="p-5">
          <EmptyPanel message="Every submission has been graded. New work will appear here." />
        </div>
      ) : (
        <ul className="divide-y divide-lab-800/70">
          {queue.pending.map((item) => (
            <PendingRow
              key={item.submission.id}
              submission={item.submission}
              student={item.student}
              activity={item.activity}
              waitingDays={item.waitingDays}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function PendingRow({
  submission,
  student,
  activity,
  waitingDays,
}: {
  submission: Submission
  student: Student
  activity: Activity
  waitingDays: number
}) {
  return (
    <li>
      <Link
        to={`/teacher/assignments/${activity.id}/review?submission=${submission.id}`}
        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-lab-800/50 focus-visible:bg-lab-800/50 focus-visible:outline-none"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill border border-lab-600 bg-lab-800 font-mono text-xs text-ink-300">
          {student.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-ink-100">{student.name}</p>
          <p className="truncate text-xs text-ink-500">{activity.title}</p>
        </div>
        <span
          className={cn(
            'shrink-0 font-mono text-[0.625rem] tabular-nums',
            waitingDays >= 3 ? 'text-warning' : 'text-ink-600',
          )}
        >
          {waitingDays === 0 ? 'today' : `${waitingDays}d`}
        </span>
        <span className="shrink-0 font-mono text-[0.625rem] text-ink-600 tabular-nums">
          {submission.score}%
        </span>
      </Link>
    </li>
  )
}
