import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../utils/cn'
import { GlowButton } from '../ui/GlowButton'

interface NavbarProps {
  variant?: 'public' | 'app'
}

const appLinks = [
  { to: '/dashboard', label: 'Learn' },
  { to: '/challenges', label: 'Challenges' },
  { to: '/admin', label: 'Monitor' },
]

const publicLinks = [
  { href: '#why-logic', label: 'Why Logic' },
  { href: '#languages', label: 'Languages' },
  { href: '#training', label: 'Training' },
  { href: '#about', label: 'About' },
]

export function Navbar({ variant = 'public' }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const isApp = variant === 'app' || pathname.startsWith('/dashboard') || pathname.startsWith('/module') || pathname.startsWith('/challenge')

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-lab-800 bg-lab-950/80 py-2 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent py-4',
      )}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 lg:px-12">
        <Link
          to="/"
          className="group flex items-center gap-2.5"
          aria-label="LOGIC LAB home"
        >
          <span className="grid h-8 w-8 place-items-center rounded-md border border-accent-400/40 bg-lab-900 font-mono text-sm text-accent-400 transition-colors group-hover:border-accent-400">
            L
          </span>
          <span className="font-display text-[0.9375rem] font-medium tracking-[0.14em] text-ink-100">
            LOGIC<span className="text-accent-400">LAB</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {isApp
            ? appLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'text-[0.875rem] text-ink-300 transition-colors hover:text-ink-100 focus-visible:text-ink-100',
                      isActive && 'text-accent-400',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))
            : publicLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[0.875rem] text-ink-300 transition-colors hover:text-ink-100"
                >
                  {link.label}
                </a>
              ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          {isApp ? (
            <>
              <button
                type="button"
                aria-label="Search"
                className="flex items-center gap-2 rounded-pill border border-lab-700 bg-lab-900/60 px-3.5 py-1.5 text-xs text-ink-600 transition-colors hover:border-lab-500 hover:text-ink-300"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                </svg>
                Search
              </button>
              <button
                type="button"
                aria-label="Profile"
                className="grid h-8 w-8 place-items-center rounded-pill border border-lab-600 bg-lab-800 text-xs text-ink-300 transition-all hover:border-accent-400/60 hover:text-accent-300"
              >
                D
              </button>
            </>
          ) : (
            <>
              <GlowButton href="/dashboard" variant="ghost" size="md">
                Login
              </GlowButton>
              <GlowButton href="/dashboard" variant="primary" size="md">
                Start Training
              </GlowButton>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-lab-700 text-ink-300 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <div className="space-y-1.5">
            <span className={cn('block h-px w-4 bg-current transition-transform', menuOpen && 'translate-y-[3.5px] rotate-45')} />
            <span className={cn('block h-px w-4 bg-current transition-transform', menuOpen && '-translate-y-[3.5px] -rotate-45')} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-lab-800 bg-lab-950/95 px-6 py-6 backdrop-blur-md md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-4">
            {isApp
              ? appLinks.map((link) => (
                  <Link key={link.to} to={link.to} className="text-ink-200">
                    {link.label}
                  </Link>
                ))
              : publicLinks.map((link) => (
                  <a key={link.href} href={link.href} className="text-ink-200" onClick={() => setMenuOpen(false)}>
                    {link.label}
                  </a>
                ))}
            <div className="mt-2 flex flex-col gap-3">
              {isApp ? (
                <>
                  <button type="button" className="w-full rounded-pill border border-lab-700 py-2.5 text-sm text-ink-200">
                    Search
                  </button>
                  <Link to="/dashboard" className="w-full rounded-pill border border-lab-700 py-2.5 text-center text-sm text-ink-200">
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <button type="button" className="w-full rounded-pill border border-lab-700 py-2.5 text-sm text-ink-200">
                    Login
                  </button>
                  <Link
                    to="/dashboard"
                    className="w-full rounded-pill bg-accent-400 py-2.5 text-center text-sm font-medium text-lab-950"
                  >
                    Start Training →
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}