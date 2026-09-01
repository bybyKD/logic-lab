import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { CHALLENGES, getChallenge } from '../data/challenges'
import { LANGUAGE_ORDER, type LanguageId } from '../data/languages'
import { MODULES } from '../data/modules'
import { CodeBlock } from '../components/ui/CodeBlock'
import { LanguageSwitcher } from '../components/code/LanguageSwitcher'
import { CodeEditor } from '../components/code/CodeEditor'
import { simulateCode, type SimResult } from '../utils/codeSimulator'
import { ChoiceCard } from '../components/challenge/ChoiceCard'
import { cn } from '../utils/cn'

export function ChallengePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const challenge = useMemo(() => (id ? getChallenge(Number(id)) : CHALLENGES[0]), [id])

  const [language, setLanguage] = useState<LanguageId>('python')
  const [selected, setSelected] = useState<number | null>(null)
  const [result, setResult] = useState<SimResult | null>(null)
  const [running, setRunning] = useState(false)
  const [editorValue, setEditorValue] = useState('')

  // Reset state when challenge changes
  useEffect(() => {
    setSelected(null)
    setResult(null)
    setLanguage('python')
  }, [id, challenge?.id])

  const index = challenge ? CHALLENGES.findIndex((c) => c.id === challenge.id) : 0
  const module = challenge ? MODULES[challenge.moduleId - 1] : undefined

  if (!challenge) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-lab-950">
        <p className="text-ink-500">Tantangan tidak ditemukan.</p>
        <button
          type="button"
          onClick={() => navigate('/challenges')}
          className="text-accent-400 underline"
        >
          Lihat semua tantangan
        </button>
      </div>
    )
  }

  const answered = selected !== null
  const isCorrect = selected === challenge.answer
  const hasCode = Object.keys(challenge.code).length > 0

  const runCode = () => {
    setRunning(true)
    setResult(null)
    window.setTimeout(() => {
      setResult(simulateCode(language, editorValue || (challenge.code[language] ?? '')))
      setRunning(false)
    }, 400)
  }

  const nextChallenge = () => {
    const next = CHALLENGES[index + 1]
    if (next) navigate(`/challenge/${next.id}`)
  }

  const allLanguages = LANGUAGE_ORDER.filter((lang) => challenge.code[lang])

  return (
    <div className="min-h-screen bg-lab-900">
      <Navbar variant="app" />
      <main className="mx-auto max-w-[1200px] px-6 pt-28 pb-24 lg:px-12">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="technical-label">
              CHALLENGE {String(challenge.id).padStart(3, '0')} / {String(CHALLENGES.length).padStart(3, '0')}
            </p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink-100 md:text-4xl">
              {challenge.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="rounded-pill border border-lab-600 px-3 py-1 font-mono text-xs text-ink-400">
                MODUL {String(module?.index ?? challenge.moduleId)}
              </span>
              <span
                className={cn(
                  'rounded-pill border px-3 py-1 font-mono text-xs',
                  challenge.difficulty === 'Sulit'
                    ? 'border-error/40 text-error'
                    : challenge.difficulty === 'Menengah'
                      ? 'border-warning/40 text-warning'
                      : 'border-success/40 text-success',
                )}
              >
                {challenge.difficulty.toUpperCase()}
              </span>
              <span className="rounded-pill border border-accent-400/30 px-3 py-1 font-mono text-xs text-accent-400">
                +{challenge.points} POIN
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/challenges')}
              className="rounded-pill border border-lab-600 px-4 py-2 font-mono text-xs text-ink-400 transition-colors hover:border-lab-500 hover:text-ink-200"
            >
              All
            </button>
            {index < CHALLENGES.length - 1 && (
              <button
                type="button"
                onClick={nextChallenge}
                className="rounded-pill bg-accent-400 px-4 py-2 font-mono text-xs font-medium text-lab-950 transition-colors hover:bg-accent-300"
              >
                Next →
              </button>
            )}
          </div>
        </div>

        {/* Challenge body */}
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* Left: code + simulator */}
          <div className="space-y-6">
            {hasCode && allLanguages.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-display text-lg text-ink-100">
                    Kode contoh — pilih bahasa
                  </p>
<LanguageSwitcher
                  value={language}
                  onChange={(l) => {
                    setLanguage(l)
                    setEditorValue(challenge.code[l] ?? '')
                    setResult(null)
                  }}
                  size="sm"
                />
              </div>
              <CodeEditor
                language={language}
                onLanguageChange={(l) => {
                  setLanguage(l)
                  setEditorValue(challenge.code[l] ?? '')
                  setResult(null)
                }}
                  value={editorValue || (challenge.code[language] ?? '')}
                  onChange={(v) => setEditorValue(v)}
                  onRun={runCode}
                  onReset={() => {
                    setEditorValue(challenge.code[language] ?? '')
                    setResult(null)
                  }}
                  result={
                    result
                      ? {
                          output: result.output,
                          duration: 0,
                          error: result.error,
                        }
                      : null
                  }
                  running={running}
                  height="260px"
                />
              </>
            ) : (
              <div className="panel p-8">
                <p className="technical-label mb-4">PERTANYAAN</p>
                <p className="text-lg leading-relaxed text-ink-100">{challenge.prompt}</p>
              </div>
            )}
          </div>

          {/* Right: question + choices */}
          <div className="space-y-6">
            <div className="panel p-6">
              <p className="technical-label mb-3">PERTANYAAN</p>
              <p className="text-lg leading-relaxed text-ink-100">{challenge.prompt}</p>

              {hasCode && challenge.code[language] && (
                <div className="mt-4">
                  <CodeBlock code={challenge.code[language] ?? ''} language={language} maxHeight="200px" />
                </div>
              )}

              {challenge.choices && (
                <div className="mt-6 grid gap-3">
                  {challenge.choices.map((choice, i) => (
                    <ChoiceCard
                      key={i}
                      letter={String.fromCharCode(65 + i)}
                      text={choice}
                      state={
                        answered
                          ? i === challenge.answer
                            ? 'correct'
                            : selected === i
                              ? 'wrong'
                              : 'idle'
                          : 'idle'
                      }
                      disabled={answered}
                      onClick={() => setSelected(i)}
                    />
                  ))}
                </div>
              )}

              <div className="mt-6 min-h-[52px]">
                {answered && isCorrect && (
                  <p className="flex items-center gap-2 rounded border border-success/30 bg-success/5 px-4 py-3 font-mono text-sm text-success">
                    ✓ Benar! {challenge.explanation}
                  </p>
                )}
                {answered && !isCorrect && (
                  <p className="flex items-center gap-2 rounded border border-error/30 bg-error/5 px-4 py-3 font-mono text-sm text-error">
                    ✕ Belum tepat. {challenge.explanation}
                  </p>
                )}
              </div>
            </div>

            {answered && index < CHALLENGES.length - 1 && (
              <button
                type="button"
                onClick={nextChallenge}
                className="group flex w-full items-center justify-center gap-2 rounded-lg border border-accent-400/40 bg-accent-400/5 py-3.5 font-mono text-sm text-accent-300 transition-all hover:bg-accent-400/10"
              >
                LANJUT KE TANTANGAN BERIKUT
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}