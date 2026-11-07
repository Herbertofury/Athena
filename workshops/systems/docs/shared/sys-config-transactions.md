# Validate a change before making it active

Practice dry run, exact schema validation, replacement and rollback on disposable files.

**Study time:** about 45 minutes, with pauses for prediction and practice.

## You will learn to

- Separate parsing, schema validation and operational suitability.
- Explain idempotence and single-file atomic replacement.
- Preserve last-good configuration when validation or staging fails.

## Learn

A configuration file can be valid JSON yet invalid for an application. Parsing checks representation; schema validation checks allowed fields, types and ranges; operational validation checks whether the settings make sense for this deployment. These are separate gates. A worker count of 100000 may parse correctly and still be outside a safe supported range.

Be precise about types. In Python a boolean is related to integers, but a setting that expects an integer count should not silently accept true as one worker. Unknown keys can hide spelling mistakes. Duplicate keys can make two readers disagree about the effective value. Our bounded parser rejects duplicate keys, unknown fields, booleans where integers are required and values outside its documented ranges.

A dry run should describe the proposed difference without changing active state. An idempotent operation recognizes when the desired state is already present and performs no unnecessary rewrite. This avoids misleading change logs and repeated side effects. It does not mean the operation is automatically correct, safe under concurrency or free of cost.

For a single file, write validated candidate bytes to a separate file in the same temporary directory, flush them, then replace the active name. Under the platform’s supported semantics this avoids readers seeing a partially written destination. Atomic replacement and crash durability are not identical: filesystem behavior, directory synchronization, storage and concurrent writers need deeper treatment.

Preserve a last-good copy and define what rollback means. A syntactically valid but unsuitable setting can still require reverting after an application check. Rolling back configuration is different from rolling back a data migration or an external side effect. Never assume that copying an old file undoes every consequence of a real change.

The config command uses only a new temporary directory. It proves that a dry run leaves bytes unchanged, an invalid candidate is rejected, a simulated failure before replacement preserves the active file, a valid change takes effect, a repeated identical request is a no-op and a deliberate rollback restores the prior setting. It does not change any system or application configuration outside that directory.

## Worked example

Last-good configuration is workers=2 and queue_limit=20. The desired state is workers=4 and queue_limit=40. A typo workers_count is rejected rather than ignored, and workers=true is rejected rather than treated as 1. The interruption is injected after staging but before replacement, so the old active bytes must remain. After a valid update, the second identical application returns changed=false. The final rollback restores exactly the original logical settings.

## Practice safely

1. Predict every state transition before running the config command.
2. Run python3 labs/systems-workshop/offline_lab.py config.
3. Check dry-run, invalid-input, interrupted-stage, applied, repeated and rollback results.
4. Explain what the injected failure actually exercises and what a real power loss would add.
5. Write one application-level validation missing from the file-only experiment.
6. Never replace a real configuration or add a user-supplied output path to this lab.

Use the [offline lab guide](../../labs/systems-workshop/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

Why reject workers=true when workers expects an integer count?

A. The schema should not silently treat a boolean as a count
B. True is not text
C. JSON cannot contain booleans
D. Every boolean is malicious

<details><summary>Answer and reasoning</summary>

A. The schema should not silently treat a boolean as a count. Exact type validation prevents unintended coercion.

</details>

### Check 2

What does a no-op result on a repeated identical configuration demonstrate?

A. The whole system is crash-proof
B. The chosen operation is idempotent in this tested state
C. Every external side effect was undone
D. No validation is needed

<details><summary>Answer and reasoning</summary>

B. The chosen operation is idempotent in this tested state. The test demonstrates a bounded repeat behavior, not every reliability property.

</details>

### Check 3

Atomic replacement of one file proves what about a multi-file migration?

A. Every file commits together
B. All rollback is automatic
C. Nothing by itself about multi-file transaction atomicity
D. The database schema is compatible

<details><summary>Answer and reasoning</summary>

C. Nothing by itself about multi-file transaction atomicity. A single-file primitive does not create a transaction across unrelated resources.

</details>

## Evidence to keep

- Actual six-stage configuration receipt.
- Exact rejection reasons and last-good preservation.
- Clear distinction between atomic visibility, crash durability and application correctness.

## Limits

No concurrency stress, forced power loss, directory fsync guarantee, multi-file transaction or real service reload is tested.

## Official references

- https://docs.python.org/3.12/library/json.html
- https://docs.python.org/3.12/library/os.html
- https://docs.python.org/3.12/library/tempfile.html
