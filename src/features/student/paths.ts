/**
 * The learner activity URL, in one place.
 *
 * Both the dashboard and the runner need to build this path, and a route that
 * exists in two string literals eventually exists in two wrong ones. The shape is
 * declared once, in `App.tsx`'s route table, and mirrored here:
 *
 *   /learn/c/:courseId/s/:sectionId/a/:activityId
 */
export function activityHref(courseId: string, sectionId: string, activityId: string): string {
  return `/learn/c/${encodeURIComponent(courseId)}/s/${encodeURIComponent(sectionId)}/a/${encodeURIComponent(activityId)}`
}
