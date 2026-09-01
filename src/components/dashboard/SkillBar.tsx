interface SkillBarProps {
  label: string
  value: number
  color?: string
  className?: string
}

export function SkillBar({ label, value, color = 'var(--color-accent-400)', className }: SkillBarProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-300">{label}</span>
        <span className="font-mono text-xs text-ink-500 tabular-nums">{value}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-lab-700">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}