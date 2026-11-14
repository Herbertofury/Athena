# Make duplicate delivery safe at the business boundary

Separate receiving a message from completing and acknowledging its business effect.

## Learning goals

- Distinguish SQS buffering from SNS fanout and EventBridge routing.
- Explain the crash window between committing an effect and acknowledging delivery.
- Trace deduplication, retries and dead-letter handling without claiming exactly once.

## Learn

A queue separates the arrival of work from the availability of a worker. In an upload-processing service, the producer can record that work is waiting while consumers process at a controlled pace. Amazon SQS provides queue-based consumption; Amazon SNS provides publication and fanout; Amazon EventBridge routes events according to rules. These are different interaction patterns, and an architecture may combine them. Choose based on who must receive an event, how work is buffered and what happens when a consumer is unavailable.

Standard SQS queues can deliver a message more than once. That fact matters at the business boundary, not just in a log counter. If a consumer adds an order amount every time it sees a delivery, a retry can charge or credit twice. A stable business identifier gives the application a way to recognize that the same intended operation has already been applied. The identifier must represent the operation correctly; two legitimate purchases must not be collapsed just because their amounts match.

Consider the failure window after a worker commits its business effect but before its acknowledgment is accepted. A later delivery may carry work that already succeeded. Retrying the effect blindly is wrong, while refusing all retries can lose genuinely unfinished work. An idempotent consumer makes repeated handling converge on the intended result. In production this usually requires durable, coordinated state or an appropriate conditional transition. A process-local set in our model illustrates the idea but disappears with the process.

A retry policy also needs a stopping and investigation path. A permanently malformed or unprocessable message can otherwise consume repeated attempts and delay useful work. Dead-letter handling collects such cases for controlled diagnosis and a deliberate replay decision. It does not automatically repair the payload or establish that replay is safe. Preserve the reason, business identifier and attempt history so an operator can decide what correction is needed without silently dropping evidence of unfinished work.

The fictional ledger includes a repeated order and a failing order. Predict the total from successful unique business operations, not from the number of deliveries. Then inspect which repetition is suppressed, which message is acknowledged and which reaches the local dead-letter outcome after the configured attempt count. Keep delivery count separate from business-effect count. This distinction is a useful operational metric because a system can receive many deliveries while correctly applying only a smaller number of unique effects.

Run the fixed Python command without any queue account, network connection or real financial data. The in-memory receipt demonstrates the fixture’s duplicate suppression and retry transitions only. It does not execute SQS visibility timeouts, durable transactions, FIFO behavior or service-level acknowledgment. A real design needs an authorized test of restart persistence, concurrency races, partial failures and replay procedures. Label those remaining tests explicitly rather than converting a successful local ledger into an end-to-end exactly-once guarantee.

## Worked example

The local ledger applies 1200 cents once for order-1, suppresses and acknowledges its duplicate, and sends failing order-2 to the modeled dead-letter outcome at attempt three. These cents are synthetic business values, not payments or AWS charges.

```sh
# Local synthetic model only; no AWS calls or configuration.
python3 labs/aws-workshop/run_lab.py queues
```

Run from the workshop directory. Local Python only; no AWS credentials, calls, network or real configuration.

## Practice safely

1. Predict the total for unique successful business operations.
2. Draw the commit-before-acknowledgment crash window.
3. Run python3 labs/aws-workshop/run_lab.py queues.
4. Reconcile 1200 cents with the duplicate and dead-letter trace.
5. Explain why a process-local deduplication set is not durable production protection.
6. Specify one restart or concurrent-consumer test still needed.

## Evidence to keep

- A delivery-to-business-effect reconciliation.
- A crash-window sketch and idempotency explanation.
- A dead-letter diagnosis and untested durability checklist.

## Original check 1

A standard SQS message is delivered again after its business effect succeeded. What should protect the result?

A. An idempotent business operation using suitable durable state
B. Adding the amount again without checking
C. Assuming duplicates never happen
D. Deleting all business history

<details><summary>Answer and reasoning</summary>

A. An idempotent business operation using suitable durable state

Duplicate delivery must not repeat a completed effect; production protection needs durable coordination, not merely receipt counting.

</details>

## Original check 2

Which service pattern primarily buffers work for consumer processing?

A. An SNS fanout alone
B. An SQS queue
C. An EventBridge routing rule alone
D. A budget threshold

<details><summary>Answer and reasoning</summary>

B. An SQS queue

Queues buffer pending work for consumers; fanout and routing answer different delivery-pattern questions.

</details>

## Original check 3

What does sending a failed case to a dead-letter destination establish?

A. Its business operation succeeded
B. Its payload was automatically corrected
C. It is separated for investigation under the configured retry policy
D. Replay is always safe

<details><summary>Answer and reasoning</summary>

C. It is separated for investigation under the configured retry policy

Dead-letter handling makes persistent failure inspectable; repair and replay still require explicit reasoning.

</details>

## Limits

No SQS, SNS or EventBridge engine is executed. Deduplication is in memory, not durable or concurrency-safe production processing, and no exactly-once business guarantee is established.

## Official references

- https://docs.aws.amazon.com/decision-guides/latest/decision-guides/sns-or-sqs-or-eventbridge.html
- https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html
