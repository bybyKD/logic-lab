import { useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { EmptyPanel, useAsync } from '../ui/AsyncBoundary'
import {
  attemptRepository,
  classRepository,
  courseRepository,
  feedbackRepository,
  submissionRepository,
} from '../../services/repositories'
import {
  buildActivitySkillMap,
  cohortSegmentForStudent,
  computeSkillMastery,
} from '../../services/learning/mastery'
import { SKILLS } from '../../data/seed'
import { getSkill } from '../../data/selectors'
import { FOCUS_ACTIVITY_ID } from '../../data/seed/attempts'
import { isPending } from '../../services/assessment/grading'
import { cn } from '../../utils/cn'
import { PageHeader, TeacherPage } from './TeacherPage'
import { relativeTime, segmentLabel } from './classroomViewModel'
import type { Activity, Attempt, Feedback, Student, Submission } from '../../domain'

/**
 * `/teacher/classes/:classId/students` — one learner, in full.
 *
 * The roster screen shows a row; this is where a teacher goes when a row needs
 * explaining. Every figure is derived from the same attempt and submission
 * records the gradebook reads, so the three screens cannot tell different stories
 * about the same student.
 */
export function StudentsScreen() {
  const { classId } = useParams<{ classId: string }>()
  const [search] = useSearchParams()
  const requestedStudent = search.get('student')

  const state = useAsync(async () => {
    const [klass, students, enrollments, attempts, submissions, activities, feedback] =
      await Promise.all([
        classRepository.getClass(),
        classRepository.listStudents(),
        classRepository.listEnrollments(),
        attemptRepository.list(),
        submissionRepository.list(),
        courseRepository.listAllActivities(),
        feedbackRepository.list(),
      ])
    return { klass, students, enrollments, attempts, submissions, activities, feedback }
  }, [])

  return (
    <TeacherPage
      state={state}
      errorMessage="The roster could not be loaded. Local storage may be unavailable."
    >
      {(data) => {
        if (classId && data.klass.id !== classId) {
          return (
            <>
              <PageHeader eyebrow="STUDENTS" title="Class not found" />
              <p className="mt-6 text-ink-500">
                No class with the id <code className="font-mono text-ink-300">{classId}</code>.{' '}
                <Link to="/teacher" className="text-accent-300 underline">
                  Back to the classroom
                </Link>
                .
              </p>
            </>
          )
        }

        const enrolledIds = new Set(data.enrollments.map((e) => e.studentId))
        const roster = data.students.filter((s) => enrolledIds.has(s.id))
        const selected =
          roster.find((s) => s.id === requestedStudent) ??
          // Default to the student a teacher would open first: the one furthest
          // behind on the activity the class is working on.
          [...roster].sort(
            (a, b) => segmentRank(a) - segmentRank(b) || a.name.localeCompare(b.name),
          )[0]

        return (
          <>
            <PageHeader
              eyebrow="STUDENTS"
              title={data.klass.name}
              description={`${roster.length} enrolled · term ${data.klass.term}`}
              meta="every figure below is derived from this learner's own attempts and submissions"
              actions={
                <Link
                  to="/teacher/gradebook"
                  className="rounded-pill border border-lab-600 px-4 py-2 font-mono text-xs text-ink-300 transition-colors hover:border-accent-400/50 hover:text-accent-300"
                >
                  Open gradebook
                </Link>
              }
            />

            <div className="mt-8 grid gap-6 [&>*]:min-w-0 xl:grid-cols-[18rem_1fr]">
              <RosterList
                roster={roster}
                attemptsByStudent={groupAttempts(data.attempts)}
                selectedId={selected?.id ?? null}
              />
              {selected ? (
                <StudentDetail
                  student={selected}
                  attempts={data.attempts.filter((a) => a.studentId === selected.id)}
                  submissions={data.submissions.filter((s) => s.studentId === selected.id)}
                  feedback={data.feedback}
                  activities={data.activities}
                />
              ) : (
                <EmptyPanel message="No students are enrolled in this class yet." />
              )}
            </div>
          </>
        )
      }}
    </TeacherPage>
  )
}

const groupAttempts = (attempts: Attempt[]): Record<string, Attempt[]> => {
  const map: Record<string, Attempt[]> = {}
  for (const attempt of attempts) (map[attempt.studentId] ??= []).push(attempt)
  return map
}

/** Struggling first, so the default selection is the one needing attention. */
const segmentRank = (student: Student): number => {
  const rank = { struggling: 0, 'in-progress': 1, 'not-started': 2, completed: 3 }
  return rank[cohortSegmentForStudent([], student.id, FOCUS_ACTIVITY_ID)]
}

function RosterList({
  roster,
  attemptsByStudent,
  selectedId,
}: {
  roster: Student[]
  attemptsByStudent: Record<string, Attempt[]>
  selectedId: string | null
}) {
  return (
    <nav aria-label="Students" className="panel overflow-hidden">
      <ul className="divide-y divide-lab-800/70">
        {roster.map((student) => {
          const segment = cohortSegmentForStudent(
            attemptsByStudent[student.id] ?? [],
            student.id,
            FOCUS_ACTIVITY_ID,
          )
          return (
            <li key={student.id}>
              <Link
                to={`?student=${student.id}`}
                aria-current={student.id === selectedId || undefined}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400',
                  student.id === selectedId ? 'bg-accent-400/10' : 'hover:bg-lab-800/50',
                )}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill border border-lab-600 bg-lab-800 font-mono text-xs text-ink-300">
                  {student.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink-100">{student.name}</span>
                  <span className="block font-mono text-[0.5625rem] text-ink-600">
                    {segmentLabel(segment)}
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function StudentDetail({
  student,
  attempts,
  submissions,
  feedback,
  activities,
}: {
  student: Student
  attempts: Attempt[]
  submissions: Submission[]
  feedback: Feedback[]
  activities: Activity[]
}) {
  const [now] = useState(() => Date.now())

  const segment = cohortSegmentForStudent(attempts, student.id, FOCUS_ACTIVITY_ID)
  // This learner's own attempts, over every activity they have touched — the
  // same computation the classroom runs, narrowed to one student.
  const mastery = useMemo(
    () =>
      computeSkillMastery(attempts, SKILLS, buildActivitySkillMap(activities), { now }).slice(0, 6),
    [attempts, activities, now],
  )
  const graded = submissions.filter((s) => s.status === 'graded' && s.grade)
  const awaiting = submissions.filter(isPending)
  const average = graded.length
    ? Math.round(graded.reduce((sum, s) => sum + (s.grade?.score ?? 0), 0) / graded.length)
    : null
  const hintsUsed = attempts.reduce((sum, a) => sum + a.hintsUsed.length, 0)
  const lastActivityAt = attempts.length
    ? attempts.map((a) => a.submittedAt).sort().slice(-1)[0] ?? null
    : null

  const submissionIds = new Set(submissions.map((s) => s.id))
  const notes = feedback
    .filter((f) => submissionIds.has(f.submissionId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="summary-heading" className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="summary-heading" className="font-display text-2xl text-ink-100">
              {student.name}
            </h2>
            <p className="mt-1 font-mono text-[0.625rem] text-ink-600">
              {student.cohort} · {attempts.length} attempts · last active{' '}
              {lastActivityAt ? relativeTime(lastActivityAt, now) : 'never'}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-pill border px-3 py-1 font-mono text-[0.625rem] tracking-widest uppercase',
              segment === 'struggling'
                ? 'border-error/40 bg-error/10 text-error'
                : 'border-lab-600 bg-lab-800 text-ink-400',
            )}
          >
            {segmentLabel(segment)}
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Figure label="Average" value={average ?? '—'} />
          <Figure label="Graded" value={graded.length} />
          <Figure label="Awaiting review" value={awaiting.length} />
          <Figure label="Hints used" value={hintsUsed} />
        </dl>
      </section>

      {mastery.length > 0 && (
        <section aria-labelledby="mastery-heading" className="panel p-6">
          <h2 id="mastery-heading" className="font-display text-lg text-ink-100">
            Skill mastery
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            Derived from this learner's own attempts, not from a stored percentage.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {mastery.map((entry) => {
              const skill = getSkill(entry.skillId)
              return (
                <li key={entry.skillId}>
                  <div className="flex items-baseline gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-300">
                      {skill?.name ?? entry.skillId}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-ink-200 tabular-nums">
                      {entry.score}
                    </span>
                    <span className="shrink-0 font-mono text-[0.5625rem] text-ink-700 uppercase">
                      {entry.confidence}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-lab-800">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        entry.score >= 70 ? 'bg-success' : entry.score >= 40 ? 'bg-accent-400' : 'bg-error',
                      )}
                      style={{ width: `${entry.score}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="work-heading" className="panel overflow-hidden">
        <div className="border-b border-lab-700 px-5 py-4">
          <h2 id="work-heading" className="font-display text-lg text-ink-100">
            Submissions
          </h2>
        </div>
        {submissions.length === 0 ? (
          <div className="p-5">
            <EmptyPanel message="This learner has not submitted anything yet." />
          </div>
        ) : (
          <ul className="divide-y divide-lab-800/70">
            {[...submissions]
              .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
              .map((submission) => {
                const activity = activities.find((a) => a.id === submission.activityId)
                const pending = isPending(submission)
                return (
                  <li key={submission.id}>
                    <Link
                      to={`/teacher/assignments/${submission.activityId}/review?submission=${submission.id}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-lab-800/50"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm text-ink-200">
                        {activity?.title ?? submission.activityId}
                      </span>
                      <span className="shrink-0 font-mono text-[0.5625rem] text-ink-600">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 font-mono text-[0.625rem] tracking-widest uppercase',
                          pending ? 'text-warning' : 'text-success',
                        )}
                      >
                        {pending ? 'pending' : 'graded'}
                      </span>
                      <span className="shrink-0 font-mono text-xs text-ink-200 tabular-nums">
                        {submission.grade?.score ?? '—'}
                      </span>
                    </Link>
                  </li>
                )
              })}
          </ul>
        )}
      </section>

      {notes.length > 0 && (
        <section aria-labelledby="notes-heading" className="panel p-6">
          <h2 id="notes-heading" className="font-display text-lg text-ink-100">
            Feedback given
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {notes.map((note) => (
              <li key={note.id} className="rounded-pill border border-lab-700 bg-lab-850/50 p-4">
                <p className="text-sm text-ink-200">{note.body}</p>
                <p className="mt-1.5 font-mono text-[0.5625rem] text-ink-600">
                  {note.authorRole} · {new Date(note.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Figure({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0">
      <dd className="font-display text-2xl text-ink-100 tabular-nums">{value}</dd>
      <dt className="mt-0.5 font-mono text-[0.5625rem] tracking-widest text-ink-600 uppercase">
        {label}
      </dt>
    </div>
  )
}
