import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { MODULES } from '../data/modules'
import { getChallengesByModule } from '../data/challenges'
import { LanguageSwitcher } from '../components/code/LanguageSwitcher'
import { CodeBlock } from '../components/ui/CodeBlock'
import { ageExample } from '../data/codeExamples'
import type { LanguageId } from '../data/languages'
import { ProgressRing } from '../components/dashboard/ProgressRing'
import { cn } from '../utils/cn'

const LESSON_SAMPLES: Record<string, string[]> = {
  '4': [
    `# 1. Percabangan dasar (Python)
umur = 20

if umur >= 18:
    print("Dewasa")
else:
    print("Remaja")`,
    `# 2. Beberapa kondisi
nilai = 85

if nilai >= 90:
    print("A")
elif nilai >= 75:
    print("B")
else:
    print("C")`,
    `# 3. Kombinasi logika
umur = 19
punya_ktp = True

if punya_ktp and umur >= 18:
    print("Boleh daftar")`,
  ],
  '5': [
    `# 1. Perulangan for (Python)
for i in range(5):
    print(i)`,
    `# 2. Akumulator
total = 0
for i in range(1, 6):
    total += i
print(total)`,
    `# 3. Perulangan while
n = 5
while n > 0:
    print(n)
    n -= 1`,
  ],
}

export function ModulePage() {
  const { id } = useParams()
  const module = MODULES.find((m) => String(m.id) === id)

  const [language, setLanguage] = useState<LanguageId>('python')

  if (!module) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-lab-950">
        <p className="text-ink-500">Modul tidak ditemukan.</p>
        <Link to="/dashboard" className="text-accent-400 underline">
          Kembali ke dashboard
        </Link>
      </div>
    )
  }

  const challenges = getChallengesByModule(module.id)
  const samples = LESSON_SAMPLES[String(module.id)] ?? [
    ageExample(20)[language],
  ]

  return (
    <div className="min-h-screen bg-lab-900">
      <Navbar variant="app" />
      <main className="mx-auto max-w-[1200px] px-6 pt-28 pb-24 lg:px-12">
        {/* Breadcrumb + header */}
        <div className="flex items-center gap-2 font-mono text-xs text-ink-600">
          <Link to="/dashboard" className="transition-colors hover:text-ink-300">Dashboard</Link>
          <span>/</span>
          <span className="text-ink-300">Module {module.index}</span>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="technical-label">
              MODULE {module.index} / 10
            </p>
            <h1 className="mt-3 font-display text-4xl font-medium tracking-tight text-ink-100 md:text-5xl">
              {module.title}
            </h1>
            <p className="mt-3 max-w-lg text-ink-500">{module.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="rounded-pill border border-lab-600 px-3 py-1 font-mono text-xs text-ink-400">
                {module.difficulty.toUpperCase()}
              </span>
              <span className="rounded-pill border border-lab-600 px-3 py-1 font-mono text-xs text-ink-400">
                {module.minutes} MENIT
              </span>
              <span className="rounded-pill border border-accent-400/40 px-3 py-1 font-mono text-xs text-accent-400">
                {module.progress}% SELESAI
              </span>
            </div>
          </div>
          <ProgressRing value={module.completed ? 100 : module.progress} size={120} label={`Kemajuan modul ${module.progress}%`} />
        </div>

        {/* Lesson content */}
        <section className="mt-14" aria-labelledby="lessons">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p id="lessons" className="technical-label">MATERI / PRAKTIK</p>
            <LanguageSwitcher value={language} onChange={setLanguage} size="sm" />
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {samples.map((code, i) => (
              <div key={i} className="panel overflow-hidden">
                <div className="flex items-center justify-between border-b border-lab-700 px-5 py-3">
                  <p className="font-mono text-xs text-ink-600">
                    Contoh {i + 1} — {module.title}
                  </p>
                  <span className="font-mono text-[0.625rem] text-accent-400">
                    {language === 'python' ? 'Python' : language === 'java' ? 'Java' : language === 'go' ? 'Go' : 'C'}
                  </span>
                </div>
                <CodeBlock code={code} language={language} maxHeight="240px" />
              </div>
            ))}
            <div className="panel flex flex-col justify-center p-8">
              <p className="technical-label mb-3">CARA BERPIKIR</p>
              <h2 className="font-display text-xl font-medium tracking-tight text-ink-100">
                Jangan hafal kode.
                <br />
                Pahami <span className="text-accent-400">polanya.</span>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-500">
                Setiap contoh di samping bisa langsung kamu edit di editor.
                Ganti bahasa untuk melihat pola yang sama dalam sintaks lain.
              </p>
            </div>
          </div>
        </section>

        {/* Challenges for this module */}
        {challenges.length > 0 && (
          <section className="mt-16" aria-labelledby="module-challenges">
            <p id="module-challenges" className="technical-label">
              TANTANGAN MODUL INI / {challenges.length} SOAL
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {challenges.map((c) => (
                <Link
                  key={c.id}
                  to={`/challenge/${c.id}`}
                  className={cn(
                    'group flex items-center justify-between rounded-lg border border-lab-700 bg-lab-850 px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-400/50',
                  )}
                >
                  <div>
                    <p className="font-mono text-[0.625rem] text-ink-600">#{String(c.id).padStart(3, '0')}</p>
                    <h3 className="mt-1 font-display text-base font-medium text-ink-100">
                      {c.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-ink-600">
                      {c.difficulty.toUpperCase()} · +{c.points} poin
                    </p>
                  </div>
                  <span className="font-mono text-ink-600 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent-300">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Next module */}
        {module.id < 10 && (
          <div className="mt-16 flex justify-between border-t border-lab-800 pt-8">
            <div>
              <p className="technical-label">SELANJUTNYA</p>
              <p className="mt-1 font-display text-lg text-ink-100">
                {MODULES[module.id].title}
              </p>
            </div>
            <Link
              to={MODULES[module.id].locked ? '/dashboard' : `/module/${module.id + 1}`}
              className="group flex items-center gap-2 font-mono text-sm text-accent-400 transition-colors hover:text-accent-300"
            >
              {MODULES[module.id].locked ? 'Lalu' : 'Lanjut'}
              <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}