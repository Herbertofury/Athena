# CurseForge inside Athena Lab: synthetic preview only

Status: isolated integration candidate based on Athena main `b1f82a9f1ac516848f6c95d4b9b87801e6090589` plus the unchanged offline mapper in [draft PR #9](https://github.com/Herbertofury/Athena/pull/9), head `bcc6369008c429065f001486f405dfc47ff445de`. No merge, deployment or live provider enablement is implied.

## Native integration

The existing Collection panel gains a CurseForge research card. It states that live collection is disabled because this app has no approved CurseForge credential configuration or transport. No key input, credential storage, login flow, API grant, provider URL fetch, job submission or journal write is attached to the card.

“Show synthetic mapping” displays the actual offline mapper's sanitized output from the three fabricated fixtures in `fixtures/curseforge-synthetic`. This is a native component in the existing Lab shadow root, not a separate app or iframe. Receipt JSON is rendered with `textContent`, begins hidden, preserves exact large file lengths as decimal strings, and never becomes executable markup. Toggle handlers are removed on unmount. The disabled live-collection control has no submission handler; accidental DOM enablement still cannot create a job.

The public static app continues to return before probing localhost. On the privileged local origin, the existing verified-runtime handshake, strict CSP, Host/Origin protections, write-readiness guards, Modrinth collector and durable job protocol are unchanged. The original standalone runtime UI is preserved; this card is added only to the unified Athena Lab adapter.

## Architecture and credentials

Current Rust `Job` variants select fixed public Modrinth/upstream operations and bounded experiments. They do not include CurseForge or accept a provider URL/key. The existing public HTTP reader checks content type and size; it is not a credential vault. The server's ephemeral engine instance is a public cache namespace, not an authentication secret. The same-origin loopback guard protects the local engine but does not authorize a provider API.

No supported keyring, provider credential store or secure CurseForge configuration mechanism was found in the inspected current Lab source. No actual credentials, environment values, browser sessions or private account state were searched. Missing configuration refers to this app's unimplemented integration, not a claim that the user has no account or key elsewhere.

The [official API](https://docs.curseforge.com/rest-api/#authentication) requires authorized application access. Browser sign-in does not supply that grant. This candidate does not relax the access gate documented in [the offline preparation](curseforge-schema-preparation.md).

## Reproducible fixture pipeline

1. The synthetic JSON preview and Lab generation use only the Python standard library. For actual HTML/XML extraction and the full provider regression suite, install the extraction lab's existing declared dependencies: `python3 -m pip install -r engineering/experiments/site-extraction-lab/requirements.txt`. Those paths still require lxml; no substitute parser or provider credential is introduced.
2. Run `python3 scripts/build_curseforge_preview.py` to derive the sanitized synthetic receipt using the unchanged PR #9 mapper.
3. Run `python3 scripts/build_lab_workspace.py` to generate the native component.
4. Run both commands with `--check`. The Lab generator checks exact source identities and compares the complete artifact bytes to freshly generated mapper output before embedding anything. Edited nested live/credential claims or arbitrary receipt fields fail closed.
5. Run `python3 tests/curseforge_preview_build_test.py`, the two Lab JavaScript test files, the existing mapper tests, and package with the exact reviewed allowlist.

Only three runtime hashes change: Lab index, stylesheet and provenance manifest. No runtime file is added, and all other allowlisted assets stay byte-identical. No Python runs in the browser; mapping happens during the fixture build.

## Verified scope

- 39 unchanged mapper tests pass in this integration stage.
- 13 DOM/lifecycle tests pass: eight existing Lab checks plus five preview checks, including synthetic transport spies, no key fields, no job requests, public-origin no-probe, pending initialization and unmount/remount behavior.
- Eight artifact/provenance tests and 12 packaging checks pass. A discovered provenance-guard weakness was reproduced with three failures, fixed by full mapper-output comparison, and retested. Failure evidence is retained.
- The unchanged existing Rust binary served all 36 servable assets from the 37-entry reviewed package with exact byte/hash headers. A synthetic unsupported `CollectCurseForge` operation returned HTTP 422; the durable jobs list remained unchanged. Strict loopback/Origin/custom-header/CSP checks passed.
- A separate bounded synthetic experiment and exact archived fixture survived controlled engine restart. Final SQLite integrity was `ok` with exactly one intended experiment job. This is not power-loss certification or live provider collection.

Native Chromium acceptance is prepared in `curseforge_preview_browser_checks.cjs` and wired into the existing runtime harness. It covers native keyboard toggle, inert JSON, disabled collection, no non-GET requests, origin containment and mobile overflow. It has not run: the local browser restriction remains respected. DOM emulation and HTTP serving do not establish visual/browser acceptance.

## Remaining gates

PR #10 at `83fb6aad8b68b434b33ca9e70f44989abffc01bd` reproduced an unnecessary eager lxml dependency in both [push](https://github.com/Herbertofury/Athena/actions/runs/42463234453) and [PR CI](https://github.com/Herbertofury/Athena/actions/runs/42463284482): 137/138 root JavaScript tests passed; Lab regeneration failed before browser/Rust acceptance. The follow-up defers the same lxml imports to actual HTML/XML entry points. It does not install a dependency, edit a workflow or substitute/relax parsing. Standard-library-only `python3 -S` checks exercise the entire synthetic provenance suite through the existing root JavaScript test command. HTML/XML requests still fail clearly when lxml is unavailable. Follow-up hosted CI must be evaluated separately; existing unrelated accessibility/approval gates remain intact.

A future live integration still needs supported secure credential handling, explicitly authorized API access, request/response provenance binding, actual permitted records, complete pagination/distribution handling, durable last-good/failure storage and real browser acceptance. Do not present this preview as a working authenticated collector. Autoplay remains off and no media is played.

## Dependency-boundary regression

Three no-site regression cases reproduce the prior import failure and protect the fix: exact preview/Lab regeneration with `python3 -S`, shared JSON and URL safety without loading lxml, and clear missing-parser failure at every HTML/XML entry point. The complete eleven-test provenance suite also runs under `-S` from normal root CI. Parser settings, mapper output and generated Lab UI bytes are preserved; only source-provenance hashes change. The mapper from PR #9 is unchanged.
