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

## B4. Prototype Build Order

1. **Domain model** — `src/domain/` types for Course, Section, Activity (+ kinds),
   Skill, Student, Class, Enrollment, Attempt, Submission, Feedback, TestCase,
   Rubric. One file per concept group, no framework.
2. **Data access layer** — `src/services/` reading from mock repositories that
   return promises (so loading/error/empty states are real from day one and a
   future API is a drop-in replacement).
3. **Teacher classroom screen (§16)** — highest-value single screen.
4. **Student loop** — join course → activity (interactive example → code lab →
   challenge) → submit → attempt recorded → feedback shown → skill progress
   updates.
5. **Feedback + skill derivation** — mastery recomputed from attempts.
6. **Content Studio (thin)** — create/edit a code-lab activity draft only; no AI
   generation yet.

Keep every new abstraction earn its place: one implementation, mock-backed, and
shaped like the thing that replaces it.

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

---

## Progress Log

- **v1 prototype (archived)** — cinematic landing, 4-language model, Monaco
  editor, pattern-matching simulator, trace debugger, 30+ challenges, student
  dashboard, 80-participant admin dashboard, responsive + a11y pass. Full detail
  in `docs/archive/LOGIC_LAB_PLAN_v1_prototype.md`.
- **Direction reset (this file)** — product repositioned from "premium tutorial
  site" to "interactive learning platform". Prototype scope, entity model,
  execution direction, priorities, and the commit→push rule are now defined
  here. No code changed in this step.
