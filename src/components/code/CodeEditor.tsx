import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { type LanguageId } from '../../data/languages'
import { LanguageSwitcher } from './LanguageSwitcher'
import { cn } from '../../utils/cn'
import type { ExecutionResult, ExecutionStatus } from '../../services/execution'

interface CodeEditorProps {
  language: LanguageId
  onLanguageChange: (id: LanguageId) => void
  value: string
  onChange: (value: string) => void
  onRun: () => void
  onReset: () => void
  result?: ExecutionResult | null
  running?: boolean
  className?: string
  readOnly?: boolean
  height?: string
  /**
   * Restrict the language tabs to these, in this order. Omitted shows all four,
   * which is the existing behaviour every current caller relies on.
   */
  allowedLanguages?: readonly LanguageId[]
}

const STATUS_STYLES: Record<ExecutionStatus, string> = {
  ok: 'text-success',
  failed: 'text-error',
  error: 'text-error',
  unsupported: 'text-warning',
}

/**
 * Premium Monaco-based code editor with language switcher,
 * Run / Reset controls, and an output panel.
 *
 * Takes an `ExecutionResult` rather than a local output/error shape, so the panel
 * cannot disagree with the execution contract about what happened — in
 * particular it can show `unsupported` honestly instead of a blank red output.
 */
export function CodeEditor({
  language,
  onLanguageChange,
  value,
  onChange,
  onRun,
  onReset,
  result,
  running,
  className,
  readOnly,
  height = '320px',
  allowedLanguages,
}: CodeEditorProps) {
  const [ready, setReady] = useState(false)

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-lab-700 bg-lab-900 shadow-panel',
        className,
      )}
    >
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-lab-700 bg-lab-850 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <LanguageSwitcher
            value={language}
            onChange={onLanguageChange}
            size="sm"
            allowed={allowedLanguages}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 font-mono text-[0.625rem] text-ink-600 sm:flex">
            <span className={cn('h-1.5 w-1.5 rounded-full', ready ? 'bg-success' : 'bg-warning')} />
            {ready ? 'READY' : 'LOADING'}
          </span>
          <button
            type="button"
            onClick={onReset}
            className="rounded-pill border border-lab-600 px-4 py-1.5 font-mono text-xs text-ink-500 transition-colors hover:border-lab-500 hover:text-ink-300"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onRun}
            disabled={running}
            className={cn(
              'flex items-center gap-2 rounded-pill px-4 py-1.5 font-mono text-xs font-medium transition-all',
              running
                ? 'cursor-wait bg-lab-700 text-ink-500'
                : 'bg-accent-400 text-lab-950 hover:bg-accent-300',
            )}
          >
            {running ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border border-lab-950/30 border-t-lab-950" />
                RUNNING
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                RUN
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div style={{ height }}>
        <Editor
          height="100%"
          language={language}
          value={value}
          onChange={(v) => onChange(v ?? '')}
          theme="vs-dark"
          onMount={() => setReady(true)}
          loading={
            <div className="flex h-full items-center justify-center gap-2 text-xs text-ink-600">
              <span className="h-3 w-3 animate-spin rounded-full border border-ink-600 border-t-accent-400" />
              Memuat editor…
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 13.5,
            fontFamily: 'JetBrains Mono, monospace',
            fontLigatures: true,
            lineNumbersMinChars: 3,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            readOnly,
            // Without this the editor keeps focus on every Tab, and a keyboard user
            // can never reach Run or Submit. Escape is the way to indent instead.
            tabFocusMode: true,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            automaticLayout: true,
            renderWhitespace: 'none',
            scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
          }}
        />
      </div>

      {/* Output panel */}
      <div className="border-t border-lab-700 bg-lab-950">
        <div className="flex items-center justify-between px-4 py-2">
          <p className="technical-label">OUTPUT</p>
          {result && (
            <span className="font-mono text-[0.625rem] text-ink-600">
              {result.status.toUpperCase()} · executed in {result.durationMs}ms
            </span>
          )}
        </div>
        <div className="min-h-[72px] px-4 pb-4 font-mono text-sm leading-relaxed">
          {running ? (
            <p className="flex items-center gap-2 text-ink-500">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-400" />
              Menjalankan program…
            </p>
          ) : result ? (
            <>
              <pre className={cn('whitespace-pre-wrap', STATUS_STYLES[result.status])}>
                {result.stdout || result.stderr}
              </pre>
              {result.note && result.status !== 'ok' && (
                <p className="mt-2 font-sans text-xs leading-relaxed text-ink-500">
                  {result.note}
                </p>
              )}
            </>
          ) : (
            <p className="text-ink-600">Tekan <span className="text-accent-400">Run ▶</span> untuk mengeksekusi.</p>
          )}
        </div>
      </div>
    </div>
  )
}