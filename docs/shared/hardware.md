# Hardware, storage and failure domains

Understand the jobs of CPU, RAM, storage, firmware and peripherals.

## Learn

The CPU executes instructions; RAM holds the active working set; persistent storage retains data after power loss. A machine can be CPU-bound, memory-constrained or waiting on storage. High resource use alone does not identify the cause of latency.

Firmware initializes hardware and hands control to a bootloader. UEFI boot configuration, disk partitioning and encryption recovery material affect recovery. Changing boot or storage mode casually can make a working installation unbootable.

Safety comes first: power down appropriately, discharge static safely, follow manufacturer service instructions, and never open a power supply. Back up unique data before storage work. RAID improves selected availability properties; it is not a backup.

## Worked example

A slow machine shows sustained paging and little free RAM while CPU use is moderate. Close or measure memory-heavy processes first. An SSD may improve paging speed, but it does not make insufficient RAM disappear.

## Practice safely

1. Create an inventory of your own CPU, installed memory and storage.
2. Identify system versus data volumes without modifying them.
3. Record the supported backup and recovery procedure.
4. Explain which measurements would distinguish CPU, memory and storage bottlenecks.

## Check your understanding

Which statement about RAID is accurate?

- RAID replaces versioned backups
- RAID and backup address different failure modes
- Every RAID level tolerates disk failure
- RAID prevents accidental deletion

<details><summary>Answer and explanation</summary>

RAID and backup address different failure modes. A mirrored deletion or ransomware-encrypted file remains deleted or encrypted. Recovery needs independent backups.

</details>

## Further study

- https://learn.microsoft.com/en-us/windows/client-management/

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

