import { Link } from 'react-router-dom'
import { MODULES } from '../../data/modules'
import { SectionNumber } from '../ui/SectionNumber'
import { ScrollReveal } from '../ui/ScrollReveal'
import { cn } from '../../utils/cn'

export function LearningPathPreview() {
  // Show modules 1-6 to keep the section tight
  const preview = MODULES.slice(0, 6)

  return (
    <section id="training" className="relative overflow-hidden bg-lab-900/40 py-28 lg:py-36">
      <div
        aria-hidden
        className="absolute inset-0 grid-bg opacity-20"
        style={{ maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%)' }}
      />
      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <ScrollReveal>
            <SectionNumber index="ROADMAP" label="Learning Path" />
            <h2 className="mt-6 display-hero text-[clamp(2.1rem,5vw,4rem)]">
              Peta perjalanan
              <br />
              <span className="text-ink-500">logika kamu.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <Link
              to="/learn"
              className="group inline-flex items-center gap-2 text-accent-400 transition-colors hover:text-accent-300"
            >
              Lihat semua modul
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </ScrollReveal>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {preview.map((m, i) => (
            <ScrollReveal key={m.id} delay={i * 0.05}>
              <Link
                to={m.locked ? '/learn' : `/module/${m.id}`}
                aria-disabled={m.locked}
                className={cn(
                  'group flex h-full flex-col rounded-lg border p-6 transition-all duration-300',
                  m.locked
                    ? 'cursor-not-allowed border-lab-800 bg-lab-900/50 opacity-50'
                    : 'border-lab-700 bg-lab-850 hover:-translate-y-1 hover:border-accent-400/50 hover:bg-lab-800',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-ink-600">
                    MODULE {m.index}
                  </span>
                  {m.locked ? (
                    <span className="font-mono text-[0.625rem] text-ink-600">🔒 LOCKED</span>
                  ) : m.completed ? (
                    <span className="font-mono text-[0.625rem] text-success">✓ DONE</span>
                  ) : (
                    <span className="font-mono text-[0.625rem] text-accent-400">IN PROGRESS</span>
                  )}
                </div>

                <h3 className="mt-3 font-display text-xl font-medium tracking-tight text-ink-100">
                  {m.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-ink-500">{m.subtitle}</p>

                <div className="mt-auto pt-6">
                  <div className="h-1 w-full rounded-full bg-lab-700">
                    <div
                      className="h-1 rounded-full bg-accent-400 transition-all duration-500"
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink-600">
                    <span className="font-mono">{m.progress}%</span>
                    <span>{m.minutes} min</span>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}