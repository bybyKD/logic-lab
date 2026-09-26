import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { SectionNumber } from '../ui/SectionNumber'
import { ScrollReveal } from '../ui/ScrollReveal'
import { cn } from '../../utils/cn'

/** One draggable instruction. Ids are referenced by `solution` and `initialPool`. */
export interface AlgorithmStep {
  id: string
  label: string
  detail: string
}

const AGE_STEPS: AlgorithmStep[] = [
  { id: 'start', label: 'START', detail: 'Mulai program' },
  { id: 'input', label: 'INPUT AGE', detail: 'Terima usia dari pengguna' },
  { id: 'check', label: 'CHECK AGE', detail: 'Apakah usia >= 18?' },
  { id: 'print', label: 'PRINT RESULT', detail: 'Tampilkan kategori' },
  { id: 'end', label: 'END', detail: 'Program selesai' },
]

const AGE_SOLUTION = ['start', 'input', 'check', 'print', 'end']

export interface AlgorithmBuilderProps {
  /**
   * The blocks on offer. Defaults to the AGE example, which is what the landing
   * page has always shown; the student activity runner passes its own.
   */
  steps?: readonly AlgorithmStep[]
  /** The correct running order, as step ids. */
  solution?: readonly string[]
  /** Pool order before the learner touches anything. Defaults to reversed. */
  initialPool?: readonly string[]
  /**
   * `landing` keeps the marketing layout and Indonesian copy.
   * `embedded` drops the marketing chrome and reports the order upwards instead
   * of checking it, because inside the runner the submit button owns scoring.
   */
  variant?: 'landing' | 'embedded'
  onSequenceChange?: (sequence: readonly string[]) => void
  /** Set once the attempt is recorded, so the order cannot change under a saved answer. */
  locked?: boolean
  className?: string
}

const COPY = {
  landing: {
    sequence: 'SEQUENCE',
    pool: 'PALET / BLOK TERSEDIA',
    empty: '↑ Klik atau seret blok dari kotak bawah ↑',
    check: 'Periksa Urutan',
    reset: 'Reset',
    correct: '✓ Algorithm Correct.',
    correctTail: 'Kamu berhasil menerjemahkan masalah menjadi urutan logis.',
    wrong: '✕ Urutan belum tepat. Coba pikir: apa yang terjadi lebih dulu?',
  },
  embedded: {
    sequence: 'YOUR ORDER',
    pool: 'AVAILABLE STEPS',
    empty: '↑ Click a step, or drag it up here ↑',
    check: 'Check my order',
    reset: 'Start over',
    correct: '✓ That order runs correctly.',
    correctTail: 'You turned the problem into an executable sequence.',
    wrong: '✕ Not quite. What has to happen before the value is used?',
  },
} as const

