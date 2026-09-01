import type { LanguageId } from '../data/languages'

export interface TraceStep {
  line: number
  code: string
  variables: Record<string, string | number | boolean>
  iteration?: string
  output?: string
  note?: string
}

export interface SimResult {
  output: string
  error?: boolean
  errorType?: 'syntax' | 'runtime' | 'logic'
  trace: TraceStep[]
}

const findLine = (lines: string[], predicate: (l: string) => boolean): number =>
  lines.findIndex((l) => predicate(l))

const firstLine = (lines: string[], predicate: (l: string) => boolean): string =>
  lines.find((l) => predicate(l))?.trim() ?? ''

/**
 * Client-side code simulator.
 * Recognizes a set of known program patterns and produces expected output
 * plus a line-by-line variable trace. This is intentionally a small
 * interpreter only for the bundled examples — not a full runtime.
 * Returns null when the code isn't recognized.
 */
export function simulateCode(language: LanguageId, code: string): SimResult | null {
  void language
  const lines = code.split('\n')

  // ---- Pattern A: conditional age (Dewasa / Minor) ----
  const ageMatch = code.match(/age\s*[=:]\s*(\d+)/)
  if (ageMatch && /Dewasa/.test(code)) {
    const age = Number(ageMatch[1])
    const adult = age >= 18
    const outcome = adult ? 'Dewasa' : 'Minor'
    const ifLine = findLine(lines, (l) => l.includes('if'))
    const resultLine =
      findLine(lines, (l) => l.includes(outcome)) + 1 || lines.length

    const trace: TraceStep[] = [
      {
        line: 1,
        code: lines[0] ?? '',
        variables: { age },
        note: 'Variabel age disimpan.',
      },
      {
        line: ifLine + 1,
        code: firstLine(lines, (l) => l.includes('if')),
        variables: { age },
        note: `Kondisi: ${age} >= 18 → ${adult ? 'TRUE' : 'FALSE'}`,
      },
      {
        line: resultLine,
        code: firstLine(lines, (l) => l.includes(outcome)),
        variables: { age },
        output: outcome,
      },
    ]
    return { output: outcome, trace }
  }

  // ---- Pattern B: loop accumulator (x = 0 … for i in range(n) : x += i … print) ----
  const rangeMatch = code.match(/range\((\d+)\)/)
  if (rangeMatch && /x\s*\+=/.test(code)) {
    const n = Number(rangeMatch[1])
    const xLine = findLine(lines, (l) => /(^|\s)x\s*=/.test(l))
    const forLine = findLine(lines, (l) => /for\s+i/.test(l))
    const accLine = findLine(lines, (l) => /x\s*\+=/.test(l))
    const printLine = findLine(lines, (l) => /print|printf|fmt\.Print|System\.out/.test(l))
    const trace: TraceStep[] = []
    let x = 0

    if (xLine >= 0) {
      trace.push({
        line: xLine + 1,
        code: lines[xLine].trim(),
        variables: { x, i: 0 },
        note: 'Akumulator dimulai dari 0.',
      })
    }
    if (forLine >= 0) {
      trace.push({
        line: forLine + 1,
        code: lines[forLine].trim(),
        variables: { x, i: 0 },
        iteration: '1 / 5',
        note: `Program akan mengulang ${n} kali.`,
      })
    }
    for (let i = 0; i < n; i++) {
      x += i
      trace.push({
        line: (accLine >= 0 ? accLine : forLine) + 1,
        code: accLine >= 0 ? lines[accLine].trim() : 'x += i',
        variables: { x, i },
        iteration: `${i + 1} / ${n}`,
      })
    }
    const finalX = (n * (n - 1)) / 2
    if (printLine >= 0) {
      trace.push({
        line: printLine + 1,
        code: lines[printLine].trim(),
        variables: { x: finalX, i: n - 1 },
        output: String(finalX),
      })
    }
    return { output: String(finalX), trace }
  }

  // ---- Pattern C: conditional mutation (predict-the-output) ----
  const xyMatch = code.match(/x\s*=\s*(\d+)[\s\S]*?y\s*=\s*(\d+)/)
  if (xyMatch && /x\s*=\s*x\s*\+\s*(\d+)/.test(code)) {
    let x = Number(xyMatch[1])
    const y = Number(xyMatch[2])
    const add = Number(code.match(/x\s*=\s*x\s*\+\s*(\d+)/)?.[1] ?? 3)
    const ifLine = findLine(lines, (l) => l.includes('if'))
    const addLine = findLine(lines, (l) => /x\s*=\s*x\s*\+/.test(l))
    const printLine = findLine(lines, (l) => /print|printf|fmt\.Print|System\.out/.test(l))
    const condTrue = x > y
    const trace: TraceStep[] = []

    if (lines[0]) trace.push({ line: 1, code: lines[0].trim(), variables: { x, y } })
    if (lines[1]) trace.push({ line: 2, code: lines[1].trim(), variables: { x, y } })
    trace.push({
      line: ifLine + 1,
      code: lines[ifLine]?.trim() ?? '',
      variables: { x: condTrue ? x : x, y },
      note: `Kondisi x > y → ${condTrue ? 'TRUE' : 'FALSE'}`,
    })
    if (condTrue) {
      x += add
      trace.push({
        line: addLine + 1,
        code: lines[addLine]?.trim() ?? '',
        variables: { x, y },
        note: `Karena TRUE, x ditambah ${add}.`,
      })
    }
    if (printLine >= 0) {
      trace.push({
        line: printLine + 1,
        code: lines[printLine].trim(),
        variables: { x, y },
        output: String(x),
      })
    }
    return { output: String(x), trace }
  }

  // ---- Pattern D: simple text print ----
  const strMatch = code.match(/["']([^"']+)["']/)
  if (strMatch && /print|printf|fmt\.Print|System\.out/.test(code)) {
    return {
      output: strMatch[1],
      trace: [{ line: 1, code: lines[0] ?? '', variables: {} }],
    }
  }

  // ---- Unrecognized: report as guess, flag syntax ----
  return {
    output: '(simulator tidak mengenali pola kode ini — coba contoh bawaan)',
    error: true,
    errorType: 'runtime',
    trace: [],
  }
}