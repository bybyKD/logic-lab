import type { Skill } from '../../domain'

/**
 * The skill graph for Programming Logic.
 *
 * Language-agnostic on purpose: this course teaches ONE logic expressed in four
 * languages, so the concepts must not be tied to a language. Language-specific
 * knowledge would be a different course.
 *
 * Roots are domain containers (parentId: null) so the graph is navigable and a
 * learner's domain-level mastery can be rolled up from its children.
 */
export const SKILLS: Skill[] = [
  // ---- computational-thinking ----
  { id: 'computational-thinking', name: 'Computational Thinking', parentId: null, domain: 'computational-thinking', description: 'How problems are broken down, recognised, and abstracted before any code is written.' },
  { id: 'decomposition', name: 'Decomposition', parentId: 'computational-thinking', domain: 'computational-thinking', description: 'Splitting a problem into steps that can each be solved and ordered.' },
  { id: 'pattern-recognition', name: 'Pattern Recognition', parentId: 'computational-thinking', domain: 'computational-thinking', description: 'Spotting the repeated structure that makes a loop or a function possible.' },
  { id: 'abstraction', name: 'Abstraction', parentId: 'computational-thinking', domain: 'computational-thinking', description: 'Keeping only the detail that matters for the current problem.' },
  { id: 'algorithm-design', name: 'Algorithm Design', parentId: 'computational-thinking', domain: 'computational-thinking', description: 'Turning a solution into an ordered, unambiguous sequence of steps.' },
  { id: 'debugging', name: 'Debugging', parentId: 'computational-thinking', domain: 'computational-thinking', description: 'Isolating the faulty step of a program and correcting its logic.' },

  // ---- variables ----
  { id: 'variables', name: 'Variables', parentId: null, domain: 'variables', description: 'How a program stores, names, and updates values.' },
  { id: 'variable-assignment', name: 'Variable Assignment', parentId: 'variables', domain: 'variables', description: 'Binding a name to a value, and re-binding it deliberately.' },
  { id: 'data-types', name: 'Data Types', parentId: 'variables', domain: 'variables', description: 'Numbers, text, and booleans — and how each behaves when combined.' },
  { id: 'constants', name: 'Constants', parentId: 'variables', domain: 'variables', description: 'Values fixed at the start so the rest of the program can rely on them.' },

  // ---- operators ----
  { id: 'operators', name: 'Operators', parentId: null, domain: 'operators', description: 'Arithmetic, comparison, and logic — the verbs of a program.' },
  { id: 'arithmetic-operators', name: 'Arithmetic Operators', parentId: 'operators', domain: 'operators', description: 'Addition, multiplication, and operator precedence.' },
  { id: 'comparison-operators', name: 'Comparison Operators', parentId: 'operators', domain: 'operators', description: '== != > >= < <= and the difference between comparison and assignment.' },
  { id: 'logical-operators', name: 'Logical Operators', parentId: 'operators', domain: 'operators', description: 'and / or / not, and operator precedence when combined.' },

  // ---- control-flow ----
  { id: 'control-flow', name: 'Control Flow', parentId: null, domain: 'control-flow', description: 'Deciding which path the program takes and how often it repeats.' },
  { id: 'conditionals', name: 'Conditionals', parentId: 'control-flow', domain: 'control-flow', description: 'Evaluating a condition and choosing a branch.' },
  { id: 'if-else', name: 'if / else', parentId: 'conditionals', domain: 'control-flow', description: 'Two-way branching, including the boundary case of >= versus >.' },
  { id: 'loops', name: 'Loops', parentId: 'control-flow', domain: 'control-flow', description: 'Repeating work a known number of times or until a condition changes.' },
  { id: 'for-loops', name: 'for Loops', parentId: 'loops', domain: 'control-flow', description: 'Counted repetition over a range of values.' },
  { id: 'while-loops', name: 'while Loops', parentId: 'loops', domain: 'control-flow', description: 'Repetition driven by a condition rather than a count.' },
  { id: 'nested-loops', name: 'Nested Loops', parentId: 'loops', domain: 'control-flow', description: 'A loop inside a loop — and why the iteration count multiplies.' },

  // ---- functions ----
  { id: 'functions', name: 'Functions', parentId: null, domain: 'functions', description: 'Naming a piece of logic so it can be reused and reasoned about separately.' },
  { id: 'function-definition', name: 'Function Definition', parentId: 'functions', domain: 'functions', description: 'Declaring a function, its name, and its body.' },
  { id: 'parameters', name: 'Parameters', parentId: 'functions', domain: 'functions', description: 'Passing values into a function so it can work on data it does not own.' },
  { id: 'return-values', name: 'Return Values', parentId: 'functions', domain: 'functions', description: 'Sending a result back to the caller, and the difference from printing.' },

  // ---- data-structures ----
  { id: 'data-structures', name: 'Data Structures', parentId: null, domain: 'data-structures', description: 'Ways to hold collections of values.' },
  { id: 'arrays', name: 'Arrays', parentId: 'data-structures', domain: 'data-structures', description: 'Indexed collections, iteration, and bounds.' },
  { id: 'strings', name: 'Strings', parentId: 'data-structures', domain: 'data-structures', description: 'Concatenation, searching, and slicing text.' },

  // ---- algorithms ----
  { id: 'algorithms', name: 'Algorithms', parentId: null, domain: 'algorithms', description: 'Classic strategies for search and ordering.' },
  { id: 'searching', name: 'Searching', parentId: 'algorithms', domain: 'algorithms', description: 'Locating a value in a collection, and the cost of doing so.' },
  { id: 'sorting', name: 'Sorting', parentId: 'algorithms', domain: 'algorithms', description: 'Ordering a collection, and why the strategy matters.' },
]

export const SKILL_IDS = SKILLS.map((s) => s.id)
