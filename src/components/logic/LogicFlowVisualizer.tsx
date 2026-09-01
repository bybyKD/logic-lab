import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from '../../utils/cn'
import { StickyLogicShowcase, useShowcaseStage } from '../ui/StickyLogicShowcase'
import { SectionNumber } from '../ui/SectionNumber'

interface NodeProps {
  label: string
  small: string
  variant: 'input' | 'decision' | 'output'
  active: boolean
  strong?: boolean
}

function Node({ label, small, variant, active, strong }: NodeProps) {
  const color =
    variant === 'decision'
      ? 'border-warning/50 text-warning'
      : variant === 'output'
        ? 'border-success/50 text-success'
        : 'border-accent-400/50 text-accent-400'

  return (
    <div
      className={cn(
        'min-w-[180px] rounded-md border bg-lab-900/95 px-6 py-4 text-center backdrop-blur transition-all duration-500 sm:min-w-[230px]',
        color,
        strong
          ? 'scale-105 accent-glow border-opacity-100'
          : active
            ? 'border-opacity-100'
            : 'opacity-45 scale-95',
      )}
    >
      <p className="font-mono text-[0.625rem] tracking-widest text-current uppercase">
        {small}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold tracking-wide text-current">
        {label}
      </p>
    </div>
  )
}

function Arrow({ active }: { active?: boolean }) {
  return (
    <span
      className={cn(
        'font-mono text-xl transition-colors duration-500',
        active ? 'text-accent-400' : 'text-lab-600',
      )}
    >
      ↓
    </span>
  )
}

function YesNo({ label, active }: { label: 'YES' | 'NO'; active?: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full border px-3 py-0.5 font-mono text-[0.625rem] tracking-widest transition-colors duration-500',
        active ? 'border-success text-success' : 'border-lab-700 text-ink-700',
      )}
    >
      {label}
    </span>
  )
}

export function LogicFlowVisualizer() {
  const reduce = useReducedMotion()
  const [age, setAge] = useState(20)
  const adult = age >= 18
  const { stage, parentRef } = useShowcaseStage()

  useEffect(() => {
    if (reduce) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setAge((a) => Math.min(30, a + 1))
      if (e.key === 'ArrowLeft') setAge((a) => Math.max(8, a - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [reduce])

  const inputStrong = stage === 0
  const condStrong = stage === 1
  const outStrong = stage === 2

  return (
    <StickyLogicShowcase className="h-[340vh]">
      {/* Illustrated flow (the chapter words scroll on the right rail at lg) */}
      <div ref={parentRef} className="flex w-full flex-col items-center gap-4 lg:w-auto lg:flex-row lg:gap-24">
        <div className="flex flex-col items-center gap-1.5">
          <Node label={`AGE = ${age}`} small="INPUT" variant="input" active strong={inputStrong} />
          <Arrow active />
          <Node label="AGE >= 18 ?" small="CONDITION" variant="decision" active strong={condStrong} />
          <div className="mt-1 flex w-full items-start justify-between">
            <div className="flex flex-col items-center gap-1.5">
              <YesNo label="YES" active={outStrong || adult} />
              <Arrow active={adult} />
              <Node label="ADULT" small="OUTPUT" variant="output" active={adult} strong={outStrong && adult} />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <YesNo label="NO" active={outStrong || !adult} />
              <Arrow active={!adult} />
              <Node label="MINOR" small="OUTPUT" variant="output" active={!adult} strong={outStrong && !adult} />
            </div>
          </div>
        </div>

        {/* Controls & heading */}
        <div className="order-first max-w-[300px] lg:order-none lg:w-64">
          <SectionNumber index="02 / 06" label="Flow Engine" />
          <h2 className="mt-4 font-display text-2xl font-medium tracking-tight text-ink-100 sm:text-3xl">
            One decision.
            <br />
            <span className="text-ink-500">Change it, watch the path.</span>
          </h2>
          <div className="mt-6 rounded-lg border border-lab-700 bg-lab-850/90 p-5 backdrop-blur">
            <label htmlFor="age-slider-lg" className="technical-label block uppercase">
              INPUT — AGE
            </label>
            <div className="mt-3 flex items-center gap-3">
              <input
                id="age-slider-lg"
                type="range"
                min={8}
                max={30}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-accent-400"
                aria-valuetext={`Age ${age}`}
              />
              <span className="w-10 font-mono text-xl text-accent-400 tabular-nums">
                {age}
              </span>
            </div>
            <p className="mt-3 font-mono text-[0.625rem] leading-relaxed text-ink-600">
              SYSTEM / LOGIC ENGINE
              <br />
              STATUS / <span className="text-success">RUNNING</span>
            </p>
          </div>
        </div>
      </div>
    </StickyLogicShowcase>
  )
}