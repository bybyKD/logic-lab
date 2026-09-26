import { useMemo } from 'react'
import { useAsync } from '../../../components/ui/AsyncBoundary'
import { SKILLS } from '../../../data/seed/skills'
import {
  attemptRepository,
  classRepository,
  courseRepository,
  feedbackRepository,
  submissionRepository,
} from '../../../services/repositories'
import { useSession } from '../../../services/session/SessionProvider'
import { buildLearnDashboard, type LearnDashboard } from './viewModel'

/**
 * The learner's dashboard, derived.
 *
 * This hook does the fetching and nothing else. Every decision about what the
 * numbers mean lives in `viewModel`, which is a pure function — so "is 62% right"
 * is a question a unit test can answer without a repository, a session, or a
 * clock, and this file stays small enough to read in one sitting.
 *
 * Reads go through the repositories rather than `data/selectors`, for the same
 * reason the activity runner does: the teacher can edit an activity in Content
 * Studio, and a learner must see the published version. The selectors read raw
 * seed and would quietly disagree with what the learner is about to open.
 */
export function useLearnDashboard() {
  const { studentId, student } = useSession()

  const state = useAsync<LearnDashboard>(async () => {
    // The course shell first: without a course and a learner there is nothing to
    // derive, and failing here beats rendering an empty dashboard as though the
    // learner had genuinely done no work.
    const [course, sections, activities, teachers] = await Promise.all([
      courseRepository.getCourse(),
      courseRepository.listSections(),
      courseRepository.listAllActivities(),
      classRepository.listTeachers(),
    ])

    if (!student) throw new Error('No learner is signed in.')

    const [attempts, submissions, feedback] = await Promise.all([
      attemptRepository.listByStudent(studentId),
      submissionRepository.listByStudent(studentId),
      feedbackRepository.listByStudent(studentId),
    ])

    const authorNames: Record<string, string> = {}
    for (const teacher of teachers) authorNames[teacher.id] = teacher.name

    return buildLearnDashboard({
      student,
      course,
      sections,
      activities,
      attempts,
      submissions,
      feedback,
      skills: SKILLS,
      authorNames,
      now: Date.now(),
    })
  }, [studentId, student?.id])

  const dashboard = state.status === 'ready' ? state.data : null

  /**
   * The one derived number the screen needs outside the view model: whether the
   * learner has finished everything published. Kept here rather than in the
   * components so the completion note and the tiles cannot disagree.
   */
  const courseComplete = useMemo(() => {
    if (!dashboard || dashboard.stats.total === 0) return false
    const { total, mastered, graded } = dashboard.stats
    return mastered + graded >= total
  }, [dashboard])

  return { state, dashboard, courseComplete, reload: state.retry }
}
