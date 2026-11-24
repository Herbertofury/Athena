# Bounded wikilink advisory regression

Checked 2026-10-28. Source RSEC0414: [pinned RustSec advisory](https://github.com/RustSec/advisory-db/blob/40f5be6fb12ed93fc591bf4ab23b7d793b3f2239/crates/pulldown-cmark/RUSTSEC-2026-0414.md), [upstream repair](https://github.com/pulldown-cmark/pulldown-cmark/pull/1102), [0.13.5 release](https://github.com/pulldown-cmark/pulldown-cmark/releases/tag/v0.13.5). The advisory is dated October 18, its ID was assigned October 28, and the patched release was published October 21. These are different events, not a newly released library today.

## Actual scoped audit

The official RustSec head changed from 99670cfc to 40f5be6f at 08:50:03 UTC. A new detached clean worktree retains the old database unchanged. The already-installed SHA-256-pinned cargo-audit 0.22.2, strict receipt acceptance and same three fixed lockfiles produced [three completed zero-match/no-warning audits](audit/receipt.json) against the new revision. None of those lockfiles lists pulldown-cmark. This does not clear all repositories, the entire machine or future dependencies. No application dependency was changed.

## Bounded local reproduction

An independently written [small Rust counter](source/main.rs) compares exact registry versions 0.13.4 and 0.13.5 in separate scratch projects. [Manifest/lock identities](source/identities.json), build logs, [all 60 raw samples](raw/results.json) and [original stdout/stderr bundle](raw/wire-output.json) are retained. The child only counts events; it does not collect an unbounded output graph or contact a service.

Maximum input is 112 bytes, event iteration stops after 500,001 events, each child has 128 MiB address-space and two CPU seconds, a three-second wall deadline and a 60-second outer budget. Three repeats alternate version order. All 60 processes exited successfully without hitting the event cap.

| Repeated wikilink count | 0.13.4, option on | 0.13.5, option on | Both versions, option off |
|---|---:|---:|---:|
| 1 | 6 | 5 | 7 |
| 4 | 76 | 17 | 25 |
| 8 | 1,276 | 33 | 49 |
| 12 | 20,476 | 49 | 73 |
| 16 | 327,676 | 65 | 97 |

This verifies the bounded event-growth regression and default-option control for these exact versions/inputs. It is not an actual memory-exhaustion attempt, a full Markdown conformance suite, a speed ranking or proof of whole-parser safety. Unknown other attack patterns and transformed-output correctness are not covered. The real fix belongs to the cited upstream authors; Atlas did not create that repair.

## Reproduction and containment

The known-affected manifest and lockfile are stored as text evidence, not an automatically built workspace member. To reproduce, use a separate disposable private directory: copy the counter into before/src and after/src, restore each corresponding Cargo.toml.txt and Cargo.lock.txt to their normal names, build with the recorded Rust toolchain and locked dependencies, then run the fixed analyst runner with the two expected executable paths. Keep OS limits and the input/event bounds. Do not feed the pattern to any third-party service or remove limits. Binaries remain local and are not published. Raw filenames in results.json are keys in wire-output.json.

The normal Atlas security checks and dependencies are unchanged. This evidence is kept in Atlas; no other project's wiki, TODO, implementation or deployment was changed.
