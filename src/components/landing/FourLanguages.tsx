import { useState } from 'react'
import { LANGUAGE_ORDER, type LanguageId } from '../../data/languages'
import { ageExample, LANGUAGE_DESCRIPTIONS } from '../../data/codeExamples'
import { LanguageSwitcher } from '../code/LanguageSwitcher'
import { CodeBlock } from '../ui/CodeBlock'
import { SectionNumber } from '../ui/SectionNumber'
import { ScrollReveal } from '../ui/ScrollReveal'
import { cn } from '../../utils/cn'

const CARD_ACCENTS: Record<LanguageId, string> = {
  python: 'hover:border-[#4fac74]/60',
  java: 'hover:border-[#e76f51]/60',
  go: 'hover:border-[#6dd5ed]/60',
  c: 'hover:border-[#818cf8]/60',
}

export function FourLanguages() {
  const [active, setActive] = useState<LanguageId>('python')
  const code = ageExample(20)[active]

  return (
    <section
      id="languages"
      className="relative overflow-hidden bg-lab-900/50 py-28 lg:py-40"
    >
      <div
        aria-hidden
        className="absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-lab-600 to-transparent"
      />

      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <ScrollReveal className="max-w-2xl">
            <SectionNumber index="03 / 06" label="Four Languages" />
            <h2 className="mt-6 display-hero text-[clamp(2.2rem,5.5vw,4.5rem)]">
              ONE LOGIC.
              <br />
              <span className="text-accent-400">FOUR LANGUAGES.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1} className="max-w-sm">
            <p className="text-ink-500">
              Syntax berbeda, cara berpikir sama. Pelajari logikanya sekali,
              terapkan di mana saja.
            </p>
          </ScrollReveal>
        </div>

        {/* Language cards */}
        <div className="mt-16 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {LANGUAGE_ORDER.map((id, i) => {
            const activeCard = active === id
            return (
              <ScrollReveal key={id} delay={i * 0.06}>
                <button
                  type="button"
                  onClick={() => setActive(id)}
                  className={cn(
                    'group relative w-full overflow-hidden rounded-lg border p-6 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400',
                    activeCard
                      ? 'border-accent-400/70 bg-lab-800 shadow-glow'
                      : 'border-lab-700 bg-lab-850 hover:-translate-y-1 hover:bg-lab-800',
                    CARD_ACCENTS[id],
                  )}
                >
                  <span className="absolute top-4 right-4 font-mono text-[0.625rem] text-ink-600">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="font-mono text-[0.6875rem] tracking-widest text-ink-600 uppercase">
                    SYNTAX
                  </p>
                  <h3 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink-100">
                    {id === 'c' ? 'C' : id.charAt(0).toUpperCase() + id.slice(1)}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-ink-500">
                    {LANGUAGE_DESCRIPTIONS[id]}
                  </p>
                  <span
                    className={cn(
                      'mt-5 inline-flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-wider transition-colors',
                      activeCard ? 'text-accent-400' : 'text-ink-600 group-hover:text-ink-300',
                    )}
                  >
                    {activeCard ? 'DITAMPILKAN' : `LIHAT ${id.toUpperCase()}`}
                    <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                  </span>
                </button>
              </ScrollReveal>
            )
          })}
        </div>

        {/* Comparison interface */}
        <ScrollReveal delay={0.1} className="mt-16">
          <div className="panel overflow-hidden">
            <div className="flex flex-col items-start justify-between gap-4 border-b border-lab-700 px-6 py-5 md:flex-row md:items-center">
              <div>
                <p className="technical-label">EXAMPLE / COMPARISON</p>
                <h3 className="mt-1 font-display text-xl font-medium text-ink-100">
                  Conditional Logic
                </h3>
              </div>
              <LanguageSwitcher value={active} onChange={setActive} />
            </div>

            <div className="grid lg:grid-cols-[1fr_300px]">
              <div className="border-b border-lab-800 lg:border-r lg:border-b-0">
                <CodeBlock code={code} language={active} highlight={[]} />
              </div>
              <div className="flex flex-col justify-between p-6">
                <div>
                  <p className="technical-label mb-4">JENIS KEPUTUSAN</p>
                  <ul className="space-y-3 text-sm text-ink-500">
                    <li className="flex items-center gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                      Variabel <span className="font-mono text-accent-400">age</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                      Perbandingan <span className="font-mono text-warning">&gt;=</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      Output <span className="font-mono text-success">"Dewasa"</span>
                    </li>
                  </ul>
                </div>
                <p className="mt-8 border-t border-lab-800 pt-5 font-display text-sm tracking-wide text-ink-300">
                  Same logic. Different syntax.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}