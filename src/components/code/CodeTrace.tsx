import { useState } from 'react'
import { simulateCode, type TraceStep } from '../../utils/codeSimulator'
import { cn } from '../../utils/cn'
import { ExecutionTimeline } from './ExecutionTimeline'

const TRACE_CODE = `x = 0

for i in range(5):
    x += i

print(x)`

/**
 * Interactive step-through trace of a small loop program.
 * Acts like a debugger: highlights the current line, shows variables,
 * iteration, and output.
 */
export function CodeTrace() {
  const [stepIndex, setStepIndex] = useState(0)

  // Generate full trace once
  const result = simulateCode('python', TRACE_CODE)
  const trace: TraceStep[] = result?.trace ?? []
  const total = trace.length

  const step = trace[stepIndex]
  const canPrev = stepIndex > 0
  const canNext = stepIndex < total - 1
  const finished = stepIndex === total - 1

  const lines = TRACE_CODE.split('\n')

  const goNext = () => {
    if (canNext) setStepIndex((i) => i + 1)
  }
  const goPrev = () => {
    if (canPrev) setStepIndex((i) => i - 1)
  }

  const runAll = () => setStepIndex(total - 1)

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      {/* Code panel with live highlight */}
      <div className="overflow-hidden rounded-lg border border-lab-700 bg-lab-900 shadow-panel">
        <div className="flex items-center justify-between border-b border-lab-700 bg-lab-850 px-4 py-2.5">
          <p className="technical-label">SOURCE — trace.py</p>
          <span className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-lab-600" />
            <span className="h-2 w-2 rounded-full bg-lab-600" />
            <span className="h-2 w-2 rounded-full bg-lab-600" />
          </span>
        </div>
        <div className="p-4 font-mono text-[0.8125rem] leading-6">
          {lines.map((line, i) => {
            const isActive = step?.line === i + 1
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center whitespace-pre rounded px-2 transition-colors duration-300',
                  isActive && line.trim() && 'bg-accent-900/50 text-accent-300',
                )}
              >
                <span className="w-7 shrink-0 text-right text-lab-500">{i + 1}</span>
                <span className={cn('ml-4 flex-1', isActive ? 'text-accent-300' : step && i < step.line ? 'text-ink-200' : 'text-ink-600')}>
                  {line}
                </span>
                {isActive && (
                  <span className="ml-2 text-accent-400" aria-hidden>
                    ◆
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Inspector panel */}
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-lab-700 bg-lab-850 p-5">
          <p className="technical-label mb-2">CURRENT LINE</p>
          <p className="font-mono text-sm text-accent-400">
            {step ? step.code : '—'}
          </p>
          {step?.iteration && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-pill border border-warning/40 bg-warning/10 px-3 py-1 font-mono text-xs text-warning">
              Iteration {step.iteration}
            </p>
          )}
        </div>

        {/* Memory panel */}
        <div className="rounded-lg border border-lab-700 bg-lab-850 p-5">
          <div className="flex items-center justify-between">
            <p className="technical-label">MEMORY / VARIABLES</p>
            {step?.output && (
              <span className="font-mono text-[0.625rem] text-success">
                OUTPUT: {step.output}
              </span>
            )}
          </div>
          <div className="mt-3 space-y-2">
            {Object.entries(step?.variables ?? {}).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded border border-lab-700 bg-lab-900 px-3 py-2 font-mono text-sm"
              >
                <span className="text-ink-500">{key}</span>
                <span className="text-ink-100">{String(val)}</span>
                <span className="flex gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                </span>
              </div>
            ))}
            {Object.keys(step?.variables ?? {}).length === 0 && (
              <p className="font-mono text-xs text-ink-600">Belum ada variabel.</p>
            )}
          </div>
        </div>

        {/* Execution timeline */}
        <div className="rounded-lg border border-lab-700 bg-lab-850 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="technical-label">EXECUTION TIMELINE</p>
            <span className="font-mono text-[0.625rem] text-ink-600">
              STEP {stepIndex + 1}/{Math.max(total, 1)}
            </span>
          </div>
          <ExecutionTimeline steps={Math.max(total, 1)} current={stepIndex} />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canPrev}
            className="rounded-pill border border-lab-600 px-5 py-2 font-mono text-xs text-ink-300 transition-colors enabled:hover:border-accent-400/60 enabled:hover:text-accent-300 disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!canNext}
            className="rounded-pill bg-accent-400 px-5 py-2 font-mono text-xs font-medium text-lab-950 transition-all enabled:hover:bg-accent-300 disabled:opacity-40"
          >
            Step →
          </button>
          <button
            type="button"
            onClick={runAll}
            className="rounded-pill px-3 py-2 font-mono text-xs text-ink-500 transition-colors hover:text-ink-200"
          >
            Run to end ⏭
          </button>
          <span className="ml-auto font-mono text-xs text-ink-600">
            {stepIndex + 1} / {Math.max(total, 1)}
          </span>
        </div>

        {/* Step logic note */}
        {step?.note && (
          <p className="rounded border border-lab-700 bg-lab-900/60 px-4 py-3 text-xs leading-relaxed text-ink-500">
            <span className="font-mono text-accent-400">// </span>
            {step.note}
          </p>
        )}

        {finished && step?.output !== undefined && (
          <p className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 font-mono text-sm text-success">
            → Program selesai. Output: <strong>{step.output}</strong>
          </p>
        )}
      </div>
    </div>
  )
}