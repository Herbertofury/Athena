# Treat missing telemetry as uncertainty, not health

Interpret metrics and logs with collection scope, time windows and missing-data limits.

## Learning goals

- Distinguish platform activity from application telemetry.
- Evaluate threshold equality and incomplete windows explicitly.
- Build an investigation record that separates observation from inference.

## Learn

A monitoring chart is evidence produced by a collection system, not a direct view of everything a workload experiences. Azure Monitor brings together monitoring capabilities for metrics, logs and related signals. Administrators still need to know what is collected, where it is stored and which time period a query describes. A quiet chart can mean low activity, a healthy service, a broken collection path or an incorrect query. Those explanations require different checks before the team can conclude that users are unaffected.

Metrics are numeric measurements over time; logs provide records that can contain richer event context. Traces help connect work across components when instrumentation supports them. The Azure Activity Log describes subscription-level platform events such as resource-management operations, not every application request or every data access. Resource logs often require diagnostic configuration for collection and routing. Do not assume that creating a resource automatically places all useful evidence in the intended workspace with the desired retention and permissions.

An alert depends on its scope, signal, aggregation, evaluation period and comparison operator. A threshold of greater than eighty-five differs from greater than or equal to eighty-five. Mean values can hide brief spikes, and different time windows can produce different interpretations of the same raw samples. State the exact rule before reporting a breach. An alert can notify or trigger configured actions, but the existence of a rule does not prove that recipients receive notifications or that a response procedure is effective.

Missing samples deserve their own state. If an exercise expects three observations and receives two, treating the two observed values as a complete window can produce unjustified reassurance. Retain the observed count and expected count along with any computed mean. Investigate collection and timing before interpreting an incomplete low average as healthy behavior. In real systems, signal-specific missing-data behavior varies; our explicit insufficient-data label is a teaching choice that makes uncertainty visible rather than a universal Azure alert implementation.

The fixed monitoring windows illustrate three distinct outcomes: a complete mean of ninety breaches a strict threshold of eighty-five, an incomplete window with mean twenty-five is insufficient data, and a complete mean of eighty-five stays within that strict threshold. These numbers do not measure an Azure service. They are deliberately chosen to require reasoning about completeness and boundary equality. A correct report preserves all three conclusions rather than selecting the reassuring values or treating every nonbreach result as operational success.

Run the monitoring command and create a brief incident note listing observations, possible causes and the next discriminating checks. On paper, consider what would change if the rule used an inclusive comparison, without claiming the fixed command executed that version. Include the missing collection context before offering a cause. This operational analysis is enrichment beyond foundational monitoring recognition. No diagnostic setting, workspace, query, alert or notification is created, and no real application health or service-level objective is validated by the resulting receipt.

## Worked example

Read windows in the returned order: breach has mean 90; insufficient_data has mean 25 with observed_count 2 and expected_count 3; within_threshold has mean 85. Explain why the incomplete low average cannot be reported as healthy. In a paper alternative, change the comparison from strictly greater than 85 to greater than or equal to 85: the equality window would change classification, but the missing-sample problem would remain. Keep this counterfactual separate from the actual receipt.

```sh
# Offline synthetic model only; no Azure operations.
python3 labs/azure-workshop/run_lab.py monitoring
```

Run from the workshop directory. Local Python only; no Azure credentials, calls, network or real configuration.

## Practice safely

1. Read the fixed monitoring fixture and write your prediction before running anything.
2. Draw the decision boundary and list the Azure conditions this local model omits.
3. From the workshop directory run python3 labs/azure-workshop/run_lab.py monitoring.
4. Compare the receipt with your prediction and retain disagreements rather than editing evidence.
5. Work the alternative in the example on paper only; label it unexecuted.
6. Save the receipt and the three evidence items, with a list of unperformed real Azure validations.

## Evidence to keep

- A window table retaining counts, mean and exact threshold semantics.
- An incident note separating observations from hypotheses.
- A paper inclusive-threshold alternative and unperformed collection checks.

## Original check 1

Two of three expected samples produce a low mean. What should the report say?

A. The service is definitely healthy
B. The missing sample must be zero
C. The window is incomplete and cannot justify a complete-window health conclusion
D. The threshold should be silently lowered

<details><summary>Answer and reasoning</summary>

C. The window is incomplete and cannot justify a complete-window health conclusion

Completeness is part of the evidence; missing values cannot be invented.

</details>

## Original check 2

What does the Azure Activity Log primarily describe?

A. Every application trace automatically
B. All blob contents
C. Only CPU measurements
D. Platform-level resource-management activity

<details><summary>Answer and reasoning</summary>

D. Platform-level resource-management activity

Activity records and application/data-plane telemetry are distinct sources.

</details>

## Original check 3

A complete mean equals 85 under a strict greater-than-85 rule. What follows?

A. It does not breach that exact comparison
B. It always breaches
C. The sample is missing
D. The threshold is irrelevant

<details><summary>Answer and reasoning</summary>

A. It does not breach that exact comparison

Equality does not satisfy a strict greater-than comparison.

</details>

## Limits

No Azure Monitor ingestion, diagnostic setting, alert delivery or live query occurs. Synthetic window labels do not reproduce every Azure alert missing-data or aggregation behavior.

## Official references

- https://learn.microsoft.com/en-us/azure/azure-monitor/fundamentals/overview
- https://learn.microsoft.com/en-us/azure/azure-monitor/fundamentals/activity-log
- https://learn.microsoft.com/en-us/azure/azure-monitor/data-collection/diagnostic-settings
