import { getChallenge } from '../data/challenges'
import {
  COURSE_ID,
  seededChallengeActivityId,
  seededLessonActivityId,
  seededSectionId,
} from '../data/seed/course'
import { activityHref } from '../features/student/paths'

/**
 * Where the old student URLs go now.
 *
 * Phase 5 built the real learner route and Phase 6 made `/learn` the entry point,
 * which left three legacy routes still serving the pre-Phase-3 screens. Those
 * screens read `data/modules.ts` and `data/challenges.ts` directly and rendered
 * invented progress, so keeping them live meant two dashboards a learner could
 * reach. They are deleted and these functions resolve the real target instead.
 *
 * Every mapping is *derived* from the seed rather than written out. The legacy
 * shape addresses content by a module number or a challenge number; the real shape
 * wants a section id and an activity id. Both are computed by the same helpers the
 * seed uses to build them, so a rename in the seed cannot leave a redirect
 * pointing at an id that does not exist — which would fail as a silent 404 to
 * `/learn` rather than as an obviously broken page.
 */

/**
 * A legacy id, parsed strictly.
 *
 * `Number('1e3')` is a perfectly good integer, which made `/module/1e3` resolve to
 * `sec-1000` — a section that does not exist. The old ids were plain digits, so
 * anything else is refused rather than coerced into a plausible-looking target.
 */
function legacyId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null
  const id = Number(raw)
  return id >= 1 ? id : null
}

/** `/module/4` → the first activity of `sec-04`. */
export function moduleRedirectTo(moduleId: string): string | null {
  const id = legacyId(moduleId)
  if (id === null) return null

  // There is no section-overview screen yet, so the learner lands on the start of
  // the section's work rather than on a route that would 404.
  return activityHref(COURSE_ID, seededSectionId(id), seededLessonActivityId(id))
}

/** `/challenge/7` → the real activity for legacy challenge 7. */
export function challengeRedirectTo(challengeId: string): string | null {
  const id = legacyId(challengeId)
  if (id === null) return null

  const challenge = getChallenge(id)
  if (!challenge) return null

  return activityHref(COURSE_ID, seededSectionId(challenge.moduleId), seededChallengeActivityId(challenge))
}

/** `/challenges` had no successor of its own; the index became the dashboard. */
export const CHALLENGES_REDIRECT = '/learn'
