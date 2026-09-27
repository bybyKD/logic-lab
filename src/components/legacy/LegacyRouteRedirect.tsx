import { Navigate, useParams } from 'react-router-dom'
import { challengeRedirectTo, moduleRedirectTo } from '../../services/legacyRoutes'

/**
 * Redirects the pre-Phase-3 student URLs at their real content.
 *
 * The old `/module/:id` and `/challenge/:id` screens are gone, but the URLs are in
 * bookmarks, in the seed's own copy, and in anything a teacher already shared. A
 * redirect preserves those links; the target is resolved in `services/legacyRoutes`
 * and checked against the seeded course, so an id we cannot resolve falls back to
 * `/learn` rather than to a dead page.
 */
function redirect(target: string | null) {
  return <Navigate to={target ?? '/learn'} replace />
}

export function LegacyModuleRedirect() {
  return redirect(moduleRedirectTo(useParams().id ?? ''))
}

export function LegacyChallengeRedirect() {
  return redirect(challengeRedirectTo(useParams().id ?? ''))
}
