import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AsyncBoundary, EmptyPanel, ErrorPanel, useAsync } from '../ui/AsyncBoundary'
import {
  attemptRepository,
  classRepository,
  courseRepository,
  submissionRepository,
} from '../../services/repositories'
import { getExecutionService } from '../../services/execution'
import { UNSUPPORTED_NOTE } from '../../services/execution/types'
import type { TestOutcome } from '../../domain'
import type { LanguageId } from '../../data/languages'
import { buildReviewQueue, isRunnable, queueForActivity } from '../../services/assessment/reviewQueue'
import {
  autoScore,
  gradeSubmission,
  isPending,
  rubricMaxPoints,
} from '../../services/assessment/grading'
import { cn } from '../../utils/cn'
import { GhostButton, KindBadge, PageHeader, StatusPill, TeacherShell } from './TeacherPage'
import { TextArea } from './StudioFields'
import type { Activity, Attempt, Student, Submission } from '../../domain'

/**
 * `/teacher/assignments/:activityId/review` — reviewing one submission.
 *
 * Three panels, left to right: the learner's work with its test results, the
 * rubric with a score per criterion, and the decision. The score the teacher sees
 * before saving is the same number `gradeSubmission` will write, computed by the
 * pure service rather than duplicated here — otherwise the preview and the stored
 * grade could disagree.
 */
export function ReviewScreen() {
  const { activityId } = useParams<{ activityId: string }>()
  const [search] = useSearchParams()
  const requestedId = search.get('submission')

  const state = useAsync(async () => {
    if (!activityId) throw new Error('missing activity id')
    const [activity, submissions, students, allAttempts] = await Promise.all([
      courseRepository.getActivity(activityId),
      submissionRepository.listByActivity(activityId),
      classRepository.listStudents(),
      attemptRepository.list(),
    ])
    // Only the attempts behind these submissions — the rest of the class history
    // is not what this screen is about.
    const attemptIds = new Set(submissions.map((s) => s.attemptId))
    return {
      activity,
      submissions,
      students,
      attempts: allAttempts.filter((a) => attemptIds.has(a.id)),
    }
  }, [activityId])

  return (
    <AsyncBoundary
      state={state}
      errorMessage="This submission could not be loaded. It may belong to a different activity."
    >
      {(data) => <ReviewBody {...data} requestedId={requestedId} onGraded={state.retry} />}
    </AsyncBoundary>
  )
}

function ReviewBody({
  activity,
  submissions,
  students,
  attempts,
  requestedId,
  onGraded,
}: {
  activity: Activity
  submissions: Submission[]
  students: Student[]
  attempts: Attempt[]
  requestedId: string | null
  /** Re-reads the queue, so a grade shows up in the counts it just changed. */
  onGraded: () => void
}) {
  if (submissions.length === 0) {
    return (
      <TeacherShell>
        <PageHeader eyebrow="REVIEW" title={activity.title} />
        <div className="mt-8">
          <EmptyPanel message="No student has submitted this activity, so there is nothing to review." />
        </div>
        <Link
          to="/teacher/assignments"
          className="mt-6 inline-block font-mono text-xs text-accent-300 underline"
        >
          Back to the queue
        </Link>
      </TeacherShell>
    )
  }

  // Deep-link to one submission, otherwise start on the oldest waiting so a
  // teacher clearing a backlog works in the order it arrived.
  const initialId =
    requestedId && submissions.some((s) => s.id === requestedId)
      ? requestedId
      : (submissions.find(isPending) ?? submissions[0]).id

  return (
    <SubmissionReview
      key={initialId}
      activity={activity}
      submissions={submissions}
      students={students}
      attempts={attempts}
      selectedId={initialId}
      onGraded={onGraded}
    />
  )
}

