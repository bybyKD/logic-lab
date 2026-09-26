import type {
  Activity,
  ActivityProgress,
  Attempt,
  CohortSegment,
  Enrollment,
  Skill,
  SkillMastery,
  Submission,
} from '../../domain'

/**
 * The learning engine.
 *
 * Every function here is pure: same inputs, same output, no clock reads except
 * the `now` passed in. That is what makes skill mastery testable and what keeps
 * the classroom screen's numbers reproducible.
 */

const DAY_MS = 86_400_000

export interface MasteryOptions {
  /** Epoch ms the calculation is relative to. Injected so tests are stable. */
  now: number
  /** Attempts older than this stop influencing mastery. Default 14. */
  halfLifeDays?: number
  /** Multiplier floor applied per hint used. Default 0.6. */
  hintPenaltyFloor?: number
  /** Penalty per hint revealed, before the floor. Default 0.15. */
  hintPenaltyPerHint?: number
  /** Score at or above which an activity counts as mastered. Default 80. */
  masteryThreshold?: number
}

const DEFAULTS = {
  halfLifeDays: 14,
  hintPenaltyFloor: 0.6,
  hintPenaltyPerHint: 0.15,
  masteryThreshold: 80,
}

function withDefaults(options: MasteryOptions) {
  return { ...DEFAULTS, ...options }
}

/** activityId → the skills that activity exercises. */
export type ActivitySkillMap = Record<string, string[]>

export function buildActivitySkillMap(activities: Activity[]): ActivitySkillMap {
  const map: ActivitySkillMap = {}
  for (const activity of activities) {
    map[activity.id] = activity.skillIds
  }
  return map
}

/**
 * Turns attempt evidence into per-skill mastery.
 *
 * Each attempt contributes `score` shaped by two factors:
 *   recency — exponential decay with a 14-day half-life, so last week's work counts
 *             more than last month's. This scales the attempt's *weight*, i.e. how
 *             much it counts against other evidence.
 *   hints   — each revealed hint discounts the attempt's *score*, floored so hints
 *             never zero out a genuinely correct answer.
 *
 * The split matters. Discounting the score (not the weight) is what makes hints
 * visible: a weighted mean divides numerator and denominator by the same factor,
 * so discounting only the weight would cancel out entirely for a learner doing
 * each activity once — the common case here.
 *
 * The weighted mean is over the *scores*, so a fresh perfect attempt reads 100
 * even if older attempts were weak. Parents with no evidence of their own roll up
 * from their children.
 */
export function computeSkillMastery(
  attempts: Attempt[],
  skills: Skill[],
  activitySkills: ActivitySkillMap,
  options: MasteryOptions,
): SkillMastery[] {
  const cfg = withDefaults(options)

  interface Bucket {
    weighted: number
    weight: number
    count: number
    last: number
  }
  const buckets = new Map<string, Bucket>()

  const bucketFor = (skillId: string): Bucket => {
    let bucket = buckets.get(skillId)
    if (!bucket) {
      bucket = { weighted: 0, weight: 0, count: 0, last: 0 }
      buckets.set(skillId, bucket)
    }
    return bucket
  }

  for (const attempt of attempts) {
    const skillIds = activitySkills[attempt.activityId]
    if (!skillIds || skillIds.length === 0) continue

    const submittedAt = Date.parse(attempt.submittedAt)
    if (Number.isNaN(submittedAt)) continue

    const ageDays = Math.max(0, (cfg.now - submittedAt) / DAY_MS)
    const recency = 0.5 ** (ageDays / cfg.halfLifeDays)
    const hintFactor = Math.max(
      cfg.hintPenaltyFloor,
      1 - cfg.hintPenaltyPerHint * attempt.hintsUsed.length,
    )
    const effectiveScore = attempt.score * hintFactor
    const weight = recency

    for (const skillId of skillIds) {
      const bucket = bucketFor(skillId)
      bucket.weighted += effectiveScore * weight
      bucket.weight += weight
      bucket.count += 1
      bucket.last = Math.max(bucket.last, submittedAt)
    }
  }

  const childrenOf = new Map<string, string[]>()
  for (const skill of skills) {
    if (!skill.parentId) continue
    const list = childrenOf.get(skill.parentId) ?? []
    list.push(skill.id)
    childrenOf.set(skill.parentId, list)
  }

  const confidenceFor = (count: number): SkillMastery['confidence'] =>
    count < 3 ? 'low' : count < 8 ? 'medium' : 'high'

  // Resolve depth-first so a parent can roll up already-resolved children.
  const resolved = new Map<string, SkillMastery>()
  const resolve = (skill: Skill, seen: Set<string>): SkillMastery => {
    const cached = resolved.get(skill.id)
    if (cached) return cached
    if (seen.has(skill.id)) {
      return { skillId: skill.id, score: 0, evidenceCount: 0, lastPracticedAt: '', confidence: 'low' }
    }
    seen.add(skill.id)

    const bucket = buckets.get(skill.id)
    let mastery: SkillMastery

    if (bucket && bucket.weight > 0) {
      mastery = {
        skillId: skill.id,
        score: Math.round(bucket.weighted / bucket.weight),
        evidenceCount: bucket.count,
        lastPracticedAt: new Date(bucket.last).toISOString(),
        confidence: confidenceFor(bucket.count),
      }
    } else {
      const childMasteries = (childrenOf.get(skill.id) ?? [])
        .map((id) => {
          const child = skills.find((s) => s.id === id)
          return child ? resolve(child, seen) : undefined
        })
        .filter((m): m is SkillMastery => Boolean(m) && m!.evidenceCount > 0)

      if (childMasteries.length === 0) {
        mastery = {
          skillId: skill.id,
          score: 0,
          evidenceCount: 0,
          lastPracticedAt: '',
          confidence: 'low',
        }
      } else {
        const total = childMasteries.reduce((sum, m) => sum + m.score, 0)
        const evidence = childMasteries.reduce((sum, m) => sum + m.evidenceCount, 0)
        const last = childMasteries.reduce(
          (latest, m) => (m.lastPracticedAt > latest ? m.lastPracticedAt : latest),
          '',
        )
        mastery = {
          skillId: skill.id,
          score: Math.round(total / childMasteries.length),
          evidenceCount: evidence,
          lastPracticedAt: last,
          confidence: confidenceFor(evidence),
        }
      }
    }

    resolved.set(skill.id, mastery)
    return mastery
  }

  return skills.map((skill) => resolve(skill, new Set()))
}

