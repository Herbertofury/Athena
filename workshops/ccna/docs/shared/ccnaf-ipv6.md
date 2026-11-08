# Separate IPv6 address meaning from neighbor discovery

Classify IPv6 addresses and membership while keeping reachability, ND and default-router evidence distinct.

## Learning goals

- Recognize link-local, unique-local, global and multicast roles.
- Calculate IPv6 prefix membership without assuming reachability.
- Explain what neighbor discovery and router advertisements add.

## Learn

IPv6 expands address space, but good troubleshooting still begins by asking what an address means in context. A host can hold several addresses with different scopes and lifetimes on one interface. A link-local address supports communication on its local link; a global-unicast-shaped address does not itself prove global connectivity. Unique-local addresses serve local communications under a different addressing plan. Multicast addresses identify groups rather than a single interface. Do not infer a usable application path merely from an address that parses successfully.

Compressed hexadecimal notation changes presentation, not address identity. Leading zeroes can be omitted within a group and one consecutive run of zero groups can be represented with a double colon. Comparing strings is therefore a poor way to decide whether two addresses are equivalent or share a prefix. Parse the value and apply the prefix length. The workshop uses deterministic address arithmetic to classify fixed examples and test membership; it does not assign those addresses to interfaces or verify that any endpoint owns them.

Link-local unicast belongs to the fe80::/10 range, while unique-local addresses are within fc00::/7 and multicast uses ff00::/8. The documentation prefix 2001:db8::/32 exists for examples rather than real public deployment. Scope classification is separate from a routing decision. A link-local next hop requires interface context because the same local-link address can appear on different links. A displayed address without that context may therefore be insufficient to identify the intended neighbor even when its syntax is valid.

IPv6 Neighbor Discovery uses ICMPv6 for functions including neighbor address resolution, router discovery and reachability-related mechanisms. Neighbor Solicitation and Advertisement messages are not ARP packets with longer addresses. Router Advertisements can supply default-router and prefix information, while host address configuration can involve SLAAC, DHCPv6 or other arrangements. Receiving an address and learning a default router are related operational concerns but not interchangeable evidence. A worksheet should reserve separate fields for interface addresses, prefixes, router information and neighbor-cache observations.

A common reasoning error is to treat same-prefix membership as proof that two endpoints can communicate. The endpoints still need appropriate interfaces, neighbor discovery, policy and functioning links. Likewise, accepting all ICMPv6 as irrelevant noise can break essential behavior; filtering decisions need to understand message purposes. The local model sends no solicitations and cannot detect duplicate addresses, stale neighbors or missing advertisements. It teaches address interpretation so that later observations can be framed accurately, rather than pretending arithmetic substitutes for those observations.

Run the fixed IPv6 exercise and record each classification and prefix result before drawing a proposed communication path. In a paper counterfactual, keep the address unchanged but move it to a different link and explain why link-local neighbor context matters. Separately list the observations needed to distinguish missing router information from failed neighbor resolution. The result demonstrates bounded address reasoning only. No IPv6 stack is configured, no router advertisement is emitted and no real neighbor or default router has been discovered.

## Worked example

The supplied prefix is 2001:db8:42::/64 with prefix_length 64. Address 2001:db8:42::7 has in_prefix true, while 2001:db8:43::7 has in_prefix false. Both use category other_unicast in this model; neither is a claim of public routability, and 2001:db8::/32 is documentation space. fe80::1 is link_local, fd00::1 unique_local, ff02::1 multicast, :: unspecified and ::1 loopback. neighbor_observation is advertisement_seen, but reachability_proven stays false. Treat that string as invented fixture evidence rather than an observed packet. On paper, place fe80::1 on two distinct interfaces and explain why an outgoing interface is needed to identify the intended neighbor. Prefix arithmetic cannot resolve that operational ambiguity.

```sh
# Fixed offline reasoning model, not a router or emulator.
python3 -B labs/ccna-workshop/run_lab.py ipv6
```

Run from the workshop directory. Local Python only; no equipment, credentials, packets or real configuration.

## Practice safely

1. Read the ipv6 fixture and the model contract; write an input-by-input prediction before executing.
2. Draw the decision sequence described in this lesson and mark the observations the model cannot supply.
3. From the workshop directory, run python3 -B labs/ccna-workshop/run_lab.py ipv6.
4. Compare every worked-example field with the receipt. Preserve mismatches and explain them rather than editing the receipt.
5. Work the named counterfactual on paper only. Record which input changes and which conclusion would need recomputing.
6. Keep the three evidence items, your actual receipt and an explicit list of unperformed equipment checks.

## Evidence to keep

- An address-classification and prefix-membership ledger.
- A diagram separating address configuration, default-router discovery and neighbor resolution.
- A paper cross-link counterfactual with missing operational observations.

## Original check 1

What does same-prefix membership prove by itself?

A. Successful neighbor discovery
B. Only the arithmetic membership relationship
C. An active default router
D. That all firewall policies permit traffic

<details><summary>Answer and reasoning</summary>

B. Only the arithmetic membership relationship

Prefix arithmetic cannot establish operational links, successful neighbor discovery or permissive traffic policy.

</details>

## Original check 2

Which mechanism handles IPv6 neighbor address resolution?

A. IPv4 ARP unchanged
B. DNS zone transfers
C. ICMPv6 Neighbor Discovery
D. LACP negotiation

<details><summary>Answer and reasoning</summary>

C. ICMPv6 Neighbor Discovery

Neighbor Solicitation and Advertisement are part of IPv6 ND, not IPv4 ARP.

</details>

## Original check 3

Why may a link-local next hop need an interface identifier?

A. Link-local addresses are public DNS names
B. IPv6 addresses cannot be compressed
C. The interface identifier supplies a password
D. Its meaning is limited to a link and may be ambiguous across interfaces

<details><summary>Answer and reasoning</summary>

D. Its meaning is limited to a link and may be ambiguous across interfaces

Link scope makes the outgoing interface part of the context needed to identify a neighbor.

</details>

## Limits

No interface addressing, ICMPv6, ND cache, duplicate-address detection or router advertisements occur. Classification and membership are arithmetic, not real endpoint or application reachability tests.

## Official references

- https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipv6_basic/configuration/xe-3s/ip6b-xe-3s-book/ip6-neighb-disc-xe.html
- https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_pi/configuration/xe-16-11/iri-xe-16-11-book/ip6-route-static-xe.html
- https://www.rfc-editor.org/rfc/rfc4861.html
