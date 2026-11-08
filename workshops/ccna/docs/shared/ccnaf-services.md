# Keep ordered policy separate from address translation

Trace first-match ACL decisions and static NAT facts while distinguishing DNS, DHCP and time-service evidence.

## Learning goals

- Evaluate an ordered access list without skipping an earlier match.
- Separate static NAT address mapping from permission and delivery.
- Identify the distinct service evidence needed for names, leases and time.

## Learn

A network service can fail even when addressing and routes appear plausible. Policy, translation, names, dynamic configuration and time each answer different questions along the path. Combining them into a single statement such as “the network is working” hides important uncertainty. This exercise focuses its executable portion on two bounded decisions: an ordered packet-filter rule list and an independent static address mapping. The surrounding worksheet asks which DNS, DHCP and NTP evidence would still be needed before diagnosing an actual application failure.

An access control list is evaluated in order. The first matching entry determines the action; a later permit cannot rescue traffic already matched by an earlier deny. Standard and extended IPv4 ACLs offer different matching capabilities, and placement and direction matter when applying policy. Real Cisco configuration also includes details such as wildcard-mask interpretation that the local explicit-network model does not reproduce. Write the packet's source, destination, protocol and ports beside each candidate rule and stop at the first applicable match.

A static NAT mapping associates addresses across a translation boundary. It is not an authorization rule and does not by itself prove that a connection can be established. The translated address may still be unreachable, policy may deny the traffic or a return path may be missing. Dynamic NAT and PAT introduce additional pool, port and state considerations outside this fixed exercise. Keep the packet-filter verdict and mapping evidence in different columns so a visible public address is not mistaken for a permit decision.

DNS associates names with records and requires its own evidence, such as the queried name, record type, responding server and actual response. DHCP supplies leased configuration through a separate exchange; a relay forwards relevant messages between client and server networks when configured. A valid lease does not ensure correct DNS data or application service. NTP supports clock synchronization, which helps correlate logs and can matter for authentication. An unsynchronized timestamp can make two correct log entries appear to describe the wrong sequence.

Consider a host explicitly denied before a broader HTTPS permit. The later permit looks reassuring when viewed alone, but ordered evaluation retains the deny. An independent static translation for that host does not contradict the policy result because the mechanisms answer different questions. A good investigation record identifies the exact matched rule, the mapping if present and the untested operational dependencies. It does not invent a DNS lookup, lease renewal or synchronized clock merely because the fixture contains recognizable addresses and service names.

Run the fixed services exercise and explain both outputs without merging them into a delivery verdict. In the paper counterfactual, move the host-specific rule after the broad permit and recompute first-match behavior, marking the policy consequence clearly. Do not apply that change anywhere. Add a proposed evidence request for DNS, DHCP and time, each tied to a specific uncertainty. This bounded model sends no traffic, changes no ACL or NAT table and confirms neither a live lease nor a synchronized device clock.

## Worked example

The packet matches blockHost before the later HTTPS permit. The result is acl_decision deny, matched_rule blockHost and implicit_deny false: an explicit rule caused this result. source_mapping_if_applied is 203.0.113.9, while translation_executed is false. These outputs are independent evidence questions and do not specify a device’s NAT-versus-ACL processing order. On paper, put the broad HTTPS permit before blockHost and trace the resulting first match. That reordering changes the intended policy and is not executed or recommended without review. Identify the DNS response, lease configuration and clock evidence that an application investigation would additionally require. None is supplied by the address mapping.

```sh
# Fixed offline reasoning model, not a router or emulator.
python3 -B labs/ccna-workshop/run_lab.py services
```

Run from the workshop directory. Local Python only; no equipment, credentials, packets or real configuration.

## Practice safely

1. Read the services fixture and the model contract; write an input-by-input prediction before executing.
2. Draw the decision sequence described in this lesson and mark the observations the model cannot supply.
3. From the workshop directory, run python3 -B labs/ccna-workshop/run_lab.py services.
4. Compare every worked-example field with the receipt. Preserve mismatches and explain them rather than editing the receipt.
5. Work the named counterfactual on paper only. Record which input changes and which conclusion would need recomputing.
6. Keep the three evidence items, your actual receipt and an explicit list of unperformed equipment checks.

## Evidence to keep

- A first-match rule trace with the original packet fields.
- A separate static translation ledger and absent delivery checks.
- A paper rule-order counterfactual plus DNS, DHCP and time evidence requests.

## Original check 1

An earlier deny matches before a later HTTPS permit. What determines the result?

A. The last permit in the list
B. The rule with the friendliest name
C. The earlier matching deny
D. The NAT address

<details><summary>Answer and reasoning</summary>

C. The earlier matching deny

Ordered ACL evaluation stops at the first applicable entry; a later permit cannot override that earlier matching deny.

</details>

## Original check 2

A static NAT mapping exists. What does that prove?

A. All ACLs permit traffic
B. DNS is correct
C. NTP is synchronized
D. A modeled address association, not permission or delivery

<details><summary>Answer and reasoning</summary>

D. A modeled address association, not permission or delivery

Translation, filtering and application success are separate mechanisms and evidence claims.

</details>

## Original check 3

Why retain time synchronization evidence during troubleshooting?

A. Clock disagreement can distort event correlation
B. NTP automatically rewrites ACLs
C. DHCP leases are passwords
D. DNS cannot work without a public NAT address

<details><summary>Answer and reasoning</summary>

A. Clock disagreement can distort event correlation

Reliable timing helps compare logs, but it does not replace protocol-specific observations.

</details>

## Limits

No ACL, NAT, DNS, DHCP relay or NTP configuration occurs. The model uses explicit networks rather than IOS wildcard syntax, has no stateful NAT/PAT engine and provides no live service results.

## Official references

- https://www.cisco.com/c/en/us/support/docs/security/ios-firewall/23602-confaccesslists.html
- https://www.cisco.com/c/en/us/support/docs/ip/network-address-translation-nat/13772-12.html
- https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dhcp/configuration/15-s/dhcp-15-s-book/dhcp-relay-agent.html
- https://www.cisco.com/c/en/us/td/docs/switches/lan/c9000/time-sync/ntp-configuration-guide/m-network-time-protocol.html
