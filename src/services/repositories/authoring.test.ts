import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ACTIVITIES, SEED_SUBMISSIONS } from '../../data/seed'

/**
 * The Phase 4 write paths: the authored-activity overlay and grading a
 * submission.
 *
 * Split from `repositories.test.ts` because that file deliberately re-imports
 * the module per test to catch stale module-scope caches, and it covers the
 * read/seed contract. These tests are about what a *write* leaves behind: an edit
 * must overlay the seed rather than mutate it, and a grade plus its comment must
 * land together.
 */

function fakeStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    key: (i: number) => [...map.keys()][i] ?? null,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  } as Storage
}

let store: Storage

beforeEach(() => {
  store = fakeStorage()
  vi.stubGlobal('localStorage', store)
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const load = () => import('./index')

const CODE_LAB = ACTIVITIES.find((a) => a.kind === 'codeLab')!
const PENDING = SEED_SUBMISSIONS.find((s) => s.status === 'submitted')!

describe('courseRepository.saveActivity', () => {
  it('overlays the activity on later reads', async () => {
    const { courseRepository } = await load()
    await courseRepository.saveActivity({ ...CODE_LAB, title: 'Recursion, rewritten' })

    expect((await courseRepository.getActivity(CODE_LAB.id)).title).toBe('Recursion, rewritten')
  })

  it('leaves the seed array untouched', async () => {
    const { courseRepository } = await load()
    await courseRepository.saveActivity({ ...CODE_LAB, title: 'Recursion, rewritten' })

    expect(ACTIVITIES.find((a) => a.id === CODE_LAB.id)?.title).not.toBe('Recursion, rewritten')
  })

  it('refuses an id that is not in the course, so a typo cannot invent one', async () => {
    const { courseRepository } = await load()

    await expect(
      courseRepository.saveActivity({ ...CODE_LAB, id: 'act-does-not-exist' }),
    ).rejects.toThrow(/not found/)
  })

  it('is visible to a fresh module instance, which is what a reload does', async () => {
    const { courseRepository } = await load()
    await courseRepository.saveActivity({ ...CODE_LAB, title: 'Persisted' })
    const written = store.getItem('logiclab.v1.authoredActivities')
    expect(written).toContain('Persisted')

    // Drop every in-memory cache but keep the stored bytes, exactly like closing
    // and reopening the tab. A write that only reached the module cache would
    // read back as the seed here.
    vi.resetModules()
    const reloaded = await load()
    expect((await reloaded.courseRepository.getActivity(CODE_LAB.id)).title).toBe('Persisted')
  })

  it('restores the original course on reset', async () => {
    // `resetDemoData` has to come from the same module instance as the
    // repository under test: it nulls that instance's caches, so the statically
    // imported one would leave the overlay alive in memory here.
    const { courseRepository, resetDemoData } = await load()
    const original = await courseRepository.getActivity(CODE_LAB.id)
    await courseRepository.saveActivity({ ...CODE_LAB, title: 'Recursion, rewritten' })

    resetDemoData()

    expect((await courseRepository.getActivity(CODE_LAB.id)).title).toBe(original.title)
    expect(await courseRepository.listAuthored()).toEqual([])
  })

  it('reports authored activities for the studio', async () => {
    const { courseRepository } = await load()
    expect(await courseRepository.listAuthored()).toEqual([])

    await courseRepository.saveActivity({ ...CODE_LAB, title: 'Mine' })

    expect((await courseRepository.listAuthored()).map((a) => a.title)).toEqual(['Mine'])
  })

  it('preserves section order when one activity is edited', async () => {
    const { courseRepository } = await load()
    const before = (await courseRepository.listAllActivities()).map((a) => a.id)

    // The studio edits one activity and has no business renumbering the section
    // around it, so `order` is stored as given.
    await courseRepository.saveActivity({ ...CODE_LAB, order: 99 })

    expect((await courseRepository.listAllActivities()).map((a) => a.id)).toEqual(before)
  })

  it('returns every activity in the course', async () => {
    const { courseRepository } = await load()
    expect(await courseRepository.listAllActivities()).toHaveLength(ACTIVITIES.length)
  })
})

describe('courseRepository.setPublished', () => {
  it('flips publish state on the activity itself', async () => {
    const { courseRepository } = await load()

    const published = await courseRepository.setPublished(CODE_LAB.id, true)
    expect(published.status).toBe('published')
    expect((await courseRepository.getActivity(CODE_LAB.id)).status).toBe('published')

    const unpublished = await courseRepository.setPublished(CODE_LAB.id, false)
    expect(unpublished.status).toBe('draft')
  })
})

describe('submissionRepository.gradeWithFeedback', () => {
  const grade = (overrides: Partial<typeof PENDING> = {}) => ({
    ...PENDING,
    status: 'graded' as const,
    score: 8,
    grade: {
      score: 8,
      maxScore: 10,
      gradedBy: 'teacher-rina',
      gradedAt: '2026-09-26T10:00:00.000Z',
    },
    ...overrides,
  })

  const comment = (body: string) => ({
    id: 'fb-new',
    submissionId: PENDING.id,
    authorId: 'teacher-rina',
    authorRole: 'teacher' as const,
    kind: 'comment' as const,
    body,
    createdAt: '2026-09-26T10:00:00.000Z',
  })

  it('grades the submission and stores the comment together', async () => {
    const { submissionRepository, feedbackRepository } = await load()

    await submissionRepository.gradeWithFeedback(grade(), comment('Nice refactor.'))

    const mine = await submissionRepository.listByStudent(PENDING.studentId)
    expect(mine.find((s) => s.id === PENDING.id)?.status).toBe('graded')
    expect(await submissionRepository.listPending()).not.toContainEqual(
      expect.objectContaining({ id: PENDING.id }),
    )
    const notes = await feedbackRepository.listByStudent(PENDING.studentId)
    expect(notes.find((f) => f.id === 'fb-new')?.body).toBe('Nice refactor.')
  })

  it('replaces the comment when the same submission is graded again', async () => {
    const { submissionRepository, feedbackRepository } = await load()

    await submissionRepository.gradeWithFeedback(grade(), comment('First pass.'))
    await submissionRepository.gradeWithFeedback(grade({ score: 9 }), comment('Second look.'))

    // Keyed on the submission, so re-grading replaces the note rather than
    // stacking a second copy of it on the same work.
    const notes = (await feedbackRepository.listByStudent(PENDING.studentId)).filter(
      (f) => f.authorId === 'teacher-rina',
    )
    expect(notes).toHaveLength(1)
    expect(notes[0].body).toBe('Second look.')
  })

  it('grades without writing a comment when there is nothing to say', async () => {
    const { submissionRepository, feedbackRepository } = await load()
    const before = (await feedbackRepository.list()).length

    await submissionRepository.gradeWithFeedback(grade({ score: 6 }), null)

    const mine = await submissionRepository.listByStudent(PENDING.studentId)
    expect(mine.find((s) => s.id === PENDING.id)?.score).toBe(6)
    expect((await feedbackRepository.list()).length).toBe(before)
  })

  it('rejects a grade for a submission that does not exist', async () => {
    const { submissionRepository } = await load()

    await expect(
      submissionRepository.gradeWithFeedback(grade({ id: 'sub-nope' }), null),
    ).rejects.toThrow(/not found/)
  })

  it('does not change what attempts read', async () => {
    const { submissionRepository, attemptRepository } = await load()
    const attempts = await attemptRepository.list()

    await submissionRepository.gradeWithFeedback(grade(), null)

    expect(await attemptRepository.list()).toEqual(attempts)
  })
})
