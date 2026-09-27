# Code execution

## The short version

The code lab **does not run the code you write.** It pattern-matches a handful of
known program shapes and reports `unsupported` for anything else. This is behind a
deliberate interface (`ExecutionService`) so a real sandbox can replace it without
touching a component. See the research note at the bottom before designing one.

## The contract

`src/services/execution/types.ts`. Three methods' worth of surface, and a flag
that says whether the implementation's answers can be trusted:

```ts
interface ExecutionService {
  readonly id: string
  /** True when this service can only evaluate a known set of programs. */
  readonly isAuthoritative: boolean
  run(request: ExecutionRequest): Promise<ExecutionResult>
}
```

`ExecutionRequest` is `language`, `code`, and optional `testCases`.

`ExecutionResult` is `status`, `stdout`, `stderr`, `testOutcomes`, `durationMs`,
`exitCode`, `trace`, and an optional plain-language `note`.

`ExecutionStatus` is `ok` | `failed` | `error` | `unsupported`.

Two things are load-bearing here:

- **`unsupported` is a first-class status.** It means "this runner cannot tell you
  what your program does", which is different from "your program is wrong". It is
  how the prototype avoids the worst outcome for a learning tool: confidently
  grading a correct program as incorrect.
- **`note` is set whenever `status` is not `ok`**, so the UI always has a sentence
  to show rather than a blank panel.

## The current implementation

`SimulatedExecutionService` wraps `src/utils/codeSimulator.ts`. It recognises
four program shapes by regular expression:

| Pattern | Recognised by |
| --- | --- |
| A — conditional age | `age = <n>` plus an `if` |
| B — loop accumulator | `range(<n>)` accumulating into a variable |
| C — conditional mutation | `x = <n>` then `y = <n>`, optionally `x = x + <n>` |
| D — simple text print | a string literal to print |

Anything else returns `null` from the simulator and becomes `status:
'unsupported'` with `UNSUPPORTED_NOTE`: *"This prototype runner can only evaluate
a few known example programs…"*.

### Three honest limitations

1. **The language is ignored.** `simulateCode` takes a `LanguageId` and then does
   `void language` — it never reads it. The patterns are all shaped like Python,
   so submitting the same logic as Java, Go, or C is matched by the same rules.
   A "run" of a Java program is not a Java execution; it is a Python-shaped
   pattern match that happens to have been labelled Java.
2. **Test cases with an `input` are not evaluated.** `evaluateTestCases` only
   compares a single stdout against expected values. A case carrying an input
   needs one run per input, which this runner cannot do, so it is reported
   `not-evaluated` rather than guessed at. Not-evaluated cases contribute nothing
   to a score.
3. **`isAuthoritative` is `false`**, and `ReviewScreen` checks that flag and shows
   `UNSUPPORTED_NOTE` instead of presenting a result as if it were a real
   execution. That check is the only thing standing between a prototype and a
   misleading grade, and it should not be removed to tidy the code.

`normalizeOutput` collapses whitespace and trims, so `10\n` and ` 10 ` compare
equal. Without that, every trailing newline in a course's expected output would
fail.

## The swap point

`getExecutionService()` in `src/services/execution/index.ts` is the only way any
caller obtains a service. It lazily constructs the simulated one and caches it.
`setExecutionService(next)` exists for tests.

A real implementation replaces the constructor argument in `getExecutionService`
and nothing else. That is the entire reason for the indirection.

## Sandbox research note

*Researched 2026-09-27. Figures below are from vendor and practitioner
comparisons, not measured here. Treat the numbers as orders of magnitude and
re-verify before committing to a design.*

### The problem

Student code is untrusted code. It gets submitted by anyone with a browser, and
the natural instinct is to run it in a container. **A standard container is not a
sufficient security boundary for untrusted code**, because containers share the
host kernel: namespaces and cgroups control what a process can *see* and *consume*,
but they do not interpose on syscalls. A kernel bug reachable from the guest is a
bug on the host, and configuration mistakes (`--privileged`, host PID namespace,
`CAP_SYS_ADMIN`) remove the boundary entirely. `seccomp` and AppArmor/SELinux
narrow the syscall surface but do not change the sharing of the kernel.

### Isolation tiers

