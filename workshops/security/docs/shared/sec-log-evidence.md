# Read security logs without inventing a story

Build a timeline, identify gaps and distinguish an alert from a conclusion.

**Estimated study:** about 40 minutes, with pauses and practice.

## You will learn to

- Separate event time from collection order.
- Explain false positives, missing evidence and correlated observations.
- Avoid secret or excessive personal data in logs.

## Learn

An event is an observed occurrence. An alert is a rule or system deciding that observations warrant attention. An incident is a situation handled under an organization’s response criteria. These are related but not interchangeable. A failed login is an event, not automatic proof of an attacker.

Useful records say when, where, what action, which relevant identity or component and what result. Use identifiers that support correlation without collecting unnecessary private details. Passwords, session tokens and secret keys do not belong in ordinary logs. Treat log input as untrusted data, and protect log access and retention.

A timeline depends on time sources. Distinguish when the source says an event occurred from when a collector received it. Normalize time zones and preserve original timestamps. Clock drift, delayed forwarding and out-of-order delivery can make a naive sort misleading. Do not infer causation merely because two lines are adjacent.

A detection rule trades missed activity against distracting alerts. A threshold of three failed logins from one identity within five minutes can be useful in a toy case, but typos and a broken client may also trigger it. Distributed or slow behavior can evade it. Evaluate the rule against both expected benign and concerning examples.

Correlate different evidence types. A success after several failures might reflect a real user finally remembering a password, a support reset or unauthorized access. A later export can increase concern, but you still need authority, scope and source reliability before claiming a breach. Preserve what the evidence says and mark what you do not yet know.

The lab reads only a bundled synthetic JSON file, normalizes explicit time zones and counts distinct event IDs. Duplicate delivery must not inflate the count. The threshold is inclusive of a five-minute window and groups by identity, not IP. This is transparent arithmetic for learning, not a deployable detection system or an attribution tool.

## Worked example

Cedar’s synthetic events contain three failures for dana at 09:00, 09:02 and 09:04 UTC, one duplicate copy of the 09:02 record, and a success at 09:05. Another user has two widely separated failures. The rule produces one alert for dana, based on three distinct events, not four. The success is a reason to investigate the context, not proof that dana or anyone else stole data. A 09:04 event may arrive after the 09:05 event, so preserve collection and event times separately.

## Practice safely

1. Read events.json and count distinct failures by event ID.
2. Convert the +01:00 example to UTC by hand.
3. Predict which identity crosses the stated five-minute threshold.
4. Run python3 labs/security-foundations/offline_lab.py logs.
5. Write two benign explanations and one concerning explanation.
6. Name the next evidence needed and a fact you cannot conclude from these records.

Executable exercises and paper alternatives are in the [offline lab guide](../../labs/security-foundations/README.md).

## Three original checks

### Check 1

A failed-login threshold fires. What does that establish?

A. The named user is guilty
B. All data was exported
C. The stated detection condition was met and needs context
D. The device must be wiped

<details><summary>Reveal the answer and reasoning</summary>

C. The stated detection condition was met and needs context. An alert is a signal for triage, not a verdict or an instruction to destroy evidence.

</details>

### Check 2

Why deduplicate the repeated event ID?

A. To hide inconvenient evidence
B. Because all logs are false
C. To make every alert disappear
D. Because repeated collection is not necessarily a new authentication attempt

<details><summary>Reveal the answer and reasoning</summary>

D. Because repeated collection is not necessarily a new authentication attempt. The same source event can be delivered twice. Count logical events while retaining provenance.

</details>

### Check 3

Which item should be excluded from an ordinary authentication log?

A. A session bearer token
B. A timestamp with a time zone
C. A success/failure result
D. A non-secret event identifier

<details><summary>Reveal the answer and reasoning</summary>

A. A session bearer token. A session token can grant access. Logging it creates unnecessary exposure.

</details>

## Evidence to keep

- Actual normalized timeline and one synthetic alert.
- Duplicate event and timezone handling explained.
- Observation, inference and missing evidence are separated.

## Limits

No live log collection, SIEM integration, malware attribution or production detection efficacy is claimed.

## Primary sources and further study

- https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html
- https://csrc.nist.gov/pubs/sp/800/61/r3/final
