import { useMemo, useState } from 'react'
import { PARTICIPANTS, type Participant } from '../../data/participants'
import { StatCard } from '../dashboard/StatCard'
import { ParticipantTable } from './ParticipantTable'
import { ParticipantDetail } from './ParticipantDetail'

export function AdminDashboard() {
  const [selected, setSelected] = useState<Participant | null>(null)

  const stats = useMemo(() => {
    const avgScore = Math.round(
      PARTICIPANTS.reduce((sum, p) => sum + p.score, 0) / PARTICIPANTS.length,
    )
    const avgProgress = Math.round(
      PARTICIPANTS.reduce((sum, p) => sum + p.progress, 0) / PARTICIPANTS.length,
    )
    const activeToday = PARTICIPANTS.filter((p) => p.lastActive === 'hari ini').length
    return { avgScore, avgProgress, activeToday }
  }, [])

  return (
    <main className="mx-auto max-w-[1400px] px-6 pt-28 pb-24 lg:px-12">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="technical-label flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-400" />
            KONTROL / ADMIN
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-ink-100 md:text-5xl">
            Laboratory Training
          </h1>
          <p className="mt-3 max-w-lg text-ink-500">
            Pantau progres seluruh asisten dan peserta laboratorium Informatika.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelected(null)}
            disabled={!selected}
            className="rounded-pill border border-lab-600 px-4 py-2 font-mono text-xs text-ink-300 transition-colors enabled:hover:border-lab-500 disabled:opacity-40"
          >
            ← Daftar
          </button>
          <a
            href="/dashboard"
            className="rounded-pill border border-accent-400/40 px-4 py-2 font-mono text-xs text-accent-300 transition-colors hover:bg-accent-400/10"
          >
            Lihat sebagai peserta
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Participants" value={`${PARTICIPANTS.length}`} hint="terdaftar di laboratorium" accent />
        <StatCard label="Average Score" value={`${stats.avgScore}`} hint="rerata skor logika" />
        <StatCard label="Completion" value={`${stats.avgProgress}%`} hint="rerata progres modul" />
        <StatCard label="Active Today" value={`${stats.activeToday}`} hint="mengerjakan hari ini" />
      </div>

      {/* Participant table + detail split */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <ParticipantTable
          participants={PARTICIPANTS}
          onSelect={(p) => setSelected(p)}
        />
        <aside aria-live="polite">
          {selected ? (
            <ParticipantDetail participant={selected} />
          ) : (
            <div className="panel sticky top-24 flex h-full min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-lg border border-lab-600 bg-lab-800 font-display text-xl text-ink-600">
                ?
              </span>
              <p className="max-w-xs font-display text-lg text-ink-300">
                Pilih peserta untuk melihat profil detail.
              </p>
              <p className="max-w-xs text-sm text-ink-600">
                Skor, kekuatan, dan area yang perlu dilatih akan tampil di sini.
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}