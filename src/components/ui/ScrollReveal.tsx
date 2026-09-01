import { motion, useReducedMotion } from 'motion/react'
import { cn } from '../../utils/cn'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  y?: number
  /** once vs while-in-view each time */
  once?: boolean
}

/**
 * Wraps content and reveals it smoothly as it scrolls into view.
 * Respects prefers-reduced-motion and becomes a plain block.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  y = 28,
  once = true,
}: ScrollRevealProps) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={cn('will-change-transform', className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
