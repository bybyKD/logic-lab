import { useState } from 'react'
import { CodeBlock } from '../ui/CodeBlock'
import { SectionNumber } from '../ui/SectionNumber'
import { ScrollReveal } from '../ui/ScrollReveal'
import { cn } from '../../utils/cn'

const BUGGED = `umur = 17

if umur > 18:
    print("Dewasa")
else:
    print("Remaja")`

const ERROR_TYPES = [
  {
    id: 'syntax',
    label: 'Syntax Error',
    desc: 'Tata bahasa salah — program tidak bisa dijalankan sama sekali.',
    color: 'text-error',
  },
  {
    id: 'logic',
    label: 'Logic Error',
    desc: 'Program berjalan, tapi hasil tidak sesuai harapan.',
    color: 'text-warning',
  },
  {
    id: 'runtime',
    label: 'Runtime Error',
    desc: 'Program menghentikan diri saat dieksekusi (crash).',
    color: 'text-accent-400',
  },
]

export function DebuggingSection() {
  const [showHint, setShowHint] = useState(false)

  return (
    <section className="relative overflow-hidden bg-lab-900/40 py-28 lg:py-36">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 lg:grid-cols-2 lg:items-center lg:px-12">
        <ScrollReveal>
          <SectionNumber index="BUG LAB" label="Debugging" />
          <h2 className="mt-6 display-hero text-[clamp(2rem,4.5vw,3.4rem)]">
            Code doesn't always work.
            <br />
            <span className="text-ink-500">That's the point.</span>
          </h2>
          <p className="mt-6 max-w-md text-ink-500">
            Program di samping berjalan tanpa pesan error — tetapi ada yang
            salah. Bisakah kamu menemukannya? Inilah{' '}
            <span className="text-warning">logic error</span>: hasilnya tidak
            sesuai logika.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {ERROR_TYPES.map((e) => (
              <div
                key={e.id}
                className="rounded-lg border border-lab-700 bg-lab-850 p-4"
              >
                <p className={cn('font-mono text-xs font-medium', e.color)}>
                  {e.id.toUpperCase()}
                </p>
                <p className="mt-1 text-xs text-ink-500">{e.label}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="mt-6 inline-flex items-center gap-2 font-mono text-xs text-accent-400 transition-colors hover:text-accent-300"
            aria-expanded={showHint}
          >
            {showHint ? 'Sembunyikan analisis' : 'Lihat analisis'} ↓
          </button>

          {showHint && (
            <div className="mt-4 rounded-lg border border-warning/40 bg-warning/5 p-5">
              <p className="font-mono text-xs text-warning">
                LOGIC ERROR — BATAS UMUR SALAH
              </p>
              <p className="mt-2 text-sm text-ink-300">
                Kondisi seharusnya <span className="font-mono text-ink-100">umur &gt;= 18</span>,
                bukan <span className="font-mono text-error">umur &gt; 18</span>.
                Dengan umur 17, cabang "Dewasa" terpilih — padahal seharusnya "Remaja".
              </p>
            </div>
          )}
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-lab-700 px-5 py-3">
              <p className="technical-label">BUGGED SOURCE</p>
              <span className="flex items-center gap-2 font-mono text-[0.625rem] text-ink-600">
                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                LOGIC ERROR
              </span>
            </div>
            <CodeBlock code={BUGGED} language="python" highlight={[2]} />
            <div className="border-t border-lab-700 px-5 py-4">
              <p className="font-mono text-xs text-ink-500">
                Program <span className="text-success">berjalan</span> tanpa
                error — tapi hasil <span className="text-error">salah</span>.
                Itu ciri khas logic error.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}