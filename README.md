# LOGIC LAB

A browser prototype for teaching programming logic. Learners work through a seeded
course of interactive activities; teachers see the same data derived into a
classroom view.

The product direction, phase-by-phase build plan, and design rules live in
[`docs/LOGIC_LAB_PLAN.md`](docs/LOGIC_LAB_PLAN.md). That file is the source of
truth for *what gets built next*. This README describes what exists today.

## Running it

```bash
npm install
npm run dev        # vite dev server
npm test           # vitest, single run
npm run build      # tsc -b then vite build
npm run preview    # serve the production build
```

`npm run build` runs `tsc -b` first, so a type error fails the build. There is no
separate typecheck script; the build *is* the typecheck.

Node 18+ and a current browser. No backend, no database, no environment variables.

## What this is, honestly

- **No backend.** Everything lives in `localStorage` under versioned keys, plus a
  deterministic seed. Clearing site data resets the demo to a known state.
- **No real auth.** A role is chosen in the UI; `Person`/`Role` model a real system
  but nothing verifies identity.
- **No real code execution.** The code lab does not run the code you write. It
  pattern-matches a set of known program shapes behind the `ExecutionService`
  interface and reports `unsupported` rather than guessing. See
  [`docs/execution.md`](docs/execution.md) — including what a real runner needs.
- **No due dates.** There is no `Assignment` entity and nothing sets
  `Activity.dueOffsetDays`. The dashboard's "waiting on your teacher" tile is real
  learner state, not a deadline.

Mock *data* is fine and used throughout. What is deliberately absent is mock
*state*: no screen invents a progress number, a streak, or a count that is not
derived from stored attempts. If a number cannot be derived, it is not shown.

## Routes

| Route | Screen |
| --- | --- |
| `/` | landing (marketing, untouched) |
| `/learn` | learner dashboard |
| `/learn/c/:courseId/s/:sectionId/a/:activityId` | activity runner |
| `/teacher` | classroom |
| `/teacher/courses`, `/teacher/courses/:courseId` | course builder + publish |
| `/teacher/studio`, `/teacher/studio/:activityId` | Content Studio |
| `/teacher/assignments`, `.../review` | assignments + review queue |
| `/teacher/gradebook`, `/teacher/classes/:classId/students` | gradebook, students |
| `/dashboard` | → `/learn` |
| `/admin` | → `/teacher` |
| `/module/:id`, `/challenge/:id`, `/challenges` | → real content (see below) |

The pre-Phase-3 student routes are redirects, not screens. Their ids are resolved
against the seeded course in `src/services/legacyRoutes.ts`; an id that cannot be
resolved lands on `/learn` rather than on a dead page.

The plan's end-state map also lists `/learn/c/:courseId` and
`/learn/c/:courseId/s/:sectionId` (course and section overviews). **Those screens
do not exist yet**, so a module redirect lands on the first activity of the
section rather than on a section page.

## Where things are

```text
src/domain/        entities and types; no behaviour, no imports from app code
src/services/      repositories, grading, mastery, execution, persistence
src/features/      student screens, grouped by feature
src/components/    shared and presentational components
src/data/          seed content (lessons, challenges, skills, people)
src/pages/         route-level screens
```

`src/features/` is the only place feature code lives; `src/components/` is for
things shared across features. Imports point one way:
`pages` → `features` → `components` → `domain`. `src/domain` imports nothing
except one exception: `course.ts` takes the `LanguageId` union from
`src/data/languages.ts`, which is a list of string literals rather than course
content. That is the only edge out of the domain layer.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — layering, the data flow, and
  why the seed is not the same thing as the repository.
- [`docs/data-model.md`](docs/data-model.md) — every entity, its fields, and
  which are seeded versus authored.
- [`docs/execution.md`](docs/execution.md) — the `ExecutionService` contract, what
  the current implementation does and does not do, and what a real sandbox needs.
- [`docs/LOGIC_LAB_PLAN.md`](docs/LOGIC_LAB_PLAN.md) — direction and build plan.

## Seed data

The seed builds one course of 10 sections and 48 activities (10 lessons, 3 code
labs, 2 interactives, 32 challenges, 1 quiz), 31 skills, 80 students, 2 teachers,
and 42 enrollments. It is deterministic — no `Math.random()` — so the same numbers
appear on every machine and in every test.

`resetDemoData()` in `src/services/repositories` restores that state.
