import { useCallback, useMemo, useState } from 'react'
import { ChoiceCard } from '../../../components/challenge/ChoiceCard'
import { AlgorithmBuilder, type AlgorithmStep } from '../../../components/challenge/AlgorithmBuilder'
import { CodeBlock } from '../../../components/ui/CodeBlock'
import type { LanguageId } from '../../../data/languages'
import type { ChallengeActivity } from '../../../domain'
import { cn } from '../../../utils/cn'
import { scoreChallenge } from './attemptScoring'
import type { OutcomeReveal } from './outcomeMasking'
import type { RunnerAnswer } from './attemptScoring'

/**
 * Every challenge variant in one component.
 *
 * They differ only in how an answer is collected, so splitting them into four
 * files would duplicate the submit path, the locked state and the feedback slot
 * four times over. The variant decides the input; everything after it is shared.
 */
export function ChallengeRunner({
  activity,
  reveal,
  locked,
  submitting,
  onSubmit,
}: {
  activity: ChallengeActivity
  /** Controls whether the correct answer may be marked yet. */
  reveal: OutcomeReveal
  locked: boolean
  submitting: boolean
  onSubmit: (params: {
    answer: RunnerAnswer
    score: number | null
    pickedLabel: string | null
  }) => void
}) {
  const [choiceId, setChoiceId] = useState<string | undefined>(undefined)
  const [sequence, setSequence] = useState<string[] | undefined>(undefined)
  // The ordering builder starts scrambled, so the learner's order has to be
  // captured before it can be scored — but only once every step is placed.
  const complete = sequence !== undefined && sequence.length === activity.choices.length

  const answer: RunnerAnswer = { choiceId, sequence }
  const score = scoreChallenge(activity, answer)
  const answered = activity.challengeType === 'algorithm' ? complete : choiceId !== undefined

  const chosen = activity.choices.find((c) => c.id === choiceId)
  // Memoised so the builder's `steps` prop keeps a stable identity between
  // renders; a fresh array each render would reset the puzzle underneath the
  // learner's hands.
  const steps = useMemo<AlgorithmStep[]>(
    () =>
      activity.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        detail: choice.text,
      })),
    [activity.choices],
  )
  const handleSequence = useCallback((next: readonly string[]) => {
    setSequence([...next])
  }, [])

  // The solution and the scramble must keep a stable identity too. The builder
  // treats a changed pool as a new puzzle and resets itself, so an array rebuilt
  // on every render would erase the learner's order as fast as they build it.
  const solutionIds = useMemo(() => activity.choices.map((c) => c.id), [activity.choices])
  const scrambled = useMemo(
    // A deterministic scramble: reversing the answer is too easy to spot, and a
    // random one would reshuffle on every render.
    () => [...solutionIds.slice(2), ...solutionIds.slice(0, 2)],
    [solutionIds],
  )

  // Shown for `predict` and `debug`, where the code is part of the question.
  const snippetLanguage = Object.keys(activity.snippet)[0] as LanguageId | undefined
  const snippet = snippetLanguage ? activity.snippet[snippetLanguage] : undefined
  // Only after the attempt is graded does the real line get marked; before that
  // the highlight would give the answer away.
  const graded = reveal === 'full'
  const highlight = graded && activity.faultyLine ? [activity.faultyLine] : []

  const submitButton = (
    <button
      type="button"
      onClick={() => onSubmit({ answer, score, pickedLabel: chosen?.label ?? null })}
      disabled={locked || submitting || !answered}
      className={cn(
        'rounded-pill bg-accent-400 px-6 py-2.5 font-mono text-sm font-medium text-lab-950 transition-all',
        'enabled:hover:bg-accent-300 disabled:cursor-not-allowed disabled:opacity-40',
        'focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none',
      )}
    >
      {submitting ? 'Submitting…' : 'Submit this attempt'}
    </button>
  )

  if (activity.challengeType === 'algorithm') {
    return (
      <div className="space-y-5">
        <AlgorithmBuilder
          variant="embedded"
          steps={steps}
          solution={solutionIds}
          initialPool={scrambled}
          onSequenceChange={handleSequence}
          locked={locked}
        />
        {submitButton}
        {!complete && sequence !== undefined && (
          <p className="font-mono text-xs text-ink-600">
            Place all {activity.choices.length} steps before submitting.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {snippet && (
        <CodeBlock
          code={snippet}
          language={snippetLanguage}
          highlight={highlight}
          className="rounded-lg border border-lab-700"
        />
      )}

      {activity.challengeType === 'debug' && !graded && (
        <p className="font-mono text-xs text-ink-600">
          One of these lines is the bug. Pick it, then read what the explanation says.
        </p>
      )}

      <div className="grid gap-2.5">
        {activity.choices.map((choice) => {
          const isCorrect = choice.id === activity.correctChoiceId
          const isPicked = choice.id === choiceId
          return (
            <ChoiceCard
              key={choice.id}
              letter={choice.label}
              text={choice.text}
              // Before submitting nothing is marked, or the list would be the answer.
              state={
                !answered
                  ? 'idle'
                  : isCorrect
                    ? 'correct'
                    : isPicked
                      ? 'wrong'
                      : 'idle'
              }
              disabled={locked}
              onClick={() => setChoiceId(choice.id)}
            />
          )
        })}
      </div>

      {submitButton}
    </div>
  )
}
