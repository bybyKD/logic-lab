import type { LanguageId } from '../languages'
import { LANGUAGE_ORDER } from '../languages'
import { ageExample } from '../codeExamples'
import { CHALLENGES, type Challenge } from '../challenges'
import { MODULES, type Module } from '../modules'
import type {
  Activity,
  ChallengeActivity,
  ChallengeChoice,
  ChallengeType,
  CodeLabActivity,
  Course,
  Difficulty,
  InteractiveActivity,
  LessonActivity,
  LessonBlock,
  QuizActivity,
  QuizQuestion,
  Rubric,
  Section,
} from '../../domain'

export const COURSE_ID = 'course-logic-101'
export const COURSE_UPDATED_AT = '2026-02-02T00:00:00.000Z'

/**
 * Code the visualizers and code labs can display, addressed by id.
 *
 * Interactive activities reference these instead of embedding code, so the same
 * example powers the landing page, the lesson, and the lab.
 */
export interface CodeSnippet {
  id: string
  label: string
  code: Record<LanguageId, string>
}

export const SNIPPETS: CodeSnippet[] = [
  {
    id: 'age-conditional',
    label: 'Conditional Logic — age check',
    code: ageExample(20),
  },
  {
    id: 'loop-accumulator',
    label: 'Loops — running total',
    code: {
      python: `x = 0

for i in range(5):
    x += i

print(x)`,
      java: `int x = 0;

for (int i = 0; i < 5; i++) {
    x += i;
}
System.out.println(x);`,
      go: `x := 0

for i := 0; i < 5; i++ {
    x += i
}
fmt.Println(x)`,
      c: `int x = 0;

for (int i = 0; i < 5; i++) {
    x += i;
}
printf("%d", x);`,
    },
  },
  {
    id: 'branch-mutation',
    label: 'Conditional Logic — value changes inside a branch',
    code: {
      python: `x = 5
y = 2

if x > y:
    x = x + 3

print(x)`,
      java: `int x = 5;
int y = 2;

if (x > y) {
    x = x + 3;
}
System.out.println(x);`,
      go: `x := 5
y := 2

if x > y {
    x = x + 3
}
fmt.Println(x)`,
      c: `int x = 5;
int y = 2;

if (x > y) {
    x = x + 3;
}
printf("%d", x);`,
    },
  },
]

export const SNIPPETS_BY_ID: Record<string, CodeSnippet> = Object.fromEntries(
  SNIPPETS.map((s) => [s.id, s]),
)

/**
 * Code examples for the lessons of the two sections that have their own.
 *
 * This used to be `LESSON_SAMPLES: Record<string, string[]>`, keyed by a legacy
 * module number as a *string*, and read from `ModulePage.tsx` — a view concern
 * that had been carried into the seed. The examples are course content and stay;
 * what went is the module-number lookup, so the key is now the section id the
 * rest of the model uses and the record is private to this file.
 */
const LESSON_CODE_EXAMPLES: Record<string, string[]> = {
  'sec-04': [
    `# 1. Percabangan dasar (Python)
umur = 20

if umur >= 18:
    print("Dewasa")
else:
    print("Remaja")`,
    `# 2. Beberapa kondisi
nilai = 85

if nilai >= 90:
    print("A")
elif nilai >= 75:
    print("B")
else:
    print("C")`,
    `# 3. Kombinasi logika
umur = 19
punya_ktp = True

if punya_ktp and umur >= 18:
    print("Boleh daftar")`,
  ],
  'sec-05': [
    `# 1. Perulangan for (Python)
for i in range(5):
    print(i)`,
    `# 2. Akumulator
total = 0
for i in range(1, 6):
    total += i
print(total)`,
    `# 3. Perulangan while
n = 5
while n > 0:
    print(n)
    n -= 1`,
  ],
}

/** Skills each module exercises, resolved against the Skill ids in ./skills. */
const MODULE_SKILL_IDS: Record<number, string[]> = {
  1: ['decomposition', 'pattern-recognition', 'abstraction', 'algorithm-design'],
  2: ['variable-assignment', 'data-types', 'constants'],
  3: ['arithmetic-operators', 'comparison-operators', 'logical-operators'],
  4: ['conditionals', 'if-else', 'comparison-operators'],
  5: ['loops', 'for-loops', 'while-loops'],
  6: ['function-definition', 'parameters', 'return-values'],
  7: ['arrays'],
  8: ['strings'],
  9: ['searching', 'sorting'],
  10: ['algorithm-design', 'debugging', 'abstraction'],
}