| Tier | Mechanism | Startup | Memory overhead | Syscall compat | Isolation |
| --- | --- | --- | --- | --- | --- |
| Plain container | namespaces + cgroups | ~10–50ms | negligible | full | shared host kernel |
| gVisor | user-space kernel ("Sentry") intercepts syscalls | ~50–100ms | ~50–100MB | ~70% of Linux | userspace kernel, not hardware |
| Kata Containers | VM behind a standard OCI/K8s RuntimeClass | ~200–500ms | ~20–50MB | full | hardware VM |
| Firecracker | KVM microVM, own guest kernel | ~125ms | ~5MB | full | hardware VM |

Notes on each, as they bear on this project:

- **gVisor** re-implements a Linux subset in Go and forwards only a vetted set of
  calls to the host, so a kernel exploit payload lands in Sentry rather than in
  the real kernel. Cost is syscall overhead: negligible for CPU-bound work,
  10–30% for filesystem-heavy work, with occasional much worse outliers.
  Compatibility gaps are real (`io_uring`, some `ioctl`s, kernel modules) and
  fail *subtly*, which is the main operational risk. Google runs it for App
  Engine and Cloud Run.
- **Kata Containers** gives hardware isolation with a drop-in `RuntimeClass` — a
  Kubernetes deployment can keep using plain containers and mark only untrusted
  workloads. Simplest path to a real boundary if this runs on Kubernetes.
- **Firecracker** is the smallest trusted computing base and boots a dedicated
  kernel in ~125ms at ~5MB, which is why AWS uses it for Lambda and Fargate.
  It is a VMM, not a platform: each microVM needs its own rootfs, tap device, and
  lifecycle management, so building a control plane is the bulk of the work.

A recurring pattern in the literature is to run all three at once and choose per
workload by trust level — plain containers for first-party code, gVisor or Kata
for untrusted, Firecracker where a breach must be impossible. OWASP's guidance for
agentic applications (reported as ASI05, "Unexpected Code Execution", in a
December 2025 release — worth confirming against the source document) takes the
position that software-only sandboxing is insufficient for generated code.

### Non-negotiable limits, whichever tier

Isolation tier is not the whole answer. A real runner also needs:

- **Wall-clock timeout** on every run, enforced by something that does not
  depend on the submitted code cooperating.
- **Memory and CPU caps**, with the process group killed on breach rather than
  left to recover.
- **No network egress** by default. A submitted program that can open a socket can
  reach the metadata service and the rest of your infrastructure. Deny by default
  rather than by allowlist.
- **Read-only root filesystem**, non-root uid, no host mounts, no Docker socket,
  no `CAP_SYS_ADMIN` / `CAP_NET_RAW` / `CAP_SYS_PTRACE`.
- **A seccomp default profile.** Note that many Kubernetes distributions still
  ship seccomp as `Unconfined` unless `SeccompDefault` is enabled, so "we use
  Kubernetes" does not imply a seccomp filter is on.
- **No shared writable volume** between runs, so one submission cannot read or
  poison another's state.
- **Output size caps**, so a program printing in a loop cannot exhaust memory
  before the timeout fires.

### The constraint that decides this project

The course teaches **Python, Java, Go, and C** (`Course.languageIds`). That list
rules out the cheapest option:

- **In-browser WASM** (Pyodide for Python, or V8 isolates) needs no server at all,
  which would make the isolation question moot for that language. It is the
  strongest option for Python specifically, and the right thing to evaluate first
  for the beginner lessons. Its cost is that it constrains what a learner can use
  — no arbitrary C extensions, no subprocesses, no real concurrency.
- **Java, Go, and C have no credible in-browser runtime.** Any real support for
  three of the four languages requires a server-side sandbox.

So the likely shape is: evaluate Pyodide for Python lessons first, since it
removes the risk entirely for a large share of the content, and put a
gVisor- or Kata-based service behind the existing `ExecutionService` interface
for the other three. Do not add a server-side runner for Python before checking
whether the in-browser option covers the lessons — it would be the largest piece
of infrastructure in the project guarding the smallest risk.

### Not decided here

No backend has been chosen, and nothing in the app depends on one. `ExecutionService`
is the seam. Deciding this is a real design task with a threat model attached, not
a line item — the notes above are the inputs, not the decision.
