import { useMemo, useState } from 'react'
import type { Participant } from '../../data/participants'
import { cn } from '../../utils/cn'

type SortKey = 'name' | 'progress' | 'score' | 'challenges' | 'lastActive'

interface ParticipantTableProps {
  participants: Participant[]
  onSelect: (p: Participant) => void
}

const STATUS_STYLES: Record<
  Participant['status'],
  string
> = {
  Aktif: 'border-success/40 bg-success/5 text-success',
  Asisten: 'border-accent-400/40 bg-accent-400/5 text-accent-300',
  'Tidak Aktif': 'border-lab-600 bg-lab-800 text-ink-600',
}

export function ParticipantTable({ participants, onSelect }: ParticipantTableProps) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortAsc, setSortAsc] = useState(false)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    const list = participants.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    )
    return list.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      let cmp = 0
      if (typeof av === 'string' && typeof bv === 'string') {
        cmp = av.localeCompare(bv)
      } else {
        cmp = Number(av) - Number(bv)
      }
      return sortAsc ? cmp : -cmp
    })
  }, [participants, query, sortKey, sortAsc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((v) => !v)
    } else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const headerBtn = (key: SortKey, label: string) => (
    <button
      type="button"
      onClick={() => toggleSort(key)}
      className={cn(
        'font-mono text-[0.625rem] tracking-widest uppercase transition-colors hover:text-ink-200',
        sortKey === key ? 'text-accent-400' : 'text-ink-600',
      )}
    >
      {label}
      {sortKey === key && <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>}
    </button>
  )

  return (
    <div className="panel overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lab-700 px-5 py-4">
        <p className="technical-label">PARTICIPANT DIRECTORY / {filtered.length}</p>
        <div className="relative">
          <svg
            aria-hidden
            className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-600"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari peserta…"
            aria-label="Cari peserta"
            className="w-52 rounded-pill border border-lab-600 bg-lab-900 py-2 pr-4 pl-9 font-mono text-xs text-ink-100 placeholder:text-ink-600 focus:border-accent-400/60 focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-lab-700 bg-lab-850/60">
              <th className="px-5 py-3">{headerBtn('name', 'Participant')}</th>
              <th className="px-4 py-3">{headerBtn('progress', 'Progress')}</th>
              <th className="px-4 py-3">{headerBtn('score', 'Score')}</th>
              <th className="px-4 py-3">{headerBtn('challenges', 'Challenges')}</th>
              <th className="px-4 py-3">{headerBtn('lastActive', 'Last Active')}</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => (
              <tr
                key={p.id}
                onClick={() => onSelect(p)}
                className={cn(
                  'cursor-pointer border-b border-lab-800/70 transition-colors hover:bg-lab-800/50',
                  idx % 2 === 0 && 'bg-lab-900/30',
                )}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill border border-lab-600 bg-lab-800 font-mono text-xs text-ink-300">
                      {p.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink-100">{p.name}</p>
                      <p className="font-mono text-[0.625rem] text-ink-600">{p.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="w-28">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-lab-700">
                      <div
                        className="h-1.5 rounded-full bg-accent-400"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <p className="mt-1.5 font-mono text-[0.625rem] text-ink-600 tabular-nums">
                      {p.progress}%
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-mono text-sm text-ink-200 tabular-nums">
                  {p.score}
                </td>
                <td className="px-4 py-3.5 font-mono text-sm text-ink-400 tabular-nums">
                  {p.challenges}
                </td>
                <td className="px-4 py-3.5 text-sm text-ink-500">
                  {p.lastActive}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={cn(
                      'rounded-pill border px-2.5 py-1 font-mono text-[0.625rem]',
                      STATUS_STYLES[p.status],
                    )}
                  >
                    {p.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-5 py-10 text-center font-mono text-sm text-ink-600">
            Tidak ada peserta yang cocok.
          </p>
        )}
      </div>
    </div>
  )
}