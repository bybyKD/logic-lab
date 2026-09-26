import type { ReactNode } from 'react'
import { Navbar } from '../layout/Navbar'
import { TeacherLayout } from './TeacherLayout'
import { AsyncBoundary, type AsyncResult } from '../ui/AsyncBoundary'
import { cn } from '../../utils/cn'
import type { Activity, ActivityKind } from '../../domain'

/**
 * The teacher chrome: Navbar, rail and page padding.
 *
 * Split from `TeacherPage` because the Content Studio editor already has its data
 * in hand from the route's own `useAsync` — it needs the frame, not a second
 * fetch and a loading state for something that is already loaded.
 */
export function TeacherShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen bg-lab-900">
      <Navbar variant="app" />
      <TeacherLayout>
        <main className={cn('px-5 pt-28 pb-24 lg:px-8', className)}>{children}</main>
      </TeacherLayout>
    </div>
  )
}

/**
 * The frame every teacher screen sits in, with loading, error and empty handled.
 *
 * Navbar + rail + page padding are identical across six routes, so they live
 * here rather than being copied into each screen — a change to the teacher
 * chrome then happens in one place.
 */
export function TeacherPage<T>({
  state,
  children,
  errorMessage,
  className,
}: {
  state: AsyncResult<T>
  /** Render prop, matching `AsyncBoundary`, so screens get the data without narrowing. */
  children: (data: T) => ReactNode
  errorMessage?: string
  className?: string
}) {
  return (
    <TeacherShell className={className}>
      <AsyncBoundary state={state} errorMessage={errorMessage}>
        {children}
      </AsyncBoundary>
    </TeacherShell>
  )
}

/**
 * Page header. `actions` is the right-hand slot, used for the primary button on
 * every screen so the call to action always sits in the same place.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
}: {
  eyebrow: string
  title: string
  description?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0">
        <p className="technical-label flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-ink-100 md:text-5xl">
          {title}
        </h1>
        {description && <p className="mt-3 max-w-xl text-ink-500">{description}</p>}
        {meta && <p className="mt-2 font-mono text-[0.625rem] text-ink-700">{meta}</p>}
      </div>
      {/*
        Not `shrink-0`: the header is a wrapping flex row, and a non-shrinking
        action group sets a floor on the page width that the row cannot get below,
        which pushed every wide-screen-only button into horizontal scroll on a
        phone. Letting it shrink lets the buttons wrap instead.
      */}
      {actions && <div className="flex min-w-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function StatusPill({ status }: { status: Activity['status'] }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-pill border px-2 py-0.5 font-mono text-[0.5625rem] tracking-widest uppercase',
        status === 'published'
          ? 'border-success/40 bg-success/10 text-success'
          : 'border-lab-600 bg-lab-800 text-ink-500',
      )}
    >
      {status === 'published' ? 'published' : 'draft'}
    </span>
  )
}

const KIND_LABELS: Record<ActivityKind, string> = {
  lesson: 'Lesson',
  interactive: 'Interactive',
  challenge: 'Challenge',
  quiz: 'Quiz',
  codeLab: 'Code lab',
  assignment: 'Assignment',
  project: 'Project',
  simulation: 'Simulation',
}

export function kindLabel(kind: ActivityKind): string {
  return KIND_LABELS[kind]
}

export function KindBadge({ kind }: { kind: ActivityKind }) {
  return (
    <span className="shrink-0 rounded-pill border border-lab-700 bg-lab-850 px-2 py-0.5 font-mono text-[0.5625rem] tracking-widest text-ink-400 uppercase">
      {KIND_LABELS[kind]}
    </span>
  )
}

/** The one destructive/secondary button style, shared so screens stay uniform. */
export function GhostButton({
  children,
  onClick,
  type = 'button',
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        'rounded-pill border border-lab-600 px-4 py-2 font-mono text-xs text-ink-300 transition-colors',
        'hover:border-accent-400/50 hover:text-accent-300',
        'focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
