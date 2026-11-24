# Security delta: package identity matters

Reviewed 2026-10-27. Sources [TLS01], [NXT01], [AUDIT01]. RustSec advanced from retained revision 3279c999 to 99670cfc0bc574433034b75876a4b791ccaa2efb. A fresh fetch succeeded after the earlier failure; historical evidence remains unchanged. Final audits use a clean, pinned worktree after a cleanliness check caught an untracked earlier placeholder in the original checkout.

## rustls-ffi, not every Rustls consumer

[RUSTSEC-2026-0413](https://github.com/RustSec/advisory-db/blob/99670cfc0bc574433034b75876a4b791ccaa2efb/crates/rustls-ffi/RUSTSEC-2026-0413.md) concerns caller-owned server-name lifetime in rustls-ffi 0.12.0–0.15.6. [Upstream v0.15.7](https://github.com/rustls/rustls-ffi/releases/tag/v0.15.7), published October 26, copies the input. The RustSec ID assignment occurred October 27. The advisory's release link contains an extra slash and returned 404; the working upstream release was independently verified.

None of the three inspected Atlas lockfiles contains rustls-ffi. The separate rustls crate is not evidence of this FFI-package issue. This does not establish the status of globally installed tools or other projects.

## cargo-nextest identity assignment

[RUSTSEC-2026-0412](https://github.com/RustSec/advisory-db/blob/99670cfc0bc574433034b75876a4b791ccaa2efb/crates/cargo-nextest/RUSTSEC-2026-0412.md) identifies the already reviewed portable-recording rerun argument-injection issue: affected 0.9.125–0.9.149, fixed in 0.9.150. This is not a newly executed proof of concept. Atlas's reviewed workflow uses cargo test; the checked lockfiles do not include cargo-nextest. No recordings or third-party prototypes were run.

## Verification

[Raw audits and provenance](../experiments/dependency-audit-lab/README.md) cover the application (185 locked packages), isolated compression component (47) and parser component (26). No known matches or warnings were reported and no advisory was ignored. No dependency upgrade, persistent access, security setting or other-project recommendation was made. Known-advisory matching is not a complete security guarantee.
