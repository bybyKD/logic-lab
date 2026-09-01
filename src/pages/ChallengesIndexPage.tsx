import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { CHALLENGES } from '../data/challenges'
import { MODULES } from '../data/modules'
import { cn } from '../utils/cn'

export function ChallengesIndexPage() {
  const [filter, setFilter] = useState<number | 'all'>('all')
  const challenges = filter === 'all' ? CHALLENGES : CHALLENGES.filter((c) => c.moduleId === filter)

  return (
    <div className="min-h-screen bg-lab-900">
      <Navbar variant="app" />
      <main className="mx-auto max-w-[1200px] px-6 pt-28 pb-24 lg:px-12">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="technical-label">CHALLENGE LIBRARY / {CHALLENGES.length} SOAL</p>
            <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink-100 md:text-5xl">
              Latihan logika.
            </h1>
            <p className="mt-3 max-w-md text-ink-500">
              Tebak output, cari bug, susun algoritma. Setiap soal berdiri di
              atas satu modul.
            </p>
          </div>
        </div>

        {/* Module filter */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'shrink-0 rounded-pill border px-4 py-1.5 font-mono text-xs transition-colors',
              filter === 'all'
                ? 'border-accent-400/60 bg-accent-400/10 text-accent-300'
                : 'border-lab-600 text-ink-500 hover:border-lab-500 hover:text-ink-300',
            )}
          >
            SEMUA
          </button>
          {MODULES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setFilter(m.id)}
              className={cn(
                'shrink-0 rounded-pill border px-4 py-1.5 font-mono text-xs transition-colors',
                filter === m.id
                  ? 'border-accent-400/60 bg-accent-400/10 text-accent-300'
                  : 'border-lab-600 text-ink-500 hover:border-lab-500 hover:text-ink-300',
              )}
            >
              {m.index} · {m.title}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {challenges.map((c) => (
            <Link
              key={c.id}
              to={`/challenge/${c.id}`}
              className="group flex h-full flex-col rounded-lg border border-lab-700 bg-lab-850 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-accent-400/50 hover:bg-lab-800"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.625rem] text-ink-600">
                  MOD {String(c.moduleId).padStart(2, '0')} · #{String(c.id).padStart(3, '0')}
                </span>
                <span
                  className={cn(
                    'font-mono text-[0.625rem]',
                    c.difficulty === 'Sulit'
                      ? 'text-error'
                      : c.difficulty === 'Menengah'
                        ? 'text-warning'
                        : 'text-success',
                  )}
                >
                  {c.difficulty.toUpperCase()}
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-medium tracking-tight text-ink-100">
                {c.title}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-sm text-ink-500">{c.prompt}</p>
              <div className="mt-auto flex items-center justify-between pt-5">
                <span className="font-mono text-[0.625rem] text-accent-400">+{c.points} POIN</span>
                <span className="flex items-center gap-1.5 font-mono text-[0.625rem] text-ink-600 transition-colors group-hover:text-ink-300">
                  KERJAKAN
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}