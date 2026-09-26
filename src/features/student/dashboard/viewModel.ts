import type {
  Activity,
  ActivityProgress,
  Attempt,
  Course,
  Feedback,
  Section,
  Skill,
  SkillMastery,
  Student,
  Submission,
} from '../../../domain'
import {
  buildActivitySkillMap,
  computeSkillMastery,
  deriveActivityProgress,
  weakestSkills,
} from '../../../services/learning/mastery'

/**
 * The learner dashboard, derived.
 *
 * The old dashboard printed `842`, `37` and `5 DAYS` from module literals: three
 * numbers that looked like evidence and were not. It could not say which attempt
 * produced them, so it could not be wrong loudly enough to notice.
 *
 * Everything below is a pure function of the learner's own records, the
 * published course, and an injected `now`. Same inputs, same dashboard. That is
 * what makes the numbers trustworthy enough to build product decisions on, and it
 * is why the view model takes raw domain records rather than fetching anything:
 * the derivation is testable without a repository, and the screen has no excuse
 * to invent a value it could not derive.
 *
 * Two things deliberately do *not* exist here:
 *
 *   Due dates. The plan asked for an "upcoming (due dates)" panel. There is no
 *   assignment entity, no calendar, and `Activity.dueOffsetDays` is unset on all
 *   48 seeded activities — a relative offset with nothing to anchor it against.
 *   Rendering a fabricated deadline would be exactly the sin this rewrite exists
 *   to remove, so the panel shows real upcoming *course order* instead and says
 *   so in its copy.
 *
 *   Per-student skill overrides. Mastery is computed from attempts, full stop. No
 *   skill score is ever stored, which is what keeps the graph, the tiles, and the
 *   recommendations from disagreeing.
 */

const DAY_MS = 86_400_000

/** `2026-03-14` for an instant, in UTC. Stable across machines and timezones. */
export function dayKey(epochMs: number): string {
  return new Date(epochMs).toISOString().slice(0, 10)
}

/**
 * Consecutive practice days ending today, or ending yesterday.
 *
 * A streak that ran through yesterday is still alive until today ends, so
 * counting from yesterday rather than reporting zero is the behaviour a learner
 * expects at 9am. Returns 0 for an empty history rather than a fake 1.
 */
export function practiceStreakDays(dayKeys: Iterable<string>, now: number): number {
  const days = new Set(dayKeys)
  if (days.size === 0) return 0

  const today = Math.floor(now / DAY_MS) * DAY_MS
  let cursor = days.has(dayKey(today)) ? today : today - DAY_MS
  if (!days.has(dayKey(cursor))) return 0

  let streak = 0
  while (days.has(dayKey(cursor))) {
    streak += 1
    cursor -= DAY_MS
  }
  return streak
}

/** An activity in the course, paired with the section that contains it. */
export interface OrderedActivity {
  activity: Activity
  section: Section
}

/**
 * Course order: sections by `order`, activities by `order` within a section.
 *
 * Ties break on id so two activities sharing an order cannot swap places between
 * renders and make the "continue" card jump around.
 */
export function orderedActivities(
  sections: readonly Section[],
  activities: readonly Activity[],
): OrderedActivity[] {
  const sectionById = new Map(sections.map((s) => [s.id, s]))

  return activities
    .filter((a) => sectionById.has(a.sectionId))
    .map((activity) => ({ activity, section: sectionById.get(activity.sectionId)! }))
    .sort(
      (a, b) =>
        a.section.order - b.section.order ||
        a.activity.order - b.activity.order ||
        a.activity.id.localeCompare(b.activity.id),
    )
    .filter(({ activity }) => activity.status === 'published')
}

