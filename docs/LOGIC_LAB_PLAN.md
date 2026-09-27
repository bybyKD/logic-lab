# LOGIC LAB — Direction & Agent Instructions (Single Source of Truth)

> **Purpose:** This is the authoritative document for the direction of Logic Lab
> and the operating instructions for every AI/software agent working on it.
> Read this file FIRST when resuming any session.
>
> **Supersedes:** the v1 prototype plan (kept for history at
> `docs/archive/LOGIC_LAB_PLAN_v1_prototype.md`) and the v1 product spec
> (`docs/LOGIC_LAB_PRD.md`, kept for design-language history).
> From now on, **this file is the direction the app will go.**
>
> **Update rule:** when the direction changes, update this file in the same
> commit as the code change. Never let GitHub fall behind the working state.

---

# 0. Mission

You are the primary AI software engineer responsible for transforming the
existing **Logic Lab** project into a modern, scalable, interactive learning
platform.

Do **not** treat this project as a simple W3Schools clone.

Do **not** merely add more tutorials, static content, or CRUD pages.

The long-term product vision is:

> **An interactive learning ecosystem where students learn, practice, build,
> submit work, receive feedback, and collaborate with teachers in one
> platform.**

Programming is the first domain, but the underlying architecture must be
designed so the platform can eventually support other technical and academic
subjects.

The goal is to evolve the existing project rather than throw it away and
rebuild unnecessarily.

---

# 1. Core Product Vision

Logic Lab should eventually combine:

* Interactive learning content
* Real programming environments
* Exercises and challenges
* Projects
* Assignments
* Automated assessment
* Teacher-created content
* Student submissions
* Teacher grading
* Feedback
* Skill tracking
* Learning analytics
* AI-powered tutoring
* Classroom management
* Collaboration
* Progress tracking

The platform should feel like:

> **Interactive Classroom + Learning Engine + Coding Lab + LMS**

But never present itself as merely:

> W3Schools + Moodle

The product must have its own identity.

---

# 2. Product Principles

Always follow these principles when implementing features.

## 2.1 Learning over content consumption

Do not optimize for:

> Read → next → read → next

Optimize for:

> Understand → experiment → solve → receive feedback → improve → prove
> understanding

Students should spend as much time interacting as reading.

## 2.2 Interactivity is a core feature

When a concept can be visualized, simulated, executed, manipulated, or
experimented with, prefer that over static text.

Examples:

* Code execution
* Variable inspection
* Execution traces
* Visual algorithms
* Interactive diagrams
* Simulations
* Test cases
* Debugging exercises
* Drag-and-drop logic exercises
* Interactive quizzes

## 2.3 Teachers are creators

Teachers should not merely consume predefined courses.

The platform should eventually allow teachers to create:

* Lessons
* Code labs
* Challenges
* Quizzes
* Assignments
* Projects
* Exams
* Simulations
* Discussions

The teacher experience is a first-class part of the product.

## 2.4 Students should produce evidence of learning

Completion alone is not enough.

The system should eventually capture:

* Submitted code
* Test results
* Quiz results
* Project submissions
* Attempts
* Hints used
* Mistakes
* Teacher feedback
* Skill mastery
* Improvement over time

## 2.5 AI should teach, not simply answer

Do not build generic:

> "Ask AI anything"

features unless there is a specific educational purpose.

Prefer:

* Progressive hints
* Socratic questioning
* Error explanations
* Misconception detection
* Personalized exercises
* AI-generated feedback
* Teacher content generation
* Difficulty adaptation
* Learning recommendations

The AI should avoid immediately revealing answers when the student is supposed
to learn.

---

# 3. Current Repository

The existing repository is the starting point.

Preserve useful existing work.

Do not rewrite the entire project simply because you prefer a different
architecture.

Before changing architecture:

1. Inspect the existing implementation.
2. Understand the current data flow.
3. Identify reusable components.
4. Identify technical debt.
5. Make the smallest architectural change that enables the next stage.

Existing concepts include:

* Student dashboard
* Teacher/admin dashboard
* Modules
* Challenges
* Code editor
* Code simulation
* Progress tracking
* Skills
* Multiple programming languages
* Interactive learning pages

Treat these as foundations.

---

# 4. Important Existing Technical Concepts

The project already contains an interactive code-learning experience.

The code editor uses Monaco.

The current code execution/simulation layer is a prototype and should not be
mistaken for a production compiler/runtime.

The current simulator is pattern-based.

Do not make the entire future platform dependent on regex-based code
interpretation.

The long-term execution architecture should be designed around a proper
isolated execution environment.

---

# 5. Target Architecture

Gradually move toward the following conceptual architecture:

```text
                         LOGIC LAB
                             |
        +--------------------+--------------------+
        |                    |                    |
     STUDENT              TEACHER              PLATFORM
        |                    |                    |
   Dashboard            Dashboard           Administration
   Courses              Courses             Analytics
   Lessons              Classes             Content
   Labs                 Assignments         Settings
   Challenges           Gradebook
   Projects             Question Bank
   Submissions          Content Studio
        |                    |
        +----------+---------+
                   |
             COURSE ENGINE
                   |
     +-------------+-------------+
     |             |             |
   Content      Activities    Assessment
     |             |             |
 Lesson        Code Lab       Tests
 Reading       Challenge      Quiz
 Video         Simulation     Rubric
 Interactive    Assignment    Project
                   |
             LEARNING ENGINE
                   |
          Skill / Mastery Graph
                   |
              AI ENGINE
                   |
      +------------+-------------+
      |            |             |
    Tutor       Feedback     Generation
```

This is the destination, not something that must all be implemented
immediately.

---

# 6. Most Important Architectural Change

The current application relies heavily on static frontend data.

Gradually move away from concepts such as:

```text
MODULES
CHALLENGES
hardcoded lessons
hardcoded progress
hardcoded dashboard statistics
```

toward entities such as:

```text
Course
Section
Activity
Lesson
CodeLab
Challenge
Quiz
Assignment
Project
Submission
Attempt
Question
Rubric
Skill
Student
Teacher
Class
Enrollment
Feedback
```

The UI should eventually render content based on these entities rather than
requiring individual pages to contain hardcoded learning material.

---

# 7. Activity-Based Learning Model

A course should not fundamentally be:

```text
Module → Lesson
```

Instead use:

```text
Course
  |
  +-- Section
       |
       +-- Activity
             |
             +-- Lesson
             +-- Interactive Lesson
             +-- Code Lab
             +-- Challenge
             +-- Quiz
             +-- Assignment
             +-- Project
             +-- Simulation
```

The exact implementation may differ, but the conceptual model must remain
flexible.

A teacher should eventually be able to construct a complete learning
experience from activities.

---

# 8. Student Experience

The student interface should answer:

> **What should I learn, practice, or complete next?**

It should not just display statistics.

The eventual dashboard should contain:

* Continue learning
* Upcoming assignments
* Current courses
* Skill progress
* Recommended practice
* Recent feedback
* Projects
* Deadlines
* Classroom announcements
* Learning streak/activity where appropriate

Example:

```text
GOOD MORNING

Continue
Python → Functions
15 minutes

Practice
3 exercises targeting weak skills

Assignment
Expense Tracker
Due tomorrow

Feedback
Teacher commented on your latest submission
```

---

# 9. Teacher Experience

The teacher dashboard should eventually include:

```text
Overview
Courses
Classes
Students
Assignments
Gradebook
Question Bank
Analytics
Content Studio
Announcements
```

The teacher must be able to eventually:

1. Create courses.
2. Create activities.
3. Publish content.
4. Create assignments.
5. Create assessments.
6. View submissions.
7. Grade submissions.
8. Leave feedback.
9. Track class progress.
10. Identify students who are struggling.

---

# 10. Content Studio

One of the major product features should eventually be:

> **Content Studio**

Teachers can create:

```text
Lesson
Interactive Lesson
Code Lab
Challenge
Quiz
Assignment
Project
Simulation
Discussion
```

For code activities, teachers should eventually be able to configure:

* Instructions
* Starter code
* Allowed language
* Test cases
* Hidden test cases
* Expected behavior
* Hints
* Difficulty
* Learning objectives
* Related skills
* Rubric
* Time estimate

---

# 11. AI Teacher Tools

AI should eventually help teachers create content.

Example:

Teacher:

> Create a beginner Python exercise about loops.

AI generates a draft containing:

```text
Title
Learning Objective
Difficulty
Description
Starter Code
Example
Expected Output
Hints
Test Cases
Hidden Test Cases
Common Mistakes
Rubric
```

The teacher must be able to review and edit the generated content before
publication.

Never automatically publish AI-generated educational content without teacher
control.

---

# 12. AI Student Tutor

For students, AI should support learning rather than shortcutting it.

Preferred interaction:

```text
Student submits code
        |
        v
System detects problem
        |
        v
Hint 1
        |
        v
Student retries
        |
        v
Hint 2
        |
        v
Explanation
        |
        v
Solution discussion
```

The AI should consider:

* Current lesson
* Current exercise
* Student code
* Test results
* Previous attempts
* Relevant skills
* Hints already used

Do not blindly send the entire application state to an LLM.

Send structured context.

---

# 13. Learning Graph / Skills

The platform should eventually track conceptual mastery rather than only course
completion.

Example:

```text
Python
 |
 +-- Variables
 |
 +-- Conditions
 |
 +-- Loops
 |    |
 |    +-- for
 |    +-- while
 |    +-- nested loops
 |
 +-- Functions
 |
 +-- Data Structures
 |
 +-- Algorithms
```

