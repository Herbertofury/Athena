# Review a typed configuration diff before any API change

Use JSON and desired-state reasoning to distinguish data validation, planned changes and real REST execution.

## Learning goals

- Preserve JSON types and reject misleading comparisons.
- Explain create, update and remove operations in a desired-state diff.
- Separate HTTP semantics and dependency planning from an executed transaction.

## Learn

Network automation begins with a precise description of state, not with a loop that sends commands quickly. Desired state records the intended values; observed state records what an observation reports. A diff compares them under a declared identity and type contract. Without that contract, a renamed interface can look like a deletion and creation, or a string containing digits can be accepted where a number was required. The local exercise reads fixed JSON-shaped data and produces a plan without contacting any device or controller.

JSON distinguishes objects, arrays, strings, numbers, booleans and null. Object member names are strings, but their values need not be. The number 20 and the string “20” should not become equivalent merely because printing them looks similar. Likewise a boolean is not a VLAN number even if a programming language happens to allow arithmetic with it. Validation should reject invalid shapes and types before computing changes. Keep missing fields distinct from intentionally empty or null values when the contract assigns them different meanings.

A desired-state comparison uses stable identifiers to match records. An identifier present only in desired state implies creation under this model; one present only in observed state implies removal; shared identifiers require field comparison. An unchanged field should not appear as an update simply because another field changed. This granularity makes review safer and explains the scope of each proposed action. Removal is a consequential real-world operation, so a printed plan must not be mistaken for permission to delete an actual interface or service.

REST-oriented APIs expose resources and use HTTP methods with defined semantics. GET retrieves a representation, while other methods can create, replace, modify or remove resources according to the API contract. Idempotence describes the intended effect of repeating an identical request, not a guarantee of identical response codes or zero side effects in logging. Authentication, authorization, pagination, asynchronous completion and concurrency controls also matter. The fixed diff exercise sends no HTTP requests, obtains no tokens and does not validate a controller's particular endpoint behavior.

Dependencies constrain execution order even when individual changes look correct. A new upstream object may need to exist before a dependent object can reference it. A successful topological ordering only shows that the supplied dependency graph has a usable order; it does not ensure atomicity, rollback or idempotent recovery after partial failure. Good plans record preconditions, expected observations and failure handling. They also avoid blind retries after uncertain outcomes, because repeating a creation can produce duplicate resources when the service does not provide an appropriate idempotency mechanism.

Run the fixed automation exercise and explain each create, update and remove entry using its stable identifier and exact changed fields. For a paper counterfactual, change a numeric VLAN to a string and state why validation should reject it instead of silently coercing it. Then sketch a dependency-aware review plan with explicit stop points for uncertain outcomes. Label all API actions unexecuted. The resulting receipt is a typed comparison of supplied records, not a device backup, a controller transaction or evidence that configuration drift has been repaired.

## Worked example

The changes list contains an update for desk with fields [vlan, description], a remove for retired and a create for uplink. desired_dependency_order is [uplink, desk], while applied is false. The change list is a diff, not an execution sequence; creation of the desired dependency belongs before a dependent update in a future reviewed plan. For desk, vlan changes from 10 to 20 and description changes from Old desk to New desk; enabled stays true. Stable identifiers show that retired is not a renamed uplink. On paper, replace a numeric VLAN with the string containing the same digits and identify the type violation before planning changes. No API request, deletion or repair is performed, and the dependency order supplies no atomic rollback guarantee.

```sh
# Fixed offline reasoning model, not a router or emulator.
python3 -B labs/ccna-workshop/run_lab.py automation
```

Run from the workshop directory. Local Python only; no equipment, credentials, packets or real configuration.

## Practice safely

1. Read the automation fixture and the model contract; write an input-by-input prediction before executing.
2. Draw the decision sequence described in this lesson and mark the observations the model cannot supply.
3. From the workshop directory, run python3 -B labs/ccna-workshop/run_lab.py automation.
4. Compare every worked-example field with the receipt. Preserve mismatches and explain them rather than editing the receipt.
5. Work the named counterfactual on paper only. Record which input changes and which conclusion would need recomputing.
6. Keep the three evidence items, your actual receipt and an explicit list of unperformed equipment checks.

## Evidence to keep

- A typed observed/desired diff tied to stable record identifiers.
- A dependency order with preconditions and unexecuted recovery steps.
- A paper wrong-type counterfactual and HTTP-method semantics explanation.

## Original check 1

Why distinguish numeric 20 from string “20” in a configuration contract?

A. They have different JSON types and may mean different valid inputs
B. JSON has no types
C. Strings always configure VLANs faster
D. Any equal-looking text is automatically equivalent

<details><summary>Answer and reasoning</summary>

A. They have different JSON types and may mean different valid inputs

Type validation prevents silent coercion from hiding invalid or unintended configuration.

</details>

## Original check 2

A diff says remove retired. What has happened?

A. A switch port was deleted
B. A removal was planned in the model, not executed on a device
C. An HTTP DELETE succeeded
D. A controller granted authorization

<details><summary>Answer and reasoning</summary>

B. A removal was planned in the model, not executed on a device

The local comparison emits planned changes without contacting an API, so it provides no evidence of deletion or configuration repair.

</details>

## Original check 3

What does idempotent HTTP semantics mean?

A. Every response is identical
B. Every failed request can be retried blindly
C. Repeating an identical request has the same intended effect as one request
D. No server logs are written

<details><summary>Answer and reasoning</summary>

C. Repeating an identical request has the same intended effect as one request

Idempotence concerns intended effect; uncertain outcomes and API-specific contracts still require care.

</details>

## Limits

No HTTP, controller access, credentials, configuration changes or retries occur. The diff omits platform schemas, transactions, authentication, concurrency and API-specific error or idempotency behavior.

## Official references

- https://developer.cisco.com/docs/catalyst-center/2-3-7-9/getting-started/
- https://www.cisco.com/c/en/us/td/docs/routers/csr1000/software/restapi/restapi/RESTAPIintro.html
- https://www.cisco.com/c/en/us/td/docs/routers/csr1000/software/restapi/restapi/RESTAPIclient.html
- https://www.rfc-editor.org/rfc/rfc8259.html
- https://www.rfc-editor.org/rfc/rfc9110.html
