import { motion, useReducedMotion } from 'motion/react'
import { SectionNumber } from '../ui/SectionNumber'
import { ScrollReveal } from '../ui/ScrollReveal'
import { cn } from '../../utils/cn'

interface FlowStepProps {
  label: string
  sub: string
  order: string
  delay: number
  accent: string
}

function FlowStep({ label, sub, order, delay, accent }: FlowStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex w-full flex-1 items-center justify-center rounded-lg border border-lab-600 bg-lab-800/90 px-5 py-7 text-center shadow-panel transition-all duration-300 hover:border-accent-400/50"
    >
      <span className="absolute top-3 right-4 font-mono text-[0.6875rem] text-ink-700">
        {order}
      </span>
      <div>
        <p className="font-mono text-[0.625rem] tracking-[0.2em] text-current uppercase" style={{ color: accent }}>
          {label}
        </p>
        <h3 className={cn('mt-2 font-display text-xl font-medium tracking-tight text-ink-100 md:text-2xl')}>
          {label.charAt(0) + label.slice(1).toLowerCase()}
        </h3>
        <p className="mt-1.5 text-sm text-ink-500">{sub}</p>
      </div>
    </motion.div>
  )
}

const STEP_ACCENTS = {
  input: 'var(--color-accent-400)',
  condition: 'var(--color-warning)',
  process: 'var(--color-accent-300)',
  output: 'var(--color-success)',
}

export function WhatIsLogic() {
  const reduce = useReducedMotion()

  return (
    <section id="why-logic" className="relative overflow-hidden py-32 lg:py-40">
      <div
        aria-hidden
        className="absolute right-0 top-1/4 h-[40vh] w-[40vw] rounded-full bg-accent-700/5 blur-[100px]"
      />

      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <ScrollReveal>
          <SectionNumber index="01 / 06" label="How Computers Think" />
        </ScrollReveal>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <ScrollReveal delay={0.05}>
            <h2 className="display-hero text-[clamp(2rem,4.5vw,3.5rem)]">
              Computers don't guess.
              <br />
              <span className="text-ink-500">They follow logic.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <p className="max-w-md text-ink-500">
              Every program begins with a sequence of decisions, operations, and
              rules. Empat langkah yang sama berulang di setiap program — apa pun
              bahasanya.
            </p>
          </ScrollReveal>
        </div>

        {/* Desktop flow */}
        <div className="mt-20 hidden gap-3 lg:flex">
          <FlowStep
            label="INPUT"
            sub="Data masuk"
            order="01"
            delay={0}
            accent={STEP_ACCENTS.input}
          />
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex items-center font-mono text-2xl text-accent-400"
          >
            ↓
          </motion.div>
          <FlowStep
            label="CONDITION"
            sub="Dunia diperiksa"
            order="02"
            delay={0.1}
            accent={STEP_ACCENTS.condition}
          />
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="flex items-center font-mono text-2xl text-accent-400"
          >
            ↓
          </motion.div>
          <FlowStep
            label="PROCESS"
            sub="Aksi diputuskan"
            order="03"
            delay={0.2}
            accent={STEP_ACCENTS.process}
          />
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="flex items-center font-mono text-2xl text-accent-400"
          >
            ↓
          </motion.div>
          <FlowStep
            label="OUTPUT"
            sub="Hasil tampil"
            order="04"
            delay={0.3}
            accent={STEP_ACCENTS.output}
          />
        </div>

        {/* Mobile stacked flow */}
        <div
          className="mt-16 flex flex-col items-center gap-6 lg:hidden"
          style={{ gap: reduce ? '1.5rem' : undefined }}
        >
          <FlowStep label="INPUT" sub="Data masuk" order="01" delay={0} accent={STEP_ACCENTS.input} />
          <span className="font-mono text-xl text-accent-400">↓</span>
          <FlowStep label="CONDITION" sub="Dunia diperiksa" order="02" delay={0.1} accent={STEP_ACCENTS.condition} />
          <span className="font-mono text-xl text-accent-400">↓</span>
          <FlowStep label="PROCESS" sub="Aksi diputuskan" order="03" delay={0.2} accent={STEP_ACCENTS.process} />
          <span className="font-mono text-xl text-accent-400">↓</span>
          <FlowStep label="OUTPUT" sub="Hasil tampil" order="04" delay={0.3} accent={STEP_ACCENTS.output} />
        </div>

        <ScrollReveal delay={0.2} className="mt-20">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-lab-800 pt-8 text-sm text-ink-600">
            <span className="technical-label">THE STORY OF EVERY PROGRAM</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              Decide
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Evaluate
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              Repeat
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-error" />
              Output
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}