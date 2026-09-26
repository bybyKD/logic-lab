/**
 * People and classroom structure.
 *
 * Content (Course/Section/Activity) lives in ./course. Everything here describes
 * WHO is taking it and WHERE — never what the content is.
 */

export type Role = 'student' | 'teacher'

export type EnrollmentStatus = 'active' | 'completed' | 'withdrawn'

export interface Person {
  id: string
  name: string
  email: string
}

export interface Student extends Person {
  role: 'student'
  /** Cohort / year group, e.g. "2026-A". */
  cohort: string
  joinedAt: string
}

export interface Teacher extends Person {
  role: 'teacher'
  title: string
}

/** A scheduled offering of a Course to a group of students. */
export interface Class {
  id: string
  name: string
  courseId: string
  teacherIds: string[]
  term: string
  startDate: string
  endDate: string
}

/**
 * A student's membership of a Class.
 *
 * This is where per-learner state belongs. It used to be baked into the course
 * content itself (`Module.progress` / `.completed` / `.locked`), which made the
 * same module look different for every student. Progress is now derived from
 * Attempt records, never stored here.
 */
export interface Enrollment {
  id: string
  classId: string
  studentId: string
  status: EnrollmentStatus
  enrolledAt: string
}
