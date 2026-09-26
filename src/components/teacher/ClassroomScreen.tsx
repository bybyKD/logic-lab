import { useMemo, useState } from 'react'
import { Navbar } from '../layout/Navbar'
import { AsyncBoundary, EmptyPanel, useAsync } from '../ui/AsyncBoundary'
import { cn } from '../../utils/cn'
import {
  attemptRepository,
  classRepository,
  courseRepository,
} from '../../services/repositories'
import { getSkill } from '../../data/selectors'
import { TeacherLayout } from './TeacherLayout'
import { CohortSplit } from './CohortSplit'
import { ActivityCompletionCard } from './ActivityCompletionCard'
import { MisconceptionPanel } from './MisconceptionPanel'
import {
  buildClassroom,
  relativeTime,
  segmentLabel,
  type ClassroomData,
  type StudentRow,
} from './classroomViewModel'

/**
 * The classroom screen — §16, "the most important prototype screen".
 *
 * It reads five things asynchronously and derives everything on screen. No
 * number here is authored: the cohort split, the completion bar and the common
 * issue all come out of `Attempt` records via the Phase 2 learning engine.
 */
export function ClassroomScreen() {
  const [misconceptionFilter, setMisconceptionFilter] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  // Frozen at mount so relative timestamps and the 24h count stay internally
  // consistent while the screen is open.
  const [now] = useState(() => Date.now())

  const state = useAsync(
    async () => {
      const [klass, students, enrollments, attempts, activities] = await Promise.all([
        classRepository.getClass(),
        classRepository.listStudents(),
        classRepository.listEnrollments(),
        attemptRepository.list(),
        courseRepository.listSections().then(async (sections: { id: string }[]) => {
          const nested = await Promise.all(
            sections.map((section) => courseRepository.listActivities(section.id)),
          )
          return nested.flat()
        }),
      ])
      return buildClassroom({ class: klass, students, enrollments, attempts, activities, now })
    },
    [now],
  )

  return (
    <div className="min-h-screen bg-lab-900">
      <Navbar variant="app" />
      <TeacherLayout>
        <main className="px-5 pt-28 pb-24 lg:px-8">
          <AsyncBoundary
            state={state}
            errorMessage="The classroom could not be loaded. Check that local storage is available and try again."
          >
            {(data) => (
              <>
                <header className="flex flex-wrap items-end justify-between gap-6">
                  <div>
                    <p className="technical-label flex items-center gap-2">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-400 motion-reduce:animate-none" />
                      CLASSROOM
                    </p>
                    <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-ink-100 md:text-5xl">
                      {data.class.name}
                    </h1>
                    <p className="mt-3 max-w-xl text-ink-500">
                      {data.summary.enrolled} students working through{' '}
                      <span className="text-ink-300">{data.focusActivity.title}</span>.
                      {' '}
                      {data.attemptsLast24h} submissions in the last 24 hours.
                    </p>
                  </div>
                  <p className="font-mono text-[0.625rem] text-ink-700">
                    term {data.class.term} · every figure below is derived from attempt records
                  </p>
                </header>

                {/* §16 order: cohort, current activity, common issue */}
                {/* `[&>*]:min-w-0`: grid items default to min-width:auto, so one long
                    nowrap string inside a panel would stretch the whole track and
                    push the page into horizontal scroll on a phone. */}
                <div className="mt-10 grid gap-6 [&>*]:min-w-0 xl:grid-cols-[1fr_1.15fr]">
                  <CohortSplit summary={data.summary} />
                  <ActivityCompletionCard
                    activity={data.focusActivity}
                    summary={data.summary}
                  />
                </div>

                <div className="mt-6 grid gap-6 [&>*]:min-w-0 xl:grid-cols-[1.15fr_1fr]">
                  <MisconceptionPanel
                    tallies={data.misconceptions}
                    activity={data.focusActivity}
                    onViewStudents={setMisconceptionFilter}
                  />
                  <SkillWatch data={data} />
                </div>

                <StudentTable
                  rows={data.rows}
                  now={now}
                  filter={misconceptionFilter}
                  onFilterChange={setMisconceptionFilter}
                  selected={selected}
                  onSelect={setSelected}
                />
              </>
            )}
          </AsyncBoundary>
        </main>
      </TeacherLayout>
    </div>
  )
}

