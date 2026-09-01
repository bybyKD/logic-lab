import { Link } from 'react-router-dom'
import type { Module } from '../../data/modules'
import { cn } from '../../utils/cn'

interface ModuleCardProps {
  module: Module
}

export function ModuleCard({ module }: ModuleCardProps) {
  return (
    <Link
      to={module.locked ? '/dashboard' : `/module/${module.id}`}
      aria-disabled={module.locked}
      className={cn(
        'group flex h-full flex-col rounded-lg border p-6 transition-all duration-300',
        module.locked
          ? 'cursor-not-allowed border-lab-800 bg-lab-900/40 opacity-60'
          : 'border-lab-700 bg-lab-850 hover:-translate-y-1 hover:border-accent-400/50 hover:bg-lab-800',
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs tracking-wider text-ink-600">
          MODULE {module.index}
        </span>
        <span
          className={cn(
            'font-mono text-[0.625rem]',
            module.locked
              ? 'text-ink-600'
              : module.completed
                ? 'text-success'
                : module.progress > 0
                  ? 'text-accent-400'
                  : 'text-ink-600',
          )}
        >
          {module.locked ? '🔒 LOCKED' : module.completed ? '✓ SELESAI' : 'DALAM PROGRES'}
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-3 font-display text-xl font-medium tracking-tight text-ink-100">
        {module.title}
      </h3>
      <p className="mt-1.5 text-sm text-ink-500">{module.subtitle}</p>

      {/* Description */}
      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-600">
        {module.description}
      </p>

      {/* Progress */}
      {!module.locked && (
        <div className="mt-auto pt-5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-lab-700">
            <div
              className={cn(
                'h-1 rounded-full transition-all duration-700',
                module.completed ? 'bg-success' : 'bg-accent-400',
              )}
              style={{ width: `${module.progress}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between font-mono text-[0.6875rem] text-ink-600">
            <span>{module.progress}%</span>
            <span>{module.difficulty.toUpperCase()}</span>
            <span>{module.minutes} min</span>
          </div>
        </div>
      )}

      {/* Action */}
      <div className="mt-4 flex items-center justify-between border-t border-lab-800 pt-4">
        <span className="text-accent-400">{module.locked ? 'Belum tersedia' : 'Continue'}</span>
        <span
          className={cn(
            'font-mono text-ink-600 transition-all duration-200',
            !module.locked && 'group-hover:translate-x-1 group-hover:text-accent-300',
          )}
        >
          →
        </span>
      </div>
    </Link>
  )
}