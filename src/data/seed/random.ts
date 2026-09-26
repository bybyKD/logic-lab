/**
 * Deterministic pseudo-randomness for seed data.
 *
 * Seeded cohort data must not use `Math.random()`: the classroom screen shows
 * counts, and counts that change on every reload look like a bug. Same seed
 * always produces the same classroom.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(random: () => number, items: T[]): T {
  return items[Math.floor(random() * items.length)]
}

export function pickSome<T>(random: () => number, items: T[], count: number): T[] {
  const pool = [...items]
  const out: T[] = []
  const take = Math.min(count, pool.length)
  for (let i = 0; i < take; i += 1) {
    const index = Math.floor(random() * pool.length)
    out.push(pool.splice(index, 1)[0])
  }
  return out
}