Activities should be associated with skills.

Student performance generates evidence about those skills.

This allows the system to eventually answer:

> Which concepts does this student understand?

rather than merely:

> Which modules did this student complete?

---

# 14. Code Execution

The current execution/simulation layer is acceptable for prototyping.

Do not expand the regex simulator indefinitely.

Long-term architecture:

```text
Student Code
      |
      v
Execution Service
      |
      +-- Sandbox
      |
      +-- Runtime
      |
      +-- Resource Limits
      |
      +-- Timeout
      |
      +-- Test Runner
      |
      v
Execution Result
      |
      +-- stdout
      +-- stderr
      +-- test results
      +-- runtime
      +-- exit code
      |
      v
Learning Engine
```

Security is critical.

Never execute arbitrary student code directly on the main application server.

When implementing a real execution backend, research appropriate sandboxing
techniques and use strict limits.

---

# 15. Today's Prototype Scope

The objective is to produce a convincing working prototype quickly.

Do NOT attempt to implement the entire platform today.

The prototype should demonstrate one complete learning loop.

## Student flow

```text
Student
  |
  v
Join Course
  |
  v
Open Lesson
  |
  v
Interactive Example
  |
  v
Code Lab
  |
  v
Challenge
  |
  v
Submit
  |
  v
Receive Feedback
  |
  v
Skill Progress Updated
```

## Teacher flow

```text
Teacher
  |
  v
Open Course
  |
  v
Create Activity
  |
  v
Publish
  |
  v
Students Attempt
  |
  v
Teacher Sees Progress
  |
  v
Open Submission
  |
  v
Grade / Feedback
```

The prototype does not need a production backend for every feature.

Mock data is acceptable when necessary.

But the UI architecture must be designed so mocked data can later be replaced
with real APIs.

---

# 16. Most Important Prototype Screen

Build a convincing teacher classroom view.

Example:

```text
CLASSROOM
------------------------------------

Programming Logic

42 students

29 completed
8 struggling
5 haven't started

------------------------------------

CURRENT ACTIVITY

Conditional Logic Challenge

Completion
██████████████░░░░ 78%

Common issue:
Students are confusing
assignment and comparison operators.

[View students]
[Open activity]
[Explain to class]
```

This is more important than adding dozens of pages.

The prototype must communicate the product's differentiation immediately.

---

# 17. UI / UX Direction

Do not copy W3Schools.

Avoid:

* generic tutorial website styling
* excessive sidebars
* basic documentation layouts
* giant walls of text
* old-school LMS aesthetics
* generic dashboard templates
* excessive cards without hierarchy

The product should feel like a modern software product.

Desired characteristics:

* Clean
* Interactive
* Technical
* Modern
* Fast
* Focused
* Strong visual hierarchy
* Excellent code editor experience
* Good typography
* Responsive
* Dark/light support where useful
* Motion used intentionally

The interface should communicate:

> **This is a place where you work and learn.**

Not:

> **This is a website containing tutorials.**

---

# 18. Product Quality Rules

Every feature must answer:

> Why does this help someone learn or teach?

Avoid feature bloat.

Do not add features merely because Moodle or another LMS has them.

Prioritize experiences that make the platform substantially better.

---

# 19. Development Workflow

Before implementing a major feature:

1. Inspect the existing implementation.
2. Identify the smallest useful change.
3. Reuse existing components whenever reasonable.
4. Implement.
5. Test the feature.
6. Fix obvious UX or TypeScript/runtime issues.
7. Update documentation where necessary.
8. Commit the changes.
9. Push the commit to GitHub.

---

# 20. CRITICAL GITHUB RULE

## Every code change must be committed and pushed.

Whenever you:

* create a new file
* modify an existing file
* delete a file
* rename a file
* change configuration
* change architecture
* add a dependency
* change database/schema definitions
* change documentation related to implementation

you MUST commit the change and push it to the GitHub repository before moving
on.

Do not wait until the end of a feature.

The GitHub repository should continuously represent the latest working state.

### Required workflow

```bash
git status
git add <changed-files>
git commit -m "<clear conventional commit message>"
git push
```

Examples:

```bash
git commit -m "feat: add interactive activity model"
git commit -m "feat: add teacher classroom dashboard"
git commit -m "feat: add student challenge flow"
git commit -m "refactor: separate course data from UI"
git commit -m "fix: correct challenge submission state"
git commit -m "docs: update architecture notes"
```

Commit messages should describe the actual change.

---

# 21. Git Safety Rules

Never:

```text
git push --force
git reset --hard
git clean -fd
```

unless explicitly instructed by the user.

Never delete or overwrite unrelated work.

Before modifying files:

```bash
git status
```

If there are existing uncommitted user changes, preserve them.

Do not blindly discard work you did not create.

Before every push:

```bash
git diff --stat
git status
```

Make sure the pushed changes are intentional.

---

# 22. Secrets and Sensitive Files

Never commit:

```text
.env
.env.local
API keys
tokens
passwords
private credentials
secret certificates
private SSH keys
```

If environment variables are required, update an example file such as:

```text
.env.example
```

instead.

Never print secrets in logs, generated documentation, commits, or responses.

---

# 23. Dependency Policy

Do not add dependencies simply because they are popular.

Before adding a package, determine whether:

1. It is actually necessary.
2. Existing dependencies already solve the problem.
3. It is compatible with the current stack.
4. It increases unnecessary complexity.

Prefer stable, well-supported packages.

---

# 24. Code Quality

Use:

* TypeScript types
* Reusable components
* Small focused modules
* Clear naming
* Predictable state management
* Error handling
* Loading states
* Empty states
* Responsive layouts

Avoid:

* Massive components
* duplicated UI
* unnecessary abstraction
* hardcoded content inside page components
* deeply coupled components
* duplicated business logic

---

# 25. Documentation

As architecture changes, maintain documentation.

Important documentation should eventually include:

```text
README.md
docs/
  architecture.md
  product.md
  data-model.md
  ai.md
  execution.md
  contributing.md
```

Do not create documentation for the sake of documentation.

Document decisions that future developers or AI agents need to understand.

---

# 26. AI Agent Behavior

You are expected to behave like a senior product engineer.

Do not merely follow the literal instruction if it creates a clearly inferior
product.

When encountering a weak implementation, consider:

* Is this scalable?
* Is this reusable?
* Does this create technical debt?
* Does this conflict with the product vision?
* Is there a simpler implementation?
* Does this feature solve the actual user problem?

Make sensible improvements while keeping the scope under control.

---

# 27. Do Not Overengineer the Prototype

Prototype first.

Do not spend hours implementing infrastructure that the prototype does not
need.

It is acceptable to use:

* mock data
* local state
* temporary APIs
* placeholder authentication
* simplified execution
* simulated analytics

provided that the implementation is clearly structured for replacement.

The prototype should demonstrate the product experience.

---

# 28. Definition of Done

A feature is not done merely because the code compiles.

Before calling a feature complete:

```text
[ ] Feature works
[ ] UI is coherent
[ ] Loading state exists where relevant
[ ] Empty state exists where relevant
[ ] Error state exists where relevant
[ ] TypeScript errors are resolved
[ ] Existing functionality still works
[ ] No obvious console errors
[ ] Code is reasonably reusable
[ ] Documentation updated if necessary
[ ] Git commit created
[ ] Git push completed
```

---

# 29. Current Priority Order

When deciding what to build next, prioritize in this order:

### Priority 1

Student ↔ interactive learning experience

### Priority 2

Teacher ↔ classroom management

### Priority 3

Activities / assignments / submissions

### Priority 4

Assessment and feedback

### Priority 5

Skill / mastery system

### Priority 6

AI tutoring and teacher assistance

### Priority 7

Projects and portfolio/evidence of learning

### Priority 8

Broader academic subjects

---

# 30. Immediate Objective

Start by transforming the current Logic Lab prototype into a convincing
demonstration of:

> **Learn → Practice → Submit → Feedback → Measure**

and:

> **Create → Assign → Observe → Grade → Improve**

Do not attempt to finish every future feature.

Build the smallest experience that makes someone look at Logic Lab and
immediately understand:

> **"This is not another tutorial website. This is an interactive learning
> platform."**

---

# 31. Final Rule

Every implementation decision should move Logic Lab closer to becoming:

> **A platform where people don't just consume educational content—they
> actively learn, practice, build, receive feedback, and demonstrate what they
> know.**

And after every meaningful code or file change:

> **COMMIT → PUSH → CONTINUE**

Never leave the GitHub repository behind the current working state.

---
---

# PART B — REPOSITORY CONTEXT (grounded in the current code)

> Sections 0–31 above are the direction and are platform-agnostic.
> Part B maps that direction onto the code that actually exists today.

## B1. Current Stack (locked unless deliberately changed)

