# LOGIC LAB — Implementation Plan & Context File

> **Purpose:** Single source-of-truth document so progress and decisions are
> never lost. Read this first to regain full context on every session resume.

## Product
- **Name:** LOGIC LAB
- **Tagline:** *Learn to think like a programmer.*
- **Type:** Premium interactive programming-logic training platform frontend
- **Audience:** ~80 Informatics Laboratory participants + admin (lecturers/TAs)
- **Languages taught:** Python, Java, Go, C
- **Content:** Bahasa Indonesia instructional code comments

## Central Message
```
ONE PROBLEM. ONE LOGIC. MANY WAYS TO CODE IT.
Python. Java. Go. C.
```

## Stack (Locked)
| Layer | Choice |
|---|---|
| Build | Vite + React 18 + TypeScript |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Routing | react-router-dom v7 |
| Editor | @monaco-editor/react (CDN mode) |
| Animation | `motion` (framer-motion v13) + custom rAF scroll system |
| Deploy | Static (Vercel/Netlify repr), all data mocked client-side |

## Fonts
| Role | Font |
|---|---|
| Display + UI | Space Grotesk (Antigravity rhythm: 450 weight, tight tracking) |
| Dense UI/labels/numbers | Inter |
| Code | JetBrains Mono |

## Routes
- `/` — Landing (cinematic marketing scroll)
- `/dashboard` — Student dashboard (demo login target)
- `/module/:id` — Module detail page
- `/challenge/:id` — Challenge page
- `/admin` — Admin dashboard (from dashboard toggle)

## Architecture
```
src/
├── main.tsx / App.tsx / index.css
├── components/
│   ├── layout/        Navbar, Footer
│   ├── landing/       Hero, WhatIsLogic, ThinkInSteps, FourLanguages,
│   │                  InteractiveCode, TraceSection, SolveChallenge,
│   │                  LearningPathPreview, StartTraining
│   ├── logic/         LogicFlowVisualizer, ComputerThinking, FlowNode
│   ├── code/          CodeEditor(Monaco), LanguageSwitcher, OutputPanel,
│   │                  CodeTrace, ExecutionTimeline
│   ├── challenge/     PredictOutput, ChoiceCard, DebuggingSection, AlgorithmBuilder
│   ├── dashboard/     LearningDashboard, ModuleCard, ProgressRing, StatCard, SkillBar
│   ├── admin/         AdminDashboard, ParticipantTable, ParticipantDetail
│   └── ui/            GlassPanel, GlowButton, GridBackground, ScrollReveal,
│                      SectionNumber, CodeBlock, AnimatedCursor
├── pages/             Landing, Dashboard, Module, Challenge, Admin
├── data/              modules(10), challenges(30+), languages(4), participants(80)
├── hooks/             useScrollProgress, useLerp, useCodeExecution, useTrace
├── styles/            globals.css
└── utils/             codeSimulator, animations(smoothstep), helpers
```

## Design Tokens (Tailwind v4 @theme)
- Colors: lab-950/900/800/700 near-black; text #f0ece4 warm off-white;
  muted #6b6b7b; accent cyan #38bdf8; success #4ade80; error #f87171;
  warning #fbbf24
- Radii: 16/24/36 + pill 999px (Antigravity-inspired)
- Spacing: Antigravity scale 4→180px
- Grid gutter: 64/48/40/16 responsive

## Data Volume (mock, Bahasa content)
- 80 participants (realistic Indonesian names, varied progress/scores/status)
- 10 modules (full roadmap metadata: title, difficulty, est. time, prereq, progress)
- 30+ challenges (all modules, per-language code + expected output)
- 4 languages config (id, name, extension, syntax, starterCode,
  expectedOutput, comments)

## Phases (build order, verify `npm run build` after each)
1. Scaffold + design system (project init, Tailwind theme, ui/ primitives, router shell, Navbar/Footer)
2. Hero + cinematic landing sections (all landing/ components, Bahasa copy)
3. Scroll choreography (useScrollProgress + lerp/smoothstep, sticky panels, hero scale/fade, reduced-motion)
4. Logic visualizers (ComputerThinking flow, LogicFlowVisualizer AGE diagram, interactive input, glowing YES path)
5. Four-language system (languages.ts model, cards→comparison, LanguageSwitcher tabs)
6. Monaco code editor (language select, highlighting, Run/Reset, codeSimulator, output, error states)
7. Code trace (step-through debugger, current-line highlight, memory panel, iteration counter, timeline)
8. Challenges (PredictOutput quiz, DebuggingSection syntax/logic/runtime, AlgorithmBuilder drag-drop, 30+ challenges)
9. Learning dashboard + module/route pages (stats, continue learning, logic profile, module grid + detail)
10. Admin dashboard (overview stats, 80-participant table search/sort, participant detail strengths/needs)
11. Responsive pass (desktop-first, tablet/mobile adaptations)
12. Polish + a11y + perf (micro-interactions, success/shake, keyboard nav, focus, ARIA, build)

