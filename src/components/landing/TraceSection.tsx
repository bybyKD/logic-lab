import { CodeTrace } from '../code/CodeTrace'
import { SectionNumber } from '../ui/SectionNumber'
import { ScrollReveal } from '../ui/ScrollReveal'

export function TraceSection() {
  return (
    <section className="relative overflow-hidden bg-lab-900/40 py-28 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-12">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <ScrollReveal className="max-w-2xl">
            <SectionNumber index="05 / 06" label="Debugger View" />
            <h2 className="mt-6 display-hero text-[clamp(2rem,4.5vw,3.4rem)]">
              Don't just run the code.
              <br />
              <span className="text-ink-500">Trace it.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1} className="max-w-sm">
            <p className="text-ink-500">
              Step demi step seperti debugger. Lihat bagaimana variabel berubah
              setiap instruksi dieksekusi.
            </p>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.12} className="mt-14">
          <CodeTrace />
        </ScrollReveal>
      </div>
    </section>
  )
}