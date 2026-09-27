# Data model

Entities live in `src/domain/`. This file records what each one is for, which
parts are seeded, and which parts exist in the type system but are not yet
populated — because the gap between "modelled" and "used" is where a reader will
otherwise guess wrong.

## Course structure

```text
Course ──1:N── Section ──1:N── Activity
```

### `Course` — `domain/course.ts`

`id`, `code`, `title`, `description`, `languageIds`, `skillIds` (root skills the
course is built around), `status`, `version`, `updatedAt`.

One seeded course, `course-logic-101` / `LOGIC 101`, 10 sections, 48 activities,
31 skills. `version` and `updatedAt` exist for real authoring workflows; today
only Content Studio writes them.

### `Section`

`id`, `courseId`, `title`, `summary`, `order`, `activityIds`.

Section ids are `sec-NN` and are derived from the seeded module number by
`seededSectionId()`, not typed by hand. `activityIds` is the ordered membership
list; a Section does not nest its activities, so an activity can be reached by id
without walking the tree.

### `Activity` — a discriminated union on `kind`

`ActivityBase` carries `id`, `sectionId`, `kind`, `title`, `objective`,
`instructions`, `difficulty`, `estimatedMinutes`, `skillIds`, `points`, `order`,
`status`, optional `dueOffsetDays`, optional `rubric`.

The union has **eight** members; the seed builds **five** of them.

| `kind` | What it is | Seeded |
| --- | --- | --- |
| `lesson` | typed content blocks: text, code, callout, image | 10 |
| `codeLab` | editable code + test cases | 3 |
| `interactive` | a visualizer: `logicFlow`, `languageCompare`, `trace` | 2 |
| `challenge` | predict / choose / debug / algorithm | 32 |
| `quiz` | multiple-choice questions | 1 |
| `assignment` | brief, deliverables, tests, due date | 0 |
| `project` | milestones + rubric | 0 |
| `simulation` | parameter-driven model | 0 |

The three unseeded kinds are **modelled but not invented**. Assignments and
projects are authored by a teacher in Content Studio rather than fabricated in a
seed, and there is no simulation model to mount. The type exists so the runner and
the builder have a shape to work against; there is no fake content pretending to
be one.

`LessonBlock` is a union of `text`, `code`, `callout`, `visualizer`, and `check`
rather than markdown, deliberately: markdown would need a new dependency and
could not express an embedded visualizer or a self-check question. `check`
blocks carry a prompt and accepted answers, so a lesson can ask something without
becoming a graded `quiz` activity.

`ChallengeType` is `predict | choose | debug | algorithm`. A fifth member, `truth`,
was removed in Phase 7: nothing ever produced one and the runner had no branch for
it, so it could only ever reach the not-found fallback. `debug` and `algorithm`
*are* real — Phase 5 seeded both and `ChallengeRunner` renders them.

## People

`domain/people.ts`: `Person` (`id`, `name`, `email`) → `Student` (adds `role`,
`cohort` such as `"2026-A"`, `joinedAt`) and `Teacher` (adds `role`, `title`),
plus `Class` and `Enrollment`. `Role` is `student` | `teacher`.

- `Class` — a scheduled offering of a course: `id`, `name`, `courseId`,
  `teacherIds`, `term`, `startDate`, `endDate`.
- `Enrollment` — a student's membership: `id`, `classId`, `studentId`,
  `status` (`active` | `completed` | `withdrawn`), `enrolledAt`.

80 students, 2 teachers, 42 enrollments, seeded. The seeded attempt distribution
is fixed by `COHORT_PLAN` in `data/seed/attempts.ts` — 29 completed, 8
struggling, 5 not started — so the teacher's classroom has a known, reproducible
shape to demonstrate against.

`Enrollment` carries **no progress fields**, and that is deliberate: the type
documents that progress used to live on the course content itself
(`Module.progress` / `.completed` / `.locked`), which made one module look
different for every student. Per-learner state now comes from `Attempt` records.