/** Course-wide counts, every one of them derived from the learner's own records. */
export interface DashboardStats {
  /** Published activities in the course. The denominator for every rate here. */
  total: number
  notStarted: number
  inProgress: number
  submitted: number
  graded: number
  mastered: number
  /** Activities with at least one attempt, i.e. anything other than untouched. */
  touched: number
  /** 0–100 share of the course the learner has opened. */
  coverage: number
  /** Mean best score across touched activities, or null when nothing is touched. */
  averageBestScore: number | null
  /** Best score anywhere, or null. */
  bestScore: number | null
  attempts: number
  /** Consecutive days with at least one attempt, ending today or yesterday. */
  streakDays: number
  /** Most recent attempt instant, or null. */
  lastPracticedAt: string | null
}

export function computeDashboardStats(
  progress: readonly ActivityProgress[],
  attempts: readonly Attempt[],
  now: number,
): DashboardStats {
  const by = (status: ActivityProgress['status']) =>
    progress.filter((p) => p.status === status).length

  const scored = progress.filter((p) => p.attempts > 0)
  const notStarted = by('not-started')
  const touched = progress.length - notStarted
  const dayKeys: string[] = []
  let lastPracticedAt: string | null = null

  for (const attempt of attempts) {
    const at = Date.parse(attempt.submittedAt)
    if (Number.isNaN(at)) continue
    dayKeys.push(dayKey(at))
    if (lastPracticedAt === null || attempt.submittedAt > lastPracticedAt) {
      lastPracticedAt = attempt.submittedAt
    }
  }

  return {
    total: progress.length,
    notStarted,
    inProgress: by('in-progress'),
    submitted: by('submitted'),
    graded: by('graded'),
    mastered: by('mastered'),
    touched,
    coverage: progress.length === 0 ? 0 : Math.round((touched / progress.length) * 100),
    averageBestScore:
      scored.length === 0
        ? null
        : Math.round(scored.reduce((sum, p) => sum + p.bestScore, 0) / scored.length),
    bestScore: scored.length === 0 ? null : Math.max(...scored.map((p) => p.bestScore)),
    attempts: attempts.length,
    streakDays: practiceStreakDays(dayKeys, now),
    lastPracticedAt,
  }
}

/**
 * Why the resume card points where it does, so the UI can explain itself.
 *
 * There is deliberately no "complete" reason: a learner who has passed
 * everything still gets a `review` card, because a dashboard that goes blank the
 * moment they succeed reads as a bug. The screen layers a completion note on top
 * rather than removing the card.
 */
export type ContinueReason = 'unfinished' | 'awaiting-grade' | 'next-up' | 'review'

export interface ContinueTarget {
  activity: Activity
  section: Section
  progress: ActivityProgress
  reason: ContinueReason
}

/**
 * Where to resume.
 *
 * Priority is what a learner would say out loud: something started and unfinished
 * beats something finished, which beats something untouched. The only exception
 * is `review`, which appears when the learner has passed everything already —
 * then the most recently touched activity is the only honest thing to offer.
 */
export function pickContinueTarget(
  ordered: readonly OrderedActivity[],
  progressById: ReadonlyMap<string, ActivityProgress>,
): ContinueTarget | null {
  const at = (activity: Activity): ActivityProgress | undefined => progressById.get(activity.id)
  const first = (status: ActivityProgress['status']) =>
    ordered.find(({ activity }) => at(activity)?.status === status)

  for (const [status, reason] of [
    ['in-progress', 'unfinished'],
    ['submitted', 'awaiting-grade'],
  ] as const) {
    const hit = first(status)
    if (hit && at(hit.activity)) {
      return { ...hit, progress: at(hit.activity)!, reason }
    }
  }

  const nextUp = first('not-started')
  if (nextUp && at(nextUp.activity)) {
    return { ...nextUp, progress: at(nextUp.activity)!, reason: 'next-up' }
  }

  const finished = ordered
    .filter(({ activity }) => {
      const status = at(activity)?.status
      return status === 'graded' || status === 'mastered'
    })
    .sort((a, b) =>
      (at(b.activity)?.lastActivityAt ?? '').localeCompare(at(a.activity)?.lastActivityAt ?? ''),
    )[0]

  if (finished && at(finished.activity)) {
    return { ...finished, progress: at(finished.activity)!, reason: 'review' }
  }

  return null
}

