import { Link, useNavigate } from 'react-router-dom'
import { GlowButton } from '../ui/GlowButton'
import { PageHeader, TeacherPage } from './TeacherPage'
import { useCourseOutline, type CourseOutline } from './useCourseOutline'
import { resetDemoData } from '../../services/repositories'

/**
 * `/teacher/courses` — the courses index.
 *
 * One course is seeded, but this is a list rather than a redirect: courses are a
 * collection the teacher owns (§22), and a hard-coded single panel would make
 * adding a second one impossible without rewriting the route.
 */
export function CoursesScreen() {
  const outline = useCourseOutline()
  const navigate = useNavigate()

  return (
    <TeacherPage
      state={outline}
      errorMessage="Your courses could not be loaded. Local storage may be unavailable in this browser."
    >
      {(data) => (
        <>
          <PageHeader
            eyebrow="COURSES"
            title="Curriculum"
            description="Structure, publish and maintain the material your classes work through."
            meta="teacher edits live in this browser only — the seed is never mutated"
            actions={
              <>
                <GlowButton
                  variant="secondary"
                  onClick={() => {
                    resetDemoData()
                    outline.reload()
                  }}
                >
                  Reset demo data
                </GlowButton>
                <GlowButton onClick={() => navigate(`/teacher/courses/${data.course.id}`)}>
                  Open builder
                </GlowButton>
              </>
            }
          />
          <CourseList outline={data} />
        </>
      )}
    </TeacherPage>
  )
}

function CourseList({ outline: data }: { outline: CourseOutline }) {
  const { course, sections } = data
  const total = sections.reduce((n, s) => n + s.activities.length, 0)
  const published = sections.flatMap((s) => s.activities).filter((a) => a.status === 'published')
  const edited = sections.flatMap((s) => s.activities).filter((a) => data.authoredIds.has(a.id))

  return (
    <section aria-labelledby="course-list" className="mt-10">
      <h2 id="course-list" className="sr-only">
        Your courses
      </h2>
      <ul className="grid gap-6 [&>*]:min-w-0">
        <li className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="font-display text-2xl text-ink-100">{course.title}</h3>
              <p className="mt-1.5 max-w-2xl text-sm text-ink-500">{course.description}</p>
              <p className="mt-2 font-mono text-[0.625rem] text-ink-700">
                {course.code} · v{course.version} · {course.status}
              </p>
            </div>
            <Link
              to={`/teacher/courses/${course.id}`}
              className="shrink-0 rounded-pill border border-accent-400/50 px-4 py-2 font-mono text-xs text-accent-300 transition-colors hover:bg-accent-400/10 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none"
            >
              Open builder →
            </Link>
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-4">
            <Stat label="Sections" value={sections.length} />
            <Stat label="Activities" value={total} />
            <Stat label="Published" value={`${published.length}/${total}`} />
          </dl>

          <ol className="mt-6 flex flex-col gap-1.5">
            {sections.map((section) => (
              <li key={section.id} className="flex items-center gap-3 text-sm">
                <span className="w-6 shrink-0 font-mono text-[0.625rem] text-ink-700 tabular-nums">
                  {String(section.order + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 truncate text-ink-300">{section.title}</span>
                <span className="shrink-0 font-mono text-[0.625rem] text-ink-600 tabular-nums">
                  {section.activities.filter((a) => a.status === 'published').length}/
                  {section.activities.length}
                </span>
              </li>
            ))}
          </ol>

          {edited.length > 0 && (
            <p className="mt-5 border-t border-lab-700 pt-4 font-mono text-[0.625rem] text-ink-500">
              {edited.length} {edited.length === 1 ? 'activity has' : 'activities have'} edits
              stored in this browser
            </p>
          )}
        </li>
      </ul>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0">
      <dd className="font-display text-2xl text-ink-100 tabular-nums">{value}</dd>
      <dt className="mt-0.5 font-mono text-[0.5625rem] tracking-widest text-ink-600 uppercase">
        {label}
      </dt>
    </div>
  )
}
