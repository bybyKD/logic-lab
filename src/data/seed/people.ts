import { PARTICIPANTS } from '../participants'
import type { Class, Enrollment, Student, Teacher } from '../../domain'
import { COURSE_ID } from './course'

export const CLASS_ID = 'class-logic-101-a'
export const PRIMARY_TEACHER_ID = 'teacher-01'
export const ASSISTANT_TEACHER_ID = 'teacher-02'

/** Size of the seeded class. Matches the classroom screen in the plan (§16). */
export const CLASS_SIZE = 42

export const TEACHERS: Teacher[] = [
  {
    id: PRIMARY_TEACHER_ID,
    role: 'teacher',
    name: 'Rina Hartati',
    email: 'rina.hartati@logiclab.id',
    title: 'Lecturer — Informatics Laboratory',
  },
  {
    id: ASSISTANT_TEACHER_ID,
    role: 'teacher',
    name: 'Dimas Prakoso',
    email: 'dimas.prakoso@logiclab.id',
    title: 'Teaching Assistant — Informatics Laboratory',
  },
]

/**
 * One Student per legacy Participant, keeping names and ids stable so the old
 * admin table and the new entity model describe the same people.
 */
export const STUDENTS: Student[] = PARTICIPANTS.map((p, i) => ({
  id: `student-${String(i + 1).padStart(3, '0')}`,
  role: 'student',
  name: p.name,
  email: `mahasiswa${String(i + 1).padStart(3, '0')}@students.logiclab.id`,
  cohort: '2026-A',
  joinedAt: '2026-01-12T00:00:00.000Z',
}))

export const LAB_CLASS: Class = {
  id: CLASS_ID,
  name: 'Programming Logic — Class A',
  courseId: COURSE_ID,
  teacherIds: [PRIMARY_TEACHER_ID, ASSISTANT_TEACHER_ID],
  term: '2026 Term 1',
  startDate: '2026-02-02',
  endDate: '2026-06-26',
}

/**
 * The first CLASS_SIZE students are enrolled. The remainder of the 80 lab members
 * stay available to the legacy participant table but are not in this class, which
 * is what makes "42 students" a real filtered count rather than a label.
 */
export const ENROLLMENTS: Enrollment[] = STUDENTS.slice(0, CLASS_SIZE).map((student) => ({
  id: `enr-${student.id}`,
  classId: CLASS_ID,
  studentId: student.id,
  status: 'active',
  enrolledAt: LAB_CLASS.startDate,
}))

/** Stable default learner for the prototype session (Phase 2 wires this up). */
export const DEFAULT_STUDENT_ID = STUDENTS[3].id
