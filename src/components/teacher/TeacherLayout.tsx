import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../utils/cn'

/**
 * Teacher shell.
 *
 * The rail lists the full §9 destination list, but only what exists is a link.
 * Everything else is muted text. A prototype full of links to nowhere teaches a
 * visitor that the product is unfinished; a roadmap that is visibly a roadmap
 * does not.
 */

interface Destination {
  label: string
  /** Null until the phase that builds it. Rendered as muted text, never a link. */
  to: string | null
}

const DESTINATIONS: Destination[] = [
  { label: 'Classroom', to: '/teacher' },
  { label: 'Courses', to: '/teacher/courses' },
  // No class index exists yet — only one class is seeded — so this stays muted
  // rather than linking somewhere that would have to invent a list.
  { label: 'Classes', to: null },
  { label: 'Students', to: '/teacher/classes/class-logic-101-a/students' },
  { label: 'Assignments', to: '/teacher/assignments' },
  { label: 'Gradebook', to: '/teacher/gradebook' },
  { label: 'Question Bank', to: null },
  { label: 'Analytics', to: null },
  { label: 'Content Studio', to: '/teacher/studio' },
  { label: 'Announcements', to: null },
]

export function TeacherLayout({
  children,
  activeLabel,
}: {
  children: ReactNode
  /**
   * Overrides path-based highlighting. Only needed where a screen does not sit
   * under its own rail entry — the classroom, which is `/teacher` itself.
   */
  activeLabel?: string
}) {
  const { pathname } = useLocation()

  // Prefix match, so `/teacher/courses/abc` still lights up Courses. `/teacher`
  // is the one entry that has to match exactly, or every teacher page would also
  // highlight Classroom.
  const isCurrent = (destination: Destination): boolean => {
    if (activeLabel !== undefined) return destination.label === activeLabel
    if (!destination.to) return false
    if (destination.to === '/teacher') return pathname === '/teacher'
    return pathname === destination.to || pathname.startsWith(`${destination.to}/`)
  }

  return (
    <div className="min-h-screen bg-lab-900">
      <div className="mx-auto flex max-w-[1560px] gap-0 px-0 lg:px-8">
        <nav
          aria-label="Teacher sections"
          className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-lab-800 py-28 pr-6 lg:flex"
        >
          <p className="technical-label px-3">TEACHER</p>
          <ul className="mt-4 flex flex-col gap-0.5">
            {DESTINATIONS.map((destination) => {
              const isActive = isCurrent(destination)
              return (
                <li key={destination.label}>
                  {destination.to ? (
                    <NavLink
                      to={destination.to}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-accent-400/10 font-medium text-accent-300'
                          : 'text-ink-400 hover:bg-lab-800 hover:text-ink-200',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'h-1.5 w-1.5 rounded-pill',
                          isActive ? 'bg-accent-400' : 'bg-lab-600',
                        )}
                      />
                      {destination.label}
                    </NavLink>
                  ) : (
                    <span
                      className="flex cursor-not-allowed items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-700"
                      title="Planned — not built in this prototype"
                    >
                      <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-lab-700" />
                      {destination.label}
                      <span className="ml-auto font-mono text-[0.5625rem] tracking-widest text-ink-700 uppercase">
                        soon
                      </span>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="mt-auto px-3 pb-2 text-xs leading-relaxed text-ink-700">
            Muted sections are on the roadmap, not implemented.
          </p>
        </nav>

        {/* Rail is a horizontal scroller on small screens, same information —
            all of it, so the mobile nav is not quietly missing sections. */}
        <div className="min-w-0 flex-1">
          <div className="border-b border-lab-800 px-5 py-3 lg:hidden">
            <ul className="flex gap-1 overflow-x-auto">
              {DESTINATIONS.map((destination) => {
                const isActive = isCurrent(destination)
                if (!destination.to) {
                  return (
                    <li key={destination.label} className="shrink-0">
                      <span className="rounded-pill border border-lab-800 px-3 py-1.5 font-mono text-[0.625rem] text-ink-700">
                        {destination.label}
                      </span>
                    </li>
                  )
                }
                return (
                  <li key={destination.label} className="shrink-0">
                    <NavLink
                      to={destination.to}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'rounded-pill border px-3 py-1.5 font-mono text-[0.625rem]',
                        isActive
                          ? 'border-accent-400/50 bg-accent-400/10 text-accent-300'
                          : 'border-lab-700 text-ink-300',
                      )}
                    >
                      {destination.label}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
