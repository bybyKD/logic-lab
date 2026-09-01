import { cn } from '../../utils/cn'

interface ProgressRingProps {
  value: number
  size?: number
  stroke?: number
  label?: string
  className?: string
}

export function ProgressRing({
  value,
  size = 96,
  stroke = 6,
  label,
  className,
}: ProgressRingProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(100, Math.max(0, value)) / 100)

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `Kemajuan ${Math.round(value)} persen`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-lab-600)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-accent-400)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-display text-xl font-medium text-ink-100 tabular-nums">
        {Math.round(value)}%
      </span>
    </div>
  )
}