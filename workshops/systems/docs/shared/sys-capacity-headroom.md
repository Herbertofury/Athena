# Budget storage without mixing units

Calculate safe headroom and distinguish byte capacity from other limits.

**Study time:** about 45 minutes, with pauses for prediction and practice.

## You will learn to

- Calculate binary and decimal storage units accurately.
- Reserve capacity for temporary work and operating margin.
- Recognize that enough bytes is not every resource requirement.

## Learn

Capacity planning starts with units. A gigabyte in decimal notation is one billion bytes; a gibibyte is 2 to the power of 30 bytes. Interfaces do not always label their units consistently. Keep calculations in explicit bytes and convert only for presentation. A percentage without a denominator and measurement time is hard to interpret.

A task often needs more than its final output size. An update might require a downloaded package, an expanded staging copy, temporary index files and the old version kept for rollback. Reserve a stated operating margin as well. Otherwise a task that nominally fits can consume the space needed for logs, temporary files or recovery.

Filesystem capacity and the total sizes of visible files are different measurements. Metadata, reserved blocks, compression, sparse allocation, snapshots and open-but-unlinked files can affect interpretation, depending on the platform and filesystem. Do not invent a single universal explanation when two tools disagree. First compare scope, units, permissions and timing.

On filesystems with a finite inode pool, many tiny files can exhaust that resource while byte capacity remains. Quotas and per-process limits can also stop a write. A write error should be investigated from its actual error and relevant resource evidence. “Free space exists” does not mean that every kind of write must succeed.

The synthetic planning rule is intentionally narrow: available bytes must cover expected new data, temporary peak and a fixed reserve. Separately, available file slots must cover expected new files. These are planning assumptions, not a guarantee about actual allocation, concurrent writers, compression or quota enforcement.

Do not free real storage by deleting unknown files during this exercise. The capacity command performs integer arithmetic on bundled invented values. It does not enumerate your disk, inspect personal filenames, resize partitions or fill a filesystem. The answer should name both the limiting resource and the missing operational evidence.

## Worked example

The fictional volume has 10 GiB capacity and 7 GiB in use, leaving 3 GiB. A job needs 1 GiB final output, 1.5 GiB temporary peak and a 1 GiB reserve, totaling 3.5 GiB. It therefore lacks 0.5 GiB under this plan. A second case has enough bytes but only 5 free file slots for 20 expected files. Neither case should be “fixed” by silently discarding the reserve or deleting unrelated files.

## Practice safely

1. Calculate the two cases by hand in bytes and GiB.
2. Run python3 labs/systems-workshop/offline_lab.py capacity.
3. Identify the byte shortfall and file-slot shortfall separately.
4. Describe two assumptions that could invalidate the simple plan.
5. Write a safe next investigation rather than a deletion command.
6. State why a decimal GB display and a binary GiB display can differ without either losing data.

Use the [offline lab guide](../../labs/systems-workshop/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

A plan has 3 GiB available and needs 3.5 GiB including reserve. What is the result?

A. It fits because final output is only 1 GiB
B. A 0.5 GiB shortfall under the stated plan
C. The disk is necessarily damaged
D. The reserve should silently become zero

<details><summary>Answer and reasoning</summary>

B. A 0.5 GiB shortfall under the stated plan. The full peak and reserve matter, not just the final output.

</details>

### Check 2

Many tiny files exhaust a finite file-slot/inode resource. What can still be true?

A. All writes must succeed
B. There are no filesystem limits
C. Byte capacity remains available
D. Every filesystem uses the same inode design

<details><summary>Answer and reasoning</summary>

C. Byte capacity remains available. Different resources can reach their limits independently. Filesystem details vary.

</details>

### Check 3

Which capacity claim is most useful?

A. The disk is big
B. 40 percent, with no context
C. A screenshot with unlabeled units
D. Available bytes at a stated time, planned peak and an explicit reserve

<details><summary>Answer and reasoning</summary>

D. Available bytes at a stated time, planned peak and an explicit reserve. A decision needs measured scope and stated assumptions.

</details>

## Evidence to keep

- Two unit-correct capacity calculations.
- Resource-specific shortages and assumptions.
- A non-destructive next-observation plan.

## Limits

This is arithmetic on synthetic data, not a disk measurement, quota test, filesystem benchmark or storage-resizing lab.

## Official references

- https://docs.python.org/3.12/library/os.html
- https://docs.python.org/3.12/library/pathlib.html
