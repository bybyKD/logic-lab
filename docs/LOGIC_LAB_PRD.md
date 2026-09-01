# LOGIC LAB — Product Requirements Document (PRD)

## 1. Overview
**LOGIC LAB** is a premium, cinematic, interactive programming-logic training
platform for ~80 Informatics Laboratory participants. It teaches programming
logic through Python, Java, Go, and C. The frontend is a high-end developer
product — not a traditional LMS. No backend; all data is local mock data.

**Tagline:** Learn to think like a programmer.

## 2. Goals & Success Criteria
- Deliver a visually premium, cinematic, scroll-driven landing experience
- Teach that programming = logic (not memorizing syntax)
- Support 4 languages with unified logic via a reusable language model
- Provide interactive code editor, code trace, challenges, algorithm builder
- Provide a populated student dashboard and admin dashboard
- Fully static, deployable to Vercel/Netlify, runs at 60 FPS
- Fully usable, accessible (keyboard, reduced-motion, contrast)

## 3. Users & Personas
1. **Participant (student)** — ~80 Informatics Lab members; learns logic,
   completes modules/challenges, builds score & streak.
2. **TA / Assistant** — guides participants, uses dashboard to continue learning.
3. **Admin / Lecturer** — views aggregate stats (80 participants, avg score,
   completion %, active today) and individual participant profiles.

## 4. Design Direction
Programming + Laboratory + Intelligence + Precision.
- Deep dark backgrounds, warm off-white type, subtle cyan accents
- Glass panels, thin borders, soft gradients, code-editor surfaces
- Monospace + large editorial headings, subtle grid systems, restrained glow
- Avoid: childish gamification, excessive neon/glassmorphism/gradients,
  cartoons, stock photos, generic dashboard look

**Reference (visual/interaction only):** Google Antigravity landing page.
Preserve: cinematic composition, layered depth, scroll storytelling, smooth
transitions, large typography, immersive sections, premium editorial layout.
Do NOT copy its identity/imagery/content.

**Feel:** Linear × Vercel × VS Code × Brilliant × modern developer laboratory.

## 5. Fonts
- Display + UI: **Space Grotesk** (450-weight rhythm, tight tracking)
- Dense UI/labels/numbers: **Inter**
- Code: **JetBrains Mono**
(Deliberate choice: Google Sans Flex is proprietary; Space Grotesk is the
free lookalike preserving the same type-system rhythm.)

## 6. Color System
- Primary bg: very dark charcoal / near-black
- Primary text: warm off-white
- Secondary text: muted gray
- Accent: subtle cyan/blue
- Success: muted green / Error: muted red / Warning: muted amber
- Avoid oversaturated colors.

## 7. Landing Page Scroll Choreography
```
HERO
  → WHAT IS LOGIC?
  → THINK IN STEPS
  → ONE LOGIC — FOUR LANGUAGES
  → INTERACTIVE CODE
  → TRACE THE PROGRAM
  → SOLVE THE CHALLENGE
  → LEARNING PATH
  → START TRAINING
```
Scroll feels intentional/cinematic. Uses sticky panels, lerp, smoothstep,
CSS custom properties, transform/opacity, GPU-friendly.

### 7.1 Hero
- Full-screen, very dark dev environment, subtle animated code/grid texture
- Massive typography: "THINK LIKE A PROGRAMMER."
- Sub: "Interactive programming logic training for Informatics Laboratory assistants."
- CTAs: "Start Training →" (primary), "Explore Curriculum" (secondary)
- Bottom: "SCROLL TO EXPLORE ↓"
- On scroll: hero text moves up, scales down slightly, fades; a central
  INPUT→PROCESS→OUTPUT visualization emerges.

### 7.2 How Computers Think
- Title: "Computers don't guess. They follow logic."
- Flow: INPUT → CONDITION → PROCESS → OUTPUT, nodes animate in on scroll,
  highlight as reached.

### 7.3 Logic Flow Visualizer (interactive)
- Diagram: AGE=20 → AGE>=18? → YES → ADULT
- Animate execution path; YES path illuminates.
- User can change input to see the path change.

### 7.4 One Logic. Four Languages.
- Four large language cards (PYTHON/JAVA/GO/C), each a distinct env feel,
  unified design system. Scroll: cards transition into comparison interface.

### 7.5 Language Comparison UI
- Header "Conditional Logic"; tabs Python | Java | Go | C
- Switch changes code panel (all Bahasa comments)
- Under editor: "Same logic. Different syntax."

### 7.6 Interactive Code Editor
- Monaco; Python default; line numbers, highlighting, language selector,
  Run ▶, Reset, Output panel, error state, execution indicator
- Layout: editor top bar (language + Run), code area, output panel

### 7.7 Trace the Program
- Title: "Don't just run the code. Trace it."
- x=0; for i in range(5): x+=i; print(x)
- Show CURRENT LINE, variables (x, i), iteration (Iteration 3/5)
- Controls: ← Previous / Step →
- Feels like a debugger; line highlights, execution path animates

