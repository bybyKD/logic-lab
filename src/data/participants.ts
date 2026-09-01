export type ParticipantStatus = 'Aktif' | 'Asisten' | 'Tidak Aktif'

export interface ParticipantAttempt {
  challenge: string
  module: number
  result: 'benar' | 'salah'
  timestamp: string
}

export interface Participant {
  id: string
  name: string
  progress: number
  score: number
  challenges: number
  lastActive: string
  status: ParticipantStatus
  modulesCompleted: number
  strengths: string[]
  needsPractice: string[]
  recentAttempts: ParticipantAttempt[]
}

const FIRST_NAMES = [
  'Adi', 'Bima', 'Citra', 'Dewi', 'Eka', 'Farhan', 'Gita', 'Hendra',
  'Intan', 'Joko', 'Kirana', 'Lukman', 'Maya', 'Nanda', 'Putri', 'Rizky',
  'Sari', 'Taufik', 'Umar', 'Vina', 'Wahyu', 'Yuni', 'Zaki', 'Andika',
  'Bunga', 'Candra', 'Dian', 'Eko', 'Fitri', 'Galang', 'Hana', 'Iqbal',
  'Jihan', 'Kevin', 'Laila', 'Miko', 'Nadia', 'Oscar', 'Ratna', 'Satria',
  'Tiara', 'Ujang', 'Vanya', 'Windi', 'Yoga', 'Zahra', 'Aldi', 'Bella',
  'Cakra', 'Dinda', 'Erwin', 'Fira', 'Gilang', 'Hesti', 'Ilham', 'Jasmine',
  'Krisna', 'Laras', 'Mahesa', 'Nabila', 'Oki', 'Pandu', 'Qori', 'Rendra',
  'Sinta', 'Tegar', 'Ulfa', 'Vito', 'Wulan', 'Xaverius', 'Yasmin', 'Zidan',
]

const LAST_NAMES = [
  'Pratama', 'Wijaya', 'Saputra', 'Anggraini', 'Hidayat', 'Nugroho', 'Kusuma',
  'Ramadhan', 'Suryani', 'Santoso', 'Prameswari', 'Gunawan', 'Halim', 'Ismawati',
  'Wibowo', 'Fadhilah', 'Rahmawati', 'Permana', 'Agustina', 'Maulana', 'Utami',
  'Budiarto', 'Cahyono', 'Darmawan', 'Effendi', 'Fernando', 'Handayani', 'Irawan',
  'Jatmiko', 'Kurniawan', 'Lestari', 'Mulyadi', 'Nurhayati', 'Octavian', 'Prayitno',
  'Qotrunnada', 'Rahardian', 'Setyawan', 'Tanjung', 'Utomo', 'Valentino', 'Wardana',
  'Yulianti', 'Zulkarnain', 'Abidin', 'Bastian', 'Dewantara', 'Firdaus',
]

const STATUSES: ParticipantStatus[] = ['Aktif', 'Aktif', 'Aktif', 'Aktif', 'Asisten', 'Tidak Aktif']

function makeName(i: number): string {
  const first = FIRST_NAMES[i % FIRST_NAMES.length]
  const last = LAST_NAMES[(i * 7) % LAST_NAMES.length]
  return `${first} ${last}`
}

function makeStrengths(i: number): string[] {
  const pool = ['Variables', 'Conditions', 'Loops', 'Functions', 'Algorithms', 'Strings', 'Arrays']
  const start = (i * 3) % pool.length
  return [pool[start % pool.length], pool[(start + 2) % pool.length]]
}

function makeWeaknesses(i: number): string[] {
  const pool = ['Loops', 'Functions', 'Algorithms', 'Arrays', 'Strings']
  const start = (i * 5) % pool.length
  return [pool[start % pool.length], pool[(start + 3) % pool.length]]
}

function makeRecent(i: number, count: number): ParticipantAttempt[] {
  const attempts: ParticipantAttempt[] = []
  const modules = [3, 4, 5, 6, 7, 8]
  for (let k = 0; k < count; k++) {
    attempts.push({
      challenge: `Tantangan ${(i * 7 + k * 3) % 30 + 1}`,
      module: modules[(i + k) % modules.length],
      result: (i + k) % 3 === 0 ? 'salah' : 'benar',
      timestamp: `${String(18 + (k % 4))}:${String((i * 7 + k * 9) % 60).padStart(2, '0')}`,
    })
  }
  return attempts
}

function makeParticipant(i: number): Participant {
  const progress = 30 + ((i * 13) % 71)
  const score = 420 + ((i * 43) % 580)
  const modulesCompleted = Math.min(10, Math.round(progress / 10))
  return {
    id: `P${String(i + 1).padStart(3, '0')}`,
    name: makeName(i),
    progress,
    score,
    challenges: 10 + ((i * 7) % 40),
    lastActive:
      i % 6 === 0
        ? '3 hari lalu'
        : i % 2 === 0
          ? 'hari ini'
          : 'Kemarin',
    status: STATUSES[i % STATUSES.length],
    modulesCompleted,
    strengths: makeStrengths(i),
    needsPractice: makeWeaknesses(i),
    recentAttempts: makeRecent(i, 3),
  }
}

export const PARTICIPANTS: Participant[] = Array.from({ length: 80 }, (_, i) =>
  makeParticipant(i),
)

export function getParticipant(id: string): Participant | undefined {
  return PARTICIPANTS.find((p) => p.id === id)
}