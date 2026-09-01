import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { SectionNumber } from '../ui/SectionNumber'
import { ScrollReveal } from '../ui/ScrollReveal'
import { cn } from '../../utils/cn'

type BlockId = 'start' | 'input' | 'check' | 'print' | 'end'

interface Block {
  id: BlockId
  label: string
  detail: string
}

const BLOCKS: Block[] = [
  { id: 'start', label: 'START', detail: 'Mulai program' },
  { id: 'input', label: 'INPUT AGE', detail: 'Terima usia dari pengguna' },
  { id: 'check', label: 'CHECK AGE', detail: 'Apakah usia >= 18?' },
  { id: 'print', label: 'PRINT RESULT', detail: 'Tampilkan kategori' },
  { id: 'end', label: 'END', detail: 'Program selesai' },
]

const CORRECT_ORDER: BlockId[] = ['start', 'input', 'check', 'print', 'end']

export function AlgorithmBuilder() {
  const reduce = useReducedMotion()
  const [pool, setPool] = useState<BlockId[]>([...CORRECT_ORDER].reverse())
  const [sequence, setSequence] = useState<BlockId[]>([])
  const [dragging, setDragging] = useState<BlockId | null>(null)
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle')

  const solved = status === 'correct'

  const moveToSequence = (id: BlockId) => {
    setPool((p) => p.filter((b) => b !== id))
    setSequence((s) => [...s, id])
    setStatus('idle')
  }

  const moveToPool = (id: BlockId) => {
    setSequence((s) => s.filter((b) => b !== id))
    setPool((p) => [...p, id])
    setStatus('idle')
  }

  const check = () => {
    const correct =
      sequence.length === CORRECT_ORDER.length &&
      sequence.every((id, i) => id === CORRECT_ORDER[i])
    setStatus(correct ? 'correct' : 'wrong')
  }

  const reset = () => {
    setSequence([])
    setPool([...CORRECT_ORDER].reverse())
    setStatus('idle')
  }

  const renderBlock = (block: Block, index: number, inSequence: boolean) => (
    <motion.button
      key={block.id}
      type="button"
      layout={!reduce}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      onDragStart={() => setDragging(block.id)}
      onDragEnd={() => {
        setDragging(null)
      }}
      draggable
      onClick={() => (inSequence ? moveToPool(block.id) : moveToSequence(block.id))}
      className={cn(
        'group flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition-all duration-200',
        dragging === block.id ? 'cursor-grabbing border-accent-400/70 bg-lab-800' : 'cursor-grab',
        inSequence
          ? 'border-accent-400/40 bg-lab-800 hover:border-accent-400'
          : 'border-lab-600 bg-lab-850 hover:-translate-y-0.5 hover:border-accent-400/60',
        solved && inSequence && 'border-success/50',
      )}
      aria-label={`${block.label}: ${block.detail}`}
    >
      <div className="flex items-center gap-3">
        <span className={cn('font-mono text-xs', solved && inSequence ? 'text-success' : 'text-accent-400')}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div>
          <p className="font-mono text-sm font-medium text-ink-100">{block.label}</p>
          <p className="text-xs text-ink-600">{block.detail}</p>
        </div>
      </div>
      <span className="font-mono text-ink-600 transition-colors group-hover:text-ink-300">
        {inSequence ? '✕' : '⠿'}
      </span>
    </motion.button>
  )

  return (
    <section className="relative overflow-hidden py-28 lg:py-36">
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
                Periksa Urutan
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-pill border border-lab-600 px-5 py-2.5 font-mono text-sm text-ink-300 transition-colors hover:border-lab-500"
              >
                Reset
              </button>
            </div>

            {status === 'correct' && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 rounded-lg border border-success/30 bg-success/5 px-5 py-4 font-mono text-sm text-success"
              >
                ✓ Algorithm Correct.{' '}
                <span className="text-ink-300">
                  Kamu berhasil menerjemahkan masalah menjadi urutan logis.
                </span>
              </motion.p>
            )}
            {status === 'wrong' && (
              <p className="mt-6 rounded-lg border border-error/30 bg-error/5 px-5 py-4 font-mono text-sm text-error">
                ✕ Urutan belum tepat. Coba pikir: apa yang terjadi lebih dulu?
              </p>
            )}
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="space-y-6">
              {/* Sequence workspace */}
              <div
                className={cn(
                  'rounded-lg border-2 border-dashed p-4 transition-colors',
                  solved ? 'border-success/40' : 'border-lab-600',
                )}
              >
                <p className="technical-label mb-3 flex items-center justify-between">
                  SEQUENCE <span>{sequence.length}/5</span>
                </p>
                <div className="grid gap-2.5">
                  {sequence.length === 0 ? (
                    <p className="py-8 text-center font-mono text-xs text-ink-600">
                      ↑ Klik atau seret blok dari kotak bawah ↑
                    </p>
                  ) : (
                    sequence.map((id, i) => renderBlock(BLOCKS.find((b) => b.id === id)!, i, true))
                  )}
                </div>
              </div>

              {/* Pool */}
              <div>
                <p className="technical-label mb-3">PALET / BLOK TERSEDIA</p>
                <div className="grid gap-2.5">
                  {pool.map((id, i) =>
                    renderBlock(BLOCKS.find((b) => b.id === id)!, i, false),
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}