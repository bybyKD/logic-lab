import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PERSIST_KEYS,
  clearPersisted,
  readPersisted,
  writePersisted,
} from '../storage/persistence'

/** Minimal in-memory Storage so tests do not depend on jsdom or a real browser. */
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
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('persistence', () => {
  it('round-trips a value', () => {
    writePersisted('attempts', [{ id: 'a1' }])
    expect(readPersisted('attempts', [])).toEqual([{ id: 'a1' }])
  })

  it('namespaces every key under the version prefix', () => {
    writePersisted('attempts', [1])
    expect(store.getItem('logiclab.v1.attempts')).toBe('[1]')
  })

  it('returns the fallback when the key is absent', () => {
    expect(readPersisted('attempts', 'fallback')).toBe('fallback')
  })

  it('falls back and drops the key when the stored JSON is corrupt', () => {
    store.setItem('logiclab.v1.attempts', '{not json')
    expect(readPersisted('attempts', 'fallback')).toBe('fallback')
    expect(store.getItem('logiclab.v1.attempts')).toBeNull()
  })

  it('does not crash when storage throws on read', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    })
    expect(readPersisted('attempts', 'fallback')).toBe('fallback')
    expect(() => writePersisted('attempts', 1)).not.toThrow()
    expect(() => clearPersisted('attempts')).not.toThrow()
  })

  it('does not crash when localStorage is entirely absent', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(readPersisted('attempts', 'fallback')).toBe('fallback')
    expect(() => writePersisted('attempts', 1)).not.toThrow()
  })

  it('keeps different keys isolated', () => {
    writePersisted('attempts', ['a'])
    writePersisted('submissions', ['s'])
    expect(readPersisted('attempts', [])).toEqual(['a'])
    expect(readPersisted('submissions', [])).toEqual(['s'])
  })

  it('clears a single key without touching the others', () => {
    writePersisted('attempts', ['a'])
    writePersisted('submissions', ['s'])
    clearPersisted('attempts')
    expect(readPersisted('attempts', [])).toEqual([])
    expect(readPersisted('submissions', [])).toEqual(['s'])
  })

  it('exposes a stable key for every persisted collection', () => {
    expect(Object.values(PERSIST_KEYS)).toContain('attempts')
    expect(Object.values(PERSIST_KEYS)).toContain('session')
  })
})
