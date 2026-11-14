# Trace AWS identity decisions without inventing an IAM engine

Separate who is calling, what they request and the layers that constrain access.

## Learning goals

- Distinguish a role session from a long-lived identity credential.
- Trace allow, implicit deny and explicit deny in a bounded example.
- Explain why a local decision is not proof of real AWS authorization.

## Learn

An application that reads order receipts needs an identity, a permitted action and an intended resource. Those are separate design choices. In AWS, IAM roles can provide temporary credentials for an assumed role session, avoiding the need to distribute a permanent application access key. The architectural question is not simply whether the developer can log in. It is which workload will act, how it obtains its session, which operations it needs and when that access should end.

Start a permission ledger with principal, action, resource and context. A reader needs a narrowly described read operation on the intended objects, rather than every operation on every bucket. A different component may need to write new objects without deleting existing ones. Keeping those responsibilities separate makes review and later investigation easier. A convenient wildcard is a decision to expand authority, not merely shorthand for a long list. Record why each permission is necessary.

IAM policy evaluation includes default denial and explicit deny, but a classroom evaluator is not IAM. Identity policies, resource policies, permissions boundaries, organization controls and session policies can interact, with important exceptions and principal-specific behavior. Our model separately checks a fictional allow/deny ledger and a required human approval label. That approval gate is a teaching workflow, not an IAM policy feature. A model-level allow therefore cannot establish actual AWS authorization or substitute for the required owner decision.

Separate authorization from authentication and from audit. Authentication establishes an identity or session. Authorization determines whether that identity may perform a particular request under applicable controls. An audit record helps explain what occurred, but its existence does not grant permission. Similarly, encrypting a receipt does not automatically make its readers appropriate. The review should ask independent questions about access scope, credential handling, data protection and the records needed to investigate misuse.

In the fictional receipt service, the read request matches the reader allow, while the write guard applies to a different action. However, the required owner approval is missing, so the local outcome is approval_required. Predict that result before running the command. Discuss a separate paper-only request with a conflicting explicit deny, and another with no matching allow. Keep those paper cases distinct from the actual fixed receipt. This avoids pretending the default fixture executed cases it never received.

Use invented resource labels and no credentials in this workshop. The executable snippet is ordinary local Python, not an AWS CLI request or a policy deployment. Before applying a real design, an authorized team would inspect the actual policy documents, trust relationships, account boundaries and service behavior, then validate the intended requests safely. Your evidence here is a reasoning trace and a list of missing real-world checks. It is not an IAM approval, security certification or production access test.

## Worked example

The fixed read/orders request matches reader, while write-guard does not match its action. The separate teaching approval gate requires owner, but approvals is empty: the observed outcome is approval_required. Explicit-deny and missing-allow cases are paper reasoning, not the default fixture outcome.

```sh
# Local synthetic model only; no AWS calls or configuration.
python3 labs/aws-workshop/run_lab.py identity
```

Run from the workshop directory. Local Python only; no AWS credentials, calls, network or real configuration.

## Practice safely

1. Write a principal/action/resource/context ledger for the fictional reader.
2. Predict why a matching read allow still leaves the owner approval missing.
3. Run python3 labs/aws-workshop/run_lab.py identity from the workshop directory.
4. Compare approval_required and the missing owner with your prediction.
5. Discuss an explicit-deny conflict on paper and label it unexecuted.
6. Keep the receipt and explain why a teaching approval gate is not IAM.

## Evidence to keep

- A four-part request ledger with a narrow purpose.
- An observed missing-owner approval result, separate from paper deny reasoning.
- A list of real IAM layers and trust checks left untested.

## Original check 1

A matching allow and explicit deny conflict in this teaching case. What wins?

A. The explicit deny
B. The most recently written statement
C. The allow because reading is harmless
D. The shorter policy

<details><summary>Answer and reasoning</summary>

A. The explicit deny

An explicit deny overrides an allow in this bounded case; actual IAM evaluation has additional policy layers and context.

</details>

## Original check 2

Why prefer a workload role over distributing a permanent application access key?

A. A role removes the need to review permissions
B. The workload can use temporary role-session credentials
C. Roles guarantee all actions are denied
D. Temporary credentials never expire

<details><summary>Answer and reasoning</summary>

B. The workload can use temporary role-session credentials

Temporary role credentials avoid distributing a permanent application key, while permission scope and credential use still require review.

</details>

## Original check 3

What does this local receipt establish?

A. That the real bucket is secure
B. That an AWS session was authenticated
C. How the supplied simplified rules treated the fictional request
D. That all organization policies were checked

<details><summary>Answer and reasoning</summary>

C. How the supplied simplified rules treated the fictional request

The model has no AWS connection, session or full policy engine, so its evidence is limited to its own inputs and rules.

</details>

## Limits

No IAM APIs, real credentials, role assumptions, policy deployment, trust-policy validation or authorization boundary are executed. The local approval gate is a teaching workflow, not an IAM feature.

## Official references

- https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html
- https://aws.amazon.com/compliance/shared-responsibility-model/
