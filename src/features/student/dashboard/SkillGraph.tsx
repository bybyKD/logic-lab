import { cn } from '../../../utils/cn'
import type { SkillGroup, SkillNode } from './viewModel'

/**
 * The learner's skill graph.
 *
 * Rendered as an indented tree rather than a force-directed canvas. The skill
 * graph is a shallow forest — 31 skills, 7 domains, depth 3 — and a tree reads
 * that structure directly, survives a 390px screen without a canvas or a resize
 * observer, and stays navigable by keyboard and screen reader. A physics layout
 * would look more like a graph while communicating less and costing far more.
 *
 * The `role` label on every row is the point of the rewrite. Eight skills are
 * domains that no activity names, so their score is a roll-up of their children.
 * Showing "62" against one of those without saying so reads as a score for work
 * the learner never did.
 */

const ROLE_LABEL: Record<SkillNode['role'], string> = {
  practised: 'your score',
  rollup: 'from children',
  untouched: 'not started',
}

const BAR_TONE: Record<SkillNode['role'], string> = {
  practised: 'bg-accent-400',
  rollup: 'bg-accent-400/45',
  untouched: 'bg-lab-600',
}

const SKILL_TEXT: Record<SkillNode['role'], string> = {
  practised: 'text-ink-100',
  rollup: 'text-ink-300',
  untouched: 'text-ink-500',
}

function toneFor(confidence: string): string {
  if (confidence === 'high') return 'text-success'
  if (confidence === 'medium') return 'text-accent-400'
  return 'text-ink-500'
}

function SkillRow({ node, depth }: { node: SkillNode; depth: number }) {
  const { skill, mastery, role, children } = node
  const untouched = role === 'untouched'

  return (
    <li>
      <div
        className="flex items-center gap-3 py-2"
        style={{ paddingLeft: `${depth * 1.1}rem` }}
      >
        {/* Connector, so indentation reads as hierarchy rather than as a list. */}
        {depth > 0 && <span aria-hidden className="h-px w-3 shrink-0 bg-lab-600" />}

        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-sm', SKILL_TEXT[role])}>{skill.name}</p>
          <p className="font-mono text-[0.625rem] text-ink-600">
            {role === 'rollup'
              ? `${ROLE_LABEL[role]} · no activity of its own`
              : `${ROLE_LABEL[role]}${mastery.evidenceCount > 0 ? ` · ${mastery.evidenceCount} attempt${mastery.evidenceCount === 1 ? '' : 's'}` : ''}`}
          </p>
        </div>

        <div className="w-20 shrink-0 sm:w-28">
          <div
            className="h-1.5 overflow-hidden rounded-pill bg-lab-700"
            role="progressbar"
            aria-label={`${skill.name} mastery`}
            aria-valuenow={mastery.score}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn('h-full rounded-pill transition-all duration-700', BAR_TONE[role])}
              style={{ width: `${Math.max(untouched ? 0 : 2, mastery.score)}%` }}
            />
          </div>
        </div>

        <span
          className={cn(
            'w-8 shrink-0 text-right font-mono text-sm tabular-nums',
            toneFor(mastery.confidence),
          )}
        >
          {untouched ? '—' : mastery.score}
        </span>
      </div>

      {children.length > 0 && (
        <ul>
          {children.map((child) => (
            <SkillRow key={child.skill.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

function SkillGroupCard({ group }: { group: SkillGroup }) {
  return (
    <div className="rounded-lg border border-lab-700 bg-lab-850/60 p-4">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-ink-100">{group.skill.name}</h3>
        <p className="font-mono text-[0.625rem] text-ink-600">
          {group.practisedCount}/{group.subtreeSize} touched
        </p>
      </div>
      <p className="mb-2 text-xs text-ink-500">{group.skill.description}</p>
      <ul>
        <SkillRow node={group} depth={0} />
      </ul>
    </div>
  )
}

export function SkillGraph({ groups }: { groups: readonly SkillGroup[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <SkillGroupCard key={group.skill.id} group={group} />
      ))}
    </div>
  )
}
