import type { Activity, Course, Section, Skill } from '../domain'
import { ACTIVITIES, COURSE, SECTIONS } from './seed/course'
import { SKILLS, SKILL_IDS } from './seed/skills'

export { SKILLS, SKILL_IDS }

const SECTION_BY_ID = new Map(SECTIONS.map((s) => [s.id, s]))
const ACTIVITY_BY_ID = new Map(ACTIVITIES.map((a) => [a.id, a]))
const SKILL_BY_ID = new Map(SKILLS.map((s) => [s.id, s]))

export function getCourse(): Course {
  return COURSE
}

export function getSection(sectionId: string): Section | undefined {
  return SECTION_BY_ID.get(sectionId)
}

export function getActivity(activityId: string): Activity | undefined {
  return ACTIVITY_BY_ID.get(activityId)
}

export function getSkill(skillId: string): Skill | undefined {
  return SKILL_BY_ID.get(skillId)
}

/** Sections of the course in teaching order. */
export function listSections(): Section[] {
  return [...SECTIONS].sort((a, b) => a.order - b.order)
}

/** Activities of a section in teaching order. */
export function listSectionActivities(sectionId: string): Activity[] {
  const section = getSection(sectionId)
  if (!section) return []
  return section.activityIds
    .map((id) => getActivity(id))
    .filter((a): a is Activity => Boolean(a))
}

/** Every activity the learner can reach, in course order. */
export function listAllActivities(): Activity[] {
  return ACTIVITIES
}

export function listPublishedActivities(): Activity[] {
  return ACTIVITIES.filter((a) => a.status === 'published')
}

/** Direct children of a skill in the learning graph. */
export function listChildSkills(skillId: string): Skill[] {
  return SKILLS.filter((s) => s.parentId === skillId)
}

/** Root skills, i.e. the domains. */
export function listRootSkills(): Skill[] {
  return SKILLS.filter((s) => s.parentId === null)
}

/** The skill itself plus every descendant, depth first. */
export function listSkillWithDescendants(skillId: string): Skill[] {
  const out: Skill[] = []
  const walk = (id: string) => {
    const skill = getSkill(id)
    if (!skill || out.includes(skill)) return
    out.push(skill)
    listChildSkills(id).forEach((child) => walk(child.id))
  }
  walk(skillId)
  return out
}
