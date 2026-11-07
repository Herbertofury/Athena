# Files, identities and least privilege

Use ownership and permissions without granting broad access.

## Learn

Linux files have an owner, group and mode bits. Read, write and execute mean different things on files and directories: directory execute permits traversal; directory write controls entry creation/removal, subject to additional rules.

Permissions should follow the task and identity. Give a service only the paths and operations it needs. ACLs, SELinux or other mandatory controls can further restrict access even when simple mode bits appear permissive.

Never fix a permission error by recursively making everything writable. Inspect path traversal, identity, ownership, mount state and policy logs. Secrets and state files must not become world-readable merely to make a test pass.

## Worked example

Mode 640 on a regular file gives the owner read/write, the group read, and others no access. It does not grant execute. A parent directory without traversal permission can still block access.

## Practice safely

1. Create files only inside a disposable lab directory.
2. Use ls -l and stat to record modes and owners.
3. Apply chmod 640 to a non-secret test file.
4. Explain why a parent directory can prevent access.

## Check your understanding

What does mode 750 grant to the group on a regular file?

- Read and write
- Write only
- All permissions
- Read and execute

<details><summary>Answer and explanation</summary>

Read and execute. 7=read/write/execute, 5=read/execute and 0=none.

</details>

## Further study

- https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

