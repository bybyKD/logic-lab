import { useCallback, useMemo, useRef, useState } from 'react'
import { useAsync, type AsyncResult } from '../../../components/ui/AsyncBoundary'
import {
  type Activity,
  type Attempt,
  type Course,
  type Feedback,
  type Section,
  type Submission,
} from '../../../domain'
import { SKILLS } from '../../../data/seed/skills'
import {
  attemptRepository,
  courseRepository,
  feedbackRepository,
  submissionRepository,
} from '../../../services/repositories'
import { buildActivitySkillMap } from '../../../services/learning/mastery'
import { masteryDeltaForAttempt, type SkillDelta } from '../../../services/learning/masteryDelta'
import { useSession } from '../../../services/session/SessionProvider'
import { autoFeedbackFor } from './autoFeedback'
import { buildAttempt, nextRecordId, type RunnerAnswer } from './attemptScoring'

export interface RunnerData {
  course: Course
  section: Section
  activity: Activity
  /** Every activity in the section, in order, for prev/next. */
  siblings: Activity[]
  /** This learner's attempts at this activity, oldest first. */
  attempts: Attempt[]
  /** The most recent submission, which is the one feedback hangs off. */
  submission: Submission | null
  feedback: Feedback[]
  /** Teacher notes only; the auto lines are regenerated on the client. */
  teacherFeedback: Feedback[]
}

/** What the screen needs back after a submit. */
export interface SubmitOutcome {
  attempt: Attempt
  /** Empty when the attempt moved no skill — an unroutable activity. */
  deltas: SkillDelta[]
  /** False when the run could not be scored, so nothing was recorded. */
  recorded: boolean
  reason?: string
}

const bySubmittedAt = (a: { submittedAt: string }, b: { submittedAt: string }) =>
  a.submittedAt.localeCompare(b.submittedAt)

/**
 * Load one activity for one learner, and record what they submit.
 *
 * Reads go through `courseRepository` rather than `data/selectors` on purpose: the
 * repository layers the teacher's Content Studio edits over the immutable seed, so
 * a learner sees the published version of an activity. The selectors read raw
 * seed and would quietly show a pre-edit activity.
 */
/**
 * A refusal the learner is allowed to see the reason for.
 *
 * Most errors in this app are plumbing — "Activity not found" means nothing to
 * someone who typed a URL by hand. A guard is a decision about *their* request,
 * so its sentence is written for them and is the only kind shown on screen.
 */
class GuardError extends Error {}

/**
 * Everything that has to be true before a learner may open an activity.
 *
 * Split out from the loader so each refusal is unit tested. These four sentences
 * are the only errors a learner ever sees, and a guard nobody exercises is a
 * guard that quietly stops working.
 */
export function guardActivityOpenable(args: {
  course: Course
  activity: Activity
  section: Section | undefined
  courseId: string
  sectionId: string
}): Section {
  const { course, activity, section, courseId, sectionId } = args
  if (course.id !== courseId) {
    throw new GuardError(`This activity is not part of ${course.title}.`)
  }
  if (!section) throw new GuardError('That section does not exist.')
  if (activity.sectionId !== sectionId) {
    throw new GuardError('That activity is not in this section.')
  }
  // A draft is the teacher's work in progress. A learner must not be able to open
  // it by guessing the URL, and it must not accept submissions.
  if (activity.status !== 'published') {
    throw new GuardError('This activity has not been published yet.')
  }
  return section
}

