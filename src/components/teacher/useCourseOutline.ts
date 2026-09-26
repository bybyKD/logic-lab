import { useCallback } from 'react'
import { useAsync, type AsyncResult } from '../ui/AsyncBoundary'
import { courseRepository } from '../../services/repositories'
import type { Activity, Course, Section } from '../../domain'

/**
 * The course outline every teacher screen needs: the course, its sections, every
 * activity in section order, and which activities the teacher has edited locally.
 *
 * Loading it in one place means the builder, the studio and the publish state all
 * read the same shape, and `reload` gives every screen a way to re-read the
 * overlay after a write instead of each one hand-rolling a cache bust.
 */

export interface SectionOutline extends Section {
  activities: Activity[]
}

export interface CourseOutline {
  course: Course
  sections: SectionOutline[]
  /** Ids the teacher has edited, i.e. what `listAuthored` returns. */
  authoredIds: Set<string>
}

async function loadOutline(): Promise<CourseOutline> {
  const [course, sections, activities, authored] = await Promise.all([
    courseRepository.getCourse(),
    courseRepository.listSections(),
    courseRepository.listAllActivities(),
    courseRepository.listAuthored(),
  ])

  return {
    course,
    sections: sections
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((section) => ({
        ...section,
        // `listAllActivities` is already in section order, so a filter preserves
        // it without re-sorting.
        activities: activities.filter((a) => a.sectionId === section.id),
      })),
    authoredIds: new Set(authored.map((a) => a.id)),
  }
}

/**
 * Loads the outline, exposing `reload` for after a write.
 *
 * The reload key is a dep of `useAsync`, so a publish toggle re-reads the
 * overlay rather than patching local state — the overlay is the source of truth
 * for an edit, and a component that guessed at the result would drift from it.
 */
export function useCourseOutline(): AsyncResult<CourseOutline> & { reload: () => void } {
  const state = useAsync(loadOutline, [])
  const { retry } = state
  const reload = useCallback(() => retry(), [retry])
  return { ...state, reload }
}
