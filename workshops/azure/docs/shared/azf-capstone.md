# Review an Azure service without erasing unresolved risks

Integrate governance, access, networking, recovery and cost into one honest evidence packet.

## Learning goals

- Connect findings across administrative boundaries.
- Prioritize missing evidence without inventing execution.
- Separate partial learning coverage from certification and practical readiness.

## Learn

A credible service review combines several imperfect pieces of evidence without turning them into a claim stronger than their sources support. The fictional reporting service now has scope, access, governance, storage, network, compute, monitoring, recovery and cost discussions. Each lesson answered a bounded question. The capstone asks how those answers interact and what remains unknown. A collection of completed exercises is not equivalent to a deployed, secure or recoverable Azure service, even when every local command runs successfully.

Begin with a business description: intended users, important data, expected workload, acceptable interruption and financial constraints. Map each technical decision back to one of those needs. A private endpoint may support a connectivity requirement but still require DNS and access evidence. A redundancy option may address selected failure boundaries while leaving recovery from accidental changes unresolved. A well-tagged resource can still exceed its budget. These distinctions prevent a convincing architecture diagram from becoming a substitute for operational acceptance criteria.

Build an evidence ledger with claim, observed result, model boundary, missing real-world validation and accountable reviewer. Copy the actual finding rather than replacing it with a summary such as “passed.” If a local model preserves a route tie, the ledger must preserve that ambiguity. If telemetry is incomplete, the absence of a breach cannot support a health claim. If the recovery point misses its target, a valid dependency order cannot convert that failure into success. Evidence quality includes retaining inconvenient results.

Prioritize follow-up by consequence and dependency. A missing restore test can leave a serious continuity claim unsupported; regional feature availability can invalidate a storage or deployment choice before implementation begins. An incomplete telemetry window weakens operational conclusions. Some issues require a design decision, others require additional measurements, and others require authorized configuration or testing. Describe those next steps precisely without taking them. This workshop does not obtain credentials, provision resources, send notifications or authorize spending simply because a plan has been written.

The fixed capstone aggregates synthetic findings and names missing evidence for region availability review, restore testing and complete telemetry windows. Its conclusion deliberately refuses a readiness or approval verdict. Compare that aggregate with the individual receipts so a reader can trace every retained risk. Do not invent successful cloud operations, timestamps or examination outcomes to make the packet appear complete. A useful final recommendation can be “more evidence is required,” provided it identifies the specific claim that each missing check would resolve.

Finish with an objective gap map. This pack covers selected AZ-900 concepts and offers broader administrative enrichment relevant to stable AZ-104 domains, not full coverage of either exam. The official AZ-104 material retrieved during review exposed conflicting effective-date information, so current-version verification remains incomplete. No exam or practical readiness is claimed. Run the capstone locally, complete a paper review memo and state the remaining validations. The resulting artifact demonstrates structured reasoning about supplied fixtures, not a qualification to operate an actual Azure environment.

## Worked example

The aggregate identifies five synthetic risks and missing_evidence [region_availability_review, restore_test, complete_telemetry_windows]. Preserve its literal conclusion: Review synthetic findings; no readiness or approval conclusion. Link each risk to the relevant individual receipt and separate design gaps from absent live evidence. In a paper change request, prioritize a region-support review before selecting a real deployment target and a restore test before asserting recoverability. These proposed actions remain unexecuted and require their own authorized environment and acceptance criteria.

```sh
# Offline synthetic model only; no Azure operations.
python3 labs/azure-workshop/run_lab.py capstone
```

Run from the workshop directory. Local Python only; no Azure credentials, calls, network or real configuration.

## Practice safely

1. Read the fixed capstone fixture and write your prediction before running anything.
2. Draw the decision boundary and list the Azure conditions this local model omits.
3. From the workshop directory run python3 labs/azure-workshop/run_lab.py capstone.
4. Compare the receipt with your prediction and retain disagreements rather than editing evidence.
5. Work the alternative in the example on paper only; label it unexecuted.
6. Save the receipt and the three evidence items, with a list of unperformed real Azure validations.

## Evidence to keep

- An evidence ledger preserving all five risks and their source receipts.
- A prioritized unexecuted validation plan for the three named evidence gaps.
- An objective gap map stating partial coverage and incomplete AZ-104 version verification.

## Original check 1

Every local command exits successfully. What does that establish?

A. A full AZ-104 qualification
B. Successful regional failover
C. Correct live role assignments
D. The local exercises ran, not that Azure is production-ready

<details><summary>Answer and reasoning</summary>

D. The local exercises ran, not that Azure is production-ready

Execution success is bounded by the local models and their synthetic inputs.

</details>

## Original check 2

What belongs beside a claim that the service is recoverable?

A. A defined recovery objective and appropriate restore-test evidence
B. Only a storage service logo
C. Only a budget threshold
D. An invented restoration timestamp

<details><summary>Answer and reasoning</summary>

A. A defined recovery objective and appropriate restore-test evidence

Recoverability needs evidence tied to objectives rather than labels or fabricated results.

</details>

## Original check 3

How should conflicting AZ-104 effective-date evidence be handled?

A. Choose the newest date and claim certainty
B. Disclose incomplete version verification and retain a partial mapping
C. Claim complete examination coverage anyway
D. Remove all scope limits

<details><summary>Answer and reasoning</summary>

B. Disclose incomplete version verification and retain a partial mapping

Source uncertainty constrains coverage claims and should remain visible.

</details>

## Limits

No Azure deployment, complete architecture review, exam-readiness assessment or operational approval occurs. AZ-104 effective-date verification is incomplete because official retrieved material conflicted; mappings use stable domains only.

## Official references

- https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900
- https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104
- https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/
- https://learn.microsoft.com/en-us/azure/backup/backup-overview
