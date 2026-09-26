import { useState } from 'react'
import { CodeEditor } from '../../../components/code/CodeEditor'
import { getExecutionService, type ExecutionResult } from '../../../services/execution'
import type { CodeLabActivity, TestOutcome } from '../../../domain'
import type { LanguageId } from '../../../data/languages'
import { cn } from '../../../utils/cn'
import { scoreCodeLab, type RunnerAnswer } from './attemptScoring'

export interface RunnerProps {
  activity: CodeLabActivity
  /** True once this attempt is recorded, so the answer is no longer being chosen. */
  locked: boolean
  submitting: boolean
  onSubmit: (params: { answer: RunnerAnswer; score: number | null; pickedLabel: string | null }) => void
  /**
   * Reports the outcomes of the last run so the screen can render the per-case
   * panel. The editor keeps the full `ExecutionResult` for its own output pane;
   * only the outcomes are needed outside, so only those are lifted.
   */
  onOutcomesChange?: (outcomes: TestOutcome[] | null) => void
}

/**
 * A code lab: write code, run it, submit it.
 *
 * The language switcher is constrained to the activity's own `languages` rather
 * than showing all four, because offering a language the activity does not accept
 * would let a learner submit Java to a Python lab and be graded against Python's
 * expected output.
 */
export function CodeLabRunner({
  activity,
  locked,
  submitting,
  onSubmit,
  onOutcomesChange,
}: RunnerProps) {
  // A draft per language, so switching does not throw away work. Resetting to
  // `starterCode` on every switch would be a small act of vandalism.
  const [drafts, setDrafts] = useState<Partial<Record<LanguageId, string>>>(() => ({
    ...activity.starterCode,
  }))
  const [language, setLanguage] = useState<LanguageId>(activity.languages[0])
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [running, setRunning] = useState(false)

  const code = drafts[language] ?? ''

  const run = async () => {
    setRunning(true)
    try {
      const next = await getExecutionService().run({
        language,
        code,
        // The full case list, hidden ones included: the runner needs them to score
        // honestly, and masking is a rendering decision, not a data one.
        testCases: activity.testCases,
      })
      setResult(next)
      onOutcomesChange?.(next.testOutcomes)
    } finally {
      setRunning(false)
    }
  }

  const score = result ? scoreCodeLab(result.testOutcomes) : null

  return (
    <div className="space-y-5">
      <CodeEditor
        language={language}
        onLanguageChange={(next) => {
          setLanguage(next)
          // A different language is a different program; its result no longer
          // describes what is on screen.
          setResult(null)
          onOutcomesChange?.(null)
        }}
        allowedLanguages={activity.languages}
        value={code}
        onChange={(value) => setDrafts((d) => ({ ...d, [language]: value }))}
        onRun={run}
        onReset={() => {
          setDrafts((d) => ({ ...d, [language]: activity.starterCode[language] ?? '' }))
          setResult(null)
          onOutcomesChange?.(null)
        }}
        result={result}
        running={running}
        height="340px"
        readOnly={locked}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            onSubmit({
              answer: { language, code, outcomes: result?.testOutcomes ?? [] },
              score,
              pickedLabel: null,
            })
          }
          disabled={locked || submitting || result === null || running}
          className={cn(
            'rounded-pill bg-accent-400 px-6 py-2.5 font-mono text-sm font-medium text-lab-950 transition-all',
            'enabled:hover:bg-accent-300 disabled:cursor-not-allowed disabled:opacity-40',
            'focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none',
          )}
        >
          {submitting ? 'Submitting…' : 'Submit this attempt'}
        </button>
        {result === null && !locked && (
          <p className="font-mono text-xs text-ink-600">
            Run your code first — submitting an unrun attempt would record a result
            nobody has seen.
          </p>
        )}
      </div>
    </div>
  )
}
