import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GhostButton, KindBadge, kindLabel } from '../../../components/teacher/TeacherPage'
import type { ChallengeActivity, CodeLabActivity, TestOutcome } from '../../../domain'
import { SKILLS } from '../../../data/seed/skills'
import { buildActivitySkillMap } from '../../../services/learning/mastery'
import { masteryDeltaForAttempt } from '../../../services/learning/masteryDelta'
import { cn } from '../../../utils/cn'
import { activityHref } from '../paths'
import { CodeLabRunner } from './CodeLabRunner'
import { ChallengeRunner } from './ChallengeRunner'
import { StudentPage } from './StudentShell'
import {
  ActivityMeta,
  FeedbackPanel,
  HintPanel,
  MasteryDeltaPanel,
  SubmitConfirmation,
  TestCasePanel,
} from './panels'
import { useActivityRunner } from './useActivityRunner'
import type { RunnerAnswer } from './attemptScoring'
import type { OutcomeReveal } from './outcomeMasking'

/**
 * One route, switched on the activity's kind.
 *
 * `/learn/c/:courseId/s/:sectionId/a/:activityId` is the only place a learner
 * meets an activity, so a new activity kind is a new branch here rather than a
 * new route and a new place for the section's list to forget about.
 */
export function ActivityRunnerScreen() {
  const { courseId = '', sectionId = '', activityId = '' } = useParams()
  const runner = useActivityRunner(courseId, sectionId, activityId)
  const [revealedHints, setRevealedHints] = useState<string[]>([])
  const [outcomes, setOutcomes] = useState<TestOutcome[] | null>(null)

  // The hook returns the same object the async boundary renders from, so the
  // panels and the runner can never disagree about what has been submitted.
  const data = runner.data

  /**
   * How much of the test detail is on screen.
   *
   * `full` only once a teacher has graded the submission, which is the plan's
   * "hidden results masked until graded". Before that the learner sees whether a
   * hidden case passed, never what it fed in.
   */
  const reveal: OutcomeReveal = data?.submission?.status === 'graded' ? 'full' : 'status'

  // Only a *recorded* attempt locks the runner. An unscoreable one is not the
  // learner's fault, so they keep the draft and get to try again.
  const locked =
    runner.lastOutcome?.recorded === true || data?.submission?.status === 'graded'

  /**
   * The delta for the most recent attempt, recomputed from stored attempts rather
   * than held in state, so it survives a reload and stays honest once later
   * attempts move the same skills.
   */
  const deltas = useMemo(() => {
    if (!data || data.attempts.length === 0) return []
    const latest = data.attempts[data.attempts.length - 1]
    return masteryDeltaForAttempt({
      attempts: data.attempts.slice(0, -1),
      attempt: latest,
      skills: SKILLS,
      activitySkills: buildActivitySkillMap(data.siblings),
      now: Date.parse(latest.submittedAt),
    })
  }, [data])

  const hintIds = data?.activity.kind === 'codeLab' ? data.activity.hints.map((h) => h.id) : []

  const handleSubmit = (params: {
    answer: RunnerAnswer
    score: number | null
    pickedLabel: string | null
  }) => {
    runner.restartTimer()
    void runner.submit({ ...params, hintsUsed: revealedHints })
  }

  return (
    <StudentPage
      state={runner.state}
      errorMessage={runner.why ?? 'Could not open this activity.'}
    >
      {(data) => {
        const { activity } = data
        // Prev/next come from the section's own ordered list, so a learner can walk
        // the whole section from the runner itself, without going back to the
        // dashboard to find the next thing.
        const position = data.siblings.findIndex((a) => a.id === activity.id)
        const previous = position > 0 ? data.siblings[position - 1] : null
        const next = position >= 0 ? (data.siblings[position + 1] ?? null) : null
        const isLab = activity.kind === 'codeLab'
        const isChallenge = activity.kind === 'challenge'

        return (
          <div className="space-y-8">
            {/* Breadcrumb + prev/next: the runner is reachable and traversable on
                its own, without waiting for the Phase 6 dashboard to link into it. */}
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <ol className="flex flex-wrap items-center gap-2 font-mono text-xs text-ink-600">
                <li className="text-ink-400">{data.section.title}</li>
                <li aria-hidden>/</li>
                <li className="text-ink-200">{kindLabel(activity.kind)}</li>
              </ol>

              <div className="flex flex-wrap items-center gap-2">
                {previous && (
                  <Link to={activityHref(courseId, sectionId, previous.id)}>
                    <GhostButton>← {kindLabel(previous.kind)}</GhostButton>
                  </Link>
                )}
                {next && (
                  <Link to={activityHref(courseId, sectionId, next.id)}>
                    <GhostButton>Next {kindLabel(next.kind)} →</GhostButton>
                  </Link>
                )}
              </div>
            </nav>

            <header>
              <p className="technical-label flex flex-wrap items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                {data.course.title} · {data.section.title}
                <KindBadge kind={activity.kind} />
              </p>
              <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-ink-100 md:text-4xl">
                {activity.title}
              </h1>
              <p className="mt-3 max-w-2xl text-ink-500">{activity.objective}</p>
              <div className="mt-4">
                <ActivityMeta activity={activity} />
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
              <div className="space-y-5">
                <section className="rounded-lg border border-lab-700 bg-lab-850 p-5">
                  <p className="technical-label mb-2">Instructions</p>
                  <p className="text-sm text-ink-300">{activity.instructions}</p>
                </section>

                {isLab && (
                  <CodeLabRunner
                    activity={activity as CodeLabActivity}
                    locked={locked}
                    submitting={runner.submitting}
                    onSubmit={handleSubmit}
                    onOutcomesChange={setOutcomes}
                  />
                )}

                {isChallenge && (
                  <ChallengeRunner
                    activity={activity as ChallengeActivity}
                    reveal={reveal}
                    locked={locked}
                    submitting={runner.submitting}
                    onSubmit={handleSubmit}
                  />
                )}

                {!isLab && !isChallenge && (
                  <div className="rounded-lg border border-dashed border-lab-600 p-6">
                    <p className="text-sm text-ink-400">
                      This {kindLabel(activity.kind).toLowerCase()} is content only in this
                      prototype — there is nothing to submit yet. The runner switches on the
                      activity's kind, so a new variant is a new branch here, not a new
                      route.
                    </p>
                  </div>
                )}

                {runner.submitError && (
                  <p
                    role="alert"
                    className="rounded-md border border-error/30 bg-error/5 px-4 py-3 font-mono text-sm text-error"
                  >
                    {runner.submitError}
                  </p>
                )}

                {runner.lastOutcome &&
                  (runner.lastOutcome.recorded ? (
                    <SubmitConfirmation
                      score={runner.lastOutcome.attempt.score}
                      recorded
                    />
                  ) : (
                    <SubmitConfirmation
                      score={0}
                      recorded={false}
                      reason={runner.lastOutcome.reason}
                    />
                  ))}
              </div>

              <aside className="space-y-5">
                {isLab && (
                  <TestCasePanel
                    testCases={(activity as CodeLabActivity).testCases}
                    outcomes={outcomes}
                    reveal={reveal}
                  />
                )}

                {hintIds.length > 0 && isLab && (
                  <HintPanel
                    hints={(activity as CodeLabActivity).hints}
                    revealed={revealedHints}
                    locked={locked}
                    onReveal={() => {
                      const nextHint = (activity as CodeLabActivity).hints
                        .slice()
                        .sort((a, b) => a.order - b.order)
                        .find((h) => !revealedHints.includes(h.id))
                      if (nextHint) setRevealedHints((h) => [...h, nextHint.id])
                    }}
                  />
                )}

                <FeedbackPanel activity={activity} feedback={data.feedback} />

                {deltas.length > 0 && <MasteryDeltaPanel deltas={deltas} />}

                {data.submission && (
                  <div
                    className={cn(
                      'rounded-lg border border-lab-700 bg-lab-850 p-5 text-sm',
                      data.submission.status === 'graded'
                        ? 'border-success/30'
                        : 'border-warning/30',
                    )}
                  >
                    <p className="technical-label mb-2">Your latest submission</p>
                    <p className="font-mono text-ink-300">
                      {data.submission.score}% ·{' '}
                      {data.submission.status === 'graded'
                        ? 'graded by your teacher'
                        : 'waiting for your teacher'}
                    </p>
                    <p className="mt-2 text-xs text-ink-600">
                      {data.attempts.length} attempt
                      {data.attempts.length === 1 ? '' : 's'} recorded on this activity.
                    </p>
                  </div>
                )}
              </aside>
            </div>
          </div>
        )
      }}
    </StudentPage>
  )
}
