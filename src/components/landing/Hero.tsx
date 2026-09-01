import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../utils/animations'
import { GlowButton } from '../ui/GlowButton'

/**
 * Full-screen cinematic hero.
 * On scroll: typography drifts up, scales down slightly, fades.
 * Transforms are written directly via rAF on a ref (no React re-renders),
 * keeping the scroll loop at 60fps.
 */
export function Hero() {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    let raf = 0
    const loop = () => {
      const el = contentRef.current
      if (el) {
        const vh = window.innerHeight || 1
        const y = window.scrollY
        const p = Math.min(1, y / (vh * 1.2))
        el.style.transform = `translate3d(0, ${p * 60}px, 0) scale(${1 - p * 0.12})`
        el.style.opacity = String(Math.max(0, 1 - p * 1.05))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const codeLines = [
    'def think():',
    '    belajar = True',
    '    while not mahir:',
    '        latihan()',
    '        bertanya()',
  ]

  return (
    <section
      id="hero"
      className="relative flex h-[120vh] items-start overflow-hidden bg-lab-950"
    >
      {/* Background code texture */}
      <div
        aria-hidden
        className="absolute inset-0 grid-bg opacity-40"
        style={{
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 75%)',
        }}
      />
      {/* Ambient cyan glow */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-accent-700/10 blur-[120px]"
      />

      {/* Floating code panel (decorative) */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[22vh] left-[max(8vw,2rem)] hidden w-64 select-none rounded-md border border-lab-700/80 bg-lab-900/70 p-4 backdrop-blur-sm lg:block"
      >
        <div className="mb-3 flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-lab-600" />
          <span className="h-2 w-2 rounded-full bg-lab-600" />
          <span className="h-2 w-2 rounded-full bg-lab-600" />
        </div>
        {codeLines.map((line, i) => (
          <div
            key={i}
            className={i === 0 ? 'font-mono text-[0.6875rem] leading-5 text-warning' : 'font-mono text-[0.6875rem] leading-5 text-ink-500'}
          >
            {line}
          </div>
        ))}
        <div className="mt-3 h-px w-full bg-lab-700" />
        <p className="mt-2 font-mono text-[0.625rem] text-ink-600">
          STATUS / <span className="text-success">READY</span>
        </p>
      </div>

      {/* Main composition */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col justify-center px-6 pt-[22vh] lg:px-12">
        <div ref={contentRef} style={{ willChange: 'transform, opacity' }}>
          <p className="technical-label mb-6 flex items-center gap-3">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent-400" />
            INTERACTIVE PROGRAMMING LOGIC TRAINING
          </p>

          <h1 className="display-hero max-w-5xl text-[clamp(2.6rem,9vw,8.25rem)]">
            THINK
            <span className="block text-ink-500">LIKE A</span>
            <span className="relative block text-ink-100">
              PROGRAMMER.
              <span className="absolute -right-4 bottom-2 h-[0.35em] w-[0.08em] animate-pulse bg-accent-400" />
            </span>
          </h1>

          <p className="mt-8 max-w-md text-lg text-ink-500">
            Interactive programming logic training for{' '}
            <span className="text-ink-200">Informatics Laboratory</span> assistants.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <GlowButton href="/dashboard" variant="primary" size="lg">
              Start Training
            </GlowButton>
            <GlowButton href="#training" variant="secondary" size="lg">
              Explore Curriculum
            </GlowButton>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-ink-600">
        <p className="font-mono text-[0.625rem] tracking-[0.3em]">SCROLL TO EXPLORE</p>
        <div className="flex h-9 w-5 justify-center rounded-pill border border-lab-600 pt-1.5">
          <span className="h-1.5 w-1 animate-bounce rounded-full bg-accent-400" />
        </div>
        <span className="font-mono text-xs text-accent-400">↓</span>
      </div>
    </section>
  )
}