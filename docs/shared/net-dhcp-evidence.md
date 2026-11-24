# Diagnose configuration and lease failures

Read an address configuration as a set of linked claims.

## Learn

An IPv4 client needs appropriate configuration, not merely any address. The address, prefix, route/gateway and resolver must be suitable for the intended network. DHCP can supply configuration through a lease; static configuration can be valid too.

For a new DHCPv4 lease, the familiar Discover, Offer, Request and Acknowledgment sequence is a useful starting model. Renewal and rebinding follow different paths. The server’s acknowledgment is not proof that a remote application is available.

A relay can carry DHCP traffic between client and server networks. If one segment fails while others work, the local VLAN, relay, pool and path are useful places to compare. Do not immediately restart every DHCP service or release a working lease on a machine you rely on for remote access.

A self-assigned IPv4 link-local address is a clue about the current configuration process, not proof of one precise server failure. Possible causes include link issues, wrong network membership, policy, missing relay, exhausted pool or no usable response. Confirm the operating system’s actual behavior and logs.

Use a known-good comparison from the same intended segment. Record whether the interface is connected, the configuration source, address/prefix, default route, resolver and lease times when available. Never paste real hardware identifiers, internal topology or user data into a public learning repository.

## Worked example

In a synthetic lab, device A has 10.20.30.10/24, gateway 10.20.30.1 and the expected resolver. Device B on the intended same segment reports 169.254.5.9/16 and no default route. Inspect link/VLAN and DHCP exchange evidence for B. The observation does not prove that the whole internet or all DHCP servers are down.

## Practice safely

1. Compare the two synthetic configurations field by field.
2. List three distinct hypotheses that could produce B’s observation.
3. Choose a low-risk observation that distinguishes two hypotheses.
4. Write why lease release is a bad first action during a remote support session.
5. Draft a concise escalation containing time, scope and missing evidence.

## Check your understanding

What is the safest useful next step for the synthetic device B?

- Inspect link, intended network membership and DHCP exchange evidence
- Delete every DHCP lease
- Turn off endpoint protection
- Assume DNS alone caused the missing default route

<details><summary>Answer and explanation</summary>

Inspect link, intended network membership and DHCP exchange evidence. The configuration difference warrants investigation of acquisition and local path. It does not justify destructive broad changes or establish a single cause.

</details>

## Further study

- https://www.rfc-editor.org/rfc/rfc2131
- https://www.rfc-editor.org/rfc/rfc3927

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

