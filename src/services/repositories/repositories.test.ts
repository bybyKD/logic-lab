import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SEED_ATTEMPTS, SEED_SUBMISSIONS } from '../../data/seed'
import { PERSIST_KEYS, readPersisted } from '../storage/persistence'

/**
 * Repository behaviour: seed as the base layer, localStorage as the overlay.
 *
 * Each test re-imports the module because the repositories cache their reads in
 * module scope — the same stale-cache bug this suite exists to catch.
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

describe('attemptRepository', () => {
  it('serves the seeded attempts when nothing is persisted', async () => {
    const { attemptRepository } = await load()
    const attempts = await attemptRepository.list()
    expect(attempts).toHaveLength(SEED_ATTEMPTS.length)
  })

  it('prefers a persisted overlay over the seed', async () => {
    store.setItem('logiclab.v1.attempts', JSON.stringify([{ id: 'only-one' }]))
    const { attemptRepository } = await load()
    expect(await attemptRepository.list()).toEqual([{ id: 'only-one' }])
  })

  it('writes a saved attempt through to storage', async () => {
    const { attemptRepository } = await load()
    const attempt = { ...SEED_ATTEMPTS[0], id: 'new-attempt' }
    await attemptRepository.save(attempt)

    expect(readPersisted<unknown[]>(PERSIST_KEYS.attempts, [])).toHaveLength(
      SEED_ATTEMPTS.length + 1,
    )
  })

  it('replaces rather than duplicates when saving an existing id', async () => {
    const { attemptRepository } = await load()
    const existing = SEED_ATTEMPTS[0]
    await attemptRepository.save({ ...existing, score: 55 })

    const list = await attemptRepository.list()
    expect(list).toHaveLength(SEED_ATTEMPTS.length)
    expect(list.find((a) => a.id === existing.id)?.score).toBe(55)
  })

  it('filters by student and orders newest first', async () => {
    const { attemptRepository } = await load()
    const studentId = SEED_ATTEMPTS[0].studentId
    const list = await attemptRepository.listByStudent(studentId)
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((a) => a.studentId === studentId)).toBe(true)
    expect([...list].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))).toEqual(list)
  })

  it('filters by activity', async () => {
    const { attemptRepository } = await load()
    const activityId = SEED_ATTEMPTS[0].activityId
    const list = await attemptRepository.listByActivity(activityId)
    expect(list.every((a) => a.activityId === activityId)).toBe(true)
  })

  it('rejects an unknown student rather than inventing one', async () => {
    const { classRepository } = await load()
    await expect(classRepository.getStudent('nope')).rejects.toThrow(/not found/)
  })
})

describe('submissionRepository', () => {
  it('lists seeded submissions', async () => {
    const { submissionRepository } = await load()
    expect(await submissionRepository.list()).toHaveLength(SEED_SUBMISSIONS.length)
  })

  it('surfaces ungraded submissions for the review queue', async () => {
    const { submissionRepository } = await load()
    const pending = await submissionRepository.listPending()
    expect(pending.length).toBeGreaterThan(0)
    expect(pending.every((s) => s.status === 'submitted')).toBe(true)
  })
})

describe('resetDemoData', () => {
  it('restores the seeded classroom after a write', async () => {
    // Regression: `save` appends in place and the seed is a shared module-level
    // array, so without a defensive copy the first write corrupts the baseline
    // that every reset restores to, and the demo silently drifts.
    const { attemptRepository, resetDemoData } = await load()
    await attemptRepository.save({ ...SEED_ATTEMPTS[0], id: 'scratch' })
    expect(await attemptRepository.list()).toHaveLength(SEED_ATTEMPTS.length + 1)

    resetDemoData()
    // Cache is dropped too, so the reset is visible without a reload.
    expect(await attemptRepository.list()).toHaveLength(SEED_ATTEMPTS.length)
  })

  it('drops the scratch attempt rather than keeping it in the seed', async () => {
    const { attemptRepository, resetDemoData } = await load()
    await attemptRepository.save({ ...SEED_ATTEMPTS[0], id: 'scratch' })
    resetDemoData()
    const ids = (await attemptRepository.list()).map((a) => a.id)
    expect(ids).not.toContain('scratch')
  })
})

describe('courseRepository', () => {
  it('lists sections in course order', async () => {
    const { courseRepository } = await load()
    const sections = await courseRepository.listSections()
    expect(sections.length).toBe(10)
    expect(sections[0].order).toBeLessThan(sections[1].order)
  })

  it('throws for an unknown activity', async () => {
    const { courseRepository } = await load()
    await expect(courseRepository.getActivity('nope')).rejects.toThrow(/not found/)
  })
})
