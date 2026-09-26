import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyPanel } from '../ui/AsyncBoundary'
import { KindBadge, PageHeader, StatusPill, TeacherPage } from './TeacherPage'
import { useCourseOutline, type CourseOutline } from './useCourseOutline'
import { cn } from '../../utils/cn'
import type { Activity, ActivityKind } from '../../domain'
import { KINDS } from '../../services/assessment/activityDraft'

/**
 * `/teacher/studio` — the Content Studio index.
 *
 * The entry point a teacher needs before opening an editor: which activity am I
 * editing, what have I already changed, and what is still unpublished. Filtering
 * by kind matters because the course holds 46 activities across 7 kinds and the
 * studio is where a code lab is distinguished from a lesson.
 */
export function StudioIndexScreen() {
  const outline = useCourseOutline()
  const [kind, setKind] = useState<ActivityKind | 'all'>('all')
  const [query, setQuery] = useState('')
  const [onlyDrafts, setOnlyDrafts] = useState(false)
  const navigate = useNavigate()

  return (
    <TeacherPage
      state={outline}
      errorMessage="The studio could not be loaded. Local storage may be unavailable in this browser."
    >
      {(data) => (
        <>
          <PageHeader
            eyebrow="CONTENT STUDIO"
            title="Author activities"
            description="Every edit is stored in this browser over the seeded course, so the demo can always be reset."
            meta={`${data.sections.flatMap((s) => s.activities).length} activities · ${data.authoredIds.size} edited here`}
            actions={
              <button
                type="button"
                onClick={() => navigate(`/teacher/studio/${data.sections[0]?.activities[0]?.id ?? ''}`)}
                disabled={data.sections[0]?.activities.length === 0}
                className="rounded-pill border border-accent-400/50 px-4 py-2 font-mono text-xs text-accent-300 transition-colors hover:bg-accent-400/10 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                Open first activity →
              </button>
            }
          />

          <StudioFilters
            data={data}
            kind={kind}
            onKindChange={setKind}
            query={query}
            onQueryChange={setQuery}
            onlyDrafts={onlyDrafts}
            onOnlyDraftsChange={setOnlyDrafts}
          />

          <StudioResults data={data} kind={kind} query={query} onlyDrafts={onlyDrafts} />
        </>
      )}
    </TeacherPage>
  )
}

function StudioFilters({
  data,
  kind,
  onKindChange,
  query,
  onQueryChange,
  onlyDrafts,
  onOnlyDraftsChange,
}: {
  data: CourseOutline
  kind: ActivityKind | 'all'
  onKindChange: (kind: ActivityKind | 'all') => void
  query: string
  onQueryChange: (query: string) => void
  onlyDrafts: boolean
  onOnlyDraftsChange: (value: boolean) => void
}) {
  const all = data.sections.flatMap((s) => s.activities)
  const counts = useMemo(() => {
    const map = new Map<ActivityKind | 'all', number>([['all', all.length]])
    for (const activity of all) map.set(activity.kind, (map.get(activity.kind) ?? 0) + 1)
    return map
  }, [all])

  return (
    <div className="mt-8 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', ...KINDS] as const).map((option) => {
          const count = counts.get(option) ?? 0
          if (count === 0 && option !== 'all') return null
          return (
            <button
              key={option}
              type="button"
              aria-pressed={kind === option}
              onClick={() => onKindChange(option)}
              className={cn(
                'rounded-pill border px-3 py-1.5 font-mono text-[0.625rem] transition-colors',
                kind === option
                  ? 'border-accent-400/50 bg-accent-400/10 text-accent-300'
                  : 'border-lab-700 text-ink-400 hover:border-accent-400/40',
              )}
            >
              {option === 'all' ? 'All' : option} {count}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex min-w-0 flex-1 items-center gap-3">
          <span className="shrink-0 font-mono text-[0.625rem] tracking-widest text-ink-600 uppercase">
            Search
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Title or objective"
            className="min-w-0 flex-1 rounded-pill border border-lab-700 bg-lab-850 px-3 py-1.5 text-sm text-ink-200 placeholder:text-ink-700 focus-visible:border-accent-400/50 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none"
          />
        </label>
        <label className="flex shrink-0 items-center gap-2 font-mono text-[0.625rem] text-ink-500">
          <input
            type="checkbox"
            checked={onlyDrafts}
            onChange={(e) => onOnlyDraftsChange(e.target.checked)}
            className="accent-accent-400"
          />
          Unpublished only
        </label>
      </div>
    </div>
  )
}

function StudioResults({
  data,
  kind,
  query,
  onlyDrafts,
}: {
  data: CourseOutline
  kind: ActivityKind | 'all'
  query: string
  onlyDrafts: boolean
}) {
  const needle = query.trim().toLowerCase()

  const matches = useMemo(() => {
    return data.sections
      .flatMap((section) => section.activities.map((activity) => ({ section, activity })))
      .filter(({ activity }) => {
        if (kind !== 'all' && activity.kind !== kind) return false
        if (onlyDrafts && activity.status === 'published') return false
        if (!needle) return true
        return (
          activity.title.toLowerCase().includes(needle) ||
          activity.objective.toLowerCase().includes(needle)
        )
      })
  }, [data.sections, kind, needle, onlyDrafts])

  if (matches.length === 0) {
    return (
      <div className="mt-6">
        <EmptyPanel message="No activity matches those filters. Clear the search or pick another kind." />
      </div>
    )
  }

  return (
    <ul className="panel mt-6 divide-y divide-lab-800/70 overflow-hidden">
      {matches.map(({ section, activity }) => (
        <StudioRow
          key={activity.id}
          activity={activity}
          sectionTitle={section.title}
          authored={data.authoredIds.has(activity.id)}
        />
      ))}
    </ul>
  )
}

function StudioRow({
  activity,
  sectionTitle,
  authored,
}: {
  activity: Activity
  sectionTitle: string
  authored: boolean
}) {
  return (
    <li>
      <Link
        to={`/teacher/studio/${activity.id}`}
        className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-lab-800/50 focus-visible:bg-lab-800/50 focus-visible:outline-none"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 truncate text-sm font-medium text-ink-100">{activity.title}</span>
            <KindBadge kind={activity.kind} />
            <StatusPill status={activity.status} />
            {authored && (
              <span className="font-mono text-[0.5625rem] tracking-widest text-ink-600 uppercase">
                edited
              </span>
            )}
            {activity.rubric && (
              <span className="font-mono text-[0.5625rem] tracking-widest text-ink-600 uppercase">
                rubric {activity.rubric.maxPoints}pts
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-500">{activity.objective}</p>
        </div>
        <span className="shrink-0 font-mono text-[0.625rem] text-ink-700">
          {sectionTitle} · {activity.estimatedMinutes} min
        </span>
      </Link>
    </li>
  )
}
