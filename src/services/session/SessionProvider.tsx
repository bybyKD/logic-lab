import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Role, Student, Teacher } from '../../domain'
import { DEFAULT_STUDENT_ID, PRIMARY_TEACHER_ID, STUDENTS, TEACHERS } from '../../data/seed'
import { resetDemoData as clearPersistedData } from '../repositories'
import { PERSIST_KEYS, readPersisted, writePersisted } from '../storage/persistence'

/**
 * Prototype session.
 *
 * There is no auth. What this provides is the one thing the product needs before
 * roles matter: a current role and a current user, so the same repository code
 * serves the student loop and the teacher loop, and so real auth later replaces
 * this file rather than reshaping the app.
 */

export interface Session {
  role: Role
  studentId: string
  teacherId: string
  student: Student | undefined
  teacher: Teacher | undefined
}

interface SessionValue extends Session {
  switchRole: (role: Role) => void
  /** Wipes every persisted overlay and returns to the seeded classroom. */
  resetDemoData: () => void
}

const SessionContext = createContext<SessionValue | null>(null)

interface PersistedSession {
  role: Role
  studentId: string
  teacherId: string
}

const FALLBACK: PersistedSession = {
  role: 'student',
  studentId: DEFAULT_STUDENT_ID,
  teacherId: PRIMARY_TEACHER_ID,
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<PersistedSession>(() => ({
    ...FALLBACK,
    ...readPersisted<Partial<PersistedSession>>(PERSIST_KEYS.session, {}),
  }))

  const switchRole = useCallback((role: Role) => {
    setPersisted((current) => {
      const next = { ...current, role }
      writePersisted(PERSIST_KEYS.session, next)
      return next
    })
  }, [])

  // Also resets in-memory repository caches and this provider's own state, so a
  // reset demo really is back to the seeded starting point rather than a session
  // pointing at data that no longer exists.
  const resetDemoData = useCallback(() => {
    clearPersistedData()
    setPersisted(FALLBACK)
  }, [])

  const value = useMemo<SessionValue>(
    () => ({
      role: persisted.role,
      studentId: persisted.studentId,
      teacherId: persisted.teacherId,
      student: STUDENTS.find((s) => s.id === persisted.studentId),
      teacher: TEACHERS.find((t) => t.id === persisted.teacherId),
      switchRole,
      resetDemoData,
    }),
    [persisted, switchRole, resetDemoData],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext)
  if (!value) {
    throw new Error('useSession must be used inside a SessionProvider')
  }
  return value
}
