import { Navigate } from 'react-router-dom'

/**
 * `/admin` is superseded by `/teacher` (§16).
 *
 * Kept as a redirect rather than a second working screen: two admin dashboards
 * would drift, and the old one was still hardcoded to the `PARTICIPANTS` mock. It
 * is now deleted; the classroom screen replaced it.
 */
export function AdminRedirect() {
  return <Navigate to="/teacher" replace />
}
