# Operating systems, processes and services

Reason about processes, threads, permissions and service lifecycle.

## Learn

An operating system schedules work, manages memory, mediates device access and enforces isolation. A process has an address space and security identity; threads share process resources. More threads do not guarantee more throughput when work is serialized or contended.

A service is long-lived work managed by the OS. On systemd-based Linux, inspect units with systemctl and logs with journalctl. On Windows, use supported service and event-log tools. Separate configured startup behavior from the service’s current state.

Before stopping a process, understand its owner, dependencies and data writes. A graceful stop allows cleanup; forced termination may leave incomplete work. Record the change and confirm recovery after restart.

## Worked example

A web service is enabled but inactive. Enabled describes boot behavior; it does not prove the process is currently running. Inspect status and logs, then determine why it exited.

## Practice safely

1. In a disposable Linux VM, inspect systemctl status for a harmless service.
2. Read its latest journal messages.
3. Distinguish PID, exit status, unit enabled state and current state.
4. Do not stop production or unfamiliar services.

## Check your understanding

A Linux unit is enabled but failed. What does enabled tell you?

- It is healthy
- It has no dependencies
- It is configured for activation through its enablement links
- Its last exit was successful

<details><summary>Answer and explanation</summary>

It is configured for activation through its enablement links. Enablement and runtime health are separate states.

</details>

## Further study

- https://www.freedesktop.org/software/systemd/man/latest/systemctl.html

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

