# Separate VLAN membership from successful delivery

Follow VLAN-scoped MAC learning and allowed trunk membership without treating either as end-to-end connectivity.

## Learning goals

- Trace source learning and destination lookup within a VLAN.
- Compute effective trunk membership from both ends.
- Distinguish a switching decision from a delivered application request.

## Learn

A switch forwarding decision begins with the frame and its ingress context, not with the application name printed on a diagram. An access port places ordinary untagged endpoint traffic into its configured access VLAN. A trunk carries traffic for multiple VLANs, subject to its configuration. Before following a destination MAC address, establish which VLAN the frame belongs to and whether each candidate egress port participates in that VLAN. Otherwise a plausible-looking path can cross a boundary that does not exist.

A learning bridge records the source MAC address against the ingress port in the relevant VLAN. It then looks up the destination within that same VLAN. A known unicast destination normally identifies one eligible egress port; an unknown unicast is flooded only through eligible forwarding ports in that VLAN, excluding ingress. Learning a source does not establish the destination's presence. The same written MAC value in another VLAN must not silently satisfy a lookup in this VLAN's forwarding context.

Trunk availability is a relationship between endpoints. If one end permits VLANs 10 and 20 while the other permits 20 and 30, their allowed-list intersection contains only 20. That arithmetic is useful but incomplete: trunk operation, VLAN existence, native-VLAN agreement and spanning-tree forwarding state also matter. An intersection result is not evidence that frames were tagged correctly or received. Keep allowed membership separate from operational state, especially when a configuration excerpt is the only evidence available.

Consider an office where engineering and visitors attach to the same physical switch but occupy different VLANs. A learned engineering MAC does not make the visitors' unknown destination known. Nor does sharing an uplink authorize communication between the VLANs. Inter-VLAN traffic requires a Layer 3 path and any applicable policy. Start your worksheet with VLAN, ingress, source, destination and eligible egress ports. This makes it possible to explain a flood without incorrectly describing it as a broadcast delivered to every physical port.

When a laptop moves between ports, subsequent source frames can update the learned location. Real switches also age dynamic entries and may implement security features that change behavior. The supplied fixed model teaches selected forwarding decisions, not aging, actual frame reception, switch capacity or attack protection. A local list of egress ports is therefore a predicted action under stated assumptions. Real validation would need authorized observations of interface state, VLAN configuration, forwarding tables and the particular traffic under investigation.

Run the fixed VLAN exercise and reconcile its learned entries and forwarding decisions with your worksheet. For a paper counterfactual, remove the required VLAN from one trunk endpoint and identify which membership result changes before considering higher layers. Do not repair the result by adding an imaginary route. Preserve whether the destination was known at each step, because event order matters. Completion demonstrates reasoning about a supplied switching trace; it does not demonstrate that a VLAN or trunk was configured on Cisco equipment.

## Worked example

Trace the four fixture events in order. Event 1 learns 02:00:00:00:00:01 on deskA in VLAN 10 and returns flood_unknown_unicast with egress [uplink]. Event 2 learns the other source on uplink in VLAN 10, then returns known_unicast with egress [deskA]. Event 3 learns the first MAC on uplink in VLAN 20, a separate entry, and floods toward deskB. Event 4 is drop_vlan with no egress because deskA does not admit VLAN 20. trunk_intersections.uplink is [10, 20], not every VLAN mentioned by either endpoint. The learned list has three entries, not two global MAC identities. On paper, remove VLAN 20 from one trunk allowed list: recompute that intersection and mark which later learning/forwarding assumptions fail. No real trunk is changed.

```sh
# Fixed offline reasoning model, not a router or emulator.
python3 -B labs/ccna-workshop/run_lab.py vlans
```

Run from the workshop directory. Local Python only; no equipment, credentials, packets or real configuration.

## Practice safely

1. Read the vlans fixture and the model contract; write an input-by-input prediction before executing.
2. Draw the decision sequence described in this lesson and mark the observations the model cannot supply.
3. From the workshop directory, run python3 -B labs/ccna-workshop/run_lab.py vlans.
4. Compare every worked-example field with the receipt. Preserve mismatches and explain them rather than editing the receipt.
5. Work the named counterfactual on paper only. Record which input changes and which conclusion would need recomputing.
6. Keep the three evidence items, your actual receipt and an explicit list of unperformed equipment checks.

## Evidence to keep

- A VLAN-scoped learning and forwarding ledger in event order.
- A two-ended trunk membership calculation with operational assumptions.
- A paper missing-VLAN counterfactual separating switching from routing.

## Original check 1

Which address is learned from an arriving frame?

A. The source MAC in its VLAN and ingress context
B. The destination IP as a route
C. Every MAC in every VLAN
D. The DNS server address

<details><summary>Answer and reasoning</summary>

A. The source MAC in its VLAN and ingress context

Source learning supplies the location used by later destination lookups; it is not IP routing.

</details>

## Original check 2

What does an allowed-list intersection establish?

A. A successful application exchange
B. Common permitted VLAN membership, with operational checks still missing
C. Identical native VLAN settings
D. A measured trunk throughput

<details><summary>Answer and reasoning</summary>

B. Common permitted VLAN membership, with operational checks still missing

Common membership is necessary for the modeled path but cannot prove operational trunk behavior.

</details>

## Original check 3

A destination exists only in VLAN 10. A VLAN 20 frame names it. What follows?

A. The switch automatically routes it
B. All VLANs merge temporarily
C. The VLAN 10 entry does not resolve the VLAN 20 lookup
D. The frame must reach its application

<details><summary>Answer and reasoning</summary>

C. The VLAN 10 entry does not resolve the VLAN 20 lookup

Forwarding context is VLAN-specific; another VLAN entry cannot establish this destination location.

</details>

## Limits

No frames, MAC-table queries, switch configuration or trunk negotiation occur. The model omits dynamic aging, native-VLAN tagging behavior, operational interfaces and hardware-specific forwarding.

## Official references

- https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/vlan/b_1718_vlan_9300_cg/configuring_vlans.html
- https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/vlan/b_1718_vlan_9300_cg/configuring_vlan_trunks.html
- https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swadmin.html
