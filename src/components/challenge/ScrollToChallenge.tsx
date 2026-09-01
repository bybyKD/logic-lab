import { Link } from 'react-router-dom'

export function ScrollToChallenge({ label }: { label: string }) {
  return (
    <Link
      to="/challenges"
      className="group inline-flex items-center gap-2 font-mono text-xs text-accent-400 transition-colors hover:text-accent-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 rounded"
    >
      {label}
      <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
    </Link>
  )
}