export interface UpNextItem extends OrderedActivity {
  progress: ActivityProgress
}

/**
 * What comes next, in course order.
 *
 * Excludes the resume target, and anything already mastered or graded: a
 * dashboard that tells a learner to redo a passed activity is nagging, not
 * helping. `submitted` work is excluded too, because until it is graded there is
 * nothing the learner can do about it — it belongs in the waiting list.
 */
export function pickUpNext(
  ordered: readonly OrderedActivity[],
  progressById: ReadonlyMap<string, ActivityProgress>,
  continueActivityId: string | null,
  limit = 5,
): UpNextItem[] {
  const out: UpNextItem[] = []
  for (const item of ordered) {
    if (out.length >= limit) break
    if (item.activity.id === continueActivityId) continue
    const progress = progressById.get(item.activity.id)
    if (!progress || progress.status === 'mastered' || progress.status === 'graded') continue
    if (progress.status === 'submitted') continue
    out.push({ ...item, progress })
  }
  return out
}

export interface WaitingItem {
  submission: Submission
  activity: Activity
  section: Section
  /** Feedback already received, so the card can show it is not ignored. */
  feedbackCount: number
}

/**
 * Work handed to a teacher and not yet graded.
 *
 * This is the honest replacement for a due-date list: it is the one part of a
 * course where a learner is genuinely blocked, because the next step belongs to
 * someone else.
 */
export function pickAwaitingGrade(
  submissions: readonly Submission[],
  ordered: readonly OrderedActivity[],
  feedback: readonly Feedback[],
): WaitingItem[] {
  const activityById = new Map(ordered.map((o) => [o.activity.id, o]))
  const sectionById = new Map(ordered.map((o) => [o.activity.id, o.section]))

  return submissions
    .filter((s) => s.status === 'submitted')
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .flatMap((submission) => {
      const entry = activityById.get(submission.activityId)
      if (!entry) return []
      return [
        {
          submission,
          activity: entry.activity,
          section: sectionById.get(entry.activity.id)!,
          feedbackCount: feedback.filter((f) => f.submissionId === submission.id).length,
        },
      ]
    })
}

export interface Recommendation {
  skill: Skill
  mastery: SkillMastery
  activity: Activity
  section: Section
  progress: ActivityProgress
  /**
   * Set when the activity drills a descendant of the weak skill rather than the
   * skill itself — the usual case, since a domain root is rarely named by one
   * activity while its children are. Carries the name as well as the id so the UI
   * can say "via Decomposition" instead of showing a slug.
   */
  drillsChild: { id: string; name: string } | null
}

/**
 * Practice for the weakest skills that have a concrete activity to offer.
 *
 * "Weakest" is `weakestSkills`, the same ranking the rest of the product uses, so
 * a recommendation cannot contradict the tile that says the skill is weak. A
 * weak skill with nothing published against it is dropped rather than padded with
 * an unrelated activity: an honest empty list beats a confident wrong one.
 */
