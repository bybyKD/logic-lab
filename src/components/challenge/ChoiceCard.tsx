import { cn } from '../../utils/cn'

interface ChoiceCardProps {
  letter: string
  text: string
  state: 'idle' | 'correct' | 'wrong'
  disabled: boolean
  onClick: () => void
}

export function ChoiceCard({ letter, text, state, disabled, onClick }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative w-full rounded-lg border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
        state === 'idle' &&
          'border-lab-600 bg-lab-800/60 hover:-translate-y-0.5 hover:border-accent-400/60 hover:bg-lab-800 enabled:cursor-pointer',
        state === 'correct' && 'border-success/60 bg-success/10 text-success',
        state === 'wrong' && 'border-error/60 bg-error/10 text-error animate-shake',
        disabled && state === 'idle' && 'opacity-40',
      )}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            'grid h-8 w-8 shrink-0 place-items-center rounded-pill border font-mono text-xs',
            state === 'idle' && 'border-lab-600 text-ink-500 group-hover:border-accent-400/60 group-hover:text-accent-300',
            state === 'correct' && 'border-success/60 text-success',
            state === 'wrong' && 'border-error/60 text-error',
          )}
        >
          {letter}
        </span>
        <span className="font-mono text-sm text-ink-100">{text}</span>
        {state === 'correct' && <span className="ml-auto text-success">✓</span>}
        {state === 'wrong' && <span className="ml-auto text-error">✕</span>}
      </span>
    </button>
  )
}