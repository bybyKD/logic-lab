import { cn } from '../../utils/cn'

interface StatCardProps {
  label: string
  value: string
  hint?: string
  accent?: boolean
  className?: string
}

export function StatCard({ label, value, hint, accent, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'panel relative flex h-full flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-0.5',
        accent && 'border-accent-400/40',
        className,
      )}
    >
      {accent && (
        <div
          aria-hidden
          className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-accent-400/10 blur-2xl"
        />
      )}
      <p className="technical-label">{label}</p>
      <p className="mt-4 font-display text-4xl font-medium tracking-tight text-ink-100 tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-ink-600">{hint}</p>}
    </div>
  )
}