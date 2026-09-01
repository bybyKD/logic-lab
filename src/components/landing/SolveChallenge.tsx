import { useState } from 'react'
import { CodeBlock } from '../ui/CodeBlock'
import { SectionNumber } from '../ui/SectionNumber'
import { ScrollReveal } from '../ui/ScrollReveal'
import { ChoiceCard } from '../challenge/ChoiceCard'
import { ScrollToChallenge } from '../challenge/ScrollToChallenge'

const SNIPPET = `x = 5
y = 2

if x > y:
    x = x + 3

print(x)`

const ANSWER = '8'
const OPTIONS = [
  ['A', '5'],
  ['B', '7'],
  ['C', '8'],
  ['D', 'Error'],
] as const

export function SolveChallenge() {
  const [selected, setSelected] = useState<string | null>(null)
  const answered = selected !== null
  const correct = selected === ANSWER

  return (
    <section className="relative overflow-hidden py-28 lg:py-36">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 lg:grid-cols-2 lg:items-center lg:px-12">
        <ScrollReveal>
          <SectionNumber index="06 / 06" label="Challenge" />
          <h2 className="mt-6 display-hero text-[clamp(1.9rem,4vw,3.1rem)]">
            Can you predict
            <br />
            what happens <span className="text-ink-500">next?</span>
          </h2>
          <p className="mt-5 max-w-md text-ink-500">
            Sebelum menekan tombol apa pun, coba pikirkan: apa output program
            ini? Inilah inti latihan logika.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-lab-700 px-5 py-3">
              <p className="technical-label">CHALLENGE / PREDICT</p>
              <span className="font-mono text-[0.625rem] text-ink-600">#LOG-007</span>
            </div>
            <CodeBlock code={SNIPPET} language="python" maxHeight="260px" />

            <div className="border-t border-lab-700 p-6">
              <p className="font-display text-lg text-ink-100">
                What will this program output?
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {OPTIONS.map(([letter, text]) => (
                  <ChoiceCard
                    key={letter}
                    letter={letter}
                    text={text}
                    state={
                      answered
                        ? text === ANSWER
                          ? 'correct'
                          : selected === text
                            ? 'wrong'
                            : 'idle'
                        : 'idle'
                    }
                    disabled={answered}
                    onClick={() => setSelected(text)}
                  />
                ))}
              </div>

              <div className="mt-6 min-h-[52px]">
                {correct && (
                  <p className="flex items-center gap-2 rounded border border-success/30 bg-success/5 px-4 py-3 font-mono text-sm text-success">
                    ✓ Correct. Karena 5 &gt; 2, maka x = 5 + 3 = 8.
                  </p>
                )}
                {answered && !correct && (
                  <p className="flex items-center gap-2 rounded border border-warning/40 bg-warning/5 px-4 py-3 font-mono text-sm text-warning">
                    Not quite. Let's trace the logic — kondisi TRUE sehingga x
                    bertambah menjadi 8.
                  </p>
                )}
              </div>

              {answered && (
                <div className="mt-4">
                  <ScrollToChallenge label="Coba tantangan lain" />
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}