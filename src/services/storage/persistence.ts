/**
 * Namespaced, versioned localStorage.
 *
 * Every read is defensive: storage can be unavailable (private mode), full, or
 * hold data from an older shape. A prototype must never crash on a bad read, so
 * a parse failure falls back to the seed value and the key is dropped.
 */

const NAMESPACE = 'logiclab.v1'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function storage(): StorageLike | null {
  try {
    if (typeof globalThis.localStorage === 'undefined') return null
    return globalThis.localStorage
  } catch {
    return null
  }
}

const fullKey = (key: string) => `${NAMESPACE}.${key}`

export function readPersisted<T>(key: string, fallback: T): T {
  const store = storage()
  if (!store) return fallback
  try {
    const raw = store.getItem(fullKey(key))
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    try {
      store.removeItem(fullKey(key))
    } catch {
      /* nothing else we can do */
    }
    return fallback
  }
}

export function writePersisted<T>(key: string, value: T): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(fullKey(key), JSON.stringify(value))
  } catch {
    /* quota exceeded or storage disabled — prototype keeps running in memory */
  }
}

export function clearPersisted(key: string): void {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(fullKey(key))
  } catch {
    /* ignore */
  }
}

export const PERSIST_KEYS = {
  attempts: 'attempts',
  submissions: 'submissions',
  feedback: 'feedback',
  session: 'session',
  /** Activity ids authored in Content Studio (Phase 4). */
  authoredActivities: 'authoredActivities',
  publishedActivityIds: 'publishedActivityIds',
} as const
