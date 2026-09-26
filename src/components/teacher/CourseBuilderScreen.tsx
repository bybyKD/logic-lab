import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { courseRepository } from '../../services/repositories'
import { getSkill } from '../../data/selectors'
import {
  GhostButton,
  KindBadge,
  PageHeader,
  StatusPill,
  TeacherPage,
} from './TeacherPage'
import { useCourseOutline, type CourseOutline, type SectionOutline } from './useCourseOutline'
import { canPublish, validateActivityDraft, type DraftContext } from '../../services/assessment/activityDraft'
import { LANGUAGE_ORDER } from '../../data/languages'
import { SKILLS } from '../../data/seed'
import type { Activity } from '../../domain'

/**
 * `/teacher/courses/:courseId` — the course builder.
 *
 * Sections and their activities, with the one control that matters here: publish
 * or unpublish. Publishing is gated on the same validator the studio uses, so a
 * half-finished activity cannot reach a class from a second route.
 */
export function CourseBuilderScreen() {
  const { courseId } = useParams<{ courseId: string }>()
  const outline = useCourseOutline()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const draftContext: DraftContext = {
    knownSkillIds: new Set(SKILLS.map((s) => s.id)),
    knownLanguageIds: new Set<string>(LANGUAGE_ORDER),
  }

  const togglePublish = async (activity: Activity, publish: boolean) => {
    setPendingId(activity.id)
    setError(null)
    try {
      await courseRepository.setPublished(activity.id, publish)
      outline.reload()
    } catch {
      setError(`Could not change the publish state of “${activity.title}”. Try again.`)
    } finally {
      setPendingId(null)
    }
  }

  return (
    <TeacherPage state={outline} errorMessage="This course could not be loaded.">
      {(data) => (
        <BuilderBody
          data={data}
          courseId={courseId}
          draftContext={draftContext}
          pendingId={pendingId}
          error={error}
          onTogglePublish={togglePublish}
        />
      )}
    </TeacherPage>
  )
}

function BuilderBody({
  data,
  courseId,
  draftContext,
  pendingId,
  error,
  onTogglePublish,
}: {
  data: CourseOutline
  courseId: string | undefined
  draftContext: DraftContext
  pendingId: string | null
  error: string | null
  onTogglePublish: (activity: Activity, publish: boolean) => void
}) {
  if (courseId && data.course.id !== courseId) {
    return (
      <>
        <PageHeader eyebrow="COURSE BUILDER" title="Course not found" />
        <p className="mt-6 text-ink-500">
          No course with the id <code className="font-mono text-ink-300">{courseId}</code>.{' '}
          <Link to="/teacher/courses" className="text-accent-300 underline">
            Back to courses
          </Link>
          .
        </p>
      </>
    )
  }

  const published = data.sections.flatMap((s) => s.activities).filter((a) => a.status === 'published')
  const total = data.sections.flatMap((s) => s.activities).length

  return (
    <>
      <PageHeader
        eyebrow="COURSE BUILDER"
        title={data.course.title}
        description={data.course.description}
        meta={`${data.sections.length} sections · ${published.length} of ${total} activities published`}
        actions={
          <Link
            to="/teacher/studio"
            className="rounded-pill border border-accent-400/50 px-4 py-2 font-mono text-xs text-accent-300 transition-colors hover:bg-accent-400/10 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none"
          >
            Open Content Studio →
          </Link>
        }
      />

      {error && (
        <p role="alert" className="mt-6 text-sm text-error">
          {error}
        </p>
      )}

      <div className="mt-10 flex flex-col gap-6">
        {data.sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            authoredIds={data.authoredIds}
            draftContext={draftContext}
            pendingId={pendingId}
            onTogglePublish={onTogglePublish}
          />
        ))}
      </div>
    </>
  )
}

function SectionCard({
  section,
  authoredIds,
  draftContext,
  pendingId,
  onTogglePublish,
}: {
  section: SectionOutline
  authoredIds: Set<string>
  draftContext: DraftContext
  pendingId: string | null
  onTogglePublish: (activity: Activity, publish: boolean) => void
}) {
  const published = section.activities.filter((a) => a.status === 'published').length

  return (
    <section aria-labelledby={`section-${section.id}`} className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lab-700 px-5 py-4">
        <div className="min-w-0">
          <h2 id={`section-${section.id}`} className="font-display text-lg text-ink-100">
            <span className="mr-2 font-mono text-[0.625rem] text-ink-700 tabular-nums">
              {String(section.order + 1).padStart(2, '0')}
            </span>
            {section.title}
          </h2>
          <p className="mt-0.5 truncate text-sm text-ink-500">{section.summary}</p>
        </div>
        <p className="shrink-0 font-mono text-[0.625rem] text-ink-600 tabular-nums">
          {published}/{section.activities.length} published
        </p>
      </div>

      <ul>
        {section.activities.map((activity) => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            authored={authoredIds.has(activity.id)}
            draftContext={draftContext}
            busy={pendingId === activity.id}
            onTogglePublish={onTogglePublish}
          />
        ))}
      </ul>
    </section>
  )
}

function ActivityRow({
  activity,
  authored,
  draftContext,
  busy,
  onTogglePublish,
}: {
  activity: Activity
  authored: boolean
  draftContext: DraftContext
  busy: boolean
  onTogglePublish: (activity: Activity, publish: boolean) => void
}) {
  // Validated against itself: this row reports on the stored activity, and the
  // studio is where it gets edited.
  const issues = validateActivityDraft(activity, activity, draftContext)
  const errors = issues.filter((i) => i.severity === 'error')
  const publishable = canPublish(issues)
  const isPublished = activity.status === 'published'

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-lab-800/70 px-5 py-3.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/teacher/studio/${activity.id}`}
            className="min-w-0 truncate text-sm font-medium text-ink-100 hover:text-accent-300"
          >
            {activity.title}
          </Link>
          <KindBadge kind={activity.kind} />
          <StatusPill status={activity.status} />
          {authored && (
            <span className="font-mono text-[0.5625rem] tracking-widest text-ink-600 uppercase">
              edited
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate font-mono text-[0.625rem] text-ink-600">
          {activity.estimatedMinutes} min · {activity.points} pts ·{' '}
          {activity.skillIds.map((id) => getSkill(id)?.name ?? id).join(', ')}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {errors.length > 0 && (
          <span
            title={errors.map((e) => e.message).join(' · ')}
            className="font-mono text-[0.5625rem] tracking-widest text-warning uppercase"
          >
            {errors.length} {errors.length === 1 ? 'blocker' : 'blockers'}
          </span>
        )}
        <Link
          to={`/teacher/studio/${activity.id}`}
          className="rounded-pill border border-lab-700 px-3 py-1.5 font-mono text-[0.625rem] text-ink-400 transition-colors hover:border-accent-400/50 hover:text-accent-300"
        >
          Edit
        </Link>
        <GhostButton
          className="px-3 py-1.5 text-[0.625rem]"
          disabled={busy || (!isPublished && !publishable)}
          onClick={() => onTogglePublish(activity, !isPublished)}
          title={
            !isPublished && !publishable
              ? 'Fix the validation errors in the studio before publishing.'
              : undefined
          }
        >
          {busy ? '…' : isPublished ? 'Unpublish' : 'Publish'}
        </GhostButton>
      </div>
    </li>
  )
}
