# Answer key: reasoning matters more than matching words

These are original teaching cases, not real exam items. Use the exact policy and assumptions supplied in the exercise. Reasonable tabletop answers may differ when they state authority, consequences, uncertainty and verification.

## Access requests

- A1 allows: active receptionist, managed device, booking read.
- A2 denies: inactive identity, even though the old role would permit reading.
- A3 denies: unmanaged device fails this toy policy’s condition.
- A4 denies: auditor has read, not update.
- A5 allows: administrator manages accounts under the specified policy.
- A6 denies: account administrator is not automatically a booking-data exporter.
- A7 allows: backup service reads the backup snapshot only.
- A8 denies: unknown role. A name such as “superuser” does not create permission.

These outcomes do not describe all vendor IAM semantics. A legitimate user blocked by a policy still needs an approved resolution, not a casual policy bypass.

## Flow matrix

F1 and F2 allow. F3–F6 deny because no exact allow tuple exists. F6 is a separately modeled reverse-initiated request; it is not the reply packet of a stateful connection. The table does not simulate return traffic. DNS, management, backup and other dependencies need separate real-design consideration.

## Suspicious requests

P1 concerns a high-consequence financial change and bypassed second approval. Verify through the established supplier-change process with a previously trusted contact. A supplied callback number is not independent evidence.

P2 requests a code that could approve access. Do not share it with the sender. Open the known account application or use the established support route. A genuine support process should not depend on giving an unsolicited sender a one-time code.

P3 asks for unverified software installation. Use the known document source and approved software/support process. Do not install the attachment to see whether it is safe.

For all three, report the request, time and context using the approved route. If someone already complied, promptly involve authorized responders without blame, collecting non-secret facts. None of these cards proves that the named person is the actual sender or has malicious intent.

## Integrity

- Original and restored SHA-256: match.
- Original and changed SHA-256: differ for these fixture bytes.
- Original message with original HMAC: valid.
- Changed message with original HMAC: invalid.
- Fresh temporary directory: removed after the local operation.

The published demo HMAC key allows anyone to make new valid tags, so it protects no real data. This is a shared-key demonstration, not public-key cryptography. A trusted baseline is needed to attach meaning to a digest match. File integrity does not prove malware absence, correct business content or a trusted author. No encryption or signature verification is executed here.

## Vulnerability triage

The known-exposure order is B, D, E, A under the stated teaching rule. C is held outside that ordering until exposure is verified. B has known exploitation and public exposure. D precedes E because exposure comes before impact in this deliberately simplified rule. E precedes A because impact comes before severity. These are not universal organizational priorities: a real database, safety requirement or compensating control can alter decisions.

A useful response challenges whether the chosen rule is appropriate rather than claiming its output is objectively correct for every business. Record supported versions, reachable features, owner, change risks and verification; no scanning or exploitation is necessary to answer this exercise.

## Log evidence

The UTC order is e1 09:00, e2 09:01, e3 09:02, e4 09:04, e5 09:05, e6 09:20. e4’s source timestamp is 10:04 +01:00, equivalent to 09:04 UTC. It was collected at 09:06, after e5’s collection.

There are seven delivered records but six unique events. The repeated e3 does not add an attempt. Dana has failures e1, e3 and e4 within four minutes, so the inclusive five-minute threshold is met at e4. Ari’s two failures are too few and too far apart. e5 is a success, not a fourth failure.

Possible benign explanations include a mistyped credential or a stale automated client. Unauthorized access is also possible. Correlate identity IDs, approved activity, session and application evidence through authorized sources. The alert does not prove a completed export, who operated the account, or the quantity of affected data.

## Recovery

Data-loss window: 10:20 − 10:00 = 20 minutes. RPO 15 is missed by five minutes.

Recovery interval: 10:55 − 10:20 = 35 minutes. RTO 60 is met, with 25 minutes of margin in this fictional example.

The arithmetic uses invented timestamps. The separate temporary-file copy and hash comparison are actually executed when you run integrity. Neither result verifies a real production restore, database consistency, key recovery, clean backup, independent failure domain or complete business continuity plan.

## Tabletop model reasoning

### Inject 1

Supported facts: an alert condition was met; the roster says the contract ended; an export start label exists. Unknowns: who operated the identity, whether the roster/inventory agree, whether the export completed, its destination and scope. A defensible proposal is an authorized temporary access/session restriction after considering dependencies, with preservation of relevant records. It is not defensible to declare every customer record stolen.

### Inject 2

Delayed collection changes confidence in the sequence. Shared display labels are not stable identity proof. Use underlying subject/account IDs, session or request correlation and source provenance. The confirmed active departed identity is a valid control gap even if the export belongs to the service account. Correct any earlier attribution rather than discarding contradictory evidence.

### Inject 3

Reject the immediate overwrite as unsupported by the supplied facts, or revise it into a separately authorized isolated restore investigation if useful. There is no demonstrated corruption, the service is working, new appointments would be lost and stale access would remain. Preserve the active state/evidence and investigate the account and export context under approved authority. A real emergency could change priorities, but that evidence has not been supplied.

### Inject 4

A conditional service decision can rely on verified identity/session remediation and successful authorized/denied role tests plus the booking workflow. Remaining uncertainty about the export stays open with an owner. A missing containment verification, reappearing unauthorized access or failed business workflow would block return. Do not represent separate fictional backup timing as a measured outcome of this incident.

Example internal update: “In this tabletop, the authorized team removed the stale access and verified the normal booking workflow and role tests. The export’s outcome and scope remain unconfirmed, so the investigation stays open. The incident owner will review the source identity and delivery evidence before deciding whether further containment or notification is needed.”

This is a practice text, not a message to send and not a real incident statement.

## Governance classification

G1 policy; G2 standard; G3 procedure; G4 evidence. A provider may run physical infrastructure while Cedar administers its users, data-sharing choices and business use. Exact duties depend on the service and agreement, which are not supplied here. Do not claim legal compliance from this fictional matrix.

## What to study next

Review the [coverage gaps](../../docs/SECURITY-COVERAGE.md). All 30 concept answers and explanations are also embedded under each lesson. A correct self-check is evidence of a response to one question, not proof of full skill transfer or current exam alignment.
