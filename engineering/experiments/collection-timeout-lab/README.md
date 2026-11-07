# Preserve response-body timeout diagnostics

Verified 2026-10-29 against Atlas's existing reqwest 0.13.5 and shared JSON reader. This repairs actual collection diagnostics, not provider permissions or networking policy.

## Reproduced defect

A bounded loopback HTTP fixture sends valid JSON headers and one body byte, then stalls. The shared reader correctly rejects the incomplete response, but its error is an `io::Error` containing a reqwest transport error. The previous classifier inspected only the outer type and reported a validation/provider failure instead of a timeout. The failing assertion is retained privately. No external provider request or account is involved.

## Repair and boundaries

The classifier now inspects typed causes, including `io::Error::get_ref`, with a maximum of 16 steps. It returns only existing fixed messages. It never copies cause text, URLs, query strings, headers or response bytes into the diagnostic. Cyclic causes terminate at the bound. Unknown failures retain the generic safe category.

Timeout, DNS, connection and response-transport ordering is preserved. The working collector still rejects incomplete bodies and retains its previous data; this patch does not change request timeouts, retry/cooldown policy, source allowlists, TLS, proxy settings, authentication, snapshots or storage. The fixture disables proxy use only in its own loopback client, never in the application client.

## Evidence

The timeout test fails against the previous classifier and passes after the repair. The local HTTP case was repeated ten times. Additional tests cover nested transport errors with synthetic secret URLs, cyclic errors, malformed JSON and controlled failures. This establishes scoped classification and redaction behavior, not restored external connectivity or a speed improvement. Run `cargo test --locked --lib collection_failure::tests` from `apps/atlas-lab`.
