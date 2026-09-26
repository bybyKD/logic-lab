import { useId, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

/**
 * Form primitives for the Content Studio.
 *
 * Every field is label-associated rather than placeholder-labelled: the studio
 * is a long scrolling form, and a teacher who tabs through it needs to know which
 * box they are in. `Field` wires the label, the hint and the error to one input
 * via generated ids, so no screen has to invent them.
 */

const FIELD =
  'w-full rounded-pill border bg-lab-850 px-3.5 py-2 text-sm text-ink-100 transition-colors placeholder:text-ink-700 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none'

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  /** An error string puts the field in the error state and is announced. */
  error?: string
  children: (props: {
    id: string
    describedBy: string | undefined
    invalid: boolean
  }) => ReactNode
}) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block font-mono text-[0.625rem] tracking-widest text-ink-500 uppercase">
        {label}
      </label>
      <div className="mt-1.5">
        {children({ id, describedBy, invalid: Boolean(error) })}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-ink-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  )
}

function inputClass(invalid: boolean): string {
  return cn(FIELD, invalid ? 'border-error/60' : 'border-lab-700 focus-visible:border-accent-400/50')
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  error,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  placeholder?: string
  type?: 'text' | 'search' | 'url'
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass(invalid)}
        />
      )}
    </Field>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  hint,
  error,
  rows = 4,
  placeholder,
  mono = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
  rows?: number
  placeholder?: string
  /** Starter code and test expectations read better in a monospace box. */
  mono?: boolean
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          value={value}
          rows={rows}
          placeholder={placeholder}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            inputClass(invalid),
            'resize-y rounded-pill px-3.5 py-2',
            mono && 'font-mono text-[0.8125rem]',
          )}
        />
      )}
    </Field>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  hint,
  error,
  min = 0,
  max,
  step = 1,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  hint?: string
  error?: string
  min?: number
  max?: number
  step?: number
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          type="number"
          // `Number('')` is 0, so an emptied box is reported as 0 and the
          // validator flags it. That is better than letting the field hold NaN,
          // which would poison the rest of the draft silently.
          value={Number.isFinite(value) ? value : ''}
          min={min}
          max={max}
          step={step}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className={inputClass(invalid)}
        />
      )}
    </Field>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
  error,
}: {
  label: string
  value: T
  onChange: (value: T) => void
  options: readonly { value: T; label: string }[]
  hint?: string
  error?: string
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          value={value}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value as T)}
          className={inputClass(invalid)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-lab-850">
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}

/**
 * Checkbox group. Used for related skills and allowed languages, where a single
 * select would hide how many are already chosen.
 */
export function CheckboxGroup({
  label,
  hint,
  options,
  selected,
  onToggle,
  invalid = false,
}: {
  label: string
  hint?: string
  options: readonly { value: string; label: string; sublabel?: string }[]
  selected: ReadonlySet<string>
  onToggle: (value: string, next: boolean) => void
  invalid?: boolean
}) {
  return (
    <fieldset className="min-w-0">
      <legend
        className={cn(
          'font-mono text-[0.625rem] tracking-widest uppercase',
          invalid ? 'text-error' : 'text-ink-500',
        )}
      >
        {label}
      </legend>
      {hint && <p className="mt-1 text-xs text-ink-600">{hint}</p>}
      <div
        className={cn(
          'mt-2 flex flex-wrap gap-2 rounded-pill border p-2',
          invalid ? 'border-error/60' : 'border-lab-700',
        )}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-pill border px-3 py-1.5 text-xs transition-colors',
              selected.has(option.value)
                ? 'border-accent-400/50 bg-accent-400/10 text-accent-200'
                : 'border-lab-700 text-ink-400 hover:border-lab-600',
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={selected.has(option.value)}
              onChange={(e) => onToggle(option.value, e.target.checked)}
            />
            <span aria-hidden className="font-mono text-[0.625rem]">
              {selected.has(option.value) ? '✓' : '+'}
            </span>
            <span className="min-w-0">
              <span className="block truncate">{option.label}</span>
              {option.sublabel && (
                <span className="block truncate font-mono text-[0.5625rem] text-ink-600">
                  {option.sublabel}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
