# Start work, prove readiness, stop cleanly

Observe a child process you own instead of treating “running” as “working.”

## Learning goals

- Distinguish process existence, readiness and useful work.
- Interpret output, error output and exit status separately.
- Use a bounded lifecycle without touching other processes.

## Learn

A process is a running program with execution state and resources. A process identifier is a handle for observation, not a permanent identity or proof of health. A process can exist while waiting, failing repeatedly or unable to serve useful work. A service manager adds lifecycle supervision and policy, but different managers define states and readiness differently.

Separate three questions: did the program launch, did it declare itself ready under its protocol, and did an intended operation succeed? A child printing READY in this lab is one protocol signal. A PING request receiving PONG is a second observation. Neither proves that an unrelated web service, database or operating-system service is healthy.

Standard input, standard output and standard error are communication channels. An exit code conveys a program-defined result; zero conventionally indicates success, but you still need to know the contract. Warnings on standard error do not universally mean failure, and empty output does not universally mean success. Read the combination of protocol, result and context.

Use an explicit argument list rather than constructing a shell command from data. Arguments containing spaces remain one argument when passed correctly. The lab starts the same Python interpreter with a fixed embedded program and isolated mode. It does not accept arbitrary commands, inherit the parent’s credentials through a copied environment, or invoke a shell.

A graceful stop gives a program the opportunity to finish its protocol and close resources. A timeout means a deadline was exceeded, not that cleanup completed by itself. Our supervisor retains only the handle of the child it created, asks it to stop, and if necessary kills and waits for that same child. It never finds or stops unrelated processes by name or PID.

The command runs three bounded cases: a normal READY/PONG/BYE exchange, a deliberately rejected request with a nonzero status, and an owned child that waits too long and is terminated. The timeout is a safety bound, not a benchmark. Operating-system process creation can itself have delays, so do not claim a strict real-time deadline from this teaching wrapper.

## Worked example

In the normal case, the child announces READY, accepts PING, returns PONG, accepts STOP and returns BYE before exiting with status 0. The parent records the child’s state before sending commands and verifies it has been reaped afterward. The failure case exits 7 with an explicit message; 7 is a convention of this tiny program, not a universal OS error. The timeout case proves cleanup of the owned child, not safe termination of arbitrary production services.

## Practice safely

1. Predict the normal response sequence, failure status and timeout cleanup.
2. Run python3 labs/systems-workshop/offline_lab.py process.
3. Identify launch, readiness, application response and final process status in the result.
4. Explain why the supplied status 7 needs the child program’s contract.
5. Explain why killing a same-named real application would be outside this exercise.
6. Record that readiness uses a local pipe protocol, not a network endpoint or installed service.

## Evidence to keep

- Actual outputs and exit statuses for three child cases.
- The distinction between readiness and one successful request.
- A cleanup receipt limited to owned children.

## Original check 1

A process exists but its work request fails. Which conclusion is justified?

- Process existence does not establish application readiness or useful work
- The operating system cannot run processes
- All dependencies are healthy
- The process identifier is an authentication credential

<details><summary>Answer and explanation</summary>

Process existence does not establish application readiness or useful work. Different health layers need different evidence.

</details>

## Original check 2

Why does the wrapper keep its own child handle?

- To terminate any process with the same name
- To avoid collecting exit status
- To grant itself administrator access
- To manage only the exact process it created

<details><summary>Answer and explanation</summary>

To manage only the exact process it created. Ownership and an exact handle keep cleanup inside the lab’s scope.

</details>

## Original check 3

A timeout is reported. What must a supervisor still establish?

- That the owned child was stopped/reaped as intended
- That every process on the machine stopped
- That no user data exists
- That all future requests will succeed

<details><summary>Answer and explanation</summary>

That the owned child was stopped/reaped as intended. A timeout alone is not a cleanup receipt. The wrapper must handle and verify its own child lifecycle.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

No systemd unit, Windows service, daemon, login session or external process is created or modified. The pipe protocol is a teaching fixture.

## Official references

- [Python 3.12 subprocess: communication, timeouts and process lifecycle](https://docs.python.org/3.12/library/subprocess.html)

- [Microsoft Win32 SERVICE_STATUS: service states](https://learn.microsoft.com/en-us/windows/win32/api/winsvc/ns-winsvc-service_status)