/**
 * Challenges whose single skill is more specific than the module's skill set.
 * Without this, every challenge in a module would report the same skills and
 * skill mastery could not be attributed to a concept.
 */
const CHALLENGE_SKILL_OVERRIDES: Record<number, string[]> = {
  3: ['data-types', 'variable-assignment'],
  4: ['data-types'],
  5: ['arithmetic-operators'],
  6: ['logical-operators', 'comparison-operators'],
  7: ['arithmetic-operators', 'variable-assignment'],
  8: ['conditionals', 'if-else', 'comparison-operators'],
  9: ['conditionals', 'comparison-operators'],
  10: ['comparison-operators'],
  11: ['loops', 'for-loops', 'variable-assignment'],
}

const MODULE_DIFFICULTY: Record<Module['difficulty'], Difficulty> = {
  Pemula: 'beginner',
  Menengah: 'intermediate',
  Lanjut: 'advanced',
}

const CHALLENGE_DIFFICULTY: Record<Challenge['difficulty'], Difficulty> = {
  Mudah: 'beginner',
  Menengah: 'intermediate',
  Sulit: 'advanced',
}

const CHALLENGE_GUIDANCE: Record<ChallengeType, string> = {
  predict: 'Predict the output first, then compare it with the actual output.',
  choose: 'Select one answer, then read the explanation.',
  debug: 'Find the faulty line, then explain what it should be.',
  algorithm: 'Arrange the steps into a working order.',
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Seeded ids for the two legacy shapes, derived rather than hardcoded.
 *
 * The old student routes address content by a module number and a challenge
 * number, while the real course addresses it by section and activity id. Both
 * ids are computed here so the `/module/:id` and `/challenge/:id` redirects
 * cannot invent a format that the seed does not actually produce — a lookup that
 * silently returns nothing is much harder to notice than a missing page.
 */
export function seededSectionId(moduleId: number): string {
  return `sec-${pad(moduleId)}`
}

export function seededChallengeActivityId(challenge: Pick<Challenge, 'id' | 'moduleId'>): string {
  return `act-s${pad(challenge.moduleId)}-c${challenge.id}`
}

/** The lesson that opens every section. */
export function seededLessonActivityId(moduleId: number): string {
  return `act-s${pad(moduleId)}-lesson`
}

function buildLesson(module: Module, sectionId: string): LessonActivity {
  const samples = LESSON_CODE_EXAMPLES[sectionId]
  const blocks: LessonBlock[] = [
    {
      kind: 'text',
      heading: module.subtitle,
      body: module.description,
    },
  ]

  if (samples) {
    samples.forEach((code, i) => {
      blocks.push({
        kind: 'code',
        language: 'python',
        caption: `Example ${i + 1} — ${module.title}`,
        code,
      })
    })
  } else {
    blocks.push({
      kind: 'code',
      language: 'python',
      caption: `Example 1 — ${module.title}`,
      code: SNIPPETS_BY_ID['age-conditional'].code.python,
    })
  }

  blocks.push({
    kind: 'callout',
    tone: 'info',
    body: 'Jangan hafal kodenya. Pahami polanya — pola yang sama bekerja di keempat bahasa.',
  })

  return {
    id: seededLessonActivityId(module.id),
    sectionId,
    kind: 'lesson',
    title: module.title,
    objective: module.subtitle,
    instructions: 'Work through the examples, then change the values and predict the new result.',
    difficulty: MODULE_DIFFICULTY[module.difficulty],
    estimatedMinutes: module.minutes,
    skillIds: MODULE_SKILL_IDS[module.id] ?? [],
    points: 0,
    order: 0,
    status: 'published',
    blocks,
  }
}

function buildInteractive(
  sectionId: string,
  id: string,
  title: string,
  visualizer: InteractiveActivity['visualizer'],
  snippetId: string,
  objective: string,
  guidance: string,
  minutes: number,
  skillIds: string[],
): InteractiveActivity {
  return {
    id,
    sectionId,
    kind: 'interactive',
    title,
    objective,
    instructions: guidance,
    guidance,
    difficulty: 'beginner',
    estimatedMinutes: minutes,
    skillIds,
    points: 5,
    order: 0,
    status: 'published',
    visualizer,
    snippetIds: [snippetId],
  }
}

/**
 * Rubric for a code lab, so the teacher review screen has something to score.
 *
 * Phase 4's review flow calls for rubric scoring, but no activity in the course
 * carried a rubric, which would have left that part of the screen permanently
 * empty. These are the two things a teacher actually judges in a two-test code
 * lab: whether the condition is right, and whether the code reads like the
 * instruction.
 */
function buildCodeLabRubric(id: string): Rubric {
  return {
    id: `${id}-rubric`,
    title: 'Code lab review',
    maxPoints: 10,
    criteria: [
      {
        id: `${id}-rc-condition`,
        label: 'Condition',
        description: 'The comparison matches the boundary the instructions ask for.',
        maxPoints: 6,
        levels: [
          {
            label: 'Correct',
            points: 6,
            descriptor: 'Right operator, right boundary, including the equality case.',
          },
          {
            label: 'Off by one',
            points: 3,
            descriptor: 'Right shape, wrong boundary — `>` where `>=` was needed.',
          },
          {
            label: 'Not a comparison',
            points: 0,
            descriptor: 'Assigns in the condition, so the branch is always taken.',
          },
        ],
      },
      {
        id: `${id}-rc-readability`,
        label: 'Readable code',
        description: 'Names the values, keeps the else branch, no dead code.',
        maxPoints: 4,
        levels: [
          {
            label: 'Clear',
            points: 4,
            descriptor: 'Names the input, both branches are present and obvious.',
          },
          {
            label: 'Works but tangled',
            points: 2,
            descriptor: 'Correct output, but the intent has to be reverse-engineered.',
          },
          {
            label: 'Unreadable',
            points: 0,
            descriptor: 'Single letters, no else, or leftover scaffolding.',
          },
        ],
      },
    ],
  }
}

function buildCodeLab(
  sectionId: string,
  id: string,
  title: string,
  objective: string,
  snippetId: string,
  visibleCase: { name: string; expectedOutput: string; skillId: string },
  hiddenCase: { name: string; input: string; expectedOutput: string; skillId: string },
  hints: CodeLabActivity['hints'],
  expectedBehavior: string,
  minutes: number,
  points: number,
  skillIds: string[],
): CodeLabActivity {
  const snippet = SNIPPETS_BY_ID[snippetId]
  return {
    id,
    sectionId,
    kind: 'codeLab',
    title,
    objective,
    instructions: 'Edit the code until the visible test passes, then submit for the hidden test.',
    expectedBehavior,
    difficulty: 'intermediate',
    estimatedMinutes: minutes,
    skillIds,
    points,
    order: 0,
    status: 'published',
    languages: LANGUAGE_ORDER,
    starterCode: snippet.code,
    testCases: [
      {
        id: `${id}-tc-visible`,
        name: visibleCase.name,
        hidden: false,
        expectedOutput: visibleCase.expectedOutput,
        skillId: visibleCase.skillId,
        weight: 1,
      },
      {
        id: `${id}-tc-hidden`,
        name: hiddenCase.name,
        hidden: true,
        input: hiddenCase.input,
        expectedOutput: hiddenCase.expectedOutput,
        skillId: hiddenCase.skillId,
        weight: 2,
      },
    ],
    hints,
    rubric: buildCodeLabRubric(id),
  }
}

function toChoices(challenge: Challenge): { choices: ChallengeChoice[]; correctChoiceId: string } {
  const choices = (challenge.choices ?? []).map((text, i) => ({
    id: `c${i}`,
    label: String.fromCharCode(65 + i),
    text,
  }))
  return { choices, correctChoiceId: `c${challenge.answer}` }
}

function buildChallenge(challenge: Challenge, sectionId: string): ChallengeActivity {
  const { choices, correctChoiceId } = toChoices(challenge)
  return {
    id: seededChallengeActivityId(challenge),
    sectionId,
    kind: 'challenge',
    challengeType: challenge.type,
    title: challenge.title,
    objective: challenge.prompt,
    instructions: CHALLENGE_GUIDANCE[challenge.type],
    prompt: challenge.prompt,
    snippet: challenge.code,
    choices,
    correctChoiceId,
    explanation: challenge.explanation,
    difficulty: CHALLENGE_DIFFICULTY[challenge.difficulty],
    estimatedMinutes: 5,
    skillIds: CHALLENGE_SKILL_OVERRIDES[challenge.id] ?? MODULE_SKILL_IDS[challenge.moduleId] ?? [],
    points: challenge.points,
    order: 0,
    status: 'published',
  }
}

/**
 * A "find the faulty line" challenge, authored directly as a `ChallengeActivity`.
 *
 * The 30 legacy challenges are all `choose` or `predict`, so nothing in the
 * course taught debugging as an activity even though `ChallengeType` and the
 * `faultyLine` field both existed for it. It is written here rather than in
 * `data/challenges.ts` because that file's own `type` union has no `algorithm`
 * member and is scheduled for deletion in Phase 7.
 *
 * `choices` are the candidate code lines, authored in line order, so the
 * correct answer is a real choice id and the existing seed invariant that every
 * `correctChoiceId` resolves still holds.
 *
 * Only Python is supplied. A line-number answer only means one thing if the
 * line numbers line up, and they do not across four languages.
 */
function buildDebugChallenge(sectionId: string): ChallengeActivity {
  const snippet = [
    'total = 0',
    '',
    'for i in range(5):',
    '    total = i',
    '',
    'print(total)',
  ].join('\n')

  const candidates: { line: number; text: string }[] = [
    { line: 1, text: 'total = 0' },
    { line: 3, text: 'for i in range(5):' },
    { line: 4, text: '    total = i' },
    { line: 6, text: 'print(total)' },
  ]
  const faultyLine = 4

  const choices: ChallengeChoice[] = candidates.map((candidate) => ({
    id: `l${candidate.line}`,
    label: `L${candidate.line}`,
    text: candidate.text,
  }))

  return {
    id: 'act-s10-dbg-accumulator',
    sectionId,
    kind: 'challenge',
    challengeType: 'debug',
    title: 'Debug: running total',
    objective: 'Find the line that stops the loop from accumulating.',
    instructions: CHALLENGE_GUIDANCE.debug,
    prompt:
      'Program ini harus mencetak 10, tetapi mencetak 4. Baris mana yang salah?',
    snippet: { python: snippet },
    choices,
    correctChoiceId: `l${faultyLine}`,
    faultyLine,
    explanation:
      'total = i menimpa nilai sebelumnya di setiap iterasi, sehingga setelah loop selesai total hanya berisi angka terakhir, yaitu 4. Yang benar adalah total += i, atau total = total + i.',
    difficulty: 'intermediate',
    estimatedMinutes: 5,
    skillIds: ['debugging', 'loops', 'for-loops', 'variable-assignment'],
    points: 20,
    order: 0,
    status: 'published',
  }
}

/**
 * An "arrange the steps" challenge.
 *
 * The running order IS the `choices` array order, which is the only place the
 * domain can hold it: `correctChoiceId` names the step that has to come first,
 * so the existing "every correctChoiceId resolves" invariant still holds and no
 * new field is needed to store a full solution.
 *
 * `label` carries the step name and `text` the description, which is what the
 * ordering UI renders. The A/B/C convention applies to single-answer challenges,
 * where the letters are what distinguish the options.
 */
function buildAlgorithmChallenge(sectionId: string): ChallengeActivity {
  const steps: { label: string; text: string }[] = [
    { label: 'START', text: 'Mulai program' },
    { label: 'INPUT TIGA ANGKA', text: 'Terima tiga angka dari pengguna' },
    { label: 'SET TERBESAR = ANGKA PERTAMA', text: 'Anggap angka pertama yang terbesar' },
    {
      label: 'BANDINGKAN ANGKA BERIKUTNYA',
      text: 'Jika angka berikutnya lebih besar, perbarui nilai terbesar',
    },
    { label: 'PRINT TERBESAR', text: 'Tampilkan angka terbesar' },
  ]

  const choices: ChallengeChoice[] = steps.map((step, i) => ({
    id: `s${i + 1}`,
    label: step.label,
    text: step.text,
  }))

  return {
    id: 'act-s10-alg-largest',
    sectionId,
    kind: 'challenge',
    challengeType: 'algorithm',
    title: 'Algorithm: find the largest',
    objective: 'Order the steps so the program finds the largest of three numbers.',
    instructions: CHALLENGE_GUIDANCE.algorithm,
    prompt:
      'Susun langkah-langkah berikut menjadi urutan yang benar agar program menemukan angka terbesar dari tiga angka.',
    snippet: {},
    choices,
    correctChoiceId: choices[0].id,
    explanation:
      'Urutannya: mulai, terima input, anggap angka pertama yang terbesar, bandingkan angka berikutnya dan perbarui bila lebih besar, lalu cetak hasilnya. Melewati langkah perbandingan membuat program selalu mencetak angka pertama.',
    difficulty: 'beginner',
    estimatedMinutes: 6,
    skillIds: ['algorithm-design', 'decomposition', 'comparison-operators'],
    points: 20,
    order: 0,
    status: 'published',
  }
}

function buildQuiz(sectionId: string): QuizActivity {
  const sourceIds = [1, 2]
  const questions: QuizQuestion[] = sourceIds
    .map((id) => CHALLENGES.find((c) => c.id === id))
    .filter((c): c is Challenge => Boolean(c))
    .map((c) => {
      const { choices, correctChoiceId } = toChoices(c)
      return {
        id: `qz-q${c.id}`,
        prompt: c.prompt,
        choices,
        correctChoiceId,
        explanation: c.explanation,
        skillId: 'decomposition',
      }
    })

  return {
    id: 'act-s01-qz-basics',
    sectionId,
    kind: 'quiz',
    title: 'Computational Thinking — check',
    objective: 'Confirm the foundations before moving on.',
    instructions: 'Answer both questions. You can retake the quiz as often as you like.',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    skillIds: ['decomposition', 'pattern-recognition'],
    points: 20,
    order: 0,
    status: 'published',
    questions,
    passMark: 50,
  }
}

/**
 * Builds the course graph: one Course, one Section per module, and the Activity
 * list for each Section.
 *
 * Assignment, Project and Simulation are modelled but deliberately NOT seeded:
 * those are authored by a teacher in Content Studio (Phase 4) rather than
 * invented here.
 */
function buildCourse() {
  const sections: Section[] = []
  const activities: Activity[] = []

  MODULES.forEach((module, index) => {
    const sectionId = seededSectionId(module.id)
    const sectionActivities: Activity[] = [buildLesson(module, sectionId)]

    if (module.id === 4) {
      sectionActivities.push(
        buildInteractive(
          sectionId,
          'act-s04-ia-logic-flow',
          'Follow the decision path',
          'logicFlow',
          'age-conditional',
          'See which branch the program takes for a given input.',
          'Change the input, then trace the path the program follows.',
          5,
          ['conditionals', 'if-else'],
        ),
        buildInteractive(
          sectionId,
          'act-s04-ia-compare',
          'One logic, four languages',
          'languageCompare',
          'age-conditional',
          'Recognise the same logic across Python, Java, Go and C.',
          'Switch languages and compare the condition and the branch.',
          5,
          ['conditionals', 'if-else'],
        ),
        buildCodeLab(
          sectionId,
          'act-s04-cl-age',
          'Code Lab — adult check',
          'Write a condition that treats 18 as an adult.',
          'age-conditional',
          {
            name: 'age 20 prints Dewasa',
            expectedOutput: 'Dewasa',
            skillId: 'if-else',
          },
          {
            name: 'age 17 prints Remaja',
            input: 'age = 17',
            expectedOutput: 'Remaja',
            skillId: 'if-else',
          },
          [
            {
              id: 'act-s04-cl-age-h1',
              order: 1,
              text: 'A condition needs a comparison. `>=` includes 18 itself, `>` does not.',
              skillId: 'comparison-operators',
            },
            {
              id: 'act-s04-cl-age-h2',
              order: 2,
              text: 'The else branch only runs when the condition is false — put the "Remaja" print there.',
              skillId: 'if-else',
            },
          ],
          'Print "Dewasa" when age >= 18, otherwise print "Remaja".',
          10,
          30,
          ['conditionals', 'if-else', 'comparison-operators'],
        ),
        buildCodeLab(
          sectionId,
          'act-s04-cl-branch',
          'Code Lab — value changes inside a branch',
          'Change a variable only when the condition holds.',
          'branch-mutation',
          {
            name: 'x > y adds 3',
            expectedOutput: '8',
            skillId: 'conditionals',
          },
          {
            name: 'x < y leaves x alone',
            input: 'y = 9',
            expectedOutput: '5',
            skillId: 'conditionals',
          },
          [
            {
              id: 'act-s04-cl-branch-h1',
              order: 1,
              text: 'Check what happens to x when the condition is true versus false.',
              skillId: 'conditionals',
            },
            {
              id: 'act-s04-cl-branch-h2',
              order: 2,
              text: '`x = x + 3` must sit inside the if block, indented under the condition.',
              skillId: 'conditionals',
            },
          ],
          'Add 3 to x only when x is greater than y, then print x.',
          10,
          30,
          ['conditionals', 'comparison-operators', 'variable-assignment'],
        ),
      )
    }

    if (module.id === 5) {
      sectionActivities.push(
        buildCodeLab(
          sectionId,
          'act-s05-cl-accumulator',
          'Code Lab — running total',
          'Accumulate a total across a loop.',
          'loop-accumulator',
          {
            name: 'sum of 0..4',
            expectedOutput: '10',
            skillId: 'for-loops',
          },
          {
            name: 'sum of 0..9',
            input: 'range(10)',
            expectedOutput: '45',
            skillId: 'for-loops',
          },
          [
            {
              id: 'act-s05-cl-accumulator-h1',
              order: 1,
              text: 'The accumulator must start at 0 BEFORE the loop, never inside it.',
              skillId: 'variable-assignment',
            },
            {
              id: 'act-s05-cl-accumulator-h2',
              order: 2,
              text: '`range(5)` yields 0,1,2,3,4 — five values starting at zero. Add them one at a time.',
              skillId: 'for-loops',
            },
          ],
          'Print the sum of every value produced by range(5).',
          12,
          35,
          ['loops', 'for-loops', 'variable-assignment'],
        ),
      )
    }

    if (module.id === 1) {
      sectionActivities.push(buildQuiz(sectionId))
    }

    // The two variants the legacy challenge set never had, in a module whose
    // skills are exactly algorithm-design and debugging.
    if (module.id === 10) {
      sectionActivities.push(buildDebugChallenge(sectionId), buildAlgorithmChallenge(sectionId))
    }

    CHALLENGES.filter((c) => c.moduleId === module.id).forEach((challenge) => {
      sectionActivities.push(buildChallenge(challenge, sectionId))
    })

    sectionActivities.forEach((activity, i) => {
      activity.order = i
      activities.push(activity)
    })

    sections.push({
      id: sectionId,
      courseId: COURSE_ID,
      title: module.title,
      summary: module.subtitle,
      order: index + 1,
      activityIds: sectionActivities.map((a) => a.id),
    })
  })

  const course: Course = {
    id: COURSE_ID,
    code: 'LOGIC 101',
    title: 'Programming Logic',
    description:
      'One logic, expressed four ways. Learn to decompose a problem, express it as steps, and write it in Python, Java, Go, or C.',
    languageIds: LANGUAGE_ORDER,
    skillIds: [
      'computational-thinking',
      'variables',
      'operators',
      'control-flow',
      'functions',
      'data-structures',
      'algorithms',
    ],
    status: 'published',
    version: 1,
    updatedAt: COURSE_UPDATED_AT,
  }

  return { course, sections, activities }
}

const built = buildCourse()

export const COURSE: Course = built.course
export const SECTIONS: Section[] = built.sections
export const ACTIVITIES: Activity[] = built.activities
