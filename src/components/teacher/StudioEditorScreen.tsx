import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AsyncBoundary, EmptyPanel, ErrorPanel, useAsync } from '../ui/AsyncBoundary'
import { courseRepository } from '../../services/repositories'
import { LANGUAGES, LANGUAGE_ORDER } from '../../data/languages'
import { SKILLS } from '../../data/seed'
import { cn } from '../../utils/cn'
import {
  canPublish,
  validateActivityDraft,
  type DraftContext,
  type DraftIssue,
} from '../../services/assessment/activityDraft'
import { GhostButton, KindBadge, PageHeader, StatusPill, TeacherShell } from './TeacherPage'
import {
  CheckboxGroup,
  NumberField,
  SelectField,
  TextArea,
  TextField,
} from './StudioFields'
import type {
  Activity,
  AssignmentActivity,
  CodeLabActivity,
  Difficulty,
  Hint,
  Rubric,
  TestCase,
} from '../../domain'

const DIFFICULTY_OPTIONS: readonly { value: Difficulty; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const LANGUAGE_OPTIONS = LANGUAGE_ORDER.map((id) => ({
  value: id as string,
  label: LANGUAGES[id].name,
  sublabel: id,
}))

const SKILL_OPTIONS = SKILLS.map((skill) => ({
  value: skill.id,
  label: skill.name,
  sublabel: skill.id,
}))

const draftContext: DraftContext = {
  knownSkillIds: new Set(SKILLS.map((s) => s.id)),
  knownLanguageIds: new Set<string>(LANGUAGE_ORDER),
}

/** Kinds whose editor shows the language / test-case / hint block. */
const RUNNABLE: ReadonlySet<Activity['kind']> = new Set<Activity['kind']>(['codeLab', 'assignment'])

/**
 * `/teacher/studio/:activityId` — the Content Studio.
 *
 * The form holds a local copy and only writes on an explicit save, so a teacher
 * can walk away mid-edit without half-applying a change to the course. Every
 * keystroke re-validates, which is why publishing can be gated on the same
 * validator here and in the course builder.
 */
export function StudioEditorScreen() {
  const { activityId } = useParams<{ activityId: string }>()

  const state = useAsync(async () => {
    if (!activityId) throw new Error('missing activity id')
    return courseRepository.getActivity(activityId)
  }, [activityId])

  return (
    <AsyncBoundary
      state={state}
      errorMessage="This activity could not be loaded. It may have been renamed, or the id is wrong."
    >
      {(activity) => <EditorBody activity={activity} />}
    </AsyncBoundary>
  )
}

function EditorBody({ activity }: { activity: Activity }) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<Activity>(activity)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  const issues = useMemo(
    () => validateActivityDraft(activity, draft, draftContext),
    [activity, draft],
  )
  const errors = issues.filter((i) => i.severity === 'error')
  const publishable = canPublish(issues)
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(activity),
    [draft, activity],
  )

  /** Patch the base fields, keeping the kind-specific payload intact. */
  const patch = useCallback((changes: Partial<Activity>) => {
    setDraft((current) => ({ ...current, ...changes }) as Activity)
    setSaveState('idle')
  }, [])

  const save = async (publish?: boolean) => {
    setSaveState('saving')
    setSaveError(null)
    try {
      const toSave: Activity = publish
        ? ({ ...draft, status: 'published' } as Activity)
        : draft
      await courseRepository.saveActivity(toSave)
      setSaveState('saved')
      setDraft(toSave)
    } catch {
      setSaveState('error')
      setSaveError(
        'The activity could not be saved. Local storage may be full or blocked in this browser.',
      )
    }
  }

  const revert = () => {
    setDraft(activity)
    setSaveState('idle')
    setSaveError(null)
  }

  return (
    <TeacherShell>
      <PageHeader
        eyebrow="CONTENT STUDIO"
        title={draft.title || 'Untitled activity'}
        description="Instructions, code, tests, hints, skills and rubric. Saved into this browser over the seeded course."
        meta={`${activity.id} · section ${draft.sectionId} · order ${draft.order}`}
        actions={
          <>
            <GhostButton onClick={() => navigate('/teacher/studio')}>Back to studio</GhostButton>
            <GhostButton onClick={revert} disabled={!dirty || saveState === 'saving'}>
              Revert
            </GhostButton>
            <GhostButton
              onClick={() => save()}
              disabled={!dirty || saveState === 'saving' || errors.length > 0}
            >
              {saveState === 'saving' ? 'Saving…' : 'Save draft'}
            </GhostButton>
            <button
              type="button"
              onClick={() => save(true)}
              disabled={
                saveState === 'saving' || !publishable || (dirty === false && draft.status === 'published')
              }
              className="rounded-pill border border-accent-400/50 bg-accent-400/10 px-4 py-2 font-mono text-xs text-accent-300 transition-colors hover:bg-accent-400/20 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {draft.status === 'published' ? 'Published — re-publish' : 'Publish'}
            </button>
          </>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <KindBadge kind={draft.kind} />
        <StatusPill status={draft.status} />
        {dirty && (
          <span className="font-mono text-[0.5625rem] tracking-widest text-warning uppercase">
            unsaved changes
          </span>
        )}
        {saveState === 'saved' && (
          <span className="font-mono text-[0.5625rem] tracking-widest text-success uppercase">
            saved
          </span>
        )}
      </div>

      <IssuePanel issues={issues} errorCount={errors.length} />

      <div className="mt-8 grid gap-6 [&>*]:min-w-0 xl:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <BasicsCard draft={draft} issues={issues} onPatch={patch} />
          {RUNNABLE.has(draft.kind) && (
            <RunnableCards draft={draft} issues={issues} onChange={setDraft} />
          )}
          <RubricCard draft={draft} issues={issues} onChange={setDraft} />
        </div>
        <div className="flex flex-col gap-6">
          <SetupCard draft={draft} issues={issues} onPatch={patch} />
        </div>
      </div>

      {saveError && (
        <div className="mt-6">
          <ErrorPanel message={saveError} />
        </div>
      )}
    </TeacherShell>
  )
}

