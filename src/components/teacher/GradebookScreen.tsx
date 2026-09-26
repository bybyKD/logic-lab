import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyPanel, useAsync } from '../ui/AsyncBoundary'
import {
  attemptRepository,
  classRepository,
  courseRepository,
  submissionRepository,
} from '../../services/repositories'
import { buildGradebook, type Gradebook } from '../../services/assessment/gradebook'
import { FOCUS_ACTIVITY_ID } from '../../data/seed/attempts'
import { segmentLabel } from './classroomViewModel'
import { cn } from '../../utils/cn'
import { PageHeader, TeacherPage } from './TeacherPage'

/**
 * `/teacher/gradebook` — every student's work, by activity.
 *
 * One row per enrolled student, one column per activity that anyone has actually
 * submitted. The columns are the honest set: an activity nobody has attempted has
 * no grades to show, and a column of blanks would imply otherwise.
 */
export function GradebookScreen() {
  const state = useAsync(() => loadGradebook(), [])

  return (
    <TeacherPage
      state={state}
      errorMessage="The gradebook could not be loaded. Local storage may be unavailable."
    >
      {(data) => (
        <>
          <PageHeader
            eyebrow="GRADEBOOK"
            title="Marks"
            description="Every cell is a graded submission. A blank cell means nothing was handed in; a pending cell means work is waiting on you."
            meta={`${data.book.totals.students} students · ${data.book.columns.length} activities with submissions`}
          />
          <GradebookTable book={data.book} classId={data.classId} />
        </>
      )}
    </TeacherPage>
  )
}

interface GradebookData {
  book: Gradebook
  classId: string
}

async function loadGradebook(): Promise<GradebookData> {
  const [klass, activities, students, enrollments, submissions, attempts] = await Promise.all([
    classRepository.getClass(),
    courseRepository.listAllActivities(),
    classRepository.listStudents(),
    classRepository.listEnrollments(),
    submissionRepository.list(),
    attemptRepository.list(),
  ])

  const attemptsByStudent: Record<string, typeof attempts> = {}
  for (const attempt of attempts) {
    ;(attemptsByStudent[attempt.studentId] ??= []).push(attempt)
  }

  return {
    classId: klass.id,
    book: buildGradebook({
      activities,
      students,
      enrollments,
      submissions,
      attemptsByStudent,
      // The same focus activity the classroom screen uses, so a student labelled
      // "struggling" here is the same student labelled there.
      focusActivityId: FOCUS_ACTIVITY_ID,
    }),
  }
}

const countAwaiting = (row: Gradebook['rows'][number]): number =>
  Object.values(row.cells).filter((cell) => cell.awaitingGrade).length

const SEGMENT_TONES: Record<string, string> = {
  completed: 'text-success',
  'in-progress': 'text-accent-300',
  struggling: 'text-error',
  'not-started': 'text-ink-600',
}

function GradebookTable({ book, classId }: { book: Gradebook; classId: string }) {
  const [sort, setSort] = useState<'name' | 'average' | 'waiting'>('name')

  const rows = useMemo(() => {
    const list = [...book.rows]
    switch (sort) {
      case 'average':
        // Nulls (nothing graded) sort last rather than counting as zero, which
        // would put a student who has not submitted at the bottom of the class.
        return list.sort((a, b) => (b.average ?? -1) - (a.average ?? -1))
      case 'waiting':
        return list.sort(
          (a, b) =>
            countAwaiting(b) - countAwaiting(a) || (a.average ?? 101) - (b.average ?? 101),
        )
      default:
        return list.sort((a, b) => a.student.name.localeCompare(b.student.name))
    }
  }, [book, sort])

  if (book.rows.length === 0) {
    return (
      <div className="mt-8">
        <EmptyPanel message="No students are enrolled in this class yet." />
      </div>
    )
  }

  return (
    <section aria-labelledby="gradebook-heading" className="panel mt-8 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lab-700 px-5 py-4">
        <div>
          <h2 id="gradebook-heading" className="font-display text-lg text-ink-100">
            {book.rows.length} students
          </h2>
          <p className="mt-0.5 font-mono text-[0.625rem] text-ink-600">
            {book.totals.gradedCells} graded · {book.totals.awaitingGrade} awaiting ·{' '}
            {book.totals.missing} not submitted
          </p>
        </div>
        <label className="flex items-center gap-2 font-mono text-[0.625rem] text-ink-500">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-pill border border-lab-700 bg-lab-850 px-3 py-1.5 text-xs text-ink-200 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none"
          >
            <option value="name" className="bg-lab-850">
              Name
            </option>
            <option value="average" className="bg-lab-850">
              Average
            </option>
            <option value="waiting" className="bg-lab-850">
              Most waiting
            </option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-lab-700 bg-lab-850/60">
              <th
                scope="col"
                className="sticky left-0 z-10 bg-lab-850 px-5 py-3 font-mono text-[0.625rem] tracking-widest text-ink-600 uppercase"
              >
                Student
              </th>
              {book.columns.map((activity) => (
                <th
                  key={activity.id}
                  scope="col"
                  className="px-3 py-3 font-mono text-[0.625rem] tracking-widest text-ink-600 uppercase"
                  title={activity.title}
                >
                  <span className="block max-w-[9rem] truncate">{activity.title}</span>
                </th>
              ))}
              <th
                scope="col"
                className="px-3 py-3 font-mono text-[0.625rem] tracking-widest text-ink-600 uppercase"
              >
                Avg
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.student.id} className="border-b border-lab-800/70 last:border-b-0">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-lab-900 px-5 py-3 font-normal hover:bg-lab-850"
                >
                  <Link
                    to={`/teacher/classes/${classId}/students?student=${row.student.id}`}
                    className="flex items-center gap-3"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill border border-lab-600 bg-lab-800 font-mono text-xs text-ink-300">
                      {row.student.name.charAt(0)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-ink-100">{row.student.name}</span>
                      <span
                        className={cn(
                          'block font-mono text-[0.5625rem] tracking-widest uppercase',
                          SEGMENT_TONES[row.segment],
                        )}
                      >
                        {segmentLabel(row.segment)}
                      </span>
                    </span>
                  </Link>
                </th>

                {book.columns.map((activity) => (
                  <td key={activity.id} className="px-3 py-3 text-center">
                    <Cell
                      cell={row.cells[activity.id]}
                      activityId={activity.id}
                      studentId={row.student.id}
                    />
                  </td>
                ))}

                <td className="px-3 py-3 text-right font-mono text-sm text-ink-200 tabular-nums">
                  {row.average ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Cell({
  cell,
  activityId,
  studentId,
}: {
  cell: Gradebook['rows'][number]['cells'][string] | undefined
  activityId: string
  studentId: string
}) {
  if (!cell || cell.submissionId === null) {
    return (
      <span className="font-mono text-xs text-ink-700" title="Nothing submitted">
        —
      </span>
    )
  }

  if (cell.awaitingGrade || cell.score === null) {
    return (
      <Link
        to={`/teacher/assignments/${activityId}/review?submission=${cell.submissionId}`}
        className="font-mono text-xs text-warning underline decoration-dotted underline-offset-2"
        title={`Waiting on you — open the review for ${studentId}`}
      >
        pending
      </Link>
    )
  }

  return (
    <Link
      to={`/teacher/assignments/${activityId}/review?submission=${cell.submissionId}`}
      className={cn(
        'font-mono text-xs tabular-nums',
        cell.score >= 70 ? 'text-success' : cell.score >= 40 ? 'text-accent-300' : 'text-error',
      )}
    >
      {cell.score}
    </Link>
  )
}
