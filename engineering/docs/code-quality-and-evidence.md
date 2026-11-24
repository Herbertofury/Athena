# Best coding evidence: behavior, security and provenance

**Reviewed October 26, 2026.** This is a ranked verification strategy, not a model leaderboard. None of the external coding-agent benchmarks below was executed here, and no model keys, private repositories or paid evaluation jobs were submitted.

## Recommended order

| Priority | Use | Why | Do not substitute |
|---|---|---|---|
| 1 | Independent externally observable behavior contracts | Survive refactoring and language changes | Compiling successfully or matching file counts |
| 2 | Explicit security and adversarial-input gates | Functional success can coexist with unsafe behavior | A green happy-path suite |
| 3 | Differential, property and fault/interruption testing | Exposes omissions and hidden ordering assumptions | More near-identical examples of the happy path |
| 4 | Representative performance and resource measurements | Verifies the actual user-visible improvement | A vendor microbenchmark or warmed partial result |
| 5 | Artifact identity and provenance verification | Connects tested source to the distributed artifact | A signed file with no checked issuer/build expectations |
| 6 | AI/static review as complementary evidence | Finds additional issues, with precision/recall tradeoffs | An autonomous “looks good” as release authority |

All six can matter together. This order reflects what must anchor an acceptance decision, not a rule to postpone security until after implementation.

## 2026 research worth using carefully

### RepoMod-Bench: language-independent acceptance

The February 26, 2026 preprint evaluates repository modernization through standardized interfaces and hidden implementation-agnostic tests. It covers 21 repositories and reports much weaker performance on large migrations than small ones. The transferable method is keeping a source-backed external behavior oracle while allowing internal architecture to change. It does not prove that a particular agent will succeed on an untested project. [PAPER04](https://arxiv.org/html/2602.22518v1)

### Last Secure Code Benchmark: functionality is not security

The October 10, 2026 preprint uses separate hidden functional and security tests across vulnerability-derived tasks. Its reported gap between functional passes and joint functional/security passes motivates distinct acceptance gates. These are the authors' results on their chosen tasks and configurations, not a local reproduction, universal model ranking or measured vulnerability rate in arbitrary applications. [PAPER05](https://arxiv.org/html/2610.14766v1)

### ReviewBench: rank reviewers by useful findings, not volume

GitHub's October 5, 2026 announcement describes 219 pull requests, severity/category slices, and grounded versus augmented precision/recall. It uses calibrated model-assisted judging, so judge version, rubric and human validation matter. Treat the vendor's reported production correlation as its claim. Do not equate more comments with better review or reuse changing augmented denominators as an apples-to-apples leaderboard. [REVIEW01](https://github.blog/ai-and-ml/github-copilot/reviewbench-an-open-benchmark-for-ai-code-review/)

### SLSA 1.2: authenticate the build, not just the checksum

The approved specification distinguishes artifact provenance from verifying it. The verification guidance checks the artifact digest, provenance signature, trusted builder identity and expected build parameters. Provenance does not establish that the software is bug-free or that a trusted build platform cannot be compromised. No attestation/signing configuration was changed as part of this research. [SEC02](https://slsa.dev/spec/v1.2/verifying-artifacts)

## Apply the methods without pretending to reproduce the papers

For a migration or optimization, preserve a reference build and drive both implementations through the same public interface. Compare successful outputs, invalid-input errors, ordering, persistence, cancellation and restart behavior. Keep internal unit tests too: black-box tests and white-box tests answer different questions. Explicitly identify unsupported cases rather than silently dropping them from the denominator.

Use a private holdout/adversarial suite where practical, but do not hide product requirements from the implementer. Freeze the acceptance contract before measuring. If a test is wrong, document and repair the test with independent evidence; do not weaken it merely because the candidate fails. Track the tested artifact hash through packaging, deployment and launch-path verification.

Review findings should include a reproducible input or concrete causal path, affected behavior and proposed fix. Deduplicate symptoms of one defect; report uncertainty. A tool that produces many plausible warnings is not necessarily useful. Security-sensitive parsing, archive paths, authentication callbacks and recovery journals deserve targeted tests even if ordinary feature tests pass.

## Atlas's own checks are bounded evidence

The JSON lab records twelve semantic probes and three generated workloads. The spatial lab compares exact integer-domain outputs, including dense and fallback cases. The benchmark comparator checks declared equivalence and input structure; it cannot establish that a supplied hash is honest or excluded fields are nonsemantic.

A local review found that the comparator previously accepted boolean/float schema values and malformed normalization metadata through Python's permissive equality/truthiness. Those inputs are now rejected by focused regression tests. This is a small robustness fix, not a performance claim or a security audit of the entire repository.

## Avoid

- Calling a rewrite complete from compilation, source volume or a single demonstration.
- Reporting only pass rates after removing difficult cases.
- Claiming a model is “best” without naming task distribution, configuration, cost and judge.
- Uploading private code or credentials to a benchmark service without specific authority.
- Running an unfamiliar research prototype before source/dependency review and required approval.
- Expanding CI permissions or generating signing credentials merely because a paper recommends provenance.

[Testing and release](testing-release.md) · [Ranked recommendations](ranked-recommendations.md) · [Research method](research-method.md)
