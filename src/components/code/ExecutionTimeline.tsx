import { cn } from '../../utils/cn'

interface ExecutionTimelineProps {
  steps: number
  current: number
}

/**
 * Horizontal execution timeline: a track of step segments where the
 * current instruction glows and completed ones stay lit.
 */
export function ExecutionTimeline({ steps, current }: ExecutionTimelineProps) {
  return (
    <div
      className="flex items-center gap-1"
      role="img"
      aria-label={`Langkah eksekusi ${Math.min(current + 1, steps)} dari ${steps}`}
    >
      {Array.from({ length: steps }).map((_, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex flex-1 items-center gap-1">
            <div
              className={cn(
                'h-1.5 flex-1 rounded-full transition-all duration-500',
                active ? 'bg-accent-400 shadow-glow' : done ? 'bg-accent-400/40' : 'bg-lab-600',
              )}
            />
            {i < steps - 1 && (
              <span
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300',
                  active || done ? 'bg-accent-400/60' : 'bg-lab-700',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}