# SELinux, firewall and service confinement

Diagnose layered access controls without disabling them.

## Learn

Linux discretionary permissions are only one layer. SELinux labels and policy can deny operations that mode bits allow. Inspect relevant audit records and contexts before proposing a change.

Firewall configuration should expose only required traffic. A listening process, a firewall rule and a route are separate conditions. Persisted and runtime configuration can differ.

Fix the intended policy or labeling using supported methods rather than disabling enforcement globally. Validate the application and ensure the change remains correct after restart.

## Worked example

A web server cannot read content with apparently correct Unix permissions. Check the content’s SELinux context and the service policy before granting broad filesystem access.

## Practice safely

1. Read SELinux status and contexts in a disposable lab.
2. Inspect a sample denial and identify source/target types.
3. List required service ports.
4. Write a targeted validation and rollback plan.

## Check your understanding

What is the safest response to a suspected SELinux denial?

- Disable SELinux permanently
- Inspect audit evidence and labels, then apply a targeted supported fix
- chmod -R 777 /
- Run the service as root without review

<details><summary>Answer and explanation</summary>

Inspect audit evidence and labels, then apply a targeted supported fix. Layered controls should be diagnosed and repaired, not removed wholesale.

</details>

## Further study

- https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/using_selinux/

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

