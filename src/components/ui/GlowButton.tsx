import { cn } from '../../utils/cn'

interface GlowButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  href?: string
  onClick?: () => void
  className?: string
  size?: 'md' | 'lg'
  disabled?: boolean
  ariaLabel?: string
}

export function GlowButton({
  children,
  variant = 'primary',
  href,
  onClick,
  className,
  size = 'md',
  disabled,
  ariaLabel,
}: GlowButtonProps) {
  const base =
    'group inline-flex items-center justify-center gap-2 rounded-pill font-display font-medium tracking-tight transition-all duration-200 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-lab-950 disabled:cursor-not-allowed disabled:opacity-50'

  const sizes = {
    md: 'px-5 py-2.5 text-[0.9375rem]',
    lg: 'px-7 py-3.5 text-base',
  }

  const variants = {
    primary:
      'bg-accent-400 text-lab-950 hover:bg-accent-300 hover:-translate-y-0.5 active:translate-y-0 shadow-glow',
    secondary:
      'border border-lab-500 bg-lab-800/60 text-ink-100 backdrop-blur hover:border-accent-400/60 hover:text-accent-300 hover:-translate-y-0.5 active:translate-y-0',
    ghost:
      'text-ink-300 hover:text-ink-100 hover:bg-lab-800 hover:-translate-y-0.5',
  }

  const content = (
    <>
      {children}
      <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
        →
      </span>
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        aria-label={ariaLabel}
        className={cn(base, sizes[size], variants[variant], className)}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(base, sizes[size], variants[variant], className)}
    >
      {content}
    </button>
  )
}
