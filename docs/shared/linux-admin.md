# Linux boot, packages and system administration

Operate a system reproducibly and preserve recoverability.

## Learn

Know the boot chain, service manager, package manager, filesystems and network configuration of the target distribution. Commands and defaults differ across versions; RHCSA preparation must match its current RHEL release.

Use package repositories and verified package metadata rather than arbitrary scripts. Inspect dependencies and service changes. Manage users, scheduled tasks, logs and time synchronization as connected operational responsibilities.

Practice recovery in a disposable VM with snapshots and tested backups. Storage resizing, boot changes and firewall changes can lock you out; a lab should have an out-of-band recovery path.

## Worked example

A filesystem is full while the disk has unused capacity. You must distinguish partition, physical volume, logical volume and filesystem sizes before choosing a supported expansion sequence.

## Practice safely

1. In a disposable RHEL-compatible training environment, inventory storage layers.
2. Inspect services and logs.
3. Create a nonprivileged lab user.
4. Document backup/rollback before any storage exercise.

## Check your understanding

Why distinguish block-device and filesystem size?

- Expanding one layer may not expand the others
- They are always identical
- Filesystems cannot be resized
- Only RAM affects disk capacity

<details><summary>Answer and explanation</summary>

Expanding one layer may not expand the others. Storage stacks have multiple independently managed layers.

</details>

## Further study

- https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

