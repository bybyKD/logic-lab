import type { Activity, Attempt, Enrollment, Feedback, Student, Submission } from '../../domain'
import {
  ACTIVITIES,
  ENROLLMENTS,
  LAB_CLASS,
  SEED_ATTEMPTS,
  SEED_FEEDBACK,
  SEED_SUBMISSIONS,
  STUDENTS,
  TEACHERS,
} from '../../data/seed'
import { getCourse, listSectionActivities, listSections } from '../../data/selectors'
import { PERSIST_KEYS, clearPersisted, readPersisted, writePersisted } from '../storage/persistence'

/**
 * Data access.
 *
 * Repositories are async on purpose. A synchronous `MODULES.find(...)` cannot
 * express loading or failure, so those states get retrofitted later as fake
 * spinners. Promises from day one mean the loading, empty and error states in
 * the UI are real, and swapping these for HTTP calls is a change confined to
 * this folder.
 *
 * Reads layer localStorage over the seed: a learner who submits something sees it
 * survive a reload, and clearing the key restores the seeded classroom.
 */

/** Simulated network latency, kept short enough not to feel broken. */
const LATENCY_MS = 140

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), LATENCY_MS)
  })
}

function findOrFail<T>(items: T[], predicate: (item: T) => boolean, what: string): T {
  const found = items.find(predicate)
  if (!found) throw new Error(`${what} not found`)
  return found
}

// ---------------------------------------------------------------- attempts

let attemptsCache: Attempt[] | null = null

function allAttempts(): Attempt[] {
  if (!attemptsCache) {
    // Clone the seed. `SEED_ATTEMPTS` is a module-level array shared by every
    // consumer, and `save` mutates in place — without this copy, one submitted
    // attempt would permanently alter the baseline that a reset restores to.
    attemptsCache = readPersisted<Attempt[]>(PERSIST_KEYS.attempts, [...SEED_ATTEMPTS])
  }
  return attemptsCache
}

