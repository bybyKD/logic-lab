import { useEffect, useRef, useState } from 'react'
import { cn } from '../../utils/cn'

const CHAPTERS = [
  {
    id: 0,
    tag: 'DECOMPOSE',
    title: 'Apa inputnya?',
    desc: 'Setiap program dimulai dari data. Di sini nilai umur masuk dan disimpan ke dalam variabel.',
  },
  {
    id: 1,
    tag: 'DECIDE',
    title: 'Apa kondisinya?',
    desc: 'Program membandingkan nilai dan memilih satu jalur. Pergeseran nilai mengubah keputusan.',
  },
  {
    id: 2,
    tag: 'OUTPUT',
    title: 'Apa hasilnya?',
    desc: 'Cabang yang terpilih menghasilkan output. Jalur yang aktif menyala — diamati, bukan ditebak.',
  },
]

type ShowcaseStage = (typeof CHAPTERS)[number]['id']

interface StickyLogicShowcaseProps {
  children: React.ReactNode
  className?: string
}

/**
 * Reads the live `--stage` value written to the sticky canvas parent.
 * Lets a child like LogicFlowVisualizer sync its highlighting to the
 * scroll-driven chapter without re-rendering on every frame.
 */
export function useShowcaseStage(): {
  stage: ShowcaseStage
  parentRef: React.Ref<HTMLDivElement>
} {
  const parentRef = useRef<HTMLDivElement | null>(null)
  const [stage, setStage] = useState<ShowcaseStage>(0)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const el = parentRef.current?.parentElement
      const raw = el ? el.style.getPropertyValue('--stage') : ''
      const next = Math.max(0, Math.min(CHAPTERS.length - 1, Number(raw) || 0))
      setStage((prev) => (prev === next ? prev : (next as ShowcaseStage)))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return { stage, parentRef }
}

/**
 * Scroll-driven sticky choreography:
 * A tall section whose visual (children) stays pinned while text chapters
 * scroll through. The active chapter highlights the matching flow node.
 * Children should render the diagram and receive `--stage` via CSS var.
 */
export function StickyLogicShowcase({ children, className }: StickyLogicShowcaseProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef(0)
  const [stage, setStage] = useState(0)

  useEffect(() => {
    let raf = 0
    const loop = () => {
      const el = sectionRef.current
      if (el) {
        const rect = el.getBoundingClientRect()
        const vh = window.innerHeight
        const total = rect.height - vh
        const rawP = total <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / total))
        // Write progress directly onto the canvas — no React re-render per frame
        if (canvasRef.current) {
          canvasRef.current.style.setProperty('--p', String(rawP.toFixed(4)))
        }
        const nextStage = Math.min(CHAPTERS.length - 1, Math.floor(rawP * CHAPTERS.length))
        if (nextStage !== stageRef.current) {
          stageRef.current = nextStage
          setStage(nextStage)
          if (canvasRef.current) {
            canvasRef.current.style.setProperty('--stage', String(nextStage))
          }
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section ref={sectionRef} className={cn('relative', className)}>
      {/* sticky canvas: the visual pins for the section's duration */}
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          className="absolute inset-0 grid place-items-center px-6 lg:px-24"
          style={{ '--stage': stage } as React.CSSProperties}
        >
          {children}
        </div>
        {/* chapter rail */}
        <div className="absolute top-1/2 right-[max(4vw,1.5rem)] hidden -translate-y-1/2 w-72 lg:block">
          <div className="space-y-10 border-l border-lab-700 pl-6">
            {CHAPTERS.map((c, i) => {
              const active = stage === i
              return (
                <div key={c.id} className="relative">
                  <span
                    className={cn(
                      'absolute -left-6 top-1 h-full w-px transition-all duration-500',
                      active ? 'bg-accent-400' : 'bg-transparent',
                    )}
                  />
                  <p
                    className={cn(
                      'font-mono text-[0.6875rem] tracking-widest transition-all duration-300',
                      active ? 'text-accent-400' : 'text-ink-600',
                    )}
                  >
                    {c.tag}
                  </p>
                  <h3
                    className={cn(
                      'mt-1 font-display text-xl font-medium tracking-tight transition-all duration-300',
                      active ? 'text-ink-100' : 'text-ink-600',
                    )}
                  >
                    {c.title}
                  </h3>
                  <p
                    className={cn(
                      'mt-1.5 text-sm leading-relaxed transition-all duration-300',
                      active ? 'text-ink-500' : 'text-ink-700 opacity-0',
                    )}
                  >
                    {c.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}