# Respond while preserving choices and evidence

Practice a bounded tabletop with owners, containment and recovery gates.

**Estimated study:** about 40 minutes, with pauses and practice.

## You will learn to

- Distinguish preparation, detection, response and recovery.
- Choose proportionate containment under authority.
- Keep a decision log and communicate uncertainty.

## Learn

Incident response is coordinated work to limit harm and restore a trustworthy service. It needs authority, roles, contact paths, evidence handling and rehearsed decisions before a crisis. NIST SP 800-61 Revision 3, published in 2025, connects response to the CSF 2.0 risk-management functions. Older phase mnemonics can help organize learning, but should not be presented as the current publication’s only structure.

At intake, record scope, time, symptoms, affected services and the reliability of each source. Use the organization’s severity criteria and escalation routes. A missing log may be a collection failure, a retention setting or an adversarial action. Describe it as a gap until evidence supports a stronger claim.

Containment limits further harm while balancing safety, business continuity and evidence. Isolating a device, restricting a session or blocking a flow can have very different consequences. Follow an approved playbook and the responsible person’s authority. There is no universal rule to immediately shut down every machine or to always leave everything connected.

Preserve originals where feasible, work from controlled copies and record collection, handling and changes. A digest can help compare copies, but a digest alone is not a chain of custody. Legal preservation requirements, specialist forensics and regulated notification decisions need qualified organizational owners. This course is a practice tabletop, not legal or forensic certification.

Recovery should remove or control the cause, restore trusted components and verify the user outcome. Restoring a clean file while leaving an exposed account active can restart the incident. Decide what evidence will permit return to service, who authorizes it, what monitoring continues and when a failed validation triggers rollback or escalation.

Communicate what is known, what remains uncertain, what has been done and when the next decision will occur. Keep an internal technical record separate from a customer notice or public statement. A tabletop answer is not authority to contact third parties, delete data, disable a real account or assert a confirmed breach.

## Worked example

At 09:10 Cedar receives a synthetic alert for a departed contractor account and an unexpected export event. The facilitator states that no actual people or systems are involved. The service owner authorizes a simulated account hold; the responder records expected impact and preserves the supplied log copy. The team does not declare exfiltration from one export label. It asks whether data was actually delivered, to what destination, and whether the event record is reliable. Recovery requires removing stale access, reviewing related sessions and verifying the intended booking workflow in the tabletop.

## Practice safely

1. Use the cumulative capstone’s four timed injects, one at a time.
2. Record observations separately from hypotheses after each inject.
3. Name who could authorize each proposed action and its expected side effects.
4. Choose a simulated containment step and evidence-preservation plan.
5. Write two return-to-service gates and one condition that blocks recovery.
6. Draft an internal status update without claiming certainty or contacting anyone.

Executable exercises and paper alternatives are in the [offline lab guide](../../labs/security-foundations/README.md).

## Three original checks

### Check 1

An export event appears after suspicious access. What is the most defensible statement?

A. A breach of every record is proven
B. The export record is concerning; delivery, scope and reliability require verification
C. Nothing needs investigation
D. Every device must be erased

<details><summary>Reveal the answer and reasoning</summary>

B. The export record is concerning; delivery, scope and reliability require verification. The evidence raises concern but does not establish all consequences or justify destructive actions.

</details>

### Check 2

What is missing if a copy has a hash but no handling record?

A. A guaranteed malware cure
B. All useful integrity information
C. The history of who collected and handled the evidence
D. A need for any further documentation

<details><summary>Reveal the answer and reasoning</summary>

C. The history of who collected and handled the evidence. Hashes help compare bytes. They do not replace provenance and custody records.

</details>

### Check 3

Which recovery gate addresses a recurring cause?

A. A screenshot of the login page
B. A fast restore alone
C. A green progress bar
D. Verified removal of stale access plus successful intended workflows

<details><summary>Reveal the answer and reasoning</summary>

D. Verified removal of stale access plus successful intended workflows. Restoring service without controlling the entry condition can repeat the incident.

</details>

## Evidence to keep

- Decision log names authority, evidence, side effects and unresolved questions.
- Two explicit recovery gates and one blocking condition.
- A concise status update distinguishes known from suspected.

## Limits

All response actions are simulated. This is not a forensic acquisition, breach determination or authorization to alter real systems.

## Primary sources and further study

- https://csrc.nist.gov/pubs/sp/800/61/r3/final
- https://www.nist.gov/cyberframework
