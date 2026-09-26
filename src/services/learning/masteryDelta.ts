import type { Attempt, Skill, SkillMastery } from '../../domain'
import {
  type ActivitySkillMap,
  type MasteryOptions,
  computeSkillMastery,
} from './mastery'

export interface SkillDelta {
  skillId: string
  name: string
  /** Mastery before this attempt, 0–100. */
  before: number
  /** Mastery after this attempt, 0–100. */
  after: number
  /** `after - before`, signed. */
  delta: number
  evidenceCount: number
  confidence: SkillMastery['confidence']
}

export interface MasteryDeltaInput {
  /**
   * This learner's attempts *before* the one being explained. Filter to the
   * student: `computeSkillMastery` buckets by activity skill and does not know
   * about students, so passing a whole class would measure the cohort.
   */
  attempts: readonly Attempt[]
  /** The attempt just recorded. */
  attempt: Attempt
  skills: readonly Skill[]
  activitySkills: ActivitySkillMap
  /**
   * One clock for both computations. The 14-day recency decay is a function of
   * `now`, so two different clocks would show a delta that is really just the
   * seconds between the calls.
   */
  now: number
  options?: Omit<Partial<MasteryOptions>, 'now'>
}

const bySkillId = (mastery: SkillMastery[]) => new Map(mastery.map((m) => [m.skillId, m]))

/**
 * What one attempt did to skill mastery.
 *
 * Derived rather than stored: the attempt is persisted, so the delta can be
 * recomputed on demand and stays true after later attempts move the same skills.
 * Persisting a snapshot would freeze a number that is only ever correct for the
 * instant it was written, and would need invalidating on every later submit.
 *
 * Parent skills are included, because `computeSkillMastery` rolls a child up into
 * its ancestors — a gain on `for-loops` genuinely moves `loops` and
 * `control-flow`, and hiding that would understate what the learner achieved.
 */
export function masteryDeltaForAttempt(input: MasteryDeltaInput): SkillDelta[] {
  const { attempts, attempt, skills, activitySkills, now, options } = input
  const settings = { ...options, now }

  const before = bySkillId(computeSkillMastery([...attempts], [...skills], activitySkills, settings))
  const after = bySkillId(
    computeSkillMastery([...attempts, attempt], [...skills], activitySkills, settings),
  )

  const deltas: SkillDelta[] = []
  for (const [skillId, next] of after) {
    const previous = before.get(skillId)
    const previousScore = previous?.score ?? 0
    const previousEvidence = previous?.evidenceCount ?? 0
    const delta = next.score - previousScore

    // A repeated attempt at the same score moves nothing but still is evidence,
    // so it is reported with a zero delta rather than dropped.
    if (delta === 0 && next.evidenceCount === previousEvidence) continue

    deltas.push({
      skillId,
      name: skills.find((s) => s.id === skillId)?.name ?? skillId,
      before: previousScore,
      after: next.score,
      delta,
      evidenceCount: next.evidenceCount,
      confidence: next.confidence,
    })
  }

  // Biggest movement first, so a truncated list keeps the part that matters.
  return deltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

/** The single direction a delta should be described in. */
export function deltaTone(delta: number): 'up' | 'down' | 'flat' {
  if (delta > 0) return 'up'
  if (delta < 0) return 'down'
  return 'flat'
}