export const attemptRepository = {
  async list(): Promise<Attempt[]> {
    return delay([...allAttempts()])
  },

  async listByStudent(studentId: string): Promise<Attempt[]> {
    const list = await attemptRepository.list()
    return list
      .filter((a) => a.studentId === studentId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
  },

  async listByActivity(activityId: string): Promise<Attempt[]> {
    const list = await attemptRepository.list()
    return list
      .filter((a) => a.activityId === activityId)
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  },

  async save(attempt: Attempt): Promise<Attempt> {
    const list = allAttempts()
    const index = list.findIndex((a) => a.id === attempt.id)
    if (index >= 0) list[index] = attempt
    else list.push(attempt)
    writePersisted(PERSIST_KEYS.attempts, list)
    return delay(attempt)
  },
}

// ------------------------------------------------------------- submissions

let submissionsCache: Submission[] | null = null

function allSubmissions(): Submission[] {
  if (!submissionsCache) {
    submissionsCache = readPersisted<Submission[]>(PERSIST_KEYS.submissions, [...SEED_SUBMISSIONS])
  }
  return submissionsCache
}

export const submissionRepository = {
  async list(): Promise<Submission[]> {
    return delay([...allSubmissions()])
  },

  async listByStudent(studentId: string): Promise<Submission[]> {
    const list = await submissionRepository.list()
    return list.filter((s) => s.studentId === studentId)
  },

  async listByActivity(activityId: string): Promise<Submission[]> {
    const list = await submissionRepository.list()
    return list.filter((s) => s.activityId === activityId)
  },

  /** Submissions still waiting for a teacher. Drives the review queue. */
  async listPending(): Promise<Submission[]> {
    const list = await submissionRepository.list()
    return list
      .filter((s) => s.status === 'submitted')
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  },

  async save(submission: Submission): Promise<Submission> {
    const list = allSubmissions()
    const index = list.findIndex((s) => s.id === submission.id)
    if (index >= 0) list[index] = submission
    else list.push(submission)
    writePersisted(PERSIST_KEYS.submissions, list)
    return delay(submission)
  },

  /**
   * Records a teacher's grade and its comment together.
   *
   * Both writes land in one call on purpose. A screen that saved the grade and
   * then the comment could be closed or fail between them, leaving a graded
   * submission with a half-written comment, and the queue would show it as done
   * either way. A blank comment is stored as no comment rather than an empty row.
   */
  async gradeWithFeedback(submission: Submission, feedback: Feedback | null): Promise<void> {
    const list = allSubmissions()
    const index = list.findIndex((s) => s.id === submission.id)
    if (index < 0) throw new Error(`submission ${submission.id} not found`)
    list[index] = submission
    writePersisted(PERSIST_KEYS.submissions, list)

    if (feedback) {
      const comments = allFeedback()
      // Keyed on the submission so re-grading replaces the teacher's note
      // instead of stacking a second copy of it on the same work.
      const existing = comments.findIndex(
        (f) => f.submissionId === feedback.submissionId && f.authorRole === feedback.authorRole,
      )
      if (existing >= 0) comments[existing] = feedback
      else comments.push(feedback)
      writePersisted(PERSIST_KEYS.feedback, comments)
    }

    return delay(undefined)
  },
}

// ---------------------------------------------------------------- feedback

let feedbackCache: Feedback[] | null = null

function allFeedback(): Feedback[] {
  if (!feedbackCache) {
    feedbackCache = readPersisted<Feedback[]>(PERSIST_KEYS.feedback, [...SEED_FEEDBACK])
  }
  return feedbackCache
}

export const feedbackRepository = {
  async list(): Promise<Feedback[]> {
    return delay([...allFeedback()])
  },

  async listByStudent(studentId: string): Promise<Feedback[]> {
    const list = await feedbackRepository.list()
    const submissions = await submissionRepository.listByStudent(studentId)
    const ids = new Set(submissions.map((s) => s.id))
    return list
      .filter((f) => ids.has(f.submissionId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  async save(feedback: Feedback): Promise<Feedback> {
    const list = allFeedback()
    list.push(feedback)
    writePersisted(PERSIST_KEYS.feedback, list)
    return delay(feedback)
  },
}

// ----------------------------------------------------------------- course

/**
 * Activities the teacher has authored in the Content Studio, keyed by id.
 *
 * The seed stays immutable: an edit is an overlay, so "reset demo data" restores
 * the original course without needing an undo log. `publishedActivityIds` is
 * deliberately not used — publish state lives on the activity's own `status`, and
 * keeping a second list of ids would mean two sources of truth for one fact.
 */
let authoredCache: Record<string, Activity> | null = null

function authoredActivities(): Record<string, Activity> {
  if (!authoredCache) {
    authoredCache = readPersisted<Record<string, Activity>>(PERSIST_KEYS.authoredActivities, {})
  }
  return authoredCache
}

function withOverlays(activities: Activity[]): Activity[] {
  const authored = authoredActivities()
  return activities.map((a) => authored[a.id] ?? a)
}

export const courseRepository = {
  async getCourse() {
    return delay(getCourse())
  },

  async listSections() {
    return delay(listSections())
  },

  async listActivities(sectionId: string): Promise<Activity[]> {
    return delay(withOverlays(listSectionActivities(sectionId)))
  },

  async getActivity(activityId: string): Promise<Activity> {
    return delay(findOrFail(withOverlays(ACTIVITIES), (a) => a.id === activityId, `activity ${activityId}`))
  },

  /**
   * Every activity in the course, seeded and authored, in section order.
   *
   * `listActivities` needs a section id, which forces a nested fetch to see the
   * whole course. The teacher screens all want the whole thing, so this does the
   * nesting once.
   */
  async listAllActivities(): Promise<Activity[]> {
    const sections = listSections()
    const nested = sections.map((section) => listSectionActivities(section.id))
    return delay(withOverlays(nested.flat()))
  },

  /** Activities the teacher has changed. Powers the "your drafts" view. */
  async listAuthored(): Promise<Activity[]> {
    return delay(Object.values(authoredActivities()))
  },

  /**
   * Writes an activity to the overlay.
   *
   * Ids are checked against the real course so a typo cannot create a phantom
   * activity, and `order` is preserved rather than recomputed: the studio edits
   * one activity, so it has no business renumbering the section around it.
   */
  async saveActivity(activity: Activity): Promise<Activity> {
    findOrFail(ACTIVITIES, (a) => a.id === activity.id, `activity ${activity.id}`)
    const authored = authoredActivities()
    authored[activity.id] = activity
    writePersisted(PERSIST_KEYS.authoredActivities, authored)
    return delay(activity)
  },

  /** Publish or unpublish. Separate from `saveActivity` so the rail can toggle it. */
  async setPublished(activityId: string, published: boolean): Promise<Activity> {
    const activity = await courseRepository.getActivity(activityId)
    return courseRepository.saveActivity({ ...activity, status: published ? 'published' : 'draft' })
  },
}

// ------------------------------------------------------------------ class

export const classRepository = {
  async getClass() {
    return delay(LAB_CLASS)
  },

  async listEnrollments(): Promise<Enrollment[]> {
    return delay([...ENROLLMENTS])
  },

  async listStudents(): Promise<Student[]> {
    return delay([...STUDENTS])
  },

  async listTeachers() {
    return delay([...TEACHERS])
  },

  async getStudent(studentId: string): Promise<Student> {
    return delay(findOrFail(STUDENTS, (s) => s.id === studentId, `student ${studentId}`))
  },
}

/**
 * Resets every persisted overlay, restoring the seeded classroom. Bound to the
 * "reset demo data" control so a demo can be re-run from a clean state.
 */
export function resetDemoData(): void {
  attemptsCache = null
  submissionsCache = null
  feedbackCache = null
  authoredCache = null
  for (const key of Object.values(PERSIST_KEYS)) {
    clearPersisted(key)
  }
}