export function pickRecommended(
  mastery: readonly SkillMastery[],
  skills: readonly Skill[],
  ordered: readonly OrderedActivity[],
  progressById: ReadonlyMap<string, ActivityProgress>,
  limit = 4,
): Recommendation[] {
  const skillById = new Map(skills.map((s) => [s.id, s]))
  const childrenOf = new Map<string, Skill[]>()
  for (const skill of skills) {
    if (!skill.parentId) continue
    const list = childrenOf.get(skill.parentId) ?? []
    list.push(skill)
    childrenOf.set(skill.parentId, list)
  }

  // Prefer untouched work, then something started, then anything unpassed.
  const rank = (status: ActivityProgress['status']) =>
    status === 'not-started' ? 0 : status === 'in-progress' ? 1 : 2

  const out: Recommendation[] = []
  const taken = new Set<string>()

  for (const weak of weakestSkills([...mastery], 6)) {
    if (out.length >= limit) break
    const skill = skillById.get(weak.skillId)
    if (!skill) continue

    const { ids } = skillClosure(weak.skillId, childrenOf)
    const candidates = ordered
      .filter(({ activity }) => activity.skillIds.some((id) => ids.has(id)))
      .filter(({ activity }) => {
        const status = progressById.get(activity.id)?.status
        return status !== 'mastered' && status !== 'graded' && status !== 'submitted'
      })
      .sort(
        (a, b) =>
          rank(progressById.get(a.activity.id)!.status) -
            rank(progressById.get(b.activity.id)!.status) ||
          a.section.order - b.section.order ||
          a.activity.order - b.activity.order ||
          a.activity.id.localeCompare(b.activity.id),
      )

    // A weak parent and its weak child often share the same only activity, and
    // recommending it twice reads as padding. Offer each activity at most once,
    // strongest skill first — the order `weakestSkills` already sorted.
    const chosen = candidates.find(({ activity }) => !taken.has(activity.id))
    if (!chosen) continue
    taken.add(chosen.activity.id)

    const drilled = chosen.activity.skillIds.find((id) => id !== weak.skillId && ids.has(id))
    out.push({
      skill,
      mastery: weak,
      activity: chosen.activity,
      section: chosen.section,
      progress: progressById.get(chosen.activity.id)!,
      drillsChild: drilled ? { id: drilled, name: skillById.get(drilled)?.name ?? drilled } : null,
    })
  }
  return out
}

/** The skill plus every descendant, so a weak parent can be drilled via its children. */
function skillClosure(
  skillId: string,
  childrenOf: ReadonlyMap<string, Skill[]>,
): { ids: Set<string> } {
  const ids = new Set<string>()
  const walk = (id: string) => {
    if (ids.has(id)) return
    ids.add(id)
    for (const child of childrenOf.get(id) ?? []) walk(child.id)
  }
  walk(skillId)
  return { ids }
}

export interface FeedbackItem {
  feedback: Feedback
  activity: Activity | null
  section: Section | null
  activityTitle: string
  authorName: string
  /** Auto feedback is generated; teacher feedback is a person. Worth distinguishing. */
  fromTeacher: boolean
}

/**
 * Recent feedback, newest first, joined back to the activity it is about.
 *
 * Joined rather than rendered as raw rows so a learner can go straight from "you
 * missed the base case" to the work that produced it.
 */
export function pickRecentFeedback(
  feedback: readonly Feedback[],
  submissions: readonly Submission[],
  ordered: readonly OrderedActivity[],
  authorNames: Readonly<Record<string, string>>,
  limit = 4,
): FeedbackItem[] {
  const submissionById = new Map(submissions.map((s) => [s.id, s]))
  const entryByActivityId = new Map(ordered.map((o) => [o.activity.id, o]))

  return [...feedback]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
    .map((item) => {
      const submission = submissionById.get(item.submissionId)
      const entry = submission ? entryByActivityId.get(submission.activityId) : undefined
      const fromTeacher = item.authorRole === 'teacher'
      return {
        feedback: item,
        activity: entry?.activity ?? null,
        section: entry?.section ?? null,
        activityTitle: entry?.activity.title ?? 'Activity',
        authorName: fromTeacher
          ? (authorNames[item.authorId] ?? 'Your teacher')
          : 'Auto feedback',
        fromTeacher,
      }
    })
}

/**
 * How a skill earned its score.
 *
 * `rollup` is the one that would otherwise look like a bug: a domain root such as
 * "conditionals" is named by no activity, so its score is a roll-up of its
 * children. Labelling it is what stops a learner reading a real number as a
 * result for work they never did.
 */