| Layer | Choice |
|---|---|
| Build | Vite 6 + React 18 + TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` |
| Routing | react-router-dom v7 |
| Editor | `@monaco-editor/react` (CDN mode) |
| Animation | `motion` (framer-motion v13) + custom rAF scroll system |
| Data | 100% client-side mock modules (`src/data/*`) |
| Deploy | Static (Vercel) |

Fonts: Space Grotesk (display/UI), Inter (dense UI), JetBrains Mono (code).
Colors: `lab-950/900/800/700` near-black, warm off-white text, cyan accent,
muted success/error/warning. These tokens live in `src/index.css` (`@theme`).

## B2. What Exists Today (reuse, do not rewrite)

```text
src/
├── App.tsx                       # 6 flat routes, no auth/layering
├── data/
│   ├── modules.ts                # 10 modules  → becomes Course + Section seed
│   ├── challenges.ts             # 30+ challenges → becomes Activity(kind=challenge)
│   ├── languages.ts              # 4 languages (python/java/go/c)
│   ├── codeExamples.ts           # one-logic-four-languages samples
│   └── participants.ts           # 80 participants → becomes Student/Enrollment seed
├── utils/codeSimulator.ts        # PATTERN-MATCHING simulator (prototype only)
├── components/
│   ├── code/     CodeEditor, CodeTrace, ExecutionTimeline, LanguageSwitcher
│   ├── challenge/ AlgorithmBuilder, ChoiceCard, ScrollToChallenge
│   ├── dashboard/ LearningDashboard, ModuleCard, ProgressRing, SkillBar, StatCard
│   ├── admin/    AdminDashboard, ParticipantTable, ParticipantDetail
│   ├── logic/    LogicFlowVisualizer
│   ├── landing/  cinematic marketing sections
│   ├── layout/   Navbar, Footer
│   └── ui/       GlassPanel, GlowButton, CodeBlock, ScrollReveal, …
└── pages/         Landing, Dashboard, Module, Challenge, ChallengesIndex, Admin
```

Reusable as-is: Monaco wrapper, trace/debugger UI, `LogicFlowVisualizer`,
`AlgorithmBuilder`, design-system primitives, the whole landing experience.

## B3. Known Gaps to Close (mapped to the vision)

| Vision requirement | Today | Action |
|---|---|---|
| Course / Section / Activity entities | `modules.ts` + `challenges.ts` | Introduce entity types + a data-access layer; keep old data as seed |
| Submissions / Attempts / Feedback | none | Add attempt capture on challenge submit |
| Skill mastery graph | `SkillBar` from hardcoded % | Derive mastery from attempts |
| Teacher as creator (Content Studio) | none | Teacher route + minimal activity editor |
| Teacher classroom view (Priority screen) | `AdminDashboard` aggregate only | Build the classroom screen from §16 |
| Code Lab with test cases | simulator + fixed expected output | Add `TestCase` model; keep simulator behind an `ExecutionService` interface |
| Isolated execution | client-side regex | Define the interface now, real sandbox later (§14) |
| Auth / roles | static "demo login" → `/dashboard` | Introduce a `Session`/role switch for prototype (student vs teacher) |

## B4. Build Plan — Phase 1 → 7 (AUTHORITATIVE)

> This replaces the earlier 6-step sketch. The historical v1 build order is kept
> in `docs/archive/LOGIC_LAB_PLAN_v1_prototype.md`.
>
> Status markers: `[ ]` not started · `[~]` in progress · `[x]` committed+pushed.
> **Update this section and the Progress Log in the same commit as the phase.**

### Locked decisions for this increment

- **Testing:** Vitest, the only new dependency (`"test": "vitest run"`). If the
  install fails offline, fall back to `node:test` with zero dependencies. Tests
  cover pure logic only (no jsdom, no component tests).
- **UI copy:** English on all new teacher/student screens. Known trade-off: the
  landing page and the legacy dashboard are still Bahasa until Phases 5–6
  migrate them, so the app is temporarily mixed-language.
- **Persistence:** `localStorage` for attempts, grades, feedback, and session, so
  the learn→submit→grade loop survives a reload and is demonstrable end to end.
- **Execution:** client-side simulation behind an `ExecutionService` interface.
  Never on a server. Real sandboxing is a later phase (§14).
- **Git:** never stage files the user edited but did not ask to be committed —
  as of this plan, uncommitted user edits exist in `.gitignore`,
  `src/components/landing/Hero.tsx`, `src/components/logic/LogicFlowVisualizer.tsx`,
  and `src/components/ui/StickyLogicShowcase.tsx`.

### Phase 1 — Domain model + seed `[x]`

**Goal:** separate content from learner state, and define entities the UI can
render instead of hardcoded arrays.

```ts
// src/domain/people.ts
Person{id,name,email} · Student · Teacher
Class{id,courseId,teacherIds,term,startDate,endDate}
Enrollment{classId,studentId,status}   // ← progress/completed/locked move here

// src/domain/course.ts
Course{id,code,title,description,languageIds,skillIds,status,version,updatedAt}
Section{id,courseId,title,summary,order,activityIds}
type ActivityKind = 'lesson'|'interactive'|'codeLab'|'challenge'
                  |'quiz'|'assignment'|'project'|'simulation'
ActivityBase{id,sectionId,kind,title,objective,instructions,difficulty,
             estimatedMinutes,skillIds,points,order,status,dueOffsetDays?,rubric?}
  + LessonActivity{blocks: LessonBlock[]}          // typed blocks, NOT markdown
  + InteractiveActivity{visualizer,snippetIds}
  + CodeLabActivity{languages,starterCode,testCases,hints}
  + ChallengeActivity{challengeType,prompt,snippet,choices?,answer,explanation}
  + QuizActivity · AssignmentActivity · ProjectActivity · SimulationActivity

// src/domain/assessment.ts
TestCase{id,name,hidden,input?,expectedOutput,skillId?,weight} · TestOutcome
Attempt{id,activityId,studentId,kind,submittedAt,language?,code?,choiceIndex?,
        selectedLines?,passed,score,durationMs,hintsUsed,misconceptionId?}
Submission{attemptId,status:'submitted'|'graded',grade?,gradedBy?,gradedAt?}
Feedback{authorRole:'auto'|'teacher',body,kind:'comment'|'rubric'|'auto'}
Rubric{criteria:[{id,label,maxPoints,levels:[{label,points,descriptor}]}]}

// src/domain/learning.ts
Skill{id,name,parentId?,domain}                   // DAG: for/while/nested under loops
SkillMastery{skillId,score,evidenceCount,lastPracticedAt,confidence}
ActivityProgress{activityId,studentId,status,bestScore,attempts,lastActivityAt}
```

- `src/data/seed/` converts `MODULES`→Course/Sections/Activities,
  `CHALLENGES`→`ChallengeActivity`, `LESSON_SAMPLES` (currently inline in
  `ModulePage.tsx`)→`LessonActivity.blocks`, `PARTICIPANTS`→`Student`+`Enrollment`.
- Normalize free-text skills (`'Dekomposisi'`, `'if'`, `'else'`) into ids with a
  parent DAG.
- Deterministic `mulberry32` PRNG for seeded attempts — never `Math.random()` at
  module scope, or the classroom numbers change on every reload.
- `src/data/selectors.ts` exposes derived views so the legacy pages keep working.
- Class = 42 of the 80 participants (matches the §16 example).

**DoD:** `tsc` clean, zero visual change, legacy exports still satisfied.
**Commit:** `feat(domain): add course/activity/attempt entity model and seed data`

### Phase 2 — Services `[x]`

**Goal:** one seam for execution, one for data access, real derived learning state.

- `services/execution/` — `ExecutionService.run(req) → ExecutionResult` where
  `ExecutionResult{status:'ok'|'failed'|'error'|'unsupported', stdout, stderr,
  testOutcomes, durationMs, exitCode, trace?}`. `SimulatedExecutionService` wraps
  the existing simulator; unrecognized pattern → `unsupported` (honest) instead of
  a fake error. `getExecutionService()` is the single swap point for a real sandbox.
- `services/repositories/` — async repos for course/class/attempt/submission/
  feedback/student, backed by seed + persistence, so loading/empty/error states
  are real from day one and a future API is a drop-in.
- `services/learning/mastery.ts` — pure functions. Mastery = recency-weighted mean
  of attempt scores (14-day half-life) × hint penalty (floor 0.6), plus
  `weakestSkills`, `classProgress`, `strugglingStudents`, `aggregateMisconceptions`.
  Confidence: low <3 evidence, medium <8, high 8+.
- `services/learning/misconceptionDetector.ts` — `detectMisconception(code,
  testOutcomes)` over a small documented rule catalog:
  `assignment-in-condition` · `off-by-one-range` · `indentation-block` ·
  `uninitialised-accumulator`. Each rule carries skill + remediation hint +
  recommended activity. This is what makes the §16 "Common issue" line **derived**.
- `services/storage/persistence.ts` — versioned `logiclab.v1.*`, safe JSON parse.
- `services/session/SessionProvider.tsx` — role, currentStudentId, currentTeacherId,
  `switchRole`, `resetDemoData`. Replaces the public `/admin` route and fake login.

**Tests:** `mastery`, `misconceptionDetector`, `SimulatedExecutionService`
(including `unsupported`), and seed referential integrity (every `sectionId` and
`skillId` resolves, every `TestCase` has an expected output, no orphan activities).
**Commit:** `feat(services): add execution, repository, mastery, and session layers`

### Phase 3 — Teacher classroom screen (§16) `[x]`

**Goal:** the product's most important single screen.

- `components/teacher/` — `TeacherLayout` (rail: implemented sections live;
  remaining §9 destinations listed muted as non-links, so there are no dead
  routes), `ClassroomScreen`, `CohortSplit` (completed / struggling / not
  started, all derived), `ActivityCompletionCard`, `MisconceptionPanel`, and the
  `[View students] [Open activity] [Explain to class]` actions.
- `components/ui/AsyncBoundary.tsx` — one reusable loading/error/empty wrapper,
  satisfying §28 for every future screen.
- `/teacher` route; `/admin` becomes a redirect; role switch in `Navbar`.
- `components/admin/*` gains a view-model adapter (`toStudentRow`) instead of a
  rewrite.

**DoD:** derived cohort split, derived misconception, tests+build pass, 1440px and
390px verified, no console errors.
**Commit:** `feat(teacher): add derived classroom screen with cohort and misconception panels`

### Phase 4 — Teacher loop: create → assign → observe → grade `[x]`

`/teacher/courses` · `/teacher/courses/:courseId` (sections, activities,
publish/draft) · `/teacher/studio` + `/teacher/studio/:activityId` (**Content
Studio**: instructions, starter code, allowed language, visible + hidden test
cases, hints, difficulty, learning objectives, related skills, rubric, time
estimate) · `/teacher/assignments` · `/teacher/assignments/:activityId/review`
(run tests, per-case results, rubric scoring, leave feedback → `Submission.grade`
+ `Feedback`) · `/teacher/gradebook` · `/teacher/classes/:classId/students`.
**Commit:** `feat(teacher): add content studio, submission review, and gradebook`

### Phase 5 — Student loop: learn → practice → submit → feedback `[x]`

One kind-switched route:
`/learn/c/:courseId/s/:sectionId/a/:activityId` +
`features/student/activity-runner/`.
`CodeLabActivity` = Monaco + `ExecutionService` + visible/hidden test cases
(hidden results masked until graded) + progressive hints + submit → persisted
`Attempt`. `ChallengeActivity` reuses `ChoiceCard`; the **`debug` variant (pick
the faulty line) and `algorithm` variant (`AlgorithmBuilder` parameterized — it is
currently hardcoded to the AGE blocks) are new seeded content**, because no
`debug` challenge exists in the data today. After submit: auto-feedback panel
(per test case) + teacher feedback if present + skill-mastery delta.
**Commit:** `feat(student): add activity runner with code lab, submit, and feedback`

### Phase 6 — Student dashboard rewrite `[x]`

`/learn` — Continue · Upcoming · Recommended practice (weakest skills
→ concrete activities) · Recent feedback · Skill graph (visualizes the `Skill`
DAG). **Every number derived**; deletes `PROFILE_SKILLS` and the hardcoded
`842 / 37 / 5 DAYS` stats in `LearningDashboard.tsx`.
**Shipped as** "Up next" + "Waiting on your teacher", not due dates: no due-date
data exists anywhere in the model (see the Phase 6 log).
**Commit:** `feat(student): rebuild dashboard from derived progress and skill mastery`

### Phase 7 — Cleanup, migration, docs `[x]`

Remove `LESSON_SAMPLES`, `PROFILE_SKILLS`, literal stats, the dead `debug`/`truth`
branches and the `answer: 'fixed'` comment. Redirect `/dashboard`→`/learn`,
`/module/:id`→section, `/challenge/:id`→activity, `/challenges`→`/learn`; delete
superseded `components/admin/*`.

**Shipped, with three corrections to the scope above** — see the Phase 7 log:
`PROFILE_SKILLS`, the literal stats, and the `/dashboard` redirect were already
done in Phase 6; `debug` is no longer dead (Phase 5 seeded and implemented it), so
only `truth` was removed; and `LESSON_SAMPLES`'s *content* was kept while its
module-number-keyed lookup was removed. Optionally re-point the landing page's
`SolveChallenge` / `DebuggingSection` at the shared activity renderer — skipped if
it risks the landing page. Docs: `README.md` (missing today), `docs/architecture.md`,
`docs/data-model.md`, `docs/execution.md` (incl. sandbox research note). No empty
`ai.md` / `contributing.md` stubs — write them when AI features and contributors
exist.
**Commit:** `refactor: remove legacy module/challenge flow and add architecture docs`

### End-state route map

```text
/                                                  landing (untouched marketing)
/learn                                             student dashboard
/learn/c/:courseId                                 course overview (NOT BUILT)
/learn/c/:courseId/s/:sectionId                    section overview (NOT BUILT)
/learn/c/:courseId/s/:sectionId/a/:activityId      activity runner
/teacher                                           classroom (§16)
/teacher/courses  /teacher/courses/:courseId       builder + publish
/teacher/studio    /teacher/studio/:activityId     Content Studio
/teacher/assignments  /teacher/assignments/:activityId/review
/teacher/gradebook  /teacher/classes/:classId/students
/dashboard                                        → redirect to /learn (Phase 6)
/admin /module/:id /challenge/:id /challenges     → redirects (removed in Phase 7)
```

### Out of scope for all 7 phases

Real backend · real auth · real sandboxed execution (interface only, §14) · AI
tutoring and AI content generation (§11/§12) · exams · discussions · subjects
beyond programming. These appear in the rail as roadmap text, never as fake
screens.

## B5. Prototype Rules

* Mock data is fine. Hardcoded learning content *inside page components* is not.
* Every list needs loading, empty, and error states from the start.
* No new runtime dependency without a written justification in the commit body.
* Never run student code on the main app server; client-side simulation only for
  the prototype, behind a swappable interface.

## B6. Definition of Done (operational)

Same checklist as §28, plus:

* `npm run build` passes (runs `tsc -b` → `vite build`).
* No new `any`, no unused locals/params (`noUnusedLocals`/`noUnusedParameters`
  are on).
* Verified at 1440px and ~390px.
* Keyboard-reachable; `prefers-reduced-motion` respected.
* This file updated if the direction or schema changed.

## B7. Resume Protocol (MANDATORY — do not skip)

This exists so no session ever loses track of the plan. Follow it literally.

**At the start of every phase:**

1. Read this file **top to bottom** — direction (§0–31) then the build plan (B4).
2. `git log --oneline -5` — confirm the previous phase's commit exists.
3. `git log origin/main -1` — confirm the previous phase was actually **pushed**.
4. `git status` — if there are uncommitted edits you did not make, **preserve
   them** and do not stage them. Ask the user if unsure.
5. Find the first phase marker in B4 that is not `[x]` and state it before coding.
6. Run `npm run test && npm run build` to confirm the tree is green before
   starting.

**At the end of every phase:**

1. Flip the phase marker in B4 (`[ ]` → `[x]`).
2. Append a Progress Log entry: what shipped, key files, commit hash, any
   deviation from the plan, and what the next phase must know.
3. Commit and push. Only then begin the next phase.

**If the plan and the code disagree:** the code is the truth about what exists;
update B4 and the Progress Log in the same commit as the fix. Never leave B4
describing work that was not done, or omitting work that was.

---

## Progress Log

### Direction

- **v1 prototype (archived)** — cinematic landing, 4-language model, Monaco
  editor, pattern-matching simulator, trace debugger, 30+ challenges, student
  dashboard, 80-participant admin dashboard, responsive + a11y pass. Full detail
  in `docs/archive/LOGIC_LAB_PLAN_v1_prototype.md`.
- **Direction reset** — product repositioned from "premium tutorial site" to
  "interactive learning platform". Entity model, execution direction, prototype
  scope, priorities, and the commit→push rule defined here.
- **Build plan authored** — the 7-phase plan in B4 was agreed with the user and
  locked: Vitest as the only new dependency, English copy on new screens,
  `localStorage` persistence, execution behind an `ExecutionService` interface.
  Known trade-off recorded: mixed-language UI until Phases 5–6.

### Phase status

| Phase | Scope | Status | Commit |
|---|---|---|---|
| 1 | Domain model + seed | `[x]` | `8b7620d` |
| 2 | Services | `[x]` | `d0f8815` |
| 3 | Teacher classroom (§16) | `[x]` | `cdaceaa` |
| 4 | Teacher loop | `[x]` | `e1fb2cf` |
| 5 | Student loop | `[x]` | `ecc0182` |
| 6 | Student dashboard | `[x]` | `7048cbe` |
| 7 | Cleanup + docs | `[ ]` | — |

### Findings that shaped the plan
- `Module.progress` / `.completed` / `.locked` are hardcoded on the content
  object (`src/data/modules.ts`) — the single biggest structural blocker, fixed
  by moving learner state to `Enrollment`.
- `LESSON_SAMPLES` is inline in `ModulePage.tsx` and `PROFILE_SKILLS` + literal
  stats (`842`, `37`, `5 DAYS`) in `LearningDashboard.tsx` — both violate the
  "no hardcoded content in pages" rule.
- All 30 challenges are `choose` (16) or `predict` (14). The `debug` / `truth`
  members of `Challenge.type` and the `answer: 'fixed'` comment are dead, so the
  debug and algorithm activity variants in Phase 5 are **new seeded content**.
- `simulateCode` has only 3 callers (`ChallengePage`, `CodeTrace`, and the
  landing-only `InteractiveCode`), so wrapping it in Phase 2 is cheap.
- `ChallengePage` renders only `choices`, so `predict` and `choose` look
  identical today.

### Phase 1 — Domain model + seed (done)

**Shipped**

- `src/domain/` — `people.ts` (Person/Student/Teacher/Class/Enrollment),
  `course.ts` (Course/Section/`Activity` as a 8-way discriminated union),
  `assessment.ts` (TestCase/TestOutcome/Attempt/Submission/Feedback/Rubric/
  Grade), `learning.ts` (Skill/SkillMastery/ActivityProgress/Misconception),
  plus a barrel `index.ts`. Types only, zero runtime.
- `src/data/seed/skills.ts` — 31 skills across 7 domain roots, as a DAG
  (`control-flow > conditionals > if-else`, `control-flow > loops > for-loops >
  while-loops > nested-loops`). Language-agnostic on purpose.
- `src/data/seed/course.ts` — builds 1 Course → 10 Sections → 46 Activities
  (10 lessons, 2 interactive, 3 code labs, 1 quiz, 30 challenges) from the
  existing `MODULES` / `CHALLENGES` / `ageExample`. Also holds `SNIPPETS` (3
  code examples addressed by id) and `LESSON_SAMPLES`.
- `src/data/seed/people.ts` — 2 teachers, 80 students (from `PARTICIPANTS`),
  1 class, 42 enrollments so "42 students" is a real filtered count.
- `src/data/selectors.ts` — derived reads over the seed graph.
- `ModulePage.tsx` now imports `LESSON_SAMPLES` from the seed instead of
  defining it inline. That was the only page touched; **no visual change**.

**Decisions taken while building**

- Challenge answers are now `correctChoiceId` strings over `ChallengeChoice[]`
  instead of an index into `choices: string[]`. The domain is fixed even though
  the legacy `Challenge.answer: number` still exists — Phase 7 deletes it.
- `TestCase.input` exists in the model but the pattern-matching simulator can
  only evaluate one fixed program, so seeded hidden test cases carry an `input`
  they cannot be executed against. This is deliberate: Phase 2's execution
  service reports those as `unsupported` rather than faking a pass, and the real
  sandbox in a later phase makes them meaningful.
- Per-challenge skill overrides (`CHALLENGE_SKILL_OVERRIDES`) exist because
  otherwise every challenge in a module reports the same skills and mastery
  cannot be attributed to a single concept.
- `assignment`, `project` and `simulation` are **modelled but not seeded** —
  those are authored by a teacher in Content Studio (Phase 4) rather than
  invented here. `seed` covers lesson/interactive/codeLab/challenge/quiz.
- **Deviation from plan:** the deterministic `mulberry32` PRNG and seeded
  `Attempt` records were *not* built in Phase 1. Progress is derived from
  attempts, so there is nothing random to do until mastery exists. Moved to
  Phase 2, where it belongs, together with the attempt distribution that should
  land near the 29/8/5 cohort split.

**Verification**

- `npx tsc -b --force` clean; `npm run build` passes (502 modules).
- Referential-integrity sweep over the whole seed graph (skill parents, course
  skill refs, section↔activity back-references, every activity in exactly one
  section, snippet refs, code-lab starter code per language, presence of both a
  visible and a hidden test case, challenge/quiz answer ids): **0 problems**.
- Headless render of `/`, `/dashboard`, `/module/4`, `/challenges`, `/admin`:
  all render, no app console errors. `/module/4` still shows its 3 lesson
  samples and 4 challenges, now sourced from the seed.

**Next — Phase 2:** execution service, repositories, mastery, misconception
detector, persistence, session, and the seeded attempt distribution behind
Vitest.

### Phase 2 — Services

**Shipped**

- `src/services/execution/` — `ExecutionService` contract with
  `ExecutionResult{status, stdout, stderr, testOutcomes, durationMs, exitCode,
  trace, note?}`, plus `SimulatedExecutionService` and the
  `get/setExecutionService` swap point.
- `src/services/repositories/index.ts` — async repos for course, class, attempt,
  submission and feedback, layered seed-first over `localStorage`.
- `src/services/learning/mastery.ts` — `computeSkillMastery`, `weakestSkills`,
  `deriveActivityProgress`, `classProgressSummary`, `studentEngagement`,
  `aggregateMisconceptions`. All pure, all taking an injected `now`.
- `src/services/learning/misconceptionDetector.ts` — 4 rules, ordered
  most-specific-first, with a `PROVABLE_FROM_SOURCE` set separating rules that hold
  regardless of test results from heuristics that need a failure.
- `src/services/learning/misconceptions.ts` — 5-entry catalog, each with skill,
  remediation hint and recommended activity.
- `src/services/storage/persistence.ts` — versioned `logiclab.v1.*`, defensive
  reads, `clearPersisted`.
- `src/services/session/SessionProvider.tsx` — role, student/teacher ids,
  `switchRole`, `resetDemoData`. Mounted in `App`.
- `src/data/seed/attempts.ts` — the seeded history: **408 attempts**, plus
  submissions and teacher feedback, generated by `mulberry32(20260216)` with
  timestamps relative to an injected clock.
- `vitest.config.ts`, `npm test` / `npm test:watch`. **116 tests across 6 files.**
- `CodeEditor` now takes an `ExecutionResult` instead of its own `RunResult`;
  `InteractiveCode` and `ChallengePage` go through the service. This deleted a
  fabricated `Math.random()` duration and a duplicated "did the simulator
  understand this?" branch in two places.

**Decisions taken while building**

- **The hint penalty discounts the score, not the weight.** The plan's wording
  ("recency-weighted mean × hint penalty") is ambiguous, and the weighted-mean
  reading made the penalty cancel: `score·w / w` is invariant, so a learner doing
  each activity once — the normal case — saw no effect at all. Discounting the
  score makes it visible: 4 hints turns a 100 into a 60, floored at 0.6 so hints
  never zero a correct answer. `ActivityProgress.effectiveScore` was added and the
  `mastered` threshold now judges that rather than the raw score.
- **A provable misconception is reported even on a passing submission.** This is
  the case the static path exists for (`if age = 18` prints the right answer), and
  without it nothing would ever tag a passing attempt — yet the seed contains
  exactly that. `detectMisconception` therefore reports a `PROVABLE_FROM_SOURCE`
  hit regardless of outcome, and stays silent for a heuristic on a pass.
- **Misconceptions are counted on passing attempts too.** `aggregateMisconceptions`
  and `studentEngagement` both count any tagged attempt. A program that printed the
  right answer via `=` still taught the wrong rule, and the two teacher panels must
  not disagree about the same student.
- **Deviation from plan — rule names.** The plan listed
  `assignment-in-condition` · `off-by-one-range` · `indentation-block` ·
  `uninitialised-accumulator`. Shipped: `assignment-in-condition` ·
  `accumulator-reset` · `off-by-one-range` · `strict-boundary`, plus a generic
  `logic-error` bucket. `indentation-block` was dropped because indentation errors
  are reported by the runtime as `errorType: 'syntax'`, not by a heuristic;
  `strict-boundary` was added because the bare `>` / `<` at an inclusive boundary
  is the mistake this course actually turns on.
- **Deviation from plan — function names.** `classProgress` and
  `strugglingStudents` shipped as `classProgressSummary` (returning all four
  buckets, not just the split) and `studentEngagement` (one row per student, with
  `struggling` as a segment). A standalone `strugglingStudents` helper would be a
  one-line filter over the latter, so it is left to the Phase 3 call site.
- `resetDemoData` is implemented in `repositories` (it clears the persisted
  overlays) and surfaced through the session, so consumers have one entry point and
  the session's own state is reset with the data.
- The `/admin` route is still public. The plan puts the `/admin` → `/teacher`
  redirect in Phase 3, along with the role switch in the Navbar; Phase 2 only
  mounts the provider.
- **Bug found by the test suite, not by review:** `readPersisted(key, SEED_X)`
  returns the *live* seed array, and `save()` appended to it in place — so the
  first persisted write permanently corrupted the baseline that a reset restores
  to. Fixed by cloning the seed at the read; two regression tests cover it, and
  both were verified to fail without the fix.

**Verification**

- `npx tsc -b --force` clean; `npm run build` passes (505 modules).
- `npm test` — **116 passed, 0 failed** (6 files). Coverage includes the required
  `unsupported` path, the `not-evaluated` path, hint floors, recency decay, parent
  roll-up, cycle safety, the 29/8/5 split, and full seed referential integrity.
- Browser-checked via Playwright against the production build: Run on the landing
  editor returns `OK · executed in 0ms` / `Dewasa`; an unrecognised program reports
  `UNSUPPORTED` with the explanatory note rather than a blank red output. `/`,
  `/challenge/1`, `/challenges`, `/module/4`, `/dashboard`, `/admin` all render with
  no console or page errors, and `/` and `/challenge/1` have no horizontal overflow
  at 390px.
- `npm install -D vitest` reported 2 vulnerabilities (1 low, 1 moderate) inherited
  from the Vite toolchain; not addressed in this phase.

**Next — Phase 3:** the teacher classroom screen (§16) — `TeacherLayout`,
`ClassroomScreen`, `CohortSplit`, `MisconceptionPanel`, `AsyncBoundary`, the
`/teacher` route, the `/admin` redirect, and the role switch in the Navbar. All of
it reads the Phase 2 derived functions, so no numbers are written down.

### Phase 3 — Teacher classroom screen (§16)

**Shipped**

- `src/components/teacher/TeacherLayout.tsx` — the §9 destination list, with only
  the built sections as links and the rest as muted `soon` text. The rail becomes a
  horizontal scroller under `lg`.
- `src/components/teacher/ClassroomScreen.tsx` — the screen, in §16 order: cohort
  split, current activity, common issue, then the roster. Loads through the Phase 2
  repositories inside one `AsyncBoundary`.
- `src/components/teacher/CohortSplit.tsx` — 29 completed · 8 struggling · 5 not
  started, plus a proportional bar of the same numbers.
- `src/components/teacher/ActivityCompletionCard.tsx` — kind, estimate, objective,
  completion, and the activity's test cases when it has any.
- `src/components/teacher/MisconceptionPanel.tsx` — the headline issue with its
  remediation hint and recommended activity, the runner-up issues, and the three
  §16 actions.
- `src/components/teacher/classroomViewModel.ts` — `buildClassroom` (pure, injected
  `now`, throws rather than rendering a focus activity it cannot resolve),
  `relativeTime`, `segmentLabel`, `strugglingRows`.
- `src/components/teacher/AdminRedirect.tsx` — `/admin` → `/teacher`.
- `src/components/ui/AsyncBoundary.tsx` — `useAsync` plus loading / error / empty /
  ready, satisfying §28 once for every later screen.
- `src/components/admin/toStudentRow.ts` — the admin adapter (see decisions).
- `src/components/layout/Navbar.tsx` — the role switch, and `Monitor` → `Classroom`
  in the app links.
- `src/data/seed/attempts.ts` — rebalanced, see decisions.

**Decisions taken while building**

- **One definition of "struggling", in `mastery.ts`.** `cohortSegmentForStudent` is
  now the single rule — tried the focus activity, not passed it yet — and both
  `classProgressSummary` and the roster label use it. The first implementation had
  `studentEngagement` bucket students by overall pass rate *and* the panel count by
  focus activity, which produced two different answers on one screen: adding a
  passing lab attempt moved a student out of `struggling`, so the "Struggling"
  filter and the `8` in the split chart could disagree, and in practice the filter
  was always empty. The roster still shows pass rate, but as its own column.
- **The `/admin` adapter takes a `StudentRow`, not a `StudentEngagement`,** for the
  same reason — otherwise the admin screen would classify students a second time.
  It also reports per-student `progress` as 0/100 rather than the class completion
  rate, which was meaningless as an individual's score. It lives in
  `components/admin/` because that is the shape it feeds, and it is the only new
  file under `admin/`; the components themselves are untouched.
- **Two of the three §16 actions ship disabled, with a stated reason.** `Open
  activity` has nowhere to go yet (`/module/:id` resolves legacy numeric module ids
  only, so navigating there with an activity id would crash) and `Explain to class`
  needs the feedback loop from Phase 4. Both render, both say why in `title` and
  `aria-label`, and both are one callback away from working. A silently dead button
  would have been the alternative.
- **The seed was rebalanced 408 → 423 attempts.** The Phase 2 numbers no longer
  produced the plan's headline: `assignment-in-condition` was not the top issue,
  because a program's best score was the only ordering signal and the boundary lab
  scored higher. Adding one failing code-lab attempt for the 8 focus-failing
  students fixed the ranking honestly — it is the code that carries the evidence.
  Multiple-choice attempts no longer receive inferred tags, and the newest attempts
  now fall inside 24 hours so the header reports real activity instead of `0`.
- **The rail lists the §9 destinations as muted text rather than dead links,** so a
  visitor can see what is planned without the prototype looking broken. The panel
  footer says so in as many words.

**Verification**

- `npx tsc -b --force` clean; `npm run build` passes.
- `npm test` — **145 passed, 0 failed** (7 files). The 29 new tests cover
  `buildClassroom` (split arithmetic, focus resolution, roster membership, ranking,
  remediation hints, empty-input behaviour, determinism), `relativeTime`,
  `strugglingRows`, and the admin adapter.
- Browser-checked with Playwright at 1440px and 390px: `/`, `/dashboard`,
  `/module/1`, `/challenges`, `/challenge/1`, `/teacher` and `/admin` all render
  with no console or page errors and no horizontal overflow. `/admin` lands on
  `/teacher`; the role switch moves to `/dashboard` when set to student.
- **Bug found by the browser check, not by review:** at 390px the page scrolled
  sideways to 652px. The runner-up issue list's `truncate` text is `nowrap`, and
  grid items default to `min-width: auto`, so one such row stretched the grid track
  and every panel in it. Fixed with `[&>*]:min-w-0` on the two grids — the panels
  now shrink and the list truncates. No test would have caught this; it needed a
  real viewport.
- The screen shows `42` enrolled, `29 / 8 / 5`, `69%` completion, `28` submissions
  in the last 24 hours, and `assignment-in-condition` (18 students) as the headline
  — all derived at runtime from the attempt records.

**Next — Phase 4:** the teacher loop — courses, the Content Studio, assignments,
submission review, and the gradebook.

### Phase 4 — Teacher loop: create → assign → observe → grade

**What shipped**

- **Content Studio** (`/teacher/studio`, `/teacher/studio/:activityId`) — the full
  authoring surface: instructions and learning objective, difficulty, time
  estimate, points, related skills, allowed languages, per-language starter code,
  visible + hidden test cases with weights and expected output, ordered hints, and a
  rubric editor. The form holds a local copy and writes only on an explicit save, so
  a teacher can abandon a half-typed activity without touching the course.
- **Course builder** (`/teacher/courses/:courseId`) — sections and their activities
  with publish / unpublish. Publishing is gated on the *same* validator the studio
  uses, so an activity with a blocker cannot reach a class through a second route.
- **Review queue** (`/teacher/assignments`) and **review** 
  (`/teacher/assignments/:activityId/review`) — the work, a `Run tests` button
  through `ExecutionService`, per-case results, rubric scoring per criterion, a
  score override, and a feedback note. The score shown before saving is computed by
  the pure `gradeSubmission`, so the preview and the stored grade cannot disagree.
- **Gradebook** (`/teacher/gradebook`) — one row per enrolled student, one column per
  activity that has submissions. Blank cell = nothing handed in; `pending` = waiting
  on the teacher.
- **Student detail** (`/teacher/classes/:classId/students`) — the roster, then one
  learner in full: derived segment, skill mastery from their own attempts, every
  submission, and the feedback given.

**Key files**

- `services/assessment/activityDraft.ts` — one validator for every kind, returning
  field-keyed errors and warnings. Shared by the studio and the course builder.
- `services/assessment/grading.ts` — `gradeSubmission` is pure: submission +
  activity + teacher input → new `Submission` and optional `Feedback`. Score
  precedence is explicit override → rubric percentage → submission score.
- `services/assessment/reviewQueue.ts`, `services/assessment/gradebook.ts` — the two
  derivations, both pure.
- `services/repositories/index.ts` — the authored-activity overlay and
  `gradeWithFeedback`.
- `components/teacher/` — `TeacherPage` (shared chrome), `StudioFields`,
  `useCourseOutline`, and the seven screens.

**Deviations from the plan**

- **There is no `Assignment` entity, and the plan did not ask for one.** Phase 4
  routes say `/teacher/assignments`, but `Submission` already carries `activityId`
  and the domain has no assignment record. Inventing one would add a second thing
  that can disagree with the submission it points at. So an "assignment" here is an
  activity that students have actually submitted work for, and the screen says so.
  A course with no submissions has nothing to review, which is why those activities
  are not listed.
- **`publishedActivityIds` was dropped rather than used.** Phase 2 reserved a
  localStorage key for it. `Activity.status` already is the publish state, so a
  parallel list of ids would be a second source of truth for one fact.
- **Rubrics were added to the three seeded code labs** (10 points: condition 6,
  readable code 4) because the review screen needs a rubric to be worth building, and
  the course had none. `seed.test.ts` asserts the criteria sum to `maxPoints` and
  that the top level is full marks.
- **Only 6 of the 10 rail destinations are live** (Classroom, Courses, Students,
  Assignments, Gradebook, Content Studio). `Classes`, `Question Bank`, `Analytics`
  and `Announcements` stay muted with the existing "on the roadmap" footer, because
  §"Out of scope" requires roadmap items to appear as text and never as fake screens.
  `Students` links to the one seeded class since there is no class index route.
- **New activity creation is not implemented.** `saveActivity` validates the id
  against the real course, so the studio edits and publishes existing seeded
  activities; it does not add new ones. The overlay is keyed by id and would support
  it, but a new activity also needs a section, an `order` within it, and a
  `skillIds` choice, and inventing placement rules would be worse than leaving the
  button off. Noted here so Phase 5/7 does not assume it exists.

**Bugs found while building, not by review**

- **The mobile page scrolled sideways to 554px on every studio route.** `PageHeader`'s
  action group was `shrink-0` inside a wrapping flex row, so it set a floor on the
  page width the row could not get below. The browser check found it at 390px; the
  teacher rail's own `overflow-x-auto` was a red herring and clips correctly.
- **A draft from localStorage could crash the validator.** Drafts are persisted JSON
  read back without a schema check, so a `quiz` whose `questions` were missing
  threw on `draft.questions.length` instead of reporting a problem. `validateKind`
  now reads every list through `listField`, which reports a missing array as a
  validation error. Three tests cover the malformed shapes.
- **A grade could not be overwritten.** `feedbackRepository.save` always pushed, so
  re-grading the same submission stacked a second copy of the teacher's note.
  `submissionRepository.gradeWithFeedback` now upserts by `(submissionId,
  authorRole)`, and writes the grade and its note in one call so a failure between
  them cannot leave a graded submission with a missing comment.
- **The review screen gave no confirmation on save.** The save button does not
  disable itself on success, so there was no way to tell a saved grade from a click
  that did nothing. There is now a `role="status"` live region.
- **Zero-point lessons were flagged invalid.** The points rule required a positive
  value for every activity, but seeded lessons are worth 0 because reading is not
  assessed. The rule now applies only to assessed kinds.

**Verification**

- `npx tsc -b --force` clean; `npm run build` passes.
- `npm test` — **257 passed, 0 failed** (12 files). The new
  `services/repositories/authoring.test.ts` (14 tests) covers the two Phase 4 write
  paths with a Map-backed `Storage` stub; one of them re-imports the module to prove
  the overlay survives a reload rather than living in the module cache, and one
  asserts `resetDemoData()` leaves the seeded array untouched.
- Browser-checked with Playwright at 1440px and 390px: all 10 teacher routes render
  with no console or page errors and no horizontal overflow — the 6 list screens, a
  code-lab editor, a challenge editor, and a review route loaded directly by URL.
- Both write paths driven in a real browser: publishing an activity and grading a
  submission, each re-checked after a page reload to prove the localStorage overlay
  round-trips rather than only living in memory.
- Accessibility spot-check: no unlabelled form controls on the long studio form,
  focus moves on Tab, and `prefers-reduced-motion: reduce` leaves no unguarded
  animation.

### Phase 5 — Student loop

- **The runner is one route, and the section list is the navigation.** No
  dashboard links into it yet, so prev/next comes from the section's own ordered
  activities. A `/learn` breadcrumb was removed rather than left pointing at a
  route that does not exist.
- **`debug` and `algorithm` are new seeded content, not new schemas.**
  `ChallengeActivity` already declared both `challengeType` values; nothing used
  them. The debug activity offers the buggy lines as choices, and the algorithm
  activity stores the running order as the array order with `correctChoiceId`
  naming the first step — which keeps the pre-existing "every `correctChoiceId`
  resolves" seed invariant true and required no domain change.
- **A hidden test case leaks its answer through its name.** The seeded cases are
  called "age 17 prints Remaja", so masking is a transformation over the name, not
  a flag: hidden cases render as "Hidden test 1" with no input and no expected
  output, and open only once a teacher grades. The panel says when they will open
  rather than implying the result is unknowable.
- **The simulated `ExecutionService` cannot apply a per-input test**, so every
  seeded hidden case comes back `not-evaluated`. That is reported as a runner limit
  ("not counted against you"), never as a failure, and the auto feedback says so
  explicitly — otherwise a learner is told they passed only the test they could
  see.
- **An unscoreable run records nothing.** A null score produces no `Attempt`, no
  `Submission` and no mastery movement, and the runner stays unlocked so the
  learner keeps their draft and tries again. A false zero would land in the
  gradebook as the learner's work.
- **Submit writes an `Attempt`, a `Submission` and auto `Feedback` together.**
  Writing only the attempt would leave the Phase 4 review queue permanently empty.
  All three are one user action, so a partial write is the failure mode to avoid.
- **Mastery is derived, never stored.** The panel recomputes before/after from the
  attempts on file, so it survives a reload and later attempts keep moving the same
  skills. `masteryDeltaForAttempt` is separate from `computeSkillMastery` for that
  reason; `computeSkillMastery` itself is untouched.
- **Guard messages were written, then unreachable.** `useAsync` discarded the
  thrown value, so all four refusals ("not in this section", "not published yet")
  rendered as one generic line. `AsyncResult` now carries the error, and only a
  `GuardError` reaches the screen — a repository fault like "Activity not found"
  is plumbing and stays hidden. The four guards are extracted into
  `guardActivityOpenable` so each is unit tested rather than trusted.
- **The review screen never re-read its own queue after saving.** A teacher graded
  a submission and the screen still counted it as waiting, so the first end-to-end
  pass contradicted itself. It now reloads after `gradeWithFeedback`.
- **Bugs found by browser-checking, all invisible to the unit tests:**
  - `AlgorithmBuilder` reset itself on every render, because the runner passed
    `steps`/`solution`/`initialPool` as fresh arrays and the reset effect watched
    their identity. React logged `Maximum update depth exceeded` and an ordering
    answer could never be completed — every click was erased. Fixed at both
    layers: the props are memoised, and the reset keys off the *contents* of the
    pool, so no parent can wipe a learner's work by rebuilding an array.
  - Submitting called `reload()`, which flipped the whole screen to its loading
    state and took the runner away mid-answer. The records just written are now
    merged into a single `AsyncResult` the screen and the async boundary both read,
    so the panels and the runner cannot disagree about what was submitted.
  - Monaco swallowed `Tab`, so a keyboard user could never reach Run or Submit.
    `tabFocusMode: true` lets focus leave the editor.
  - Submitting used to lock the runner even when nothing was recorded.
- **The seeded `act-s04-cl-age` already has a graded attempt**, because the
  class-wide misconception seed hangs off it. It is the wrong subject for a submit
  test, and asserting hidden-case masking against it fails for the right reason:
  `reveal` is correctly `full`. Browser checks use `act-s05-cl-accumulator`, which
  the seed leaves untouched.

**Verification**

- `npx tsc -b --force` clean; `npm run build` passes.
- `npm test` — **333 passed, 0 failed** (17 files), up from 257. New:
  `outcomeMasking` (masking rules), `attemptScoring` (code, choice, ordering and
  partial credit), `autoFeedback`, `masteryDelta`, `activityGuards` (all four
  refusals), plus four seed invariants — that the `debug` and `algorithm` variants
  exist at all, that a debug activity's `faultyLine` and its correct choice name
  the same line, that a debug snippet is single-language so line numbers mean one
  thing, and that an algorithm's choice order is its solution order.
- Browser-checked with Playwright at 1440px and 390px: all six runner variants
  (lesson, choose, predict, debug, algorithm, code lab) render with no console or
  page errors and no horizontal overflow, one `h1` each, and every control named.
- The whole loop driven in a real browser: run → hint → submit → auto feedback →
  mastery delta → reload, then the teacher graded it in the review screen, and the
  learner's view afterwards opened the hidden case and showed the comment. A
  regression check asserts no render-loop warning on the algorithm route.
- All 12 existing routes re-checked for regressions, including the landing page,
  whose `AlgorithmBuilder` output had to stay identical: 5 blocks, click to move,
  reset, no errors.

### Phase 6 — Student dashboard

- **The plan's "Upcoming (due dates)" panel is not buildable, and the honest
  substitute replaced it.** There is no due date anywhere in the model: no
  `Assignment` entity, and `Activity.dueOffsetDays` is unset on all 48 seeded
  activities — a relative offset with nothing to anchor it against. Inventing a
  deadline would have been the exact failure this phase exists to remove, so the
  panel shows **"Up next" in real course order** and says in its own copy that
  nothing in it is a deadline. A second panel, **"Waiting on your teacher"**,
  covers the one case where a learner really is blocked: submitted, not graded.
- **`Logic Score 842` had no recoverable meaning, so it is gone rather than
  replaced with a similar-looking number.** The four tiles are now metrics that
  can be defended: course coverage %, mean best score, mastered count, and a
  practice streak derived from distinct attempt days.
- **"Average best score" is a mean of per-activity bests, not of all attempts.**
  Averaging every attempt punishes a learner for retrying, which is the opposite
  of what the number would claim to reward. With nothing scored the tile shows
  `—`, not `0`: "no attempts yet" and "scored zero" are different facts.
- **A streak that ran through yesterday is still alive today.** Counting from
  yesterday rather than reporting zero is what a learner expects at 9am, and an
  empty history reports 0 rather than a fabricated 1.
- **Coverage means "opened", not "finished".** It is the share of *published*
  activities with at least one attempt, and draft activities are excluded from
  every count. The browser check cross-verifies the coverage tile against the
  header's untouched counts, so those two numbers cannot drift apart.
- **The skill graph is an indented forest, not a force-directed canvas.** The DAG
  is 31 skills across 7 domains at depth 3; a tree reads that structure directly,
  survives 390px with no canvas or resize observer, and stays keyboard- and
  screen-reader-navigable. A physics simulation would look more like a graph and
  communicate less.
- **Eight skills are containers that no activity names**, so their score is a
  roll-up from their children. Labelled `from children · no activity of its own`,
  because a real number rendered against work the learner never did is a lie the
  UI can prevent. `SkillNodeRole` (`practised` / `rollup` / `untouched`) lives in
  the view model and is unit tested.
- **Recommendations never repeat an activity.** A weak parent and a weak child
  frequently share the same only activity; offering it twice reads as padding.
  Strongest skill first, each activity at most once, and a weak skill with nothing
  published against it is dropped rather than filled with something unrelated.
- **The header divided two different populations** and rendered as "15 of 7
  domains still untouched" — untouched *skills* over *domains*. Both figures now
  come from the same population, and a test asserts the pair is consistent.
- **`drillsChild` was keyed by the wrong id.** It looked an activity id up in a
  map of skill ids, so the "via …" line was always empty. No test failed, because
  `not.toBeNull()` is not what the line was for; it surfaced by dumping the
  rendered page as text. It now carries the child skill's name.
- **One definition of the activity URL.** The dashboard and the runner both needed
  `/learn/c/:courseId/s/:sectionId/a/:activityId`, so it lives in
  `features/student/paths.ts` and the runner's prev/next use it too.
- **`/dashboard` had 12 inbound links**, so deleting the screen outright would have
  404'd every one of them. It now redirects to `/learn`, and every link the repo
  owns points straight at `/learn`. `landing/Hero.tsx` is user-modified, so its
  href deliberately still says `/dashboard` and works through the redirect.
- **The navbar's app-chrome check did not know about `/learn`.** `isApp` matched
  `/dashboard`, `/module`, `/challenge`, `/teacher` and `/admin`, so the learner
  dashboard would have rendered the public navbar until the path was added.
- **The dashboard reads through `courseRepository`**, not `data/selectors`, so a
  teacher's Content Studio edit is what the learner sees and clicks into.
- **`deriveActivityProgress` finally has a production consumer.** It shipped in
  Phase 1 with only tests, and it is exactly the status-per-activity derivation
  this phase needed.
- **Deleted:** `LearningDashboard.tsx`, `DashboardPage.tsx`, `SkillBar.tsx` and
  `ModuleCard.tsx` — all only reachable from the old screen. `StatCard` and
  `ProgressRing` stay: the admin screens and `ModulePage` still use them.
  `data/modules.ts` stays too, because the legacy module flow still reads it until
  Phase 7.
- **Bugs found by browser-checking, invisible to the unit tests:**
  - 15px of horizontal overflow at 390px. `min-w-0` on the truncating title span
    was not enough: the *grid items* default to `min-width: auto`, so the
    recommended list's intrinsic width set the column to 377px instead of 350px
    and pushed the page wide. Traced by measuring each node's min-content and
    bisecting by hiding subtrees, rather than guessing at the CSS.
  - A learner who had passed everything got a blank continue card. There is no
    "complete" reason: the most recent activity is offered for review instead,
    because a dashboard that empties the moment you succeed reads as a bug.
- **Every number on the page is a pure function of the learner's own records**
  and an injected `now`. `buildLearnDashboard` is the single entry point, so the
  tile, the ring, the graph and the recommendations are the same computation
  rather than five that happen to agree today.

**Verification**

- `npx tsc -b --force` clean; `npm run build` passes.
- `npm test` — **370 passed, 0 failed** (18 files), up from 333. New file
  `viewModel.test.ts` (37 tests) on synthetic records only, so every assertion
  names the attempts that produced the number: course order and draft exclusion,
  all four resume priorities, the streak's gaps and day boundaries, coverage and
  the `—` state, recommendation ranking, dedupe and the drop-when-nothing-fits
  case, the three skill roles, cycle safety, and that another learner's attempts
  are ignored.
- Browser-checked with Playwright at 1440px and 390px: no console or page errors,
  no horizontal overflow, no `NaN`/`undefined`/`Invalid Date` leaking from the
  derivation, and none of the old prototype copy (`842`, `5 DAYS`, `naik 23 poin`,
  `SELAMAT SORE`, `YOUR LOGIC PROFILE`) anywhere on the page.
- Every activity link on the dashboard was followed into the runner and opened a
  real, submittable activity; the continue target is asserted not to also appear
  in up next.
- The empty state was checked in a real browser against `student-042`, one of the
  five seeded learners with no attempts at all, rather than by mocking: `0%`
  coverage, a `—` score, and a "Start activity" call to action.
- All 14 routes swept at both widths, including the `/dashboard` redirect and the
  untouched landing page.

**Next — Phase 7:** remove `LESSON_SAMPLES`, the dead `debug`/`truth` branches and
`answer: 'fixed'`, redirect the remaining legacy student routes
(`/module/:id`, `/challenge/:id`, `/challenges`), delete superseded
`components/admin/*`, and write the missing `README.md` + `docs/architecture.md` +
`docs/data-model.md` + `docs/execution.md`. Note that
`src/components/landing/Hero.tsx` still links to `/dashboard` and is user-modified,
so repointing it is left to that phase.

### Phase 7 — Cleanup, migration, docs

**Shipped.** Three items in the scope were already done in Phase 6, one was
obsolete, and one needed correcting rather than deleting.

- **`PROFILE_SKILLS`, the literal `842 / 37 / 5 DAYS` stats, and the
  `/dashboard`→`/learn` redirect were already Phase 6 work.** They are repeated
  in the Phase 7 scope list above; no code changed for them this phase. The route
  map above has been updated so `/admin`, `/module/:id`, `/challenge/:id` and
  `/challenges` are the Phase 7 redirects.
- **`debug` is not dead and was not removed.** The plan predates Phase 5, which
  seeded a real `debug` challenge (`act-s10-dbg-accumulator`) and a real
  `algorithm` one, both rendered by `ChallengeRunner`. Only **`truth` was dead**:
  it was in the `ChallengeType` union in both `domain/course.ts` and
  `data/challenges.ts` and had a guidance string in the seed, but nothing ever
  produced a `truth` challenge and the runner had no branch for it, so it could
  only ever reach the not-found fallback. Removed from all three places.
- **The `answer: 'fixed'` comment was a comment, not a value.** `data/challenges.ts`
  declared `answer: number // index into choices; or for debug: 'fixed'`, but all
  30 challenges carry a numeric index — the clause described a `'fixed'` value the
  `number` type could not hold. Trimmed to `// index into \`choices\``.
- **`LESSON_SAMPLES` was content, not cruft, so it was corrected rather than
  deleted.** The two lessons it feeds (`sec-04`, `sec-05`) are real seeded
  activities with real code examples; deleting it would have emptied two lessons.
  What was actually wrong was the *lookup*: a `Record<string, string[]>` keyed by a
  legacy module number as a string, read from `ModulePage.tsx` — a view concern
  carried into the seed. It is now `LESSON_CODE_EXAMPLES`, private to
  `data/seed/course.ts` and keyed by the section id the rest of the model uses.
- **Redirect targets are derived, never written out.** `legacyRoutes.ts` imports
  `seededSectionId` / `seededLessonActivityId` / `seededChallengeActivityId` from
  the seed — the same functions that build the ids — rather than re-implementing
  the `act-sNN-cNN` format. A hand-written copy would be a second place to get it
  wrong, and a wrong id does not fail loudly: it lands on the catch-all route and
  reads as a broken link rather than a bug.
- **A test caught a real redirect bug.** `Number('1e3')` is a valid integer, so
  `/module/1e3` resolved to `sec-1000` — a section that does not exist. Legacy ids
  are parsed with `/^\d+$/` instead, so `1e3`, `0x4`, `4.5` and whitespace are all
  refused and fall back to `/learn`.
- **`/module/:id` lands on the section's first activity, not a section page.**
  The end-state map lists `/learn/c/:courseId/s/:sectionId`, but that screen does
  not exist. Redirecting to it would have converted a working legacy link into a
  dead one, so the module redirect resolves to the lesson that opens the section.
  Building the course and section overviews is still open work.
- **Deleted:** `ModulePage.tsx`, `ChallengePage.tsx`, `ChallengesIndexPage.tsx`,
  `AdminPage.tsx`, and all of `components/admin/` (`AdminDashboard`,
  `ParticipantDetail`, `ParticipantTable`, `toStudentRow`).
  `AdminPage` was already unrouted — `/admin` pointed at `AdminRedirect` — and
  `ParticipantDetail` / `ParticipantTable` were already imported by nothing.
  `toStudentRow` existed only to adapt derived rows for the admin components and
  said so in its own doc comment; its `describe` block came out of
  `classroomViewModel.test.ts` with it.
- **Two legacy data files stay, deliberately.** `data/modules.ts` and
  `data/challenges.ts` are the source the seed builds all 48 activities from —
  deleting them would delete the course. They are content now, not UI, and the
  lesson that reads them directly is gone. `data/participants.ts` likewise stays
  because `data/seed/people.ts` derives `STUDENTS` from it.
- **The landing page was left alone.** `SolveChallenge` and `DebuggingSection`
  still have their own challenge UI rather than the shared runner, which the plan
  listed as optional. `AlgorithmBuilder` and `ChoiceCard` are shared with the
  runner, so reusing the renderer there is a follow-up, not a Phase 7 deliverable.
- **Two pre-existing orphans were left:** `components/ui/GlassPanel.tsx` and
  `GridBackground.tsx` have no importers. They were already unreferenced at HEAD
  and are unrelated to the legacy flow, so removing them is a separate call.
- **No `ai.md` or `contributing.md`**, per the plan. No AI feature and no
  contributor exists yet.
- **Tests: 368 across 19 files**, up from 370 across 18. Net −2: 10 tests went
  with the deleted `toStudentRow` adapter, 8 came in with `legacyRoutes.test.ts`.
  Verified: `tsc -b` clean, `vite build` clean, and all routes swept in Chromium
  at 1440px and 390px with zero horizontal overflow and no console errors.

**Docs written:** `README.md`, `docs/architecture.md`, `docs/data-model.md`,
`docs/execution.md`. The execution doc records three limitations of the current
runner that were not written down anywhere, the most important being that
`simulateCode` receives a `LanguageId` and then does `void language` — it never
reads it, so a "run" of Java is a Python-shaped pattern match that happens to be
labelled Java. The sandbox research note concludes that in-browser WASM (Pyodide)
should be evaluated for Python before any server-side runner is built, because
three of the four course languages have no in-browser runtime and Python lessons
are a large share of the content.

**What the next phase should know:** the course and section overview screens in
the end-state map are the largest remaining gap in the student experience — the
dashboard links straight to activities and there is no way to see a section as a
whole. `/learn/c/:courseId` and `/learn/c/:courseId/s/:sectionId` are the two
routes to build. `Activity` also has three unseeded kinds (`assignment`,
`project`, `simulation`) that are modelled and unpopulated; the runner has no
branch for them. There is no component test renderer in the project — no
`@testing-library`, no jsdom — so all tests are pure logic and components are
verified by building and by opening routes. That is the main testing limitation to
address if the UI surface keeps growing.
