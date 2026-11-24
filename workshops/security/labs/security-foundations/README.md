# Safe offline security practice

These exercises use only bundled invented data. No account, API key, browser login, administrator access, cloud service, paid tool or network is required. Do not replace the fixtures with real people, credentials, customer records, logs or company information.

## What actually runs

The Python program reads fixed JSON fixtures. Its integrity command also creates a new temporary directory, writes synthetic text, copies it, calculates SHA-256 and HMAC comparisons, then removes only its own temporary directory. The HMAC key is deliberately public demonstration text. It is not a credential and must never protect real data.

No command scans, connects to a host, changes permissions, edits firewall rules, manages accounts, installs software or restores over a user file. The CLI accepts only six named commands, never a target or file path. Inspect the short source before running it.

## Requirements and commands

Use Python 3.10 or newer. The standard library is sufficient. From the pack or integrated repository root:

```sh
python3 labs/security-foundations/offline_lab.py access
python3 labs/security-foundations/offline_lab.py flows
python3 labs/security-foundations/offline_lab.py integrity
python3 labs/security-foundations/offline_lab.py triage
python3 labs/security-foundations/offline_lab.py logs
python3 labs/security-foundations/offline_lab.py recovery
```

On a Windows installation using the Python launcher, replace `python3` with `py -3`. The Windows commands have not been executed in this validation environment. Each command prints readable JSON. A result containing `false` is often the expected negative case, not a failed program. Compare with the answer key, not simply with the process exit code.

Optional quality checks for the pack maintainer:

```sh
python3 scripts/render_security_pack.py
python3 -m unittest discover -s tests -p 'test_security_foundations.py' -v
```

## Predict first, then check

1. Read the relevant lesson and fixture.
2. Write the expected outcome and the rule behind it.
3. Run the command, or use the answer key for the paper-only route.
4. Explain any disagreement. Preserve the original prediction.
5. Write what the result proves and what it does not prove.

A paper-only answer is useful learning, but must not be recorded as an executed lab. All outputs remain synthetic except the actual temporary-file calculations and copy operation.

## Six exercises

- **Access:** eight requests under a fixed active-identity, managed-device, role/action policy. No vendor IAM semantics are implied.
- **Flows:** six one-way tuples. No connection state, return traffic, packet delivery or protocol inspection is modeled. Reverse traffic being denied in this toy table is not a claim that real stateful firewalls deny replies.
- **Integrity:** actual local synthetic copy, digest and keyed-tag comparisons. There is no encryption or signature implementation. A matching reference must itself be trusted.
- **Triage:** four known-exposure findings ordered under a stated teaching rule; one unknown exposure isolated for investigation. Unknown does not mean safe. No real vulnerability identifiers or live scanning.
- **Logs:** six unique events plus one duplicate delivery, timezone normalization and an inclusive five-minute failure window. One first alert per identity. No deployment efficacy claim.
- **Recovery:** arithmetic on invented timestamps. RPO and RTO are checked independently. This is not actual disaster-recovery timing.

## Safety stop

If any proposed adaptation asks for real credentials, a remote target, administrative permission, untrusted software, destructive commands or security-setting changes, stop. That is a different task requiring its own approved scope and safeguards. The supplied exercises do not need any of those steps.

## Accessible alternatives

All teaching, fixtures and expected outcomes are plain text. There is no color-only signal, time pressure or requirement to drag items, listen to audio or use a mouse. Tables are not required to answer. The generated lesson pages use headings and numbered steps; answers are in expandable text and also readable in the answer-key file. Actual screen-reader and accessibility conformance have not been independently assessed.