### 7.8 Code Execution Visualization
- Execution timeline (01──,02──,03──●,04──) with current instruction highlighted
- Memory/variables panel (x=10, i=3)

### 7.9 Predict the Output (challenge)
- Title: "Can you predict what happens next?"
- x=5;y=2;if x>y:x=x+3;print(x) → choices A.5 B.7 C.8 D.Error (answer: 8)
- Cards with hover; correct: "✓ Correct"; incorrect: "Not quite. Let's trace the logic."

### 7.10 Debugging Section
- Title: "Code doesn't always work. That's the point."
- Broken code: age=17; if age>18 (should be >=18)
- Highlight problematic line; label "LOGIC ERROR"
- Teach: syntax vs logical vs runtime error

### 7.11 Algorithm Builder
- Title: "Before code, there is an algorithm."
- Drag-drop blocks: START, INPUT AGE, CHECK AGE, PRINT RESULT, END
- Correct arrangement → "✓ Algorithm Correct ..."

### 7.12 Learning Path
- Transition to dashboard after cinematic intro
- 10 modules roadmap, each as large interactive node with progress/difficulty/time/locked

## 8. Module Card Design
Per module: "MODULE 04 / CONDITIONAL LOGIC / Make decisions. Control
execution. / progress bar / 12 min / Continue →"
Hover: rises, brighter border, bg shift, arrow moves.

### Modules (roadmap)
01 Computational Thinking · 02 Variables & Data Types · 03 Operators ·
04 Conditional Logic · 05 Loops · 06 Functions · 07 Arrays · 08 Strings ·
09 Algorithms · 10 Final Logic Challenge

## 9. Dashboard (student, after login)
- Header: "Good evening. Ready to sharpen your logic?"
- Stats: LOGIC SCORE 842 · MODULES 7/10 · CHALLENGES 37 · STREAK 5 DAYS
- Continue Learning: Conditional Logic 80% → Continue
- Your Logic Profile: Variables 92% · Conditions 81% · Loops 63% ·
  Functions 51% · Algorithms 70%

## 10. Admin Dashboard
- Title "LABORATORY TRAINING"; stats 80 Participants · Avg Score 742 ·
  Completion 81% · Active Today 64
- Participant table: Participant / Progress / Score / Challenges / Last
  Active / Status (search + sort, realistic mock data)
- Click → participant detail: Overall Logic Score 842 · Modules 7/10 ·
  Challenges 37 · Strengths (Conditional Logic, Variables) · Needs Practice
  (Loops, Functions) · recent attempts

## 11. Navigation
- Landing (public): LOGIC LAB | Why Logic · Languages · Training · About |
  Login · Start Training →
- App: LOGIC LAB | Learn · Challenges · Progress | Search · Profile
- Nav compacts while scrolling

## 12. Micro-Interactions
Buttons: hover movement/brightness/arrow · Cards: translation/border ·
Code: line highlight/cursor/execution indicator · Progress: animated fill ·
Correct: subtle success · Incorrect: subtle shake · Module completion: smooth
animation. Not excessive.

## 13. Typography System (Antigravity-inspired scale)
Base Spacing: 4/8/16/24/36/48/60/80/88/120/180px
Radii: 16/24/36/pill
Headings use 450 weight with tight negative letter-spacing; progressive sizes
per breakpoint (>=1600, >=1024, >=767, >=425).

## 14. Accessibility
KB navigation, focus states, accessible labels, semantic HTML, sufficient
contrast, `@media (prefers-reduced-motion: reduce)` disables scroll smoothing,
parallax, and unnecessary animation. Content stays usable.

## 15. Responsive
Desktop-first; laptop/tablet/mobile supported. Mobile: smaller hero type,
stacked cards, code comparison → tabs, scrollable editor, simplified
cinematic, preserved readability.

## 16. Frontend State
React useState/hooks (no global store unless necessary):
selected language, selected module, current challenge, editor content,
execution state, current trace step, challenge answer, progress, score,
hints, sidebar state.

## 17. Mock Data Requirements
- 80 participants, 10 modules, 30+ challenges, progress/scores/attempts
- Language model: { id, name, extension, syntax, starterCode, expectedOutput, comments }
- No empty dashboards; no lorem ipsum/generic placeholders.

## 18. Non-Functional Requirements
- 60 FPS: prefer transform/opacity/scale/translate; avoid animating
  width/height/top/left/margin
- Modular components (no single giant component)
- Realistic Indonesian training content

## 19. Quality Priorities
```
UX → Learning Experience → Visual Quality → Interaction → Animation → Gamification
```

## 20. Acceptance Criteria (final)
- Landing scroll story fully works & feels cinematic
- All 4 languages supported with one reusable model
- Monaco editor runs code via client-side simulator
- Trace operates like a debugger
- Predict/drag-drop challenges function with feedback
- Dashboard & admin fully populated with mock data
- Responsive + accessible; `npm run build` passes cleanly
- Feels like a real edtech product for lab management/lecturers/TAs/students