/** Lowest-scoring skills that actually have evidence, weakest first. */
export function weakestSkills(mastery: SkillMastery[], limit = 3): SkillMastery[] {
  return mastery
    .filter((m) => m.evidenceCount > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
}

/** Per-student, per-activity status derived from attempts. */
export function deriveActivityProgress(
  attempts: Attempt[],
  studentId: string,
  activityIds: string[],
  submissions: Submission[] = [],
  masteryThreshold = DEFAULTS.masteryThreshold,
  hintPenaltyPerHint = DEFAULTS.hintPenaltyPerHint,
  hintPenaltyFloor = DEFAULTS.hintPenaltyFloor,
): ActivityProgress[] {
  return activityIds.map((activityId) => {
    const own = attempts.filter((a) => a.activityId === activityId && a.studentId === studentId)
    const submission = submissions.find(
      (s) => s.activityId === activityId && s.studentId === studentId,
    )

    if (own.length === 0) {
      return {
        activityId,
        studentId,
        status: 'not-started',
        bestScore: 0,
        effectiveScore: 0,
        attempts: 0,
      }
    }

    const bestScore = Math.max(...own.map((a) => a.score))
    // Judged on the best *hint-discounted* attempt: a 100 found by copying the
    // hint is not the same evidence as a 100 written unaided.
    const effectiveScore = Math.max(
      ...own.map(
        (a) =>
          a.score *
          Math.max(
            hintPenaltyFloor,
            1 - hintPenaltyPerHint * a.hintsUsed.length,
          ),
      ),
    )
    const lastActivityAt = own.reduce(
      (latest, a) => (a.submittedAt > latest ? a.submittedAt : latest),
      '',
    )
    const passed = own.some((a) => a.passed)

    let status: ActivityProgress['status'] = 'in-progress'
    if (submission?.status === 'graded') status = 'graded'
    else if (passed && effectiveScore >= masteryThreshold) status = 'mastered'
    else if (passed) status = 'submitted'

    return {
      activityId,
      studentId,
      status,
      bestScore,
      effectiveScore: Math.round(effectiveScore),
      attempts: own.length,
      lastActivityAt,
    }
  })
}

export interface ClassProgressSummary {
  enrolled: number
  completed: number
  struggling: number
  inProgress: number
  notStarted: number
  /** Percentage of enrolled students who completed the focus activity. */
  focusCompletionRate: number
  totalAttempts: number
}

/**
 * Engagement split for a class, measured against the activity the class is
 * currently working on.
 *
 * `completed` means "passed the focus activity" — it is an engagement state, not
 * a claim that the whole course is finished. `struggling` means tried and not yet
 * passing. The other two are: working elsewhere, or not started at all.
 */
export function classProgressSummary(
  enrollments: Enrollment[],
  attempts: Attempt[],
  focusActivityId: string,
): ClassProgressSummary {
  const enrolled = enrollments.length
  let completed = 0
  let struggling = 0
  let inProgress = 0
  let notStarted = 0
  let totalAttempts = 0

  const studentIds = new Set(enrollments.map((e) => e.studentId))
  const attemptsByStudent = new Map<string, Attempt[]>()
  for (const attempt of attempts) {
    if (!studentIds.has(attempt.studentId)) continue
    const list = attemptsByStudent.get(attempt.studentId) ?? []
    list.push(attempt)
    attemptsByStudent.set(attempt.studentId, list)
  }

  for (const studentId of studentIds) {
    const own = attemptsByStudent.get(studentId) ?? []
    totalAttempts += own.length
    const onFocus = own.filter((a) => a.activityId === focusActivityId)

    if (onFocus.length > 0) {
      if (onFocus.some((a) => a.passed)) completed += 1
      else struggling += 1
    } else if (own.length > 0) {
      inProgress += 1
    } else {
      notStarted += 1
    }
  }

  return {
    enrolled,
    completed,
    struggling,
    inProgress,
    notStarted,
    focusCompletionRate: enrolled === 0 ? 0 : Math.round((completed / enrolled) * 100),
    totalAttempts,
  }
}

export interface StudentEngagement {
  studentId: string
  segment: CohortSegment
  attempts: number
  passed: number
  passRate: number
  lastActivityAt: string
  /**
   * Misconceptions this student showed, from any tagged attempt.
   *
   * Passing attempts are included, matching `aggregateMisconceptions`: a solution
   * that passed while using `=` in a condition still carries the misconception, and
   * the per-student row must agree with the class-wide panel.
   */
  misconceptionIds: string[]
}

/** One row per enrolled student, for the teacher roster. */
export function studentEngagement(
  enrollments: Enrollment[],
  attempts: Attempt[],
): StudentEngagement[] {
  const studentIds = [...new Set(enrollments.map((e) => e.studentId))]
  return studentIds.map((studentId) => {
    const own = attempts
      .filter((a) => a.studentId === studentId)
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    const passed = own.filter((a) => a.passed).length
    const lastActivityAt = own.length > 0 ? own[own.length - 1].submittedAt : ''
    const misconceptionIds = [
      ...new Set(own.map((a) => a.misconceptionId).filter((id): id is string => Boolean(id))),
    ]

    let segment: CohortSegment = 'not-started'
    if (own.length > 0) {
      const rate = passed / own.length
      if (rate >= 0.8 && own.length >= 2) segment = 'completed'
      else if (rate < 0.5) segment = 'struggling'
      else segment = 'in-progress'
    }

    return {
      studentId,
      segment,
      attempts: own.length,
      passed,
      passRate: own.length === 0 ? 0 : Math.round((passed / own.length) * 100),
      lastActivityAt,
      misconceptionIds,
    }
  })
}

export interface MisconceptionTally {
  id: string
  label: string
  description: string
  skillId: string
  remediationHint: string
  recommendedActivityId?: string
  /** Failed attempts that showed this misconception. */
  occurrences: number
  /** Distinct students affected. */
  studentCount: number
  studentIds: string[]
}

/**
 * The "common issue" panel on the classroom screen: which wrong mental model is
 * costing the class the most, and who it is costing it to.
 *
 * Counts every attempt tagged with a misconception, including passing ones: a
 * program that printed the right answer while using `=` instead of `==` still
 * taught the student the wrong rule, and hiding that would understate the class's
 * real problem.
 */
export function aggregateMisconceptions(
  attempts: Attempt[],
  catalog: { id: string; label: string; description: string; skillId: string; remediationHint: string; recommendedActivityId?: string }[],
): MisconceptionTally[] {
  const byId = new Map(catalog.map((m) => [m.id, m]))
  const tallies = new Map<string, { occurrences: number; studentIds: Set<string> }>()

  for (const attempt of attempts) {
    if (!attempt.misconceptionId) continue
    if (!byId.has(attempt.misconceptionId)) continue
    const entry = tallies.get(attempt.misconceptionId) ?? {
      occurrences: 0,
      studentIds: new Set<string>(),
    }
    entry.occurrences += 1
    entry.studentIds.add(attempt.studentId)
    tallies.set(attempt.misconceptionId, entry)
  }

  return [...tallies.entries()]
    .map(([id, entry]) => {
      const meta = byId.get(id)
      if (!meta) return undefined
      return {
        ...meta,
        occurrences: entry.occurrences,
        studentCount: entry.studentIds.size,
        studentIds: [...entry.studentIds],
      }
    })
    .filter((t): t is MisconceptionTally => Boolean(t))
    .sort((a, b) => b.studentCount - a.studentCount || b.occurrences - a.occurrences)
}
