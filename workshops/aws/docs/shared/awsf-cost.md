# Reconcile synthetic costs without pretending a budget is a cap

Keep units, ownership, omissions and alert timing visible in cost decisions.

## Learning goals

- Compute a subtotal from explicit synthetic quantities and rates.
- Distinguish a budget notification from a guaranteed spending ceiling.
- Identify missing cost drivers and governance decisions before a real estimate.

## Learn

A useful estimate states what is being counted, over which period, at which rate and in which currency. A bare total hides assumptions that often dominate the decision. Compute usage, retained storage, requests, transfer, logging and backups may change independently. Some architectures also introduce fixed or minimum charges and licensing questions. This workshop uses invented integer-cent values to make the arithmetic inspectable. None of the rates or totals is a quotation for an AWS service, Region or account.

Match the units before multiplying. A storage amount measured at one instant is not automatically a full month of retained storage. A request count is not a data-transfer volume. An average demand can conceal a burst that changes capacity or concurrency needs. Write one ledger row for each modeled category and mark omitted categories explicitly. An incomplete estimate can still support learning if its exclusions are clear; presenting it as a complete bill would be misleading.

Cost optimization is a requirements problem as well as an arithmetic problem. Removing redundancy can lower a hypothetical subtotal while violating a recovery objective. Retaining fewer logs can reduce storage while undermining investigation. Selecting a lower-priced storage option can add retrieval delay or other charges. Compare feasible designs against the same workload and obligations before choosing the lowest subtotal. The cost lesson should not undo the security, recovery and evidence requirements established earlier in the workshop.

AWS Budgets can track actual or forecast costs and provide notifications or configured actions. Billing and notification delays mean spending can pass a threshold before someone responds. Existing resources can continue to incur charges, and configured actions have their own scope and constraints. A budget is therefore not a guaranteed hard spending cap. Make the response owner, expected action and delay assumptions explicit. An alert with no responsible person or permitted response is only a signal, not an operating control.

The fixed local fixture totals 1390 cents against a 1300-cent budget, exceeding it by 90 cents. Predict the threshold result, then inspect the separate spending-cap field. The arithmetic should show the overage while the cap remains false. Do not reinterpret that field as a live account setting: it communicates the teaching limitation that a comparison does not halt real usage. Keep the synthetic currency amounts distinct from the order-ledger amounts in the queue lesson.

Run the cost command and retain the category ledger, total, threshold and omissions. No Pricing API, Cost Explorer report, billing account, purchase or AWS Budgets configuration is accessed. Before a real estimate, verify current prices, service modes, Regions, usage quantities, applicable commitments and relevant taxes or fees. Before spending, obtain the required authorization. Your final recommendation should name the largest uncertainty and a useful next measurement, not claim that a classroom budget can protect a real payment method.

## Worked example

The synthetic receipt totals 1390 cents, compares it with a 1300-cent threshold and reports a 90-cent overage. threshold_reached is true while spending_cap is false. No amount is an AWS price or a real charge.

```sh
# Local synthetic model only; no AWS calls or configuration.
python3 labs/aws-workshop/run_lab.py cost
```

Run from the workshop directory. Local Python only; no AWS credentials, calls, network or real configuration.

## Practice safely

1. Write units and period for every synthetic ledger category.
2. Predict the total and 90-cent overage.
3. Run python3 labs/aws-workshop/run_lab.py cost.
4. Explain why an exceeded threshold does not stop spending.
5. Identify three omitted or uncertain real cost drivers.
6. Name an owner and authorized response for a hypothetical alert.

## Evidence to keep

- A unit-labeled synthetic ledger and reconciled total.
- A threshold-versus-cap explanation with the 90-cent overage.
- A real-estimate gap list and hypothetical alert owner.

## Original check 1

What does an AWS budget threshold guarantee about the final bill?

A. It does not guarantee a hard ceiling
B. The bill can never exceed it
C. All running services stop instantly
D. All taxes and fees disappear

<details><summary>Answer and reasoning</summary>

A. It does not guarantee a hard ceiling

Budget data, notifications and actions have timing and scope constraints; spending can exceed a threshold.

</details>

## Original check 2

The total is 1390 cents and the threshold is 1300 cents. What is the difference?

A. 90 cents under the threshold
B. 90 cents over the threshold
C. 1300 cents over the threshold
D. A verified AWS invoice

<details><summary>Answer and reasoning</summary>

B. 90 cents over the threshold

Subtracting the threshold from the synthetic total gives 90 cents; neither number is a real AWS charge.

</details>

## Original check 3

Why might the lowest subtotal be the wrong design?

A. Requirements never affect cost choices
B. Every omitted charge is always zero
C. It may violate required recovery, access or operational needs
D. A low subtotal proves exam readiness

<details><summary>Answer and reasoning</summary>

C. It may violate required recovery, access or operational needs

Compare designs that meet the same requirements and account for relevant omitted costs before treating price as decisive.

</details>

## Limits

No actual AWS rates, quotas, billing data, budget configuration, commitment, purchase or spend authorization is used. Synthetic arithmetic is not a quote, and budgets are not hard caps.

## Official references

- https://docs.aws.amazon.com/cost-management/latest/userguide/budgets-managing-costs.html
- https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html
