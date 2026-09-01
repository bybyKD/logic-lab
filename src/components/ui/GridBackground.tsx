import { cn } from '../../utils/cn'

interface GridBackgroundProps {
  className?: string
  /** opacity 0-1 for grid lines */
  opacity?: number
}

export function GridBackground({ className, opacity = 1 }: GridBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 grid-bg', className)}
      style={{ opacity }}
    />
  )
}
