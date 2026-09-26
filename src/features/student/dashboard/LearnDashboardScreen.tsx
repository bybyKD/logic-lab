import { useSession } from '../../../services/session/SessionProvider'
import { StudentPage } from '../activity-runner/StudentShell'
import { SkillGraph } from './SkillGraph'
import { useLearnDashboard } from './useLearnDashboard'
import {
  AwaitingGradePanel,
  ContinueCard,
  FeedbackPanel,
  RecommendedPanel,
  StatTiles,
  UpNextPanel,
} from './widgets'

/**
 * The learner dashboard.
 *
 * Replaces the old screen, which printed three invented numbers. The change that
 * matters is not the layout, it is that nothing on this page is a literal: the
 * greeting aside, every figure arrives from `buildLearnDashboard`, which derives
 * it from this learner's attempts. Delete an attempt and the number moves; that
 * is the property the previous dashboard could not offer.
 */
export function LearnDashboardScreen() {
  const { state, courseComplete, reload } = useLearnDashboard()
  const { student } = useSession()

  return (
    <StudentPage state={state} errorMessage="Could not load your dashboard.">
      {(data) => (
        <div className="space-y-16">
          <header>
            <p className="technical-label flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {student ? `Welcome back, ${student.name.split(' ')[0]}` : 'Your dashboard'}
            </p>
            <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-ink-100 md:text-5xl">
              {courseComplete ? 'Course complete.' : 'Keep going.'}
              <br />
              <span className="text-ink-500">
                {courseComplete
                  ? 'Everything published is done. Revisit any activity to keep it fresh.'
                  : `${data.stats.notStarted} of ${data.stats.total} activities untouched.`}
              </span>
            </h1>
          </header>

          <StatTiles tiles={data.tiles} />

          {data.continueWith ? (
            <section aria-label="Continue">
              <p className="technical-label mb-5">CONTINUE</p>
              <ContinueCard
                target={data.continueWith}
                coverage={data.stats.coverage}
                courseId={data.course.id}
              />
            </section>
          ) : (
            <p className="panel p-8 text-sm text-ink-500">
              This course has no published activities yet.
            </p>
          )}

          {/*
            `min-w-0` on both grid items is load-bearing. A grid item defaults to
            `min-width: auto`, so a long activity title in the recommended list set
            the track's minimum to its own intrinsic width and pushed the whole page
            15px wide at 390. Capping the minimum lets the track stay at the
            container width and the titles truncate instead.
          */}
          <div className="grid gap-10 lg:grid-cols-2">
            <UpNextPanel items={data.upNext} courseId={data.course.id} className="min-w-0" />
            <div className="min-w-0 space-y-10">
              <AwaitingGradePanel items={data.awaiting} courseId={data.course.id} />
              <RecommendedPanel items={data.recommended} courseId={data.course.id} />
            </div>
          </div>

          <section aria-labelledby="graph-heading">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="technical-label">SKILL GRAPH</p>
                <h2
                  id="graph-heading"
                  className="mt-1 font-display text-lg font-medium text-ink-100"
                >
                  Where your understanding stands
                </h2>
              </div>
              <p className="font-mono text-[0.625rem] text-ink-600">
                {data.untouchedSkillCount} of {data.totalSkillCount} skills not yet touched
              </p>
            </div>
            <SkillGraph groups={data.skillGroups} />
            <p className="mt-4 text-xs text-ink-600">
              Scores come from your attempts, weighted so recent and unhinted work counts
              for more. A domain with no activity of its own shows a score rolled up from
              the skills inside it, marked &ldquo;from children&rdquo;.
            </p>
          </section>

          <FeedbackPanel items={data.feedback} courseId={data.course.id} />

          <p className="pb-4 text-center font-mono text-[0.625rem] text-ink-700">
            {data.stats.attempts} attempt{data.stats.attempts === 1 ? '' : 's'} on record
            {data.stats.lastPracticedAt
              ? ` · last one ${new Date(data.stats.lastPracticedAt).toLocaleDateString()}`
              : ''}
            {' · '}
            <button
              type="button"
              onClick={reload}
              className="underline decoration-lab-600 underline-offset-2 transition-colors hover:text-ink-400"
            >
              refresh
            </button>
          </p>
        </div>
      )}
    </StudentPage>
  )
}
