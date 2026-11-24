# Security Foundations: Evidence Before Assumptions

Ten connected applied lessons: risk, identity, integrity, boundaries, suspicious requests, patch decisions, logs, response, restore and accountable evidence.

Version-neutral applied beginner practice, not exhaustive Security+ coverage, an official practice exam or proof of job readiness. All fixtures are synthetic. Only the small local file-copy/hash operations are real system operations; no security configuration is changed.

## Prerequisites

- [Authentication, authorization and accounting](shared-identity)
- [Risk, threats and security controls](shared-risk)
- [Encryption, hashing and key management](shared-cryptography)
- [Incident response and evidence](shared-incident)
- [Availability, backup, RTO and RPO](shared-resilience)

## Ordered workshop

1. [Describe the risk before choosing a tool](shared-sec-risk-story)
2. [Design access that ends when the job ends](shared-sec-identity-lifecycle)
3. [Tell secrecy, integrity and authenticity apart](shared-sec-data-integrity)
4. [Draw boundaries and allowed flows](shared-sec-trust-boundaries)
5. [Handle a suspicious request without escalating harm](shared-sec-phishing-decisions)
6. [Prioritize fixes with context](shared-sec-vulnerability-triage)
7. [Read security logs without inventing a story](shared-sec-log-evidence)
8. [Respond while preserving choices and evidence](shared-sec-incident-decisions)
9. [Prove a restore instead of trusting a backup label](shared-sec-restore-proof)
10. [Turn controls into accountable evidence](shared-sec-governance-proof)

## Offline practice

Download the workshop ZIP from the app, extract it and read its README before running any command. Run commands from that extracted workshop folder. The app does not execute Python or SQL, and a read mark is not lab evidence.

Source and editable exercises: [workshop folder](https://github.com/Herbertofury/Athena/blob/main/workshops/security/README.md).

## Primary-source register

- [NIST SP 800-30 Revision 1: Guide for Conducting Risk Assessments](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-30r1.pdf) — Stable risk terms and scenario/context reasoning; fictional examples and scoring caveats are original teaching.
- [NIST Cybersecurity Framework resource center](https://www.nist.gov/cyberframework) — Risk-management framing and governance; not a claim of CSF implementation or certification.
- [NIST SP 800-63B-4: Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html) — Factor categories, phishing resistance and lifecycle considerations; not full AAL compliance.
- [NIST SP 800-207: Zero Trust Architecture](https://csrc.nist.gov/pubs/sp/800/207/final) — No implicit trust from network location or asset ownership alone; not a deployment blueprint.
- [NIST FIPS 180-4: Secure Hash Standard](https://csrc.nist.gov/pubs/fips/180-4/upd1/final) — Hash digests detect changed bytes; source planning note says revision was planned. No claim that hashing authenticates a publisher.
- [Python hashlib documentation](https://docs.python.org/3/library/hashlib.html) — Stable SHA-256 API used in tested local example; executed interpreter version is separately recorded.
- [Python hmac documentation](https://docs.python.org/3/library/hmac.html) — Keyed authentication API and compare_digest; only a public teaching key is used.
- [NIST SP 800-40 Revision 4: Enterprise Patch Management Planning](https://csrc.nist.gov/pubs/sp/800/40/r4/final) — Identification, prioritization, installation and verification of updates.
- [FIRST CVSS v4.0 User Guide](https://www.first.org/cvss/v4.0/user-guide) — Severity metrics versus broader local prioritization. No official CVSS calculation implemented.
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html) — Purpose, correlation, sensitive-data exclusion and protection of logs; toy threshold is original.
- [NIST SP 800-61 Revision 3: Incident Response Recommendations](https://csrc.nist.gov/pubs/sp/800/61/r3/final) — Revision 3 finalized April 2025 and supersedes Revision 2; response integrated into CSF 2.0 risk management.
- [NIST SP 800-34 Revision 1: Contingency Planning](https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final) — Contingency planning concepts. Timing scenario and copy exercise are original, not production validation.
- [RFC 7489: Domain-based Message Authentication, Reporting, and Conformance](https://www.rfc-editor.org/rfc/rfc7489.html) — Domain authentication does not confer elevated delivery trust or prove benign intent. Foundational limited citation, not current configuration advice.
- [FTC Cybersecurity for Small Business](https://www.ftc.gov/business-guidance/small-businesses/cybersecurity) — Suspicious requests and independent verification; no third-party contact or real incident conclusion.