export function AlgorithmBuilder({
  steps = AGE_STEPS,
  solution = AGE_SOLUTION,
  initialPool,
  variant = 'landing',
  onSequenceChange,
  locked = false,
  className,
}: AlgorithmBuilderProps) {
  const reduce = useReducedMotion()
  const copy = COPY[variant]
  const embedded = variant === 'embedded'

  // A lookup rather than `find(...)!`: the runner builds steps from stored
  // activity content, and an id that no longer resolves must drop out quietly
  // instead of throwing inside a drag interaction.
  const byId = useMemo(() => new Map(steps.map((s) => [s.id, s])), [steps])

  const knownSolution = useMemo(
    () => (solution.length ? solution.filter((id) => byId.has(id)) : steps.map((s) => s.id)),
    [solution, steps, byId],
  )

  // An explicit `initialPool` is already in learner-facing order and is used as
  // given. Only the default is reversed, so the puzzle is not handed over solved.
  const seedPool = useMemo(
    () =>
      initialPool
        ? initialPool.filter((id) => byId.has(id))
        : [...knownSolution].reverse(),
    [initialPool, knownSolution, byId],
  )

  const [pool, setPool] = useState<string[]>(() => [...seedPool])
  const [sequence, setSequence] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [dragging, setDragging] = useState<string | null>(null)

  const solved = status === 'correct'

  // A new activity means a new puzzle: drop any order the learner had built.
  // Keyed on the *contents* of the pool and solution, not their identity, because
  // a parent that rebuilds its arrays each render would otherwise reset the
  // puzzle on every render and the order could never be completed.
  const puzzleKey = `${knownSolution.join('>')}|${seedPool.join('>')}`
  const seenPuzzle = useRef(puzzleKey)

  useEffect(() => {
    if (seenPuzzle.current === puzzleKey) return
    seenPuzzle.current = puzzleKey
    setPool([...seedPool])
    setSequence([])
    setStatus('idle')
  }, [puzzleKey, seedPool])

  // Report the order upwards, but only when the order itself changed. Holding the
  // callback in a ref means a parent that passes a fresh arrow each render cannot
  // turn this into a render loop, and the comparison means a no-op report never
  // reaches the parent's state either.
  const reportRef = useRef<readonly string[] | null>(null)
  const onSequenceChangeRef = useRef(onSequenceChange)
  onSequenceChangeRef.current = onSequenceChange

  useEffect(() => {
    const previous = reportRef.current
    if (previous && previous.length === sequence.length && previous.every((id, i) => id === sequence[i])) {
      return
    }
    reportRef.current = sequence
    onSequenceChangeRef.current?.(sequence)
  }, [sequence])

  const moveToSequence = (id: string) => {
    setPool((p) => p.filter((b) => b !== id))
    setSequence((s) => [...s, id])
    setStatus('idle')
  }

  const moveToPool = (id: string) => {
    setSequence((s) => s.filter((b) => b !== id))
    setPool((p) => [...p, id])
    setStatus('idle')
  }

  const check = () => {
    const correct =
      sequence.length === knownSolution.length &&
      sequence.every((id, i) => id === knownSolution[i])
    setStatus(correct ? 'correct' : 'wrong')
  }

  const reset = () => {
    setSequence([])
    setPool([...seedPool])
    setStatus('idle')
  }

  const renderBlock = (step: AlgorithmStep, index: number, inSequence: boolean) => (
    <motion.button
      key={step.id}
      type="button"
      layout={!reduce}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onDragStart={() => setDragging(step.id)}
      onDragEnd={() => {
        setDragging(null)
      }}
      draggable={!locked}
      disabled={locked}
      onClick={() => (inSequence ? moveToPool(step.id) : moveToSequence(step.id))}
      className={cn(
        'group flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition-all duration-200',
        locked
          ? 'cursor-not-allowed opacity-60'
          : dragging === step.id
            ? 'cursor-grabbing border-accent-400/70 bg-lab-800'
            : 'cursor-grab',
        inSequence
          ? 'border-accent-400/40 bg-lab-800 hover:border-accent-400'
          : 'border-lab-600 bg-lab-850 hover:-translate-y-0.5 hover:border-accent-400/60',
        solved && inSequence && 'border-success/50',
      )}
      aria-label={`${step.label}: ${step.detail}`}
    >
      <div className="flex items-center gap-3">
        <span className={cn('font-mono text-xs', solved && inSequence ? 'text-success' : 'text-accent-400')}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div>
          <p className="font-mono text-sm font-medium text-ink-100">{step.label}</p>
          <p className="text-xs text-ink-600">{step.detail}</p>
        </div>
      </div>
      <span className="font-mono text-ink-600 transition-colors group-hover:text-ink-300">
        {inSequence ? '✕' : '⠿'}
      </span>
    </motion.button>
  )

  /** The ordering workspace, shared by both variants. */
  const workspace = (
    <div className="space-y-6">
      {/* Sequence workspace */}
      <div
        className={cn(
          'rounded-lg border-2 border-dashed p-4 transition-colors',
          solved ? 'border-success/40' : 'border-lab-600',
        )}
      >
        <p className="technical-label mb-3 flex items-center justify-between">
          {copy.sequence} <span>{sequence.length}/{knownSolution.length}</span>
        </p>
        <div className="grid gap-2.5">
          {sequence.length === 0 ? (
            <p className="py-8 text-center font-mono text-xs text-ink-600">{copy.empty}</p>
          ) : (
            sequence.map((id, i) => {
              const step = byId.get(id)
              return step ? renderBlock(step, i, true) : null
            })
          )}
        </div>
      </div>

      {/* Pool */}
      <div>
        <p className="technical-label mb-3">{copy.pool}</p>
        <div className="grid gap-2.5">
          {pool.map((id, i) => {
            const step = byId.get(id)
            return step ? renderBlock(step, i, false) : null
          })}
        </div>
      </div>
    </div>
  )

  if (embedded) {
    return (
      <div className={className}>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">{workspace}</div>
        {status === 'correct' && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
            className="mt-6 rounded-lg border border-success/30 bg-success/5 px-5 py-4 font-mono text-sm text-success"
          >
            {copy.correct} <span className="text-ink-300">{copy.correctTail}</span>
          </motion.p>
        )}
        {status === 'wrong' && (
          <p className="mt-6 rounded-lg border border-error/30 bg-error/5 px-5 py-4 font-mono text-sm text-error">
            {copy.wrong}
          </p>
        )}
      </div>
    )
  }

  return (
    <section className={cn('relative overflow-hidden py-28 lg:py-36', className)}>
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <ScrollReveal>
            <SectionNumber index="ALGORITHM" label="Construction" />
            <h2 className="mt-6 display-hero text-[clamp(1.9rem,4.2vw,3.2rem)]">
              Before code,
              <br />
              there is an <span className="text-ink-500">algorithm.</span>
            </h2>
            <p className="mt-6 max-w-md text-ink-500">
              Susun blok di sebelah kanan menjadi urutan yang benar. Kode yang
              rapi berawal dari langkah yang urut.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={check}
                disabled={sequence.length === 0}
                className="rounded-pill bg-accent-400 px-6 py-2.5 font-mono text-sm font-medium text-lab-950 transition-all enabled:hover:bg-accent-300 disabled:opacity-40"
              >
                {copy.check}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-pill border border-lab-600 px-5 py-2.5 font-mono text-sm text-ink-300 transition-colors hover:border-lab-500"
              >
                {copy.reset}
              </button>
            </div>

            {status === 'correct' && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-lg border border-success/30 bg-success/5 px-5 py-4 font-mono text-sm text-success"
              >
                {copy.correct} <span className="text-ink-300">{copy.correctTail}</span>
              </motion.p>
            )}
            {status === 'wrong' && (
              <p className="mt-6 rounded-lg border border-error/30 bg-error/5 px-5 py-4 font-mono text-sm text-error">
                {copy.wrong}
              </p>
            )}
          </ScrollReveal>

          <ScrollReveal delay={0.1}>{workspace}</ScrollReveal>
        </div>
      </div>
    </section>
  )
}
