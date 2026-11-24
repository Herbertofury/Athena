# Shell pipelines and safe automation

Compose small commands, validate input and preserve failures.

## Learn

A pipeline connects the output of one process to the input of another. Text processing tools are useful for logs and configuration, but quoting, whitespace and filenames can make casual scripts unsafe.

Use dry runs and explicit paths for destructive operations. Capture exit status; a pipeline’s final command can succeed while an earlier command failed unless the shell’s error handling is deliberately configured.

Idempotence means repeating an operation produces the intended state without accumulating unwanted effects. Prefer declarative desired state, validation and rollback to sequences that assume they are run exactly once.

## Worked example

A backup script that prints “done” after a failed copy creates false confidence. Check the copy result and verify expected files or hashes before marking the backup complete.

## Practice safely

1. Create a small local CSV of fictitious hosts.
2. Filter and sort it without modifying the source.
3. Write a script that validates the input path and exits nonzero for missing input.
4. Test filenames with spaces and record exit codes.

## Check your understanding

What makes a configuration operation idempotent?

- Repeated runs converge to the same intended state
- It always runs instantly
- It never needs privileges
- It ignores errors

<details><summary>Answer and explanation</summary>

Repeated runs converge to the same intended state. Idempotence concerns repeatable state, not speed or permissions.

</details>

## Further study

- https://www.gnu.org/software/bash/manual/bash.html

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