## Key Decisions
- Landing `/` = marketing/cinematic; app at /dashboard+/module+/challenge+;
  /admin standalone; login is a static "demo" -> routes to /dashboard
- Code execution = pattern-matching simulator maps known snippet -> output
  + variable tracking for trace
- Fonts are freely-licensed (Space Grotesk) NOT Google Sans Flex (proprietary)

## Resume Protocol
When resuming a session, READ THIS FILE first, then:
1. Check git status / file tree to see current state
2. Find the current phase (its `in_progress` in the todo list)
3. Continue; re-save this file when a phase completes

## Progress Log
- [x] Phase 1 — scaffold + design system (done: project init, Tailwind v4 theme, ui/ primitives, router, Navbar/Footer, build OK)
- [x] Phase 2 — hero + landing sections (done: Hero, WhatIsLogic, LogicFlowVisualizer, FourLanguages, InteractiveCode, TraceSection, SolveChallenge, Debugging, AlgorithmBuilder, LearningPathPreview, StartTraining)
- [x] Phase 3 — scroll choreography (done: useScrollProgress, useSectionProgress, lerp/smoothstep utils, hero scroll transform, reduced-motion)
- [x] Phase 4 — logic visualizers (done: WhatIsLogic flow + LogicFlowVisualizer interactive AGE diagram with slider + glowing YES/NO path)
- [x] Phase 5 — four-language system (done: languages.ts model, FourLanguages cards→comparison, LanguageSwitcher tabs, codeExamples.ts)
- [x] Phase 6 — Monaco code editor (done: CodeEditor with Monaco, language switcher, Run/Reset, codeSimulator pattern-matching, output panel, error states)
- [x] Phase 7 — code trace (done: CodeTrace step-through debugger, current-line highlight, memory panel, iteration counter, ExecutionTimeline strip)
- [x] Phase 8 — challenges (done: challenges.ts 30+ challenges, ChallengesIndexPage, ChallengePage with Monaco+simulator, ChoiceCard, AlgorithmBuilder drag-drop, DebuggingSection)
- [x] Phase 9 — learning dashboard (done: DashboardPage, ModuleCard, ProgressRing, StatCard, SkillBar, ModulePage)
- [x] Phase 10 — admin dashboard (done: participants data 80, AdminPage, ParticipantTable, ParticipantDetail)
- [x] Phase 11 — responsive pass (done: WhatIsLogic + LogicFlowVisualizer responsive rewrites; StickyLogicShowcase scroll choreography drives node highlighting via useShowcaseStage; sticky rAF writes --p/--stage directly to CSS vars, no per-frame React re-render)
- [ ] Phase 12 — polish + a11y + perf (in progress: global :focus-visible ring, Login→/dashboard, ExecutionTimeline; reduced-motion + perf verified)
  - Bugfix pass: Hero floating `def think():` panel moved to right-side whitespace (was overlapping headline); Flow Engine `StickyLogicShowcase` restructured — chapter rail is now a reserved grid column at `lg+` (absolute overlay removed), canvas pinning is desktop-only (`static lg:sticky` + `z-10` for crisp handoff), mobile uses normal-flow layout with padding; output Node min-width shaved for small phones. Verified via headless geometry at 1024/1280/1440/500px.

---
## Session 1 build log (context for resume)
- Built on macOS. Commands: `npm run build` (tsc -b + vite build) & `npm run dev`.
- Dev server on http://localhost:5173 when running.
- Verified landing renders: 10 sections, hero text, nav present (headless chrome dump-dom).
- Interface notes: theme colors lab-950→400, ink-100→700, accent-300/400/500, success/error/warning + -dim. Fonts Space Grotesk/Inter/JetBrains Mono.
- Monaco: `@monaco-editor/react` CDN mode (needs internet to load editor; loading fallback shows spinner).
- Phase 12 additions: global `:focus-visible` accent ring (keyboard a11y), Login button now routes to `/dashboard` (demo login), new `src/components/code/ExecutionTimeline.tsx` strip inside CodeTrace.
- StickyLogicShowcase: rAF loop writes `--p`/`--stage` directly onto the sticky canvas element (no per-frame React re-render); children read the chapter via `useShowcaseStage()` hook (LogicFlowVisualizer highlights node per stage). Dead hooks `useScrollProgress`/`useSectionProgress` removed (Hero + StickyLogicShowcase handle scroll directly).
- Verified routes render OK desktop + 390px mobile (landing page includes DebuggingSection text with the word "Error" — benign).
