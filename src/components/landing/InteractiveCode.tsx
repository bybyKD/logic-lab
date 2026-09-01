import { useState } from 'react'
import { type LanguageId } from '../../data/languages'
import { ageExample } from '../../data/codeExamples'
import { simulateCode, type SimResult } from '../../utils/codeSimulator'
import { CodeEditor, type RunResult } from '../code/CodeEditor'
import { SectionNumber } from '../ui/SectionNumber'
import { ScrollReveal } from '../ui/ScrollReveal'

function toRunResult(sim: SimResult): RunResult {
  return {
    output: sim.output,
    duration: 60 + Math.round(Math.random() * 90),
    error: sim.error,
  }
}

export function InteractiveCode() {
  const [language, setLanguage] = useState<LanguageId>('python')
  const [code, setCode] = useState<string>(ageExample(20).python)
  const [result, setResult] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [errorNote, setErrorNote] = useState<string | null>(null)

  const switchLanguage = (id: LanguageId) => {
    setLanguage(id)
    setCode(ageExample(20)[id])
    setResult(null)
    setErrorNote(null)
  }

  const run = () => {
    setRunning(true)
    setResult(null)
    setErrorNote(null)
    window.setTimeout(() => {
      const sim = simulateCode(language, code)
      if (sim && !sim.error) {
        setResult(toRunResult(sim))
      } else {
        setResult({ output: '', duration: 0, error: true })
        setErrorNote('Simulator tidak mengenali pola ini.')
      }
      setRunning(false)
    }, 500)
  }

  const reset = () => {
    setCode(ageExample(20)[language])
    setResult(null)
    setErrorNote(null)
  }

  return (
    <section
      id="interactive"
      className="relative overflow-hidden py-28 lg:py-36"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr] lg:items-center">
          <ScrollReveal>
            <SectionNumber index="04 / 06" label="Live Editor" />
            <h2 className="mt-6 display-hero text-[clamp(2rem,4.5vw,3.4rem)]">
              Tulis.
              <br />
              <span className="text-ink-500">Jalankan.</span>
              <br />
              Lihat hasilnya.
            </h2>
            <p className="mt-6 max-w-md text-ink-500">
              Editor di samping bukan simulasi — ini editor sungguhan. Ganti
              bahasa, ganti nilai <span className="font-mono text-accent-400">age</span>,
              lalu tekan Run untuk melihat bagaimana setiap sintaks
              mengeksekusi logika yang sama.
            </p>
            <div className="mt-8 flex flex-col gap-3 border-l border-lab-700 pl-5 text-sm text-ink-500">
              <p>
                <span className="font-mono text-success">→</span> Ubah{' '}
                <span className="font-mono text-accent-400">age</span> dari 20 ke 16 dan perhatikan
                output berubah.
              </p>
              <p>
                <span className="font-mono text-success">→</span> Pindah ke tab Java, Go, atau C —
                sintaks berubah, logika tetap.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <CodeEditor
              language={language}
              onLanguageChange={switchLanguage}
              value={code}
              onChange={setCode}
              onRun={run}
              onReset={reset}
              result={result}
              running={running}
            />
            {errorNote && (
              <p className="mt-3 font-mono text-xs text-warning">{errorNote}</p>
            )}
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}