function IssuePanel({ issues, errorCount }: { issues: DraftIssue[]; errorCount: number }) {
  if (issues.length === 0) {
    return (
      <p className="mt-6 rounded-pill border border-success/30 bg-success/5 px-4 py-2 text-sm text-success">
        No validation problems. This activity is ready to publish.
      </p>
    )
  }

  return (
    <div
      className={cn(
        'mt-6 rounded-pill border px-4 py-3',
        errorCount > 0 ? 'border-error/30 bg-error/5' : 'border-warning/30 bg-warning/5',
      )}
    >
      <p
        className={cn(
          'font-mono text-[0.625rem] tracking-widest uppercase',
          errorCount > 0 ? 'text-error' : 'text-warning',
        )}
      >
        {errorCount} {errorCount === 1 ? 'problem' : 'problems'} blocking publish
      </p>
      <ul className="mt-2 flex flex-col gap-1">
        {issues.map((issue, index) => (
          <li key={`${issue.field}-${index}`} className="text-sm text-ink-300">
            <span className="font-mono text-[0.625rem] text-ink-600">{issue.field}</span>{' '}
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  )
}

function errorFor(issues: DraftIssue[], field: string): string | undefined {
  return issues.find((i) => i.field === field && i.severity === 'error')?.message
}

function BasicsCard({
  draft,
  issues,
  onPatch,
}: {
  draft: Activity
  issues: DraftIssue[]
  onPatch: (changes: Partial<Activity>) => void
}) {
  return (
    <section aria-labelledby="basics" className="panel p-6">
      <h2 id="basics" className="font-display text-lg text-ink-100">
        Instructions
      </h2>
      <div className="mt-4 flex flex-col gap-4">
        <TextField
          label="Title"
          value={draft.title}
          onChange={(title) => onPatch({ title })}
          error={errorFor(issues, 'title')}
        />
        <TextField
          label="Learning objective"
          hint="One sentence: what the learner can do afterwards."
          value={draft.objective}
          onChange={(objective) => onPatch({ objective })}
          error={errorFor(issues, 'objective')}
        />
        <TextArea
          label="Instructions"
          rows={6}
          value={draft.instructions}
          onChange={(instructions) => onPatch({ instructions })}
          error={errorFor(issues, 'instructions')}
        />
      </div>
    </section>
  )
}

function SetupCard({
  draft,
  issues,
  onPatch,
}: {
  draft: Activity
  issues: DraftIssue[]
  onPatch: (changes: Partial<Activity>) => void
}) {
  return (
    <section aria-labelledby="setup" className="panel p-6">
      <h2 id="setup" className="font-display text-lg text-ink-100">
        Setup
      </h2>
      <div className="mt-4 flex flex-col gap-4">
        <SelectField
          label="Difficulty"
          value={draft.difficulty}
          onChange={(difficulty) => onPatch({ difficulty })}
          options={DIFFICULTY_OPTIONS}
        />
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="Time estimate (min)"
            value={draft.estimatedMinutes}
            onChange={(estimatedMinutes) => onPatch({ estimatedMinutes })}
            error={errorFor(issues, 'estimatedMinutes')}
          />
          <NumberField
            label="Points"
            value={draft.points}
            onChange={(points) => onPatch({ points })}
            hint={GRADED_KINDS.has(draft.kind) ? '0 is allowed but discouraged.' : 'Read-only activities are worth 0.'}
            error={errorFor(issues, 'points')}
          />
        </div>
        <div>
          <p className="font-mono text-[0.625rem] tracking-widest text-ink-500 uppercase">Kind</p>
          <p className="mt-1.5 text-sm text-ink-300">
            {draft.kind} — changing the kind of an activity with attempts would invalidate existing
            submissions, so it is fixed once a class has run it.
          </p>
        </div>
        <CheckboxGroup
          label="Related skills"
          hint="Mastery is attributed to whatever is ticked here."
          options={SKILL_OPTIONS}
          selected={new Set(draft.skillIds)}
          invalid={Boolean(errorFor(issues, 'skillIds'))}
          onToggle={(skillId, next) =>
            onPatch({
              skillIds: next
                ? [...draft.skillIds, skillId]
                : draft.skillIds.filter((id) => id !== skillId),
            })
          }
        />
        {errorFor(issues, 'skillIds') && (
          <p className="text-xs text-error">{errorFor(issues, 'skillIds')}</p>
        )}

        {RUNNABLE.has(draft.kind) && (
          <LanguagePicker draft={draft} issues={issues} onPatch={onPatch} />
        )}

        <p className="border-t border-lab-700 pt-4 text-xs text-ink-600">
          Editing <code className="font-mono">{draft.id}</code> in section{' '}
          <code className="font-mono">{draft.sectionId}</code>. Ids are never reassigned, so links
          from a class roster keep working.
        </p>
      </div>
    </section>
  )
}

const GRADED_KINDS: ReadonlySet<Activity['kind']> = new Set<Activity['kind']>([
  'codeLab',
  'challenge',
  'quiz',
  'assignment',
  'project',
])

function LanguagePicker({
  draft,
  issues,
  onPatch,
}: {
  draft: Activity
  issues: DraftIssue[]
  onPatch: (changes: Partial<Activity>) => void
}) {
  const runnable = draft as CodeLabActivity | AssignmentActivity
  const selected = new Set(runnable.languages)

  return (
    <CheckboxGroup
      label="Allowed languages"
      hint="Only languages the execution service supports can be ticked."
      options={LANGUAGE_OPTIONS}
      selected={selected}
      invalid={Boolean(errorFor(issues, 'languages'))}
      onToggle={(language, next) => {
        const languages = next
          ? [...runnable.languages, language as CodeLabActivity['languages'][number]]
          : runnable.languages.filter((id) => id !== language)
        onPatch({ languages } as Partial<Activity>)
      }}
    />
  )
}

function RunnableCards({
  draft,
  issues,
  onChange,
}: {
  draft: Activity
  issues: DraftIssue[]
  onChange: (draft: Activity) => void
}) {
  const runnable = draft as CodeLabActivity | AssignmentActivity

  return (
    <>
      <StarterCodeCard runnable={runnable} issues={issues} onChange={onChange} />
      <TestCasesCard runnable={runnable} issues={issues} onChange={onChange} />
      <HintsCard runnable={runnable} issues={issues} onChange={onChange} />
      {runnable.kind === 'assignment' && (
        <p className="text-xs text-ink-600">
          Assignments are graded by a teacher from the submission, so the test cases here are
          guidance for the learner rather than an automatic score.
        </p>
      )}
    </>
  )
}

function StarterCodeCard({
  runnable,
  issues,
  onChange,
}: {
  runnable: CodeLabActivity | AssignmentActivity
  issues: DraftIssue[]
  onChange: (draft: Activity) => void
}) {
  return (
    <section aria-labelledby="starter" className="panel p-6">
      <h2 id="starter" className="font-display text-lg text-ink-100">
        Starter code
      </h2>
      <p className="mt-2 text-sm text-ink-500">
        One box per allowed language. A language with no starter code fails validation.
      </p>
      <div className="mt-4 flex flex-col gap-4">
        {runnable.languages.length === 0 && (
          <EmptyPanel message="Tick an allowed language first — the starter code follows from it." />
        )}
        {runnable.languages.map((language) => (
          <TextArea
            key={language}
            label={LANGUAGES[language].name}
            mono
            rows={6}
            value={runnable.starterCode[language] ?? ''}
            error={errorFor(issues, 'starterCode')}
            onChange={(code) =>
              onChange({
                ...runnable,
                starterCode: { ...runnable.starterCode, [language]: code },
              } as Activity)
            }
          />
        ))}
      </div>
    </section>
  )
}

function TestCasesCard({
  runnable,
  issues,
  onChange,
}: {
  runnable: CodeLabActivity | AssignmentActivity
  issues: DraftIssue[]
  onChange: (draft: Activity) => void
}) {
  const hidden = runnable.testCases.filter((t) => t.hidden).length

  const update = (index: number, changes: Partial<TestCase>) => {
    const testCases = runnable.testCases.map((testCase, i) =>
      i === index ? { ...testCase, ...changes } : testCase,
    )
    onChange({ ...runnable, testCases } as Activity)
  }

  return (
    <section aria-labelledby="tests" className="panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="tests" className="font-display text-lg text-ink-100">
          Test cases
        </h2>
        <p className="font-mono text-[0.625rem] text-ink-600">
          {runnable.testCases.length} total · {hidden} hidden
        </p>
      </div>
      <p className="mt-2 text-sm text-ink-500">
        Hidden cases are withheld from the learner until grading, so a program cannot be written to
        match only the visible ones.
      </p>
      {errorFor(issues, 'testCases') && (
        <p className="mt-2 text-xs text-error">{errorFor(issues, 'testCases')}</p>
      )}

      <ul className="mt-4 flex flex-col gap-4">
        {runnable.testCases.map((testCase, index) => (
          <li key={testCase.id} className="rounded-pill border border-lab-700 bg-lab-850/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[0.625rem] text-ink-600">{testCase.id}</p>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 font-mono text-[0.625rem] text-ink-400">
                  <input
                    type="checkbox"
                    className="accent-accent-400"
                    checked={testCase.hidden}
                    onChange={(e) => update(index, { hidden: e.target.checked })}
                  />
                  hidden
                </label>
                <GhostButton
                  className="px-2.5 py-1 text-[0.625rem] text-error/80 hover:border-error/50 hover:text-error"
                  onClick={() =>
                    onChange({
                      ...runnable,
                      testCases: runnable.testCases.filter((_, i) => i !== index),
                    } as Activity)
                  }
                >
                  Remove
                </GhostButton>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <TextField
                label="Name"
                value={testCase.name}
                onChange={(name) => update(index, { name })}
              />
              <NumberField
                label="Weight"
                value={testCase.weight}
                min={0}
                onChange={(weight) => update(index, { weight })}
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <TextArea
                label="Input"
                rows={2}
                mono
                value={testCase.input ?? ''}
                onChange={(input) => update(index, { input })}
              />
              <TextArea
                label="Expected output"
                rows={2}
                mono
                value={testCase.expectedOutput}
                onChange={(expectedOutput) => update(index, { expectedOutput })}
              />
            </div>
          </li>
        ))}
      </ul>

      <GhostButton
        className="mt-4"
        onClick={() =>
          onChange({
            ...runnable,
            testCases: [
              ...runnable.testCases,
              {
                id: `${runnable.id}-t${runnable.testCases.length + 1}`,
                name: `Case ${runnable.testCases.length + 1}`,
                hidden: runnable.testCases.length > 0,
                expectedOutput: '',
                weight: 1,
              },
            ],
          } as Activity)
        }
      >
        Add test case
      </GhostButton>
    </section>
  )
}

function HintsCard({
  runnable,
  issues,
  onChange,
}: {
  runnable: CodeLabActivity | AssignmentActivity
  issues: DraftIssue[]
  onChange: (draft: Activity) => void
}) {
  const sorted = [...runnable.hints].sort((a, b) => a.order - b.order)

  const update = (index: number, changes: Partial<Hint>) => {
    const hints = sorted.map((hint, i) => (i === index ? { ...hint, ...changes } : hint))
    onChange({ ...runnable, hints } as Activity)
  }

  return (
    <section aria-labelledby="hints" className="panel p-6">
      <h2 id="hints" className="font-display text-lg text-ink-100">
        Hints
      </h2>
      <p className="mt-2 text-sm text-ink-500">
        Revealed in order to a learner who is stuck. Each hint used is recorded as evidence of
        struggle.
      </p>
      {errorFor(issues, 'hints') && (
        <p className="mt-2 text-xs text-error">{errorFor(issues, 'hints')}</p>
      )}

      <ul className="mt-4 flex flex-col gap-3">
        {sorted.map((hint, index) => (
          <li key={hint.id} className="rounded-pill border border-lab-700 bg-lab-850/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[0.625rem] text-ink-600">{hint.id}</p>
              <GhostButton
                className="px-2.5 py-1 text-[0.625rem] text-error/80 hover:border-error/50 hover:text-error"
                onClick={() =>
                  onChange({
                    ...runnable,
                    hints: sorted.filter((_, i) => i !== index),
                  } as Activity)
                }
              >
                Remove
              </GhostButton>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem]">
              <TextArea
                label="Hint"
                rows={2}
                value={hint.text}
                onChange={(text) => update(index, { text })}
              />
              <NumberField
                label="Order"
                value={hint.order}
                min={1}
                onChange={(order) => update(index, { order })}
              />
            </div>
          </li>
        ))}
      </ul>

      <GhostButton
        className="mt-4"
        onClick={() =>
          onChange({
            ...runnable,
            hints: [
              ...runnable.hints,
              {
                id: `${runnable.id}-h${runnable.hints.length + 1}`,
                order: runnable.hints.length + 1,
                text: '',
              },
            ],
          } as Activity)
        }
      >
        Add hint
      </GhostButton>
    </section>
  )
}

function RubricCard({
  draft,
  issues,
  onChange,
}: {
  draft: Activity
  issues: DraftIssue[]
  onChange: (draft: Activity) => void
}) {
  const rubric = draft.rubric
  const total = rubric?.criteria.reduce((sum, c) => sum + c.maxPoints, 0) ?? 0

  const setRubric = (next: Rubric) => onChange({ ...draft, rubric: next } as Activity)

  /**
   * Drops the key rather than setting it to `undefined`: `ProjectActivity` types
   * `rubric` as required, so a project is never offered the remove control and an
   * absent rubric stays absent in the object instead of becoming an explicit
   * `undefined` the type does not allow.
   */
  const removeRubric = () => {
    if (draft.kind === 'project') return
    const { rubric: _removed, ...rest } = draft
    onChange(rest as Activity)
  }

  // A project is defined by its rubric, so the section is not optional there.
  const required = draft.kind === 'project'

  return (
    <section aria-labelledby="rubric" className="panel p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="rubric" className="font-display text-lg text-ink-100">
          Rubric
        </h2>
        {rubric && (
          <p
            className={cn(
              'font-mono text-[0.625rem]',
              total === rubric.maxPoints ? 'text-ink-600' : 'text-error',
            )}
          >
            criteria {total}/{rubric.maxPoints} points
          </p>
        )}
      </div>
      <p className="mt-2 text-sm text-ink-500">
        Optional. A rubric lets a teacher award partial credit on the review screen instead of
        accepting the all-or-nothing test result. Auto-graded activities do not need one.
      </p>
      {issues
        .filter((i) => i.field === 'rubric' && i.severity === 'error')
        .map((issue, index) => (
          <p key={index} className="mt-2 text-xs text-error">
            {issue.message}
          </p>
        ))}

      {rubric ? (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField
              label="Rubric title"
              value={rubric.title}
              onChange={(title) => setRubric({ ...rubric, title })}
            />
            <NumberField
              label="Max points"
              value={rubric.maxPoints}
              min={0}
              onChange={(maxPoints) => setRubric({ ...rubric, maxPoints })}
            />
          </div>

          <ul className="mt-4 flex flex-col gap-4">
            {rubric.criteria.map((criterion, criterionIndex) => (
              <li
                key={criterion.id}
                className="rounded-pill border border-lab-700 bg-lab-850/50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[0.625rem] text-ink-600">{criterion.id}</p>
                  <GhostButton
                    className="px-2.5 py-1 text-[0.625rem] text-error/80 hover:border-error/50 hover:text-error"
                    onClick={() =>
                      setRubric({
                        ...rubric,
                        criteria: rubric.criteria.filter((_, i) => i !== criterionIndex),
                      })
                    }
                  >
                    Remove criterion
                  </GhostButton>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_8rem]">
                  <TextField
                    label="Label"
                    value={criterion.label}
                    onChange={(label) =>
                      setRubric({
                        ...rubric,
                        criteria: rubric.criteria.map((c, i) => (i === criterionIndex ? { ...c, label } : c)),
                      })
                    }
                  />
                  <NumberField
                    label="Max points"
                    value={criterion.maxPoints}
                    min={0}
                    onChange={(maxPoints) =>
                      setRubric({
                        ...rubric,
                        criteria: rubric.criteria.map((c, i) =>
                          i === criterionIndex ? { ...c, maxPoints } : c,
                        ),
                      })
                    }
                  />
                </div>
                <div className="mt-3">
                  <TextField
                    label="Description"
                    value={criterion.description}
                    onChange={(description) =>
                      setRubric({
                        ...rubric,
                        criteria: rubric.criteria.map((c, i) =>
                          i === criterionIndex ? { ...c, description } : c,
                        ),
                      })
                    }
                  />
                </div>
                <ul className="mt-3 flex flex-col gap-2">
                  {criterion.levels.map((level, levelIndex) => (
                    <li key={`${criterion.id}-l${levelIndex}`} className="grid gap-2 sm:grid-cols-[1fr_7rem]">
                      <TextField
                        label={`Level ${levelIndex + 1}`}
                        value={level.label}
                        onChange={(label) =>
                          setRubric({
                            ...rubric,
                            criteria: rubric.criteria.map((c, i) =>
                              i === criterionIndex
                                ? {
                                    ...c,
                                    levels: c.levels.map((l, j) => (j === levelIndex ? { ...l, label } : l)),
                                  }
                                : c,
                            ),
                          })
                        }
                      />
                      <NumberField
                        label="Points"
                        value={level.points}
                        min={0}
                        onChange={(points) =>
                          setRubric({
                            ...rubric,
                            criteria: rubric.criteria.map((c, i) =>
                              i === criterionIndex
                                ? {
                                    ...c,
                                    levels: c.levels.map((l, j) => (j === levelIndex ? { ...l, points } : l)),
                                  }
                                : c,
                            ),
                          })
                        }
                      />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            <GhostButton
              onClick={() =>
                setRubric({
                  ...rubric,
                  criteria: [
                    ...rubric.criteria,
                    {
                      id: `criterion-${rubric.criteria.length + 1}`,
                      label: `Criterion ${rubric.criteria.length + 1}`,
                      description: '',
                      maxPoints: 1,
                      levels: [{ label: 'Meets', points: 1, descriptor: '' }],
                    },
                  ],
                })
              }
            >
              Add criterion
            </GhostButton>
            {!required && <GhostButton onClick={removeRubric}>Remove rubric</GhostButton>}
          </div>
        </>
      ) : required ? (
        <p className="mt-4 text-sm text-error">
          A project is defined by its rubric, and this one has none. Add one to publish.
        </p>
      ) : (
        <GhostButton
          className="mt-4"
          onClick={() =>
            setRubric({
              id: `${draft.id}-rubric`,
              title: 'Rubric',
              maxPoints: 10,
              criteria: [
                {
                  id: 'criterion-1',
                  label: 'Correctness',
                  description: 'Does the solution work?',
                  maxPoints: 6,
                  levels: [
                    { label: 'Meets', points: 6, descriptor: 'All tests pass.' },
                    { label: 'Approaching', points: 3, descriptor: 'Some tests pass.' },
                    { label: 'Below', points: 0, descriptor: 'No tests pass.' },
                  ],
                },
                {
                  id: 'criterion-2',
                  label: 'Clarity',
                  description: 'Can another learner follow it?',
                  maxPoints: 4,
                  levels: [
                    { label: 'Meets', points: 4, descriptor: 'Named steps, no dead code.' },
                    { label: 'Approaching', points: 2, descriptor: 'Understandable with effort.' },
                    { label: 'Below', points: 0, descriptor: 'Unfollowable.' },
                  ],
                },
              ],
            })
          }
        >
          Add rubric
        </GhostButton>
      )}
    </section>
  )
}
