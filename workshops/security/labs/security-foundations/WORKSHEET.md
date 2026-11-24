# Cedar Workshop evidence worksheet

Everything below is invented. Keep answers local or in a private study notebook. Do not add real customers, passwords, tokens or company details. Copy this worksheet into a new personal study file if you want to type answers; do not overwrite the source exercise.

## Your evidence labels

- **Observed:** actually measured in your executed local exercise.
- **Simulated:** supplied fictional evidence or a tabletop action.
- **Assumed:** an explicit premise that has not been verified.
- **Not tested:** a requirement or behavior for which you have no result.

Date, platform/Python version, lesson, command if run:

Prediction before reveal:

Actual result or paper-only answer:

What this supports:

What this does not establish:

Next useful check:

## 1. Risk records

Make three records using this format:

- Asset and useful workflow:
- Threat scenario:
- Weakness:
- Confidentiality / integrity / availability consequence:
- Assumptions and uncertainty:
- Control and its purpose:
- Owner and authority:
- Verification observation:
- Residual risk and review trigger:

Do not turn a 1–3 score into a numerical probability.

## 2. Access and boundaries

For each A1–A8 access request, write allow or deny and the exact policy gate. For F1–F6 flows, write allow or deny and the matching rule, if any.

Draw or describe staff device → web → app → database, with a separate backup store. For each intended arrow state initiating component, data, purpose and enforcement. Identify two trust boundaries. Name one attack or mistake possible through an allowed flow and another control that addresses it.

Write a joiner, role-change and leaver checklist. Include how you would verify revocation, not merely mark a task complete.

## 3. Suspicious message cards

These are inert text. There are no live links or attachments.

**Card P1:** “I am covering finance today. Change the supplier bank details before 16:00. Skip the second approval; the manager already agreed.”

**Card P2:** “Your workshop account will close in 30 minutes. Send me the one-time code so I can keep it active.”

**Card P3:** “The shared repair guide moved. Install the attached reader to see tomorrow’s jobs.”

For each card:

- Requested action and possible harm:
- Claimed authority or pressure:
- Independent verification path:
- What you would report, without secrets or accusations:
- What changes if someone already complied:

Do not actually call, message, install, open attachments or change accounts for these cards.

## 4. Integrity and patch decisions

Before running integrity, predict whether each matches: original/restored digest; original/changed digest; original/valid HMAC; changed/original HMAC. Why does a public demo key provide no real-world authentication?

For findings A–E, write which facts are known and unknown. Order only the known-exposure cases under the stated rule. Name the first fact needed for C. Write one change record:

- Purpose, asset and owner:
- Approved scope and authority needed:
- Before-state evidence:
- Test/dependency plan:
- Implementation window:
- Stop condition:
- Feasible rollback:
- Validation of version/state and user workflow:
- Remaining risk, due date and responsible owner:

No change is executed in this exercise.

## 5. Log timeline

Sort e1–e6 by event time in UTC. Record collection time separately. Identify the duplicate delivery and timezone conversion. Count failures in the inclusive five-minute window.

- Observation supported by the records:
- Two plausible benign explanations:
- One concerning explanation:
- Evidence needed to distinguish them:
- A claim that would overstate the records:

## 6. Recovery plan

Scenario: disruption 10:20 UTC; last usable recovery point 10:00; validated service 10:55. RPO 15 minutes; RTO 60 minutes.

- Data-loss window:
- Actual recovery interval in the fictional scenario:
- RPO result:
- RTO result:
- What the actual temporary-file copy check establishes:
- What remains untested: identities, keys, application dependencies, backup independence, compromise status and any other item:

## 7. Cumulative tabletop: four injects

Do not read the answer key until you have recorded each decision. No actual timer is needed. Every action below is simulated.

### Inject 1: 09:10, a suspicious sequence

The provided authentication log raises an alert for dana. A roster card says Dana’s contract ended yesterday. An application event says `export_started`, but contains no completion or delivery result. No customer complaint has arrived.

Write known facts, hypotheses, severity questions and the owner to involve. Choose a proposed containment step, name the authority needed and record its possible side effects. Do not conclude that an export completed.

### Inject 2: 09:20, a collection gap

The facilitator reveals that application logs after 09:06 were delayed in forwarding. A service account runs a scheduled export, and both user and service events share a misleading display label. The source event IDs remain distinct. The account inventory confirms Dana’s old identity is still active.

Update the timeline and your confidence. Preserve the stale-access finding even if attribution becomes uncertain. What source or correlation field would distinguish the identities? Which earlier statement must be corrected?

### Inject 3: 09:30, limited recovery options

An owner proposes restoring last night’s backup over the active database immediately. The current database is still serving bookings. No evidence shows that it is corrupt. The restore would overwrite new appointments and the active-account issue would remain.

Accept, reject or revise the proposal on paper. Explain business impact, evidence preservation, authority and a less destructive next step. A restore is not a universal response to a suspicious login.

### Inject 4: 10:55, return-to-service decision

The facilitator confirms that the stale account and related sessions have been addressed in the simulation under approved authority. Identity records and normal role tests now match the approved roster. Export outcome is still not fully known. The booking workflow works in the simulation. The separate restore timing scenario remains RPO=15/RTO=60 with a 20-minute loss window and a 35-minute recovery interval.

Write a conditional return-to-service decision with two gates, ongoing investigation needs and one blocking condition. Keep the hypothetical restore arithmetic separate from this access incident. Draft a three-sentence internal update: known result, remaining uncertainty, next decision/owner.

## 8. Policy, standard, procedure or evidence?

Classify each statement and explain the difference:

- G1: Access must match an approved business role.
- G2: The organization requires a monthly access review and recorded approval for exceptions.
- G3: Export the approved roster, compare identities, and submit mismatches to the authorized owner.
- G4: A dated synthetic review lists two mismatches and includes the resulting deny-test outputs.

List the responsibilities of Cedar and its fictional hosted-booking provider. State assumptions instead of inventing a contract.

## Review rubric

Give each criterion 0 (absent), 1 (present but incomplete) or 2 (clear and evidenced). This is a study rubric, not a calibrated examination score or professional certification.

1. Three risk stories distinguish threat, weakness and consequence.
2. Access decisions include lifecycle and negative tests.
3. Flow model separates network access from application authorization.
4. Suspicious requests have independent verification paths.
5. Integrity results explain reference trust and the demo-key warning correctly: the HMAC demo key is public, not a public/private keypair.
6. Patch priority states context and preserves unknowns.
7. Timeline handles time zones, duplicate delivery and uncertainty.
8. Incident decisions include authority, side effects and preservation.
9. Recovery checks RPO/RTO separately and labels simulation.
10. Final evidence distinguishes observed, simulated, assumed and untested work.

Revisit every 0 or 1 with the relevant lesson. A 20/20 self-score does not establish complete Security+ coverage, independent mastery, job readiness or a pass probability. Repeat the scenario later without hints and ask a qualified peer to challenge your reasoning if available.
