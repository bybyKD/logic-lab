export type LanguageId = 'python' | 'java' | 'go' | 'c'

export interface LanguageConfig {
  id: LanguageId
  name: string
  extension: string
  monacoId: string
  /** Sorted list of languages for tab display */
  order: number
  /** Short label to show in compact spaces */
  short: string
}

export const LANGUAGES: Record<LanguageId, LanguageConfig> = {
  python: {
    id: 'python',
    name: 'Python',
    extension: '.py',
    monacoId: 'python',
    order: 0,
    short: 'PY',
  },
  java: {
    id: 'java',
    name: 'Java',
    extension: '.java',
    monacoId: 'java',
    order: 1,
    short: 'JV',
  },
  go: {
    id: 'go',
    name: 'Go',
    extension: '.go',
    monacoId: 'go',
    order: 2,
    short: 'GO',
  },
  c: {
    id: 'c',
    name: 'C',
    extension: '.c',
    monacoId: 'c',
    order: 3,
    short: 'C',
  },
}

export const LANGUAGE_ORDER: LanguageId[] = ['python', 'java', 'go', 'c']

export function getLanguage(id: LanguageId): LanguageConfig {
  return LANGUAGES[id]
}
