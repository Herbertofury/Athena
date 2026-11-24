# Safe offline Cloud Workshop guide

## Boundaries first

Use a private study copy and synthetic data only. The Python code uses the standard library and no provider SDK. There are no accounts, credentials, network requests, purchases, resource changes, permission grants or live failovers. No cloud CLI or container runtime is required.

The eight fixed commands print JSON. Each output explicitly says `real_cloud_executed: false`. Seven are arithmetic or comparison models. The `restore` command creates one owned temporary directory, writes and copies invented report bytes, restores into a new file, and cleans up its own directory. It never reads or replaces a personal file. It does not test cloud durability or a real application’s recovery.

Python executes with your normal account permissions, not in a sandbox. Read the supplied code, edit only your study copy and do not paste untrusted code. No administrator permission is needed. No command accepts an arbitrary file path, URL or cloud target. A reference link is for reading, not an instruction to sign up or deploy.

## Suggested rhythm

Predict the output, run the fixed command, explain any difference and record the limits. Use the [worksheet](WORKSHEET.md) and consult the [answer key](ANSWER-KEY.md) afterward. The full [model contracts](CONTRACTS.md) define bounds and assumptions. Expect roughly six hours of study plus additional reflection and variation work.

All commands below run from the extracted pack directory. If your platform uses `python` or `py -3`, substitute its Python 3 launcher. Only Python 3.12.14/Linux was executed here. Paper alternatives are valid study activities, but not execution evidence.

## 1. Resource scope

```sh
python3 labs/cloud-workshop/run_lab.py scope
```

Predict which invented resource paths match `academy/dev`, then `academy`. The narrow scope matches only `academy/dev/reports`; broad matches all three resources. `academy/dev-tools/reports` is a sibling branch, not a child of `academy/dev`.

This checks whole-segment containment only. It does not authenticate a principal, evaluate an operation or determine effective IAM access. On paper, split the paths into segments and compare them. Safe variation: add a new synthetic resource in a private fixture copy and predict both scope lists.

## 2. Request assumptions

```sh
python3 labs/cloud-workshop/run_lab.py network
```

The baseline fails `service_listening`; the second case fails `identity_allows`. All four boolean assumptions must be true for the simplified gate result to pass. No packets are sent. The result does not diagnose a real service or implement stateful security groups, DNS, TLS, routing or vendor IAM.

On paper, list which evidence could verify each assumption in an authorized environment. Safe variation: change one boolean in a private fixture copy. Do not make a live firewall rule to “test” the lesson.

## 3. Capacity planning

```sh
python3 labs/cloud-workshop/run_lab.py scaling
```

Demand is 850 requests/minute. A replica has 400 rpm modeled physical capacity; target is 50%, so five replicas are needed at 200 rpm each. The maximum permits four: target capacity 800 rpm, physical capacity 1600 rpm. The target is missed, but modeled physical capacity is sufficient. This is not an observed outage or an autoscaling event.

On paper, use ceiling division and then apply minimum/maximum. Safe variations: demand 0, 800, 801 and 1700. Keep target and physical limits separate. No load generator is included or authorized.

## 4. Failure-domain headroom

```sh
python3 labs/cloud-workshop/run_lab.py failure
```

Baseline: two replicas per invented zone, four total. Losing zone-a leaves two and 400 rpm at the target, below demand 500. Alternative: three per zone, six total. Losing zone-a leaves three and 600 rpm at the target, sufficient in the model.

There is no failure injection, health-check measurement, traffic redirection, database recovery or availability percentage. On paper, cross out one zone’s replicas and calculate the remainder. Safe variation: compare loss of zone-b or both zones in a private fixture copy.

## 5. Recovery objectives

```sh
python3 labs/cloud-workshop/run_lab.py recovery
```

The last recoverable point is minute 580, incident at 600 and restored service at 650. Data gap is 20 minutes; downtime is 50. RPO target 15 is missed, RTO target 60 is met. These timestamps are invented, not measured.

On paper, draw the two intervals. Safe variation: move the last recoverable point to 590 while leaving restoration time unchanged. Explain which objective changes and which does not.

## 6. Actual local restore

```sh
python3 labs/cloud-workshop/run_lab.py restore
```

The command writes a synthetic report, copies it, changes the source and restores the earlier copy to a new file. Expect `backup_matches_original`, `restored_matches_original`, `current_source_differs` and `temporary_directory_removed` all true. SHA-256 verifies byte equality against the earlier source.

This is real local file I/O, not a provider API, database restore or cloud disaster-recovery test. Cleanup affects only the created temporary directory. Do not replace paths with personal or system files. Paper alternative: explain expected byte relationships and label the restore unexecuted.

## 7. Fictional cost estimate

```sh
python3 labs/cloud-workshop/run_lab.py cost
```

All rates are invented credits, not currency or vendor prices. Always-on: compute 10800, storage 200, transfer 150, total 11150; 1150 above a 10000-credit threshold. Scheduled: compute 2400 plus the same 350, total 2750; 7250 below the threshold. 720 hours is an explicit 30-day assumption, not every month.

This does not establish real savings, charges, free-offer eligibility or a spending cap. On paper, cancel units in each multiplication. Safe variation: double only transfer volume and explain the effect. Do not create a cloud budget or assume a notification stops spending.

## 8. Change review

```sh
python3 labs/cloud-workshop/run_lab.py changes
```

Expect: add queue, remove reports, modify web fields public and size. Warnings identify reports removal and increased web exposure. `applied` is false. The schema and replacement rules are invented and cannot predict provider behavior. There is no apply command.

On paper, compare IDs, then changed fields. Safe variation: compare an unchanged inventory or a kind change in a private fixture copy. Discuss who would need to approve a real change, what could be lost, and how to verify and recover it. Do not upload templates or create a real change set as part of this pack.

## Tests and changing fixtures

```sh
python3 -m unittest discover -s tests -v
```

The suite checks the distributed baseline, boundary cases, nonmutation, actual temporary-file cleanup, fixed CLI outputs and content consistency. If you intentionally edit a fixture, baseline-output tests can fail because you changed the scenario. Preserve the original pack, record new predictions and create additional tests rather than weakening old assertions to conceal a defect.

A green suite verifies these bounded implementations and fixtures. It does not certify a learner, validate vendor semantics or prove unexecuted cloud behavior.
