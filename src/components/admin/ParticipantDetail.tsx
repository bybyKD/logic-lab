import type { Participant } from '../../data/participants'
import { ProgressRing } from '../dashboard/ProgressRing'
import { cn } from '../../utils/cn'

interface ParticipantDetailProps {
  participant: Participant
}

export function ParticipantDetail({ participant }: ParticipantDetailProps) {
  return (
    <div className="space-y-6">
      {/* Identity + key metrics */}
      <div className="panel p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-lg border border-accent-400/40 bg-lab-800 font-display text-xl text-accent-400">
            {participant.name.charAt(0)}
          </span>
          <div>
            <p className="font-display text-xl font-medium text-ink-100">{participant.name}</p>
            <p className="font-mono text-xs text-ink-600">
              {participant.id} · {participant.status.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-lab-700 bg-lab-900 p-4">
            <p className="technical-label">Logic Score</p>
            <p className="mt-2 font-display text-2xl font-medium text-ink-100 tabular-nums">
              {participant.score}
            </p>
          </div>
          <div className="rounded-lg border border-lab-700 bg-lab-900 p-4">
            <p className="technical-label">Modules</p>
            <p className="mt-2 font-display text-2xl font-medium text-ink-100 tabular-nums">
              {participant.modulesCompleted} / 10
            </p>
          </div>
          <div className="rounded-lg border border-lab-700 bg-lab-900 p-4">
            <p className="technical-label">Challenges</p>
            <p className="mt-2 font-display text-2xl font-medium text-ink-100 tabular-nums">
              {participant.challenges}
            </p>
          </div>
          <div className="rounded-lg border border-lab-700 bg-lab-900 p-4">
            <p className="technical-label">Progress</p>
            <p className="mt-2 font-display text-2xl font-medium text-accent-400 tabular-nums">
              {participant.progress}%
            </p>
          </div>
        </div>
      </div>

      {/* Strengths / needs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <p className="technical-label mb-3">STRENGTHS</p>
          <div className="flex flex-wrap gap-2">
            {participant.strengths.map((s) => (
              <span
                key={s}
                className="rounded-pill border border-success/40 bg-success/5 px-3 py-1 font-mono text-xs text-success"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="panel p-5">
          <p className="technical-label mb-3">NEEDS PRACTICE</p>
          <div className="flex flex-wrap gap-2">
            {participant.needsPractice.map((s) => (
              <span
                key={s}
                className="rounded-pill border border-warning/40 bg-warning/5 px-3 py-1 font-mono text-xs text-warning"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent attempts */}
      <div className="panel p-5">
        <p className="technical-label mb-4">RECENT ATTEMPTS</p>
        <ul className="space-y-2">
          {participant.recentAttempts.map((a, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded border border-lab-700 bg-lab-900 px-4 py-2.5"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    a.result === 'benar' ? 'bg-success' : 'bg-error',
                  )}
                />
                <p className="font-mono text-sm text-ink-300">{a.challenge}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-[0.625rem] text-ink-600">
                  MOD {String(a.module).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'font-mono text-[0.625rem]',
                    a.result === 'benar' ? 'text-success' : 'text-error',
                  )}
                >
                  {a.result.toUpperCase()}
                </span>
                <span className="font-mono text-[0.625rem] text-ink-600">{a.timestamp}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Ring summary */}
      <div className="panel flex items-center justify-between p-6">
        <p className="max-w-[220px] font-display text-sm text-ink-300">
          Kemajuan keseluruhan dari 10 modul
        </p>
        <ProgressRing value={participant.progress} size={88} stroke={5} />
      </div>
    </div>
  )
}