import { cn } from '../../utils/cn'

interface GlassPanelProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export function GlassPanel({ children, className, style }: GlassPanelProps) {
  return (
    <div className={cn('glass rounded-md', className)} style={style}>
      {children}
    </div>
  )
}