export function useActivityRunner(courseId: string, sectionId: string, activityId: string) {
  const { studentId } = useSession()
  const startedAt = useRef(Date.now())

  const state = useAsync<RunnerData>(async () => {
    const [course, activity, sections] = await Promise.all([
      courseRepository.getCourse(),
      courseRepository.getActivity(activityId),
      courseRepository.listSections(),
    ])

    const section = guardActivityOpenable({
      course,
      activity,
      section: sections.find((s) => s.id === sectionId),
      courseId,
      sectionId,
    })

    const [siblings, allAttempts, allSubmissions] = await Promise.all([
      courseRepository.listActivities(sectionId),
      attemptRepository.listByStudent(studentId),
      submissionRepository.listByActivity(activityId),
    ])

    const attempts = allAttempts
      .filter((a) => a.activityId === activityId)
      .sort(bySubmittedAt)
    const submission =
      allSubmissions
        .filter((s) => s.studentId === studentId)
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0] ?? null
    const feedback = submission
      ? (await feedbackRepository.list()).filter((f) => f.submissionId === submission.id)
      : []

    return {
      course,
      section,
      activity,
      siblings: [...siblings].sort((a, b) => a.order - b.order),
      attempts,
      submission,
      feedback,
      teacherFeedback: feedback.filter((f) => f.authorRole === 'teacher'),
    }
  }, [courseId, sectionId, activityId, studentId])

  // After a submit the records are already in hand, so they are merged in rather
  // than refetched. A refetch would flip the whole screen back to its loading
  // state and take the runner the learner is looking at away mid-answer.
  const [merged, setMerged] = useState<{ key: string; data: RunnerData } | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [lastOutcome, setLastOutcome] = useState<SubmitOutcome | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // `AsyncResult` only carries `data` once it is ready, so narrow before reading.
  // Keyed on the route, so navigating to another activity never shows this one's
  // freshly merged records for a frame.
  const activityKey = `${courseId}/${sectionId}/${activityId}`
  const loaded = state.status === 'ready' ? state.data : null
  const data = merged && merged.key === activityKey ? merged.data : loaded

  // Mastery is computed from every activity's skills, not just this one, because
  // a parent's score rolls up from its children.
  const skillMap = useMemo(() => buildActivitySkillMap(data?.siblings ?? []), [data])

  const reload = state.retry

  const submit = useCallback(
    async (params: {
      answer: RunnerAnswer
      score: number | null
      hintsUsed: readonly string[]
      pickedLabel: string | null
    }): Promise<SubmitOutcome> => {
      if (!data) throw new Error('Nothing to submit yet.')

      // A run the prototype cannot score is not a zero. Recording one would put a
      // false failure into mastery and straight into the teacher's gradebook.
      if (params.score === null) {
        const outcome: SubmitOutcome = {
          attempt: {
            id: '',
            activityId: data.activity.id,
            studentId,
            kind: data.activity.kind,
            submittedAt: new Date().toISOString(),
            passed: false,
            score: 0,
            durationMs: 0,
            hintsUsed: [],
          },
          deltas: [],
          recorded: false,
          reason:
            'This prototype runner cannot score what you wrote, so nothing was recorded. Try one of the example programs, or ask your teacher to run it.',
        }
        setLastOutcome(outcome)
        return outcome
      }

      setSubmitting(true)
      setSubmitError(null)
      const now = Date.now()
      try {
        const attempt = buildAttempt({
          ...params.answer,
          activity: data.activity,
          studentId,
          attemptId: nextRecordId('att', now),
          now,
          durationMs: Math.max(0, now - startedAt.current),
          hintsUsed: params.hintsUsed,
          score: params.score,
        })

        // An `Attempt` is the evidence; the `Submission` is what a teacher grades.
        // Writing only the attempt would leave the review queue permanently empty
        // and the learn → submit → grade loop would not close.
        const submission: Submission = {
          id: nextRecordId('sub', now),
          activityId: attempt.activityId,
          studentId,
          attemptId: attempt.id,
          status: 'submitted',
          submittedAt: attempt.submittedAt,
          score: attempt.score,
        }

        const drafts = autoFeedbackFor({
          activity: data.activity,
          score: attempt.score,
          outcomes: params.answer.outcomes ?? [],
          pickedLabel: params.pickedLabel,
        })

        const savedFeedback = drafts.map((draft, index) => ({
          id: `${submission.id}-fb${index + 1}`,
          submissionId: submission.id,
          authorId: 'system',
          authorRole: 'auto' as const,
          kind: draft.kind,
          body: draft.body,
          createdAt: new Date(now + index).toISOString(),
        }))

        await attemptRepository.save(attempt)
        await submissionRepository.save(submission)
        for (const feedback of savedFeedback) {
          await feedbackRepository.save(feedback)
        }

        // Measured against the attempts that existed *before* this one.
        const deltas = masteryDeltaForAttempt({
          attempts: data.attempts,
          attempt,
          skills: SKILLS,
          activitySkills: skillMap,
          now,
        })

        const outcome: SubmitOutcome = { attempt, deltas, recorded: true }
        setLastOutcome(outcome)
        setMerged({
          key: activityKey,
          data: {
            ...data,
            attempts: [...data.attempts, attempt],
            submission,
            feedback: [...data.feedback, ...savedFeedback],
          },
        })
        return outcome
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Could not save your attempt.'
        setSubmitError(reason)
        throw error
      } finally {
        setSubmitting(false)
      }
    },
    [data, studentId, skillMap, reload],
  )

  /** Reset the clock so a second attempt on the same page is timed fairly. */
  const restartTimer = useCallback(() => {
    startedAt.current = Date.now()
  }, [])

  const view = useMemo<AsyncResult<RunnerData>>(() => {
    if (merged && merged.key === activityKey && state.status === 'ready') {
      return { status: 'ready', data: merged.data, retry: state.retry }
    }
    return state
  }, [merged, activityKey, state])

  // Only a guard's own sentence reaches the screen; anything else is a fault on
  // our side and gets the generic message.
  const why =
    state.status === 'error' && state.error instanceof GuardError ? state.error.message : null

  return {
    state: view,
    data,
    why,
    submit,
    submitting,
    submitError,
    lastOutcome,
    restartTimer,
    setLastOutcome,
  }
}
