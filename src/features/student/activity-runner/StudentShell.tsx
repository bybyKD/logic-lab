import type { ReactNode } from 'react'
import { Navbar } from '../../../components/layout/Navbar'
import { AsyncBoundary, type AsyncResult } from '../../../components/ui/AsyncBoundary'
import { cn } from '../../../utils/cn'

/**
 * The frame the student runner sits in.
 *
 * Deliberately not `TeacherShell`: that one carries the teacher rail, which would
 * put a learner's activity inside the teacher's navigation. This is the same
 * navbar and page padding with no rail, so the two shells stay recognisably the
 * same product without pretending a student has teacher destinations.
 */
export function StudentShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="min-h-screen bg-lab-900">
      <Navbar variant="app" />
      <main className={cn('mx-auto max-w-[1400px] px-5 pt-28 pb-24 lg:px-8', className)}>
        {children}
      </main>
    </div>
  )
}

/** `StudentShell` with the loading, error and empty states already handled. */
export function StudentPage<T>({
  state,
  children,
  errorMessage,
  className,
}: {
  state: AsyncResult<T>
  children: (data: T) => ReactNode
  errorMessage?: string
  className?: string
}) {
  return (
    <StudentShell className={className}>
      <AsyncBoundary state={state} errorMessage={errorMessage}>
        {children}
      </AsyncBoundary>
    </StudentShell>
  )
}
