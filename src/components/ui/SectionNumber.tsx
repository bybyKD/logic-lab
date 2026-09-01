import { cn } from '../../utils/cn'

interface SectionNumberProps {
  index: string
  label: string
  className?: string
}

/**
 * Small technical overline used above section headings, e.g.
 * "01 / 10 — CONDITIONAL LOGIC"
 */
export function SectionNumber({ index, label, className }: SectionNumberProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 font-mono text-[0.6875rem] tracking-[0.16em] text-ink-600 uppercase',
        className,
      )}
    >
      <span className="text-accent-400">{index}</span>
      <span className="h-px w-8 bg-lab-500" />
      <span>{label}</span>
    </div>
  )
}