export type SkillNodeRole = 'practised' | 'rollup' | 'untouched'

export interface SkillNode {
  skill: Skill
  mastery: SkillMastery
  role: SkillNodeRole
  /** Published activities naming this skill directly. */
  activityCount: number
  children: SkillNode[]
}

export interface SkillGroup extends SkillNode {
  /** Skills in this subtree with evidence of their own, plus any rolled up. */
  practisedCount: number
  subtreeSize: number
}

/**
 * The skill graph as a forest of domain trees.
 *
 * Rendered as an indented tree rather than a force-directed graph: a depth-3
 * forest of 31 skills reads as structure in a list, survives a 390px screen
 * without a canvas, and stays keyboard- and screen-reader-navigable. A physics
 * simulation would look more like a graph and communicate less.
 */
export function buildSkillForest(
  skills: readonly Skill[],
  mastery: readonly SkillMastery[],
  activities: readonly Activity[],
): SkillGroup[] {
  const masteryById = new Map(mastery.map((m) => [m.skillId, m]))
  const childrenOf = new Map<string, Skill[]>()
  const roots: Skill[] = []

  for (const skill of skills) {
    if (skill.parentId) {
      const list = childrenOf.get(skill.parentId) ?? []
      list.push(skill)
      childrenOf.set(skill.parentId, list)
    } else {
      roots.push(skill)
    }
  }

  const practised = new Set<string>()
  for (const activity of activities) {
    if (activity.status !== 'published') continue
    for (const id of activity.skillIds) practised.add(id)
  }

  const build = (skill: Skill, seen: Set<string>): SkillNode => {
    const m = masteryById.get(skill.id)
    const evidence = m?.evidenceCount ?? 0
    const role: SkillNodeRole =
      evidence === 0 ? 'untouched' : practised.has(skill.id) ? 'practised' : 'rollup'
    const next = new Set(seen).add(skill.id)
    return {
      skill,
      mastery: m ?? { skillId: skill.id, score: 0, evidenceCount: 0, lastPracticedAt: '', confidence: 'low' },
      role,
      activityCount: practised.has(skill.id)
        ? activities.filter((a) => a.status === 'published' && a.skillIds.includes(skill.id)).length
        : 0,
      children: (childrenOf.get(skill.id) ?? []).map((child) =>
        // Skills are not authorable and the seed graph is asserted acyclic, so this
        // is belt-and-braces rather than a real path.
        next.has(child.id) ? { ...build(child, next), children: [] } : build(child, next),
      ),
    }
  }

  return roots.map((root) => {
    const node = build(root, new Set())
    const count = (n: SkillNode): { practised: number; total: number } =>
      n.children.reduce(
        (acc, c) => {
          const sub = count(c)
          return { practised: acc.practised + sub.practised, total: acc.total + sub.total }
        },
        { practised: n.role === 'untouched' ? 0 : 1, total: 1 },
      )
    const totals = count(node)
    return { ...node, practisedCount: totals.practised, subtreeSize: totals.total }
  })
}

export interface StatTile {
  id: string
  label: string
  value: string
  hint: string
  accent?: boolean
}

const DASH = '—'

/**
 * The headline tiles.
 *
 * `coverage` and `averageBestScore` are new; the old `Logic Score 842` had no
 * recoverable meaning. A dash is returned rather than a zero when there is
 * nothing to average, because "no attempts" and "scored 0" are different facts
 * and a learner should not have to guess which one they are looking at.
 */
