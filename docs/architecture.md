# Architecture

## The shape of the app

Four layers. Each may import from the layer below it, never from the one above.

```text
src/pages/        route-level screens: pick a route, mount a feature
src/features/     student and teacher screens, grouped by feature
src/components/   shared and presentational components
src/domain/       entities, unions, and the few pure functions on them
```

`src/services/` sits beside these rather than inside them. It holds the logic
that is not tied to a screen: repositories, grading, mastery, execution, and
persistence. A screen reads from `services`; `services` does not know a screen
exists.

The one upward edge is deliberate and singular: `src/domain/course.ts` imports
the `LanguageId` union from `src/data/languages.ts`. That file is a list of
string literals (`'python' | 'java' | 'go' | 'c'`), not course content, so it does
not create a dependency on the data layer's behaviour.

## Why the data layer is split in two

`src/data/` is the **seed**: hand-written lessons, challenges, skills, and people
that stand in for a backend. `src/services/repositories/` is the **access layer**
the app actually reads from.

The distinction matters because they answer different questions. The seed answers
"what does this course contain?" and is deterministic, so tests and screenshots
are stable. The repository answers "what has this learner done, and what has this
teacher changed?" and reads `localStorage`, falling back to the seed when empty.

Reading the seed directly from a screen is what the old `/module/:id` and
`/challenge/:id` pages did, and it is why they were deleted in Phase 7: they
bypassed stored progress entirely and could only ever show invented numbers.

Course *content* is the one thing still seeded rather than authored. A teacher can
author activities in Content Studio, and those live under their own persistence
key and are overlaid on top of the seeded course. The seeded content is the
starting curriculum, not a shortcut around the repository.

## The write path

```text
screen → repository → persistence (localStorage) → re-render from repository
```

Components do not mutate storage. They call a repository method, and the screen
re-reads. That keeps "what is on screen" and "what is stored" the same question,
which is the failure mode the earlier phases existed to remove.

`src/services/storage/persistence.ts` wraps every `localStorage` call in a
try/catch and namespaces keys with a version, so a quota error or a private-mode
denial degrades to in-memory behaviour instead of a white screen.

## The read path for a learner

```text
Course + Sections + Activities   (courseRepository)
          +
Attempts + Progress + Mastery    (attemptRepository, learning services)
          ↓
viewModel.ts                      pure derivation
          ↓
LearnDashboardScreen
```

`features/student/dashboard/viewModel.ts` is a pure function from stored records
to what the dashboard shows. It is unit-tested directly, with no React involved.
That is the point: the derivation is where a wrong number would come from, so it
is tested in isolation rather than through the DOM.

The same shape appears in `components/teacher/classroomViewModel.ts` for the
teacher's class segmentation, and in `features/student/activity-runner/` for
scoring a submission.

## The activity runner

One route serves every activity kind:

```text
/learn/c/:courseId/s/:sectionId/a/:activityId
```

`ActivityRunnerScreen` switches on `activity.kind`, so adding a kind is a new
branch in the switch and a new activity type in `domain/course.ts` — not a new
URL. `guardActivityOpenable` in `useActivityRunner.ts` rejects a mismatch
between the ids in the URL and the activity that was actually loaded, so a
hand-edited URL cannot render one section's activity under another section's
heading.

Sub-types that need their own interaction live in their own component:
`CodeLabRunner`, `ChallengeRunner`, and the panel components. They receive an
already-fetched `Activity` and know nothing about routing or storage.

## Legacy routes

`/module/:id`, `/challenge/:id`, and `/challenges` are redirects. The resolution
lives in `src/services/legacyRoutes.ts` and is a pure function over the legacy id.

The targets are **derived, not written out**. `seededSectionId`,
`seededLessonActivityId`, and `seededChallengeActivityId` in
`src/data/seed/course.ts` are the same functions the seed uses to build its ids,
and the redirect imports them. A hand-written copy of the id format would be a
second place to get it wrong, and a wrong id does not fail loudly — it lands on
the catch-all route and looks like a broken link rather than a bug.

## What is deliberately not here

- No server, no API client, no auth. `localStorage` and a role toggle.
- No real code execution. `ExecutionService` is the seam; see
  [`execution.md`](execution.md).
- No router-level data loading. Screens fetch in an effect through a hook
  (`useLearnDashboard`, `useActivityRunner`).
- No component test renderer. There is no `@testing-library` in the project, so
  tests are pure logic; components are verified by building and by opening the
  routes. This is a real limitation, not a virtue — see the Progress Log.
