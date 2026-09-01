import { useMemo } from 'react'
import { cn } from '../../utils/cn'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
  /** highlight line numbers (1-indexed) */
  highlight?: number[]
  showLineNumbers?: boolean
  maxHeight?: string
}

/**
 * Lightweight syntax-highlighted code display with optional line highlighting.
 * Note: for the fully interactive Monaco editor use the CodeEditor component.
 */
export function CodeBlock({
  code,
  language = 'python',
  className,
  highlight = [],
  showLineNumbers = true,
  maxHeight,
}: CodeBlockProps) {
  const lines = useMemo(() => code.replace(/\n$/, '').split('\n'), [code])

  return (
    <div
      className={cn(
        'overflow-auto rounded-md border border-lab-700 bg-lab-900 font-mono text-[0.8125rem] leading-relaxed',
        className,
      )}
      style={{ maxHeight }}
    >
      <div className="flex items-center justify-between border-b border-lab-700 px-4 py-2">
        <span className="font-mono text-[0.6875rem] tracking-wider text-ink-600 uppercase">
          {language}
        </span>
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-lab-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-lab-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-lab-600" />
        </span>
      </div>
      <div className="p-4">
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              'flex whitespace-pre',
              highlight.includes(i + 1) &&
                'bg-accent-800/30 text-accent-300 -mx-2 px-2',
            )}
          >
            {showLineNumbers && (
              <span className="mr-4 w-6 shrink-0 select-none text-right text-lab-500">
                {String(i + 1).padStart(2, '0')}
              </span>
            )}
            <span className={cn('text-ink-100', highlight.includes(i + 1) && 'text-accent-300')}>
              {line || '\u00A0'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