export function dashboardStatTiles(stats: DashboardStats): StatTile[] {
  const score = stats.averageBestScore
  return [
    {
      id: 'coverage',
      label: 'Course coverage',
      value: `${stats.coverage}%`,
      hint: `${stats.touched} of ${stats.total} activities opened`,
    },
    {
      id: 'average-score',
      label: 'Average best score',
      value: score === null ? DASH : String(score),
      hint: score === null ? 'No scored attempts yet' : `Best run: ${stats.bestScore}`,
      accent: true,
    },
    {
      id: 'mastered',
      label: 'Mastered',
      value: String(stats.mastered),
      hint: `${stats.inProgress} in progress · ${stats.submitted + stats.graded} submitted`,
    },
    {
      id: 'streak',
      label: 'Practice streak',
      value: stats.streakDays === 0 ? '0' : `${stats.streakDays}d`,
      hint: stats.attempts === 0 ? 'No attempts yet' : `${stats.attempts} attempts logged`,
    },
  ]
}

export interface LearnDashboard {
  /** Carried through so the screen builds real activity links, not guessed ones. */
  course: Course
  stats: DashboardStats
  tiles: StatTile[]
  continueWith: ContinueTarget | null
  upNext: UpNextItem[]
  awaiting: WaitingItem[]
  recommended: Recommendation[]
  feedback: FeedbackItem[]
  skillGroups: SkillGroup[]
  /**
   * Skills with no evidence at all, and every skill in the graph.
   *
   * Reported as a pair because the two numbers are only meaningful together:
   * "15 of 7" is how the screen managed to read when it divided an all-skill count
   * by a domain count. Both are over the same population or the ratio is nonsense.
   */
  untouchedSkillCount: number
  totalSkillCount: number
}

export interface LearnDashboardInput {
  student: Student
  course: Course
  sections: readonly Section[]
  activities: readonly Activity[]
  /** The learner's own attempts. Passing a cohort here would produce a lie. */
  attempts: readonly Attempt[]
  submissions: readonly Submission[]
  feedback: readonly Feedback[]
  skills: readonly Skill[]
  /** Id → display name, for teacher-authored feedback. Auto feedback names itself. */
  authorNames: Readonly<Record<string, string>>
  now: number
  upNextLimit?: number
}

/**
 * The whole dashboard, derived in one pass.
 *
 * One entry point on purpose: five widgets that each call their own derivation
 * are five places for the same number to come out two different ways. Here the
 * skill map, the progress table, and the stats are computed once and shared, so
 * the tile that says 62% and the graph that says 62% are the same 62% by
 * construction.
 */
export function buildLearnDashboard(input: LearnDashboardInput): LearnDashboard {
  const { student, course, activities, attempts, submissions, feedback, skills, now } = input

  const ordered = orderedActivities(input.sections, activities)
  const published = ordered.map((o) => o.activity)
  const activitySkills = buildActivitySkillMap(published)
  const mastery = computeSkillMastery(
    [...attempts],
    [...skills],
    activitySkills,
    { now },
  )
  const progress = deriveActivityProgress(
    [...attempts],
    student.id,
    published.map((a) => a.id),
    [...submissions],
  )
  const progressById = new Map(progress.map((p) => [p.activityId, p]))
  const stats = computeDashboardStats(progress, attempts, now)

  const continueWith = pickContinueTarget(ordered, progressById)
  const groups = buildSkillForest(skills, mastery, published)

  return {
    course,
    stats,
    tiles: dashboardStatTiles(stats),
    continueWith,
    upNext: pickUpNext(ordered, progressById, continueWith?.activity.id ?? null, input.upNextLimit),
    awaiting: pickAwaitingGrade(submissions, ordered, feedback),
    recommended: pickRecommended(mastery, skills, ordered, progressById),
    feedback: pickRecentFeedback(feedback, submissions, ordered, input.authorNames),
    skillGroups: groups,
    untouchedSkillCount: groups.reduce((total, group) => total + countUntouched(group), 0),
    totalSkillCount: groups.reduce((total, group) => total + group.subtreeSize, 0),
  }
}

function countUntouched(node: SkillNode): number {
  return (
    (node.role === 'untouched' ? 1 : 0) + node.children.reduce((n, c) => n + countUntouched(c), 0)
  )
}