function SubmissionReview({
  activity,
  submissions,
  students,
  attempts,
  selectedId,
  onGraded,
}: {
  activity: Activity
  submissions: Submission[]
  students: Student[]
  attempts: Attempt[]
  selectedId: string
  onGraded: () => void
}) {
  const [selected, setSelected] = useState(selectedId)
  const submission = submissions.find((s) => s.id === selected) ?? submissions[0]
  const student = students.find((s) => s.id === submission.studentId)
  const attempt = attempts.find((a) => a.id === submission.attemptId)
  const runnable = isRunnable(activity) && attempt?.code !== undefined

  const [rubricScores, setRubricScores] = useState<Record<string, number>>(
    () => submission.grade?.rubricScores ?? {},
  )
  const [comment, setComment] = useState('')
  const [override, setOverride] = useState<string>('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  // Switching submission must not carry the previous learner's rubric marks or
  // half-typed comment across — the key prop on this component handles that.
  useEffect(() => {
    setRubricScores(submission.grade?.rubricScores ?? {})
    setComment('')
    setOverride('')
    setSaveState('idle')
    setError(null)
  }, [submission.id, submission.grade?.rubricScores])

  const [now] = useState(() => Date.now())
  const maxPoints = rubricMaxPoints(activity)

  // The queue is built over just this activity so the waiting count on the
  // header agrees with the list below it, rather than with the whole course.
  const queue = useMemo(
    () => queueForActivity(buildReviewQueue({ activities: [activity], students, submissions, now }), activity.id),
    [activity, students, submissions, now],
  )

  const preview = useMemo(
    () =>
      gradeSubmission({
        submission,
        activity,
        input: {
          ...(maxPoints ? { rubricScores } : {}),
          ...(comment.trim() ? { comment } : {}),
          ...(override !== '' ? { scoreOverride: Number(override) } : {}),
        },
        gradedBy: 'teacher-rina',
        now,
        feedbackId: `fb-${submission.id}-${now}`,
      }),
    [submission, activity, rubricScores, comment, override, maxPoints, now],
  )

  const save = async () => {
    setSaveState('saving')
    setError(null)
    try {
      await submissionRepository.gradeWithFeedback(preview.submission, preview.feedback)
      setSaveState('saved')
      // Reload the queue. Without this the screen keeps counting the submission it
      // just graded as still waiting, so a teacher cannot see their own work land.
      onGraded()
    } catch {
      setSaveState('error')
      setError('The grade could not be saved. Local storage may be full or blocked in this browser.')
    }
  }

  return (
    <TeacherShell>
      <PageHeader
        eyebrow="REVIEW"
        title={student?.name ?? 'Submission'}
        description={activity.title}
        meta={`${activity.id} · submitted ${new Date(submission.submittedAt).toLocaleString()} · ${queue.items.length} waiting on this activity`}
        actions={
          <Link
            to="/teacher/assignments"
            className="rounded-pill border border-lab-600 px-4 py-2 font-mono text-xs text-ink-300 transition-colors hover:border-accent-400/50 hover:text-accent-300"
          >
            Back to queue
          </Link>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <KindBadge kind={activity.kind} />
        <StatusPill status={submission.status === 'graded' ? 'published' : 'draft'} />
        <span className="font-mono text-[0.5625rem] tracking-widest text-ink-600 uppercase">
          {submission.status === 'graded' ? 'graded' : 'awaiting review'}
        </span>
      </div>

      <div className="mt-8 grid gap-6 [&>*]:min-w-0 xl:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          <SubmissionList
            submissions={submissions}
            students={students}
            selectedId={submission.id}
            onSelect={setSelected}
          />
          <WorkPanel
            activity={activity}
            submission={submission}
            attempt={attempt}
            runnable={runnable}
          />
        </div>

        <div className="flex flex-col gap-6">
          {maxPoints !== null && activity.rubric && (
            <RubricScoring
              rubric={activity.rubric}
              scores={rubricScores}
              onChange={(criterionId, points) =>
                setRubricScores((current) => ({ ...current, [criterionId]: points }))
              }
            />
          )}

          <DecisionPanel
            submission={submission}
            maxPoints={maxPoints}
            previewScore={preview.submission.grade?.score ?? 0}
            previewMax={preview.submission.grade?.maxScore ?? 100}
            autoScore={autoScore(submission, maxPoints ?? 100)}
            override={override}
            onOverrideChange={setOverride}
            comment={comment}
            onCommentChange={setComment}
            saveState={saveState}
            onSave={save}
            error={error}
          />
        </div>
      </div>
    </TeacherShell>
  )
}

function SubmissionList({
  submissions,
  students,
  selectedId,
  onSelect,
}: {
  submissions: Submission[]
  students: Student[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <section aria-labelledby="submissions-heading" className="panel overflow-hidden">
      <div className="border-b border-lab-700 px-5 py-4">
        <h2 id="submissions-heading" className="font-display text-lg text-ink-100">
          Submissions
        </h2>
        <p className="mt-0.5 text-sm text-ink-500">
          {submissions.filter(isPending).length} of {submissions.length} still waiting.
        </p>
      </div>
      <ul className="divide-y divide-lab-800/70">
        {submissions.map((candidate) => {
          const student = students.find((s) => s.id === candidate.studentId)
          const pending = isPending(candidate)
          return (
            <li key={candidate.id}>
              <button
                type="button"
                aria-current={candidate.id === selectedId || undefined}
                onClick={() => onSelect(candidate.id)}
                className={cn(
                  'flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-left transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-400',
                  candidate.id === selectedId ? 'bg-accent-400/10' : 'hover:bg-lab-800/50',
                )}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill border border-lab-600 bg-lab-800 font-mono text-xs text-ink-300">
                  {student?.name.charAt(0) ?? '?'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink-100">
                    {student?.name ?? candidate.studentId}
                  </span>
                  <span className="block font-mono text-[0.5625rem] text-ink-600">
                    {new Date(candidate.submittedAt).toLocaleDateString()}
                  </span>
                </span>
                <span
                  className={cn(
                    'shrink-0 font-mono text-[0.625rem] tracking-widest uppercase',
                    pending ? 'text-warning' : 'text-success',
                  )}
                >
                  {pending ? 'waiting' : 'graded'}
                </span>
                <span className="shrink-0 font-mono text-xs text-ink-200 tabular-nums">
                  {candidate.grade?.score ?? candidate.score}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function WorkPanel({
  activity,
  submission,
  attempt,
  runnable,
}: {
  activity: Activity
  submission: Submission
  attempt: Attempt | undefined
  runnable: boolean
}) {
  const [outcomes, setOutcomes] = useState<TestOutcome[] | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    setOutcomes(null)
    setRunError(null)
    setNote(null)
  }, [submission.id])

  const run = useCallback(async () => {
    if (!attempt?.code || !runnable || activity.kind !== 'codeLab') return
    setRunning(true)
    setRunError(null)
    try {
      const service = getExecutionService()
      const result = await service.run({
        // The attempt records which language it was written in. The first
        // allowed language is only a fallback, and is still an honest guess:
        // it is what the learner would have submitted.
        language: (attempt.language ?? activity.languages[0]) as LanguageId,
        code: attempt.code,
        testCases: activity.testCases,
      })
      setOutcomes(result.testOutcomes)
      setNote(result.note ?? null)
      // A non-authoritative service cannot be trusted to grade, so say so rather
      // than presenting its output as a result.
      if (!service.isAuthoritative) setRunError(UNSUPPORTED_NOTE)
    } catch {
      setRunError('The runner could not be reached. Nothing was evaluated.')
    } finally {
      setRunning(false)
    }
  }, [activity, attempt, runnable])

  return (
    <section aria-labelledby="work-heading" className="panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="work-heading" className="font-display text-lg text-ink-100">
          The work
        </h2>
        {runnable ? (
          <GhostButton onClick={run} disabled={running}>
            {running ? 'Running…' : 'Run tests'}
          </GhostButton>
        ) : (
          <p className="font-mono text-[0.625rem] text-ink-600">not runnable</p>
        )}
      </div>

      {!attempt?.code ? (
        <div className="mt-4">
          <EmptyPanel
            message="This submission has no code attached — it is a written answer, graded against the rubric."
          />
        </div>
      ) : (
        <>
          <p className="mt-2 font-mono text-[0.625rem] text-ink-600">
            {attempt.language} · {attempt.durationMs}ms · {attempt.score}%
            {attempt.hintsUsed.length > 0 && ` · ${attempt.hintsUsed.length} hints used`}
          </p>
          <pre className="mt-3 max-h-96 overflow-auto rounded-pill border border-lab-700 bg-lab-950 p-4 font-mono text-[0.8125rem] leading-relaxed text-ink-200">
            {attempt.code}
          </pre>
        </>
      )}

      {runError && (
        <p className="mt-4 rounded-pill border border-warning/30 bg-warning/5 px-4 py-2 text-sm text-warning">
          {runError}
        </p>
      )}
      {note && !runError && (
        <p className="mt-4 text-sm text-ink-500">{note}</p>
      )}

      {outcomes && (
        <div className="mt-5">
          <h3 className="font-mono text-[0.625rem] tracking-widest text-ink-500 uppercase">
            Per-case results
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {outcomes.map((outcome) => (
              <li
                key={outcome.testCaseId}
                className={cn(
                  'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-pill border px-3 py-2 text-xs',
                  outcome.status === 'passed'
                    ? 'border-success/30 bg-success/5 text-success'
                    : outcome.status === 'failed'
                      ? 'border-error/30 bg-error/5 text-error'
                      : 'border-lab-700 bg-lab-850 text-ink-500',
                )}
              >
                <span className="font-mono text-[0.625rem] tracking-widest uppercase">
                  {outcome.status === 'not-evaluated' ? 'skipped' : outcome.status}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink-200">{outcome.name}</span>
                {outcome.hidden && (
                  <span className="font-mono text-[0.5625rem] text-ink-600 uppercase">hidden</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function RubricScoring({
  rubric,
  scores,
  onChange,
}: {
  rubric: NonNullable<Activity['rubric']>
  scores: Record<string, number>
  onChange: (criterionId: string, points: number) => void
}) {
  const total = rubric.criteria.reduce((sum, c) => sum + (scores[c.id] ?? 0), 0)

  return (
    <section aria-labelledby="rubric-heading" className="panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="rubric-heading" className="font-display text-lg text-ink-100">
          {rubric.title}
        </h2>
        <p
          className={cn(
            'font-mono text-[0.625rem] tabular-nums',
            total === rubric.maxPoints ? 'text-ink-600' : 'text-accent-300',
          )}
        >
          {total}/{rubric.maxPoints}
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-5">
        {rubric.criteria.map((criterion) => (
          <li key={criterion.id}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="min-w-0 text-sm text-ink-200">{criterion.label}</p>
              <p className="shrink-0 font-mono text-[0.625rem] text-ink-600">
                {criterion.maxPoints} pts
              </p>
            </div>
            <p className="mt-0.5 text-xs text-ink-600">{criterion.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {criterion.levels.map((level) => {
                const active = scores[criterion.id] === level.points
                return (
                  <button
                    key={level.label}
                    type="button"
                    aria-pressed={active}
                    title={level.descriptor}
                    onClick={() => onChange(criterion.id, level.points)}
                    className={cn(
                      'rounded-pill border px-3 py-1.5 text-left text-xs transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
                      active
                        ? 'border-accent-400/50 bg-accent-400/10 text-accent-200'
                        : 'border-lab-700 text-ink-400 hover:border-lab-600',
                    )}
                  >
                    {level.label}
                    <span className="ml-2 font-mono text-[0.625rem] text-ink-600">
                      {level.points}
                    </span>
                  </button>
                )
              })}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function DecisionPanel({
  submission,
  maxPoints,
  previewScore,
  previewMax,
  autoScore,
  override,
  onOverrideChange,
  comment,
  onCommentChange,
  saveState,
  onSave,
  error,
}: {
  submission: Submission
  maxPoints: number | null
  previewScore: number
  previewMax: number
  autoScore: number
  override: string
  onOverrideChange: (value: string) => void
  comment: string
  onCommentChange: (value: string) => void
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  onSave: () => void
  error: string | null
}) {
  const isGraded = submission.status === 'graded'

  return (
    <section aria-labelledby="decision-heading" className="panel p-6">
      <h2 id="decision-heading" className="font-display text-lg text-ink-100">
        Decision
      </h2>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="font-display text-4xl text-ink-100 tabular-nums">{previewScore}</span>
        <span className="font-mono text-xs text-ink-600">/ {previewMax}</span>
        <span className="ml-auto font-mono text-[0.5625rem] tracking-widest text-ink-600 uppercase">
          {maxPoints ? 'from rubric' : 'auto'}
        </span>
      </div>

      {maxPoints === null && (
        <p className="mt-2 text-xs text-ink-600">
          Auto score from the test result was {autoScore}. Override it if a passing program is still
          poor work.
        </p>
      )}

      <div className="mt-4">
        <TextArea
          label="Feedback for the learner"
          rows={4}
          value={comment}
          onChange={onCommentChange}
          placeholder="What worked, and what to do differently next time."
          hint="Saved as teacher feedback and shown to the learner after they submit."
        />
      </div>

      <div className="mt-4">
        <label className="block font-mono text-[0.625rem] tracking-widest text-ink-500 uppercase">
          Override score
        </label>
        <input
          type="number"
          value={override}
          min={0}
          max={previewMax}
          onChange={(e) => onOverrideChange(e.target.value)}
          placeholder={String(previewScore)}
          className="mt-1.5 w-32 rounded-pill border border-lab-700 bg-lab-850 px-3.5 py-2 text-sm text-ink-100 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none"
        />
        <p className="mt-1 text-xs text-ink-600">
          Leave blank to keep the {previewScore} above.
        </p>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorPanel message={error} />
        </div>
      )}

      {/*
        A save has to be visible. The button is a plain element that does not
        disable itself on success, so without this the teacher has no way to tell
        a saved grade from a click that did nothing.
      */}
      <p
        role="status"
        aria-live="polite"
        className={cn(
          'mt-3 text-xs',
          saveState === 'saved' ? 'text-success' : 'text-ink-700',
        )}
      >
        {saveState === 'saved'
          ? `Grade saved${maxPoints === null ? '' : ' from the rubric'}.`
          : saveState === 'saving'
            ? 'Saving…'
            : ''}
      </p>

      <button
        type="button"
        onClick={onSave}
        disabled={saveState === 'saving'}
        className="mt-5 w-full rounded-pill border border-accent-400/50 bg-accent-400/10 px-4 py-2.5 font-mono text-xs text-accent-300 transition-colors hover:bg-accent-400/20 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saveState === 'saving' ? 'Saving…' : isGraded ? 'Update grade' : 'Save grade'}
      </button>

      {isGraded && submission.grade && (
        <p className="mt-3 text-xs text-ink-600">
          Last graded {new Date(submission.grade.gradedAt).toLocaleString()}.
        </p>
      )}
    </section>
  )
}