/** Weakest skills for the whole class — feeds "what to reteach next". */
function SkillWatch({ data }: { data: ClassroomData }) {
  if (data.weakestSkills.length === 0) return null

  return (
    <section aria-labelledby="skills-heading" className="panel p-6">
      <h2 id="skills-heading" className="font-display text-xl text-ink-100">
        Skills to watch
      </h2>
      <p className="mt-2 text-sm text-ink-500">
        Lowest mastery across the class, with the evidence behind each score.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {data.weakestSkills.map((mastery) => {
          const skill = getSkill(mastery.skillId)
          return (
            <li key={mastery.skillId}>
              <div className="flex items-baseline gap-3">
                <span className="min-w-0 flex-1 truncate text-sm text-ink-300">
                  {skill?.name ?? mastery.skillId}
                </span>
                <span className="shrink-0 font-mono text-xs text-ink-200 tabular-nums">
                  {mastery.score}
                </span>
                <span className="shrink-0 font-mono text-[0.5625rem] text-ink-700 uppercase">
                  {mastery.confidence}
                </span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-lab-800">
                <div className="h-full rounded-full bg-lab-500" style={{ width: `${mastery.score}%` }} />
              </div>
              <p className="mt-1 font-mono text-[0.5625rem] text-ink-700">
                {mastery.evidenceCount} submissions
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const SEGMENT_TONES: Record<StudentRow['segment'], string> = {
  completed: 'text-success',
  'in-progress': 'text-accent-300',
  struggling: 'text-error',
  'not-started': 'text-ink-600',
}

/**
 * The roster, adapted rather than rewritten: the Phase 2 `StudentEngagement`
 * rows drive it, so progress and status are derived per student.
 */
function StudentTable({
  rows,
  now,
  filter,
  onFilterChange,
  selected,
  onSelect,
}: {
  rows: StudentRow[]
  now: number
  filter: string | null
  onFilterChange: (id: string | null) => void
  selected: string | null
  onSelect: (id: string | null) => void
}) {
  const visible = useMemo(() => {
    const list = filter
      ? rows.filter((r) => r.misconceptionIds.includes(filter))
      : rows
    return [...list].sort((a, b) => {
      // Struggling first: that is who the teacher opened the screen for.
      const order = { struggling: 0, 'in-progress': 1, 'not-started': 2, completed: 3 }
      const delta = order[a.segment] - order[b.segment]
      if (delta !== 0) return delta
      return a.passRate - b.passRate
    })
  }, [rows, filter])

  if (rows.length === 0) {
    return (
      <div className="mt-6">
        <EmptyPanel message="No students are enrolled in this class yet." />
      </div>
    )
  }

  return (
    <section aria-labelledby="roster-heading" className="panel mt-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lab-700 px-5 py-4">
        <div>
          <h2 id="roster-heading" className="font-display text-lg text-ink-100">
            Students
          </h2>
          <p className="mt-0.5 font-mono text-[0.625rem] text-ink-600">
            showing {visible.length} of {rows.length}
            {filter ? ` · flagged with a specific issue` : ''}
          </p>
        </div>
        {filter && (
          <button
            type="button"
            onClick={() => onFilterChange(null)}
            className="rounded-pill border border-lab-600 px-3 py-1.5 font-mono text-[0.625rem] text-ink-400 transition-colors hover:border-accent-400/50 hover:text-accent-300"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-lab-700 bg-lab-850/60">
              <th className="px-5 py-3 font-mono text-[0.625rem] tracking-widest text-ink-600 uppercase">
                Student
              </th>
              <th className="px-4 py-3 font-mono text-[0.625rem] tracking-widest text-ink-600 uppercase">
                Status
              </th>
              <th className="px-4 py-3 font-mono text-[0.625rem] tracking-widest text-ink-600 uppercase">
                Pass rate
              </th>
              <th className="px-4 py-3 font-mono text-[0.625rem] tracking-widest text-ink-600 uppercase">
                Best
              </th>
              <th className="px-4 py-3 font-mono text-[0.625rem] tracking-widest text-ink-600 uppercase">
                Last active
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row.studentId}
                onClick={() => onSelect(selected === row.studentId ? null : row.studentId)}
                className={cn(
                  'cursor-pointer border-b border-lab-800/70 transition-colors hover:bg-lab-800/50',
                  selected === row.studentId && 'bg-accent-400/5',
                )}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill border border-lab-600 bg-lab-800 font-mono text-xs text-ink-300">
                      {row.student.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-100">
                        {row.student.name}
                      </p>
                      <p className="truncate font-mono text-[0.625rem] text-ink-600">
                        {row.student.cohort}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn('text-sm', SEGMENT_TONES[row.segment])}>
                    {segmentLabel(row.segment)}
                  </span>
                  {row.misconceptionIds.length > 0 && (
                    <p className="mt-0.5 font-mono text-[0.5625rem] text-warning">
                      {row.misconceptionIds.length} flagged
                    </p>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <div className="w-24">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-lab-700">
                      <div
                        className="h-1.5 rounded-full bg-accent-400"
                        style={{ width: `${row.passRate}%` }}
                      />
                    </div>
                    <p className="mt-1.5 font-mono text-[0.625rem] text-ink-600 tabular-nums">
                      {row.passRate}% · {row.attempts} attempts
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-sm text-ink-200 tabular-nums">
                  {row.bestScore}
                </td>
                <td className="px-4 py-3.5 text-sm text-ink-500">
                  {relativeTime(row.lastActivityAt, now)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
