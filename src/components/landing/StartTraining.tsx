import { GlowButton } from '../ui/GlowButton'
import { ScrollReveal } from '../ui/ScrollReveal'

export function StartTraining() {
  return (
    <section id="about" className="relative overflow-hidden py-32 lg:py-44">
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-[50vh] w-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-700/10 blur-[120px]"
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <ScrollReveal>
          <p className="technical-label mb-6 flex items-center justify-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
            LABORATORIUM INFORMATIKA
          </p>
          <h2 className="display-hero text-[clamp(2.4rem,6vw,4.8rem)]">
            ONE PROBLEM.
            <br />
            <span className="text-accent-400">ONE LOGIC.</span>
            <br />
            MANY WAYS TO CODE IT.
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-lg text-ink-500">
            Python. Java. Go. C.
            <br />
            Pelajari cara berpikir — dan kode itu akan mengikuti.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <GlowButton href="/dashboard" variant="primary" size="lg">
              Start Training
            </GlowButton>
            <GlowButton href="/admin" variant="secondary" size="lg">
              Admin View
            </GlowButton>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}