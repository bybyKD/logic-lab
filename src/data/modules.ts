export type Difficulty = 'Pemula' | 'Menengah' | 'Lanjut'

export interface Module {
  id: number
  index: string
  title: string
  subtitle: string
  description: string
  difficulty: Difficulty
  minutes: number
  progress: number // 0-100
  completed: boolean
  locked: boolean
  color: string
  skills: string[]
}

export const MODULES: Module[] = [
  {
    id: 1,
    index: '01',
    title: 'Computational Thinking',
    subtitle: 'Pikir seperti komputer.',
    description:
      'Dekomposisi, pengenalan pola, abstraksi, dan algoritma — dasar berpikir komputasional sebelum menulis kode.',
    difficulty: 'Pemula',
    minutes: 15,
    progress: 100,
    completed: true,
    locked: false,
    color: '#38bdf8',
    skills: ['Dekomposisi', 'Pola', 'Abstraksi', 'Algoritma'],
  },
  {
    id: 2,
    index: '02',
    title: 'Variables & Data Types',
    subtitle: 'Kotak penyimpan nilai.',
    description:
      'Bagaimana program menyimpan data: variabel, angka, teks, dan tipe data boolean di keempat bahasa.',
    difficulty: 'Pemula',
    minutes: 12,
    progress: 100,
    completed: true,
    locked: false,
    color: '#38bdf8',
    skills: ['Variabel', 'Tipe data', 'Konstanta'],
  },
  {
    id: 3,
    index: '03',
    title: 'Operators',
    subtitle: 'Perbandingan dan aritmatika.',
    description:
      'Operator aritmatika, perbandingan, dan logika — fondasi untuk membuat keputusan di dalam program.',
    difficulty: 'Pemula',
    minutes: 10,
    progress: 92,
    completed: false,
    locked: false,
    color: '#4ade80',
    skills: ['Aritmatika', 'Perbandingan', 'Logika'],
  },
  {
    id: 4,
    index: '04',
    title: 'Conditional Logic',
    subtitle: 'Buat keputusan.',
    description:
      'Percabangan if/else untuk mengontrol alur eksekusi berdasarkan kondisi tertentu.',
    difficulty: 'Menengah',
    minutes: 12,
    progress: 80,
    completed: false,
    locked: false,
    color: '#4ade80',
    skills: ['if', 'else', 'percabangan'],
  },
  {
    id: 5,
    index: '05',
    title: 'Loops',
    subtitle: 'Ulangi tanpa bosan.',
    description:
      'Perulangan for dan while untuk memproses data berulang kali dengan efisien.',
    difficulty: 'Menengah',
    minutes: 14,
    progress: 63,
    completed: false,
    locked: false,
    color: '#4ade80',
    skills: ['for', 'while', 'iterasi'],
  },
  {
    id: 6,
    index: '06',
    title: 'Functions',
    subtitle: 'Pisah jadi bagian kecil.',
    description:
      'Membuat fungsi untuk membungkus logika menjadi potongan yang dapat dipakai kembali.',
    difficulty: 'Menengah',
    minutes: 15,
    progress: 51,
    completed: false,
    locked: false,
    color: '#fbbf24',
    skills: ['fungsi', 'parameter', 'return'],
  },
  {
    id: 7,
    index: '07',
    title: 'Arrays',
    subtitle: 'Kumpulan data.',
    description:
      'Menyimpan banyak nilai dalam satu struktur dan mengaksesnya dengan indeks.',
    difficulty: 'Menengah',
    minutes: 16,
    progress: 30,
    completed: false,
    locked: false,
    color: '#fbbf24',
    skills: ['indeks', 'elemen', 'iterasi array'],
  },
  {
    id: 8,
    index: '08',
    title: 'Strings',
    subtitle: 'Bekerja dengan teks.',
    description:
      'Operasi pada string: penggabungan, pencarian, dan manipulasi teks.',
    difficulty: 'Menengah',
    minutes: 13,
    progress: 0,
    completed: false,
    locked: true,
    color: '#fbbf24',
    skills: ['concatenation', 'substring', 'teks'],
  },
  {
    id: 9,
    index: '09',
    title: 'Algorithms',
    subtitle: 'Urutan langkah penyelesaian.',
    description:
      'Algoritma klasik: pencarian, pengurutan, dan strategi penyelesaian masalah.',
    difficulty: 'Lanjut',
    minutes: 20,
    progress: 0,
    completed: false,
    locked: true,
    color: '#f87171',
    skills: ['pencarian', 'pengurutan', 'logika'],
  },
  {
    id: 10,
    index: '10',
    title: 'Final Logic Challenge',
    subtitle: 'Uji seluruh pemahaman.',
    description:
      'Tantangan akhir yang menggabungkan semua materi dari modul 1 hingga 9.',
    difficulty: 'Lanjut',
    minutes: 25,
    progress: 0,
    completed: false,
    locked: true,
    color: '#f87171',
    skills: ['integrasi', 'debugging', 'design'],
  },
]
