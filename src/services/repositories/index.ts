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

export const courseRepository = {
  async getCourse() {
    return delay(getCourse())
  },

  async listSections() {
    return delay(listSections())
  },

  async listActivities(sectionId: string): Promise<Activity[]> {
    return delay(listSectionActivities(sectionId))
  },

  async getActivity(activityId: string): Promise<Activity> {
    return delay(findOrFail(ACTIVITIES, (a) => a.id === activityId, `activity ${activityId}`))
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
  for (const key of Object.values(PERSIST_KEYS)) {
    clearPersisted(key)
  }
}
