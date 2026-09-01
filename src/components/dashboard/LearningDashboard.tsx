import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MODULES } from '../../data/modules'
import { StatCard } from './StatCard'
import { ProgressRing } from './ProgressRing'
import { SkillBar } from './SkillBar'
import { ModuleCard } from './ModuleCard'

const PROFILE_SKILLS = [
  { label: 'Variables', value: 92 },
  { label: 'Conditions', value: 81 },
  { label: 'Loops', value: 63 },
  { label: 'Functions', value: 51 },
  { label: 'Algorithms', value: 70 },
]

export function LearningDashboard() {
  const stats = useMemo(() => {
    const solved = MODULES.filter((m) => m.completed).length
    const inProgress = MODULES.filter((m) => !m.completed && !m.locked).length
    return { solved, inProgress, total: MODULES.length }
  }, [])

  const continueModule = MODULES[3] // Conditional Logic, 80%

  return (
    <main className="mx-auto max-w-[1400px] px-6 pt-28 pb-24 lg:px-12">
      {/* Greeting */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="technical-label flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            SELAMAT SORE, DEWA
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-ink-100 md:text-5xl">
            Good evening.
            <br />
            <span className="text-ink-500">Ready to sharpen your logic?</span>
          </h1>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Logic Score" value="842" hint="naik 23 poin minggu ini" accent />
        <StatCard
          label="Modules"
          value={`${stats.solved} / ${stats.total}`}
          hint={`${stats.inProgress} sedang dikerjakan`}
        />
        <StatCard label="Challenges" value="37" hint="dari 30+ tersedia" />
        <StatCard label="Streak" value="5 DAYS" hint="rekor pribadi: 9 hari" />
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        {/* Continue learning */}
        <section aria-labelledby="continue-heading">
          <p className="technical-label mb-5">CONTINUE LEARNING</p>
          <div className="panel relative overflow-hidden p-8">
            <div
              aria-hidden
              className="absolute -top-16 right-0 h-48 w-48 rounded-full bg-accent-400/10 blur-3xl"
            />
            <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row">
              <div>
                <p className="font-mono text-[0.6875rem] tracking-widest text-ink-600 uppercase">
                  MODULE {continueModule.index}
                </p>
                <h2 id="continue-heading" className="mt-2 font-display text-2xl font-medium tracking-tight text-ink-100">
                  {continueModule.title}
                </h2>
                <p className="mt-2 max-w-md text-sm text-ink-500">{continueModule.description}</p>
                <Link
                  to={`/module/${continueModule.id}`}
                  className="group mt-6 inline-flex items-center gap-2 rounded-pill bg-accent-400 px-6 py-2.5 font-mono text-sm font-medium text-lab-950 transition-all hover:bg-accent-300"
                >
                  Continue
                  <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                </Link>
              </div>
              <ProgressRing value={continueModule.progress} size={110} label={`Kondisional logic ${continueModule.progress}%`} />
            </div>
          </div>
        </section>

        {/* Logic profile */}
        <section aria-labelledby="profile-heading">
          <p className="technical-label mb-5">YOUR LOGIC PROFILE</p>
          <div className="panel p-8">
            <h2 id="profile-heading" className="font-display text-lg font-medium text-ink-100">
              Kekuatan logika kamu
            </h2>
            <div className="mt-6 space-y-5">
              {PROFILE_SKILLS.map((s, i) => (
                <SkillBar
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  color={i === 0 ? 'var(--color-success)' : s.value >= 70 ? 'var(--color-accent-400)' : 'var(--color-warning)'}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Learning path grid */}
      <section className="mt-16" aria-labelledby="path-heading">
        <div className="flex items-center justify-between">
          <p id="path-heading" className="technical-label">LEARNING PATH / 10 MODUL</p>
          <Link to="/challenges" className="font-mono text-xs text-accent-400 transition-colors hover:text-accent-300">
            Challenge library →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MODULES.map((m) => (
            <ModuleCard key={m.id} module={m} />
          ))}
        </div>
      </section>
    </main>
  )
}