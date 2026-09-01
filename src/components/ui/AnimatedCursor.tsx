import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../../utils/animations'

/**
 * A soft animated cursor that trails the pointer with a subtle lag.
 * Only active on pointer-fine devices with animation allowed.
 */
export function AnimatedCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (prefersReducedMotion()) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    const pos = { x: -100, y: -100 }
    const dot = { x: -100, y: -100 }
    const ring = { x: -100, y: -100 }
    let raf = 0
    let visible = false

    const onMove = (e: MouseEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      if (!visible) {
        visible = true
        if (dotRef.current && ringRef.current) {
          dotRef.current.style.opacity = '1'
          ringRef.current.style.opacity = '1'
        }
      }
    }

    const onLeave = () => {
      visible = false
      if (dotRef.current && ringRef.current) {
        dotRef.current.style.opacity = '0'
        ringRef.current.style.opacity = '0'
      }
    }

    const loop = () => {
      dot.x += (pos.x - dot.x) * 0.4
      dot.y += (pos.y - dot.y) * 0.4
      ring.x += (pos.x - ring.x) * 0.18
      ring.y += (pos.y - ring.y) * 0.18

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dot.x - 3}px, ${dot.y - 3}px, 0)`
      }
      if (ringRef.current) {
        const ringHover =
          (document.activeElement as HTMLElement | null)?.closest('a,button') ?? null
        const scale = ringHover ? 1.6 : 1
        ringRef.current.style.transform = `translate3d(${ring.x - 16}px, ${ring.y - 16}px, 0) scale(${scale})`
      }
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[100] h-8 w-8 rounded-full border border-accent-400/40 opacity-0 transition-opacity duration-300 will-change-transform"
      />
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[101] h-1.5 w-1.5 rounded-full bg-accent-400 opacity-0 transition-opacity duration-300 will-change-transform"
      />
    </>
  )
}