There is no authentication. `Role` is selected in the UI; nothing verifies
identity, and the seed simply contains both kinds of person.

## Skills and mastery

`domain/learning.ts`:

- `Skill` — `id`, `name`, `parentId` (null for a domain root), `domain`
  (`computational-thinking` | `variables` | `operators` | `control-flow` |
  `functions` | `data-structures` | `algorithms`), `description`. 31 seeded.
  The tree is `parentId`, not a prerequisite list.
- `SkillMastery` — per student per skill: score, `MasteryConfidence`
  (`low` | `medium` | `high`), evidence count, updated timestamp. Explicitly
  documented in the type as derived from attempts and never hand-authored.
- `ProgressStatus` — `not-started` | `in-progress` | `submitted` | `graded` |
  `mastered`.
- `ActivityProgress` — per (student, activity): `status`, `bestScore`,
  `effectiveScore`, `attempts`, `lastActivityAt`.

`bestScore` and `effectiveScore` are both kept, and the difference is the point:
`bestScore` is the highest raw score, while `effectiveScore` discounts hints
revealed. The `mastered` threshold is judged on `effectiveScore`, so a correct
answer reached with every hint open does not silently certify mastery.
- `Misconception` — a named error pattern, e.g. off-by-one, with a remedy.
- `CohortSegment` — `completed` | `in-progress` | `struggling` | `not-started`,
  the teacher-facing bucket for a student.

Mastery is **derived, not stored as truth**. `services/learning/mastery.ts`
recomputes it from attempts; the dashboard's skill graph reads that. The
difficulty of guessing mastery wrong is the reason Phase 6 deleted the screen
that hardcoded a skill list per profile.

## Assessment

`domain/assessment.ts`:

- `Attempt` — one learner run: `id`, `activityId`, `studentId`, `kind`,
  `submittedAt`, optional `language` / `code` / `choiceId` / `selectedLines`,
  `passed`, a 0–100 `score` normalised across activity types, `durationMs`,
  `hintsUsed` (evidence of struggle, and the input to `effectiveScore`), and
  `misconceptionId` set when a failure matches a known pattern.
- `TestCase` / `TestOutcome` — input, expected output, and a per-case status of
  `passed` | `failed` | **`not-evaluated`**.
- `Submission` and `SubmissionStatus` (`submitted` | `graded`), `Grade`, `Feedback`
  (`FeedbackAuthorRole` = `auto` | `teacher`), `Rubric` / `RubricCriterion` /
  `RubricLevel`, `Hint`.

`not-evaluated` is not a fourth-class citizen. A test case carrying an `input`
needs the program to be run once per input, which the current execution layer
cannot do, so those cases are reported as not evaluated rather than guessed at —
and they contribute nothing to a score.

`FeedbackAuthorRole` distinguishes an auto-generated comment from a teacher's,
because a learner should be able to tell which is which.

## Persistence

`localStorage`, namespaced and versioned by `services/storage/persistence.ts`:

| Key | Contents |
| --- | --- |
| `attempts` | learner attempts |
| `submissions` | assignment submissions |
| `feedback` | teacher and auto feedback |
| `session` | current role and person id |
| `authoredActivities` | activities authored in Content Studio |

A parallel `publishedActivityIds` key existed in Phase 2 and was removed in
Phase 4: publish state is the activity's own `status` field, and a second list of
ids would be a second source of truth for one fact.

Course content is **not** persisted for seeded activities — it is rebuilt from
`src/data/` on load. Only authored activities and learner/teacher records are
stored. That keeps the curriculum diffable in git instead of trapped in a
browser.

## Determinism

`data/seed/random.ts` provides `mulberry32`, a seeded PRNG. Seed data must not
use `Math.random()`: the classroom shows counts, and counts that change on every
reload look like a bug. There is no `Math.random()` anywhere in `src/`.
