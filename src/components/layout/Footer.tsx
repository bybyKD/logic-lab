import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-lab-800 bg-lab-950">
      <div className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-md border border-accent-400/40 bg-lab-900 font-mono text-sm text-accent-400">
                L
              </span>
              <span className="font-display text-[0.9375rem] font-medium tracking-[0.14em] text-ink-100">
                LOGIC<span className="text-accent-400">LAB</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-ink-500">
              Learn to think like a programmer. Laboratorium Informatika —
              melatih logika pemrograman melalui Python, Java, Go, dan C.
            </p>
          </div>

          <div>
            <p className="technical-label mb-4">Training</p>
            <ul className="space-y-3 text-sm text-ink-300">
              <li><Link to="/learn" className="transition-colors hover:text-accent-300">Dashboard</Link></li>
              <li><Link to="/challenges" className="transition-colors hover:text-accent-300">Challenges</Link></li>
              <li><span className="text-ink-600">Learning Path</span></li>
            </ul>
          </div>

          <div>
            <p className="technical-label mb-4">Language</p>
            <ul className="space-y-3 text-sm text-ink-300">
              <li>Python</li>
              <li>Java</li>
              <li>Go</li>
              <li>C</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-lab-800 pt-6 text-xs text-ink-600 md:flex-row">
          <p>© {new Date().getFullYear()} LOGIC LAB — Laboratorium Informatika</p>
          <p className="font-mono">ONE PROBLEM · ONE LOGIC · MANY WAYS TO CODE IT</p>
        </div>
      </div>
    </footer>
  )
}