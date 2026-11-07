# Know the system before changing it

Turn an administration request into an inventory, a hypothesis and a reversible test.

## Learning goals

- Separate desired state, observed state and user outcome.
- Identify the configuration, runtime and data layers.
- Write a bounded change plan with a stop condition.

## Learn

A system is more than the box or app name. It includes hardware or virtual resources, an operating system, running processes, configuration, persistent data and the people depending on its behavior. Start with the useful task. Our fictional tool, Cedar Queue, records repair jobs and produces a daily work list. A healthy process is useful only if that workflow succeeds.

Inventory the details that can change your reasoning: operating-system family and version, application version, data location, configuration location, launch method, resource limits and important dependencies. Keep observation separate from intention. A document saying “version 2” does not prove the running process loaded version 2. A service configured for automatic startup can still be stopped or failed.

Distinguish three kinds of state. Configuration describes intended settings; runtime state describes what a process is doing now; durable data must remain available after it stops. Editing a configuration file may require reload or restart before it changes behavior. Restarting a process does not necessarily repair a bad configuration or recover damaged data.

Convert “make it faster” or “fix the service” into measurable acceptance criteria. For Cedar Queue, one criterion is that submitting a synthetic work order produces exactly one saved record and that reopening the database shows it. Another is that malformed configuration is rejected without replacing the last known good file. A screenshot of a green indicator is weaker evidence than either test.

Before a change, record the current symptom, scope, recent changes, candidate causes and one low-risk observation that distinguishes them. Plan the owner, allowed target, expected effect, stop condition, rollback and verification. If the system is remote, a change that breaks your only access path may make recovery harder than the original problem.

This workshop does not discover or modify your real services. The inventory and incidents are invented. Commands that really execute create their own temporary files or their own child process. Keep all existing applications, accounts, boot settings, disks and network settings outside the lab. A small controlled experiment can teach a general principle without pretending to be a complete operating-system lab.

## Worked example

Cedar Queue’s supplied record says the configured worker count changed from 2 to 20. Its operator reports a larger backlog, but the only log says a new configuration was rejected and the last good settings remain active. Do not assume 20 workers are running. Check the effective configuration and relevant runtime evidence first. A proposed rollback should identify the actual active state, not blindly rewrite a file based on the intended change.

## Practice safely

1. Open the supplied case JSON and mark every field as configuration, runtime, durable data or user outcome.
2. Write one acceptance criterion for successful work and one for a rejected change.
3. List three possible causes of a growing queue without choosing one prematurely.
4. Choose a discriminating observation and explain what each possible result would mean.
5. Write a rollback trigger and the exact evidence required before calling the system healthy.
6. Keep the plan on paper; do not inspect private logs or stop a real service.

## Evidence to keep

- A four-layer inventory of the invented system.
- Two concrete acceptance criteria.
- A change record with owner, stop condition, rollback and verification.

## Original check 1

A file says workers=20, but the process reports that it retained workers=2 after validation failed. Which value describes effective runtime configuration?

- 20 because the newest file always wins
- Neither value can ever be known
- 2 according to the supplied runtime evidence
- The number of CPU cores by definition

<details><summary>Answer and explanation</summary>

2 according to the supplied runtime evidence. The intended file and accepted runtime state differ. The supplied observation says the process retained 2.

</details>

## Original check 2

Which acceptance criterion best verifies durable work?

- The window opened
- The saved record remains correct after closing and reopening the data store
- A success message appeared once
- The service has an attractive icon

<details><summary>Answer and explanation</summary>

The saved record remains correct after closing and reopening the data store. Reopening checks a meaningful persistence boundary. A UI or process signal alone does not prove the record was saved.

</details>

## Original check 3

What belongs in a safe change plan?

- Only the new setting
- A promise that failure is impossible
- A stop condition and feasible rollback with verification
- Permission to change every nearby system

<details><summary>Answer and explanation</summary>

A stop condition and feasible rollback with verification. Boundaries and recovery decisions should be explicit before the change.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

This is planning against synthetic evidence, not an inventory, repair or performance measurement of the learner’s device.

## Official references

- [Microsoft Win32 SERVICE_STATUS: service states](https://learn.microsoft.com/en-us/windows/win32/api/winsvc/ns-winsvc-service_status)

- [Python 3.12 sqlite3: transactions, connection and backup APIs](https://docs.python.org/3.12/library/sqlite3.html)

