import { LANGUAGE_ORDER, type LanguageId } from '../../data/languages'
import { cn } from '../../utils/cn'

interface LanguageSwitcherProps {
  value: LanguageId
  onChange: (id: LanguageId) => void
  className?: string
  size?: 'sm' | 'md'
}

const LABELS: Record<LanguageId, string> = {
  python: 'Python',
  java: 'Java',
  go: 'Go',
  c: 'C',
}

export function LanguageSwitcher({
  value,
  onChange,
  className,
  size = 'md',
}: LanguageSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Pilih bahasa pemrograman"
      className={cn(
        'inline-flex items-center gap-1 rounded-pill border border-lab-600 bg-lab-800/80 p-1 backdrop-blur',
        className,
      )}
    >
      {LANGUAGE_ORDER.map((id) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={cn(
              'rounded-pill font-mono font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-5 py-2 text-sm',
              active
                ? 'bg-accent-400 text-lab-950 shadow-glow'
                : 'text-ink-500 hover:bg-lab-700 hover:text-ink-200',
            )}
          >
            {LABELS[id]}
          </button>
        )
      })}
    </div>
  )
}