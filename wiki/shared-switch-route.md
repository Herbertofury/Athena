# Switching, routing and segmentation

Follow a frame on a LAN and a packet across networks.

## Learn

A Layer 2 switch forwards frames using MAC-address learning within a broadcast domain. A router forwards packets using a routing table. VLANs segment Layer 2 domains; communication between them needs Layer 3 forwarding and an explicit policy.

Loops in redundant Layer 2 topologies can be disruptive. Spanning-tree protocols coordinate loop avoidance. Link aggregation and routing redundancy solve different problems and must match both endpoints.

Use the longest matching route prefix. Administrative preference and metrics choose among comparable routes. Segmentation is a design tool: define allowed flows and validate them rather than assuming a VLAN label alone enforces security.

## Worked example

A host in VLAN 10 cannot reach VLAN 20 without a gateway or Layer 3 interface. Allowing routing does not automatically mean every application flow should be permitted.

## Practice safely

1. Draw two VLANs and a router using documentation-only addresses.
2. Label broadcast domains and gateway addresses.
3. Write a flow matrix of permitted source/destination/services.
4. Find the longest match among /0, /16 and /24 routes for one address.

## Check your understanding

Which matching route is normally selected for 10.2.3.5?

- 0.0.0.0/0
- 10.0.0.0/8
- 10.2.0.0/16
- 10.2.3.0/24

<details><summary>Answer and explanation</summary>

10.2.3.0/24. Longest-prefix match selects the most specific applicable route.

</details>

## Further study

- https://www.cisco.com/c/en/us/solutions/enterprise-networks/what-is-network-switch.html

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

