import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

/**
 * One loading / error / empty wrapper for every screen in the product.
 *
 * §28 requires all three states from the start, and retrofitting them is how a
 * screen ends up with a spinner that never resolves on an empty class. Doing it
 * once, here, means a new screen gets them by construction.
 */

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  // The thrown value rides along so a screen can explain *why* something failed.
  // Loaders in this codebase throw sentences written for people, and a guard like
  // "that activity is not in this section" is far more use to a learner than a
    // generic "could not load".
  | { status: 'error'; error?: unknown }

export type AsyncResult<T> = AsyncState<T> & { retry: () => void }

/**
 * Runs `load` on mount and whenever `deps` change, and tracks its state.
 *
 * `deps` is passed explicitly rather than inferred so a screen cannot
 * accidentally fetch in a loop by returning a fresh object or array each
 * render — the classic way this pattern goes wrong.
 */
export function useAsync<T>(load: () => Promise<T>, deps: readonly unknown[]): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    setState({ status: 'loading' })
    load().then(
      (data) => {
        if (alive) setState({ status: 'ready', data })
      },
      (error) => {
        if (alive) setState({ status: 'error', error })
      },
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])

  return { ...state, retry }
}

export interface AsyncBoundaryProps<T> {
  state: AsyncResult<T>
  children: (data: T) => ReactNode
  /** Return true when there is no error but nothing worth showing. */
  empty?: (data: T) => boolean
  emptyMessage?: ReactNode
  errorMessage?: ReactNode
  className?: string
}

export function AsyncBoundary<T>({
  state,
  children,
  empty,
  emptyMessage = 'Nothing to show yet.',
  errorMessage = 'Could not load this data.',
  className,
}: AsyncBoundaryProps<T>) {
  if (state.status === 'error') {
    return (
      <div className={className}>
        <ErrorPanel message={errorMessage} onRetry={state.retry} />
      </div>
    )
  }

  if (state.status === 'loading') {
    return (
      <div className={className}>
        <LoadingPanel />
      </div>
    )
  }

  if (empty?.(state.data)) {
    return (
      <div className={className}>
        <EmptyPanel message={emptyMessage} />
      </div>
    )
  }

  return <>{children(state.data)}</>
}

export function LoadingPanel({ label }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="panel flex min-h-[220px] flex-col items-center justify-center gap-3 p-8"
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-lab-600 border-t-accent-400 motion-reduce:animate-none" />
      <p className="font-mono text-xs tracking-widest text-ink-600 uppercase">
        {label ?? 'Loading'}
      </p>
    </div>
  )
}

export function ErrorPanel({
  message,
  onRetry,
}: {
  message?: ReactNode
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="panel flex min-h-[180px] flex-col items-center justify-center gap-3 border-error/30 p-8 text-center"
    >
      <span className="grid h-11 w-11 place-items-center rounded-lg border border-error/40 bg-error/5 font-display text-lg text-error">
        !
      </span>
      <p className="max-w-sm text-sm text-ink-300">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-pill border border-lab-600 px-4 py-2 font-mono text-xs text-ink-300 transition-colors hover:border-accent-400/50 hover:text-accent-300"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyPanel({ message, icon }: { message?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="panel flex min-h-[180px] flex-col items-center justify-center gap-3 p-8 text-center">
      <span
        className={cn(
          'grid h-11 w-11 place-items-center rounded-lg border border-lab-600 bg-lab-800',
          'font-display text-lg text-ink-600',
        )}
      >
        {icon ?? '—'}
      </span>
      <p className="max-w-sm text-sm text-ink-500">{message}</p>
    </div>
  )
}
