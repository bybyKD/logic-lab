import { Navigate } from 'react-router-dom'

/**
 * `/admin` is superseded by `/teacher` (§16).
 *
 * Kept as a redirect rather than a second working screen: two admin dashboards
 * would drift, and the old one is still hardcoded to the `PARTICIPANTS` mock.
 */
export function AdminRedirect() {
  return <Navigate to="/teacher" replace />
}
