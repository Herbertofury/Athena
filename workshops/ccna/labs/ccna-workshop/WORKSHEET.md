# Predict, inspect, explain

Use the [README](README.md) commands and [contracts](CONTRACTS.md). For each exercise record (1) your prediction, (2) the model's actual JSON, (3) the specific input evidence supporting the result, and (4) one conclusion the model cannot justify. Do not turn suggestions into real network actions. All records are invented. In-memory variations are optional local tests and never configure equipment.

## 1. VLAN scope, not just a MAC address

Inspect [vlans.json](fixtures/vlans.json).

1. Intersect the uplink's two allowed lists. Which offered VLAN is absent from the peer list?
2. Trace all four frames in order. For each, record whether learning occurs and which ports can receive it.
3. The same source MAC appears in VLANs 10 and 20. Does the second observation overwrite the first table row?
4. Why does the fourth frame not add its source MAC? Why is deskB not an egress for the first frame?
5. Variation: change uplink's peer list to `[30]`. Predict first-frame egress, then verify with an in-memory copy. Can an empty flood list establish that the destination does not exist?
6. Name two omitted switching behaviors that prevent treating this as a switch emulator.

## 2. A root and a cost are not a full spanning tree

Inspect [loop-control.json](fixtures/loop-control.json).

1. Rank the supplied bridge identifiers. Why does `root` win regardless of topology cost?
2. Calculate root-to-edge cost through left and through right. Predict both candidates before running.
3. What evidence/result does the cost-only model deliberately leave unresolved? Does a sorted candidate list choose a forwarding port?
4. Explain the null cost for island. Would a real disconnected component simply have no root?
5. Variation: increase right-to-edge cost from 4 to 5. What changes? What stays unchanged?
6. Explain why positive topology cycles are valid input here but self-links and duplicate undirected links are rejected.

## 3. Partial LACP compatibility evidence

Inspect [bundles.json](fixtures/bundles.json).

1. Identify the reference member and normalize its VLAN set.
2. Which member has matching speed/duplex/VLANs but cannot initiate with its peer? Explain active versus passive without introducing static `on`.
3. List both mismatches for m3. Would repairing only its speed make it compatible?
4. Variation: use only m1/m2 and change m2 peer mode to active. Predict the result. Explain why `all_compatible:true` still does not prove a real bundle forms.
5. Must local channel-group numbers match between peers? Would two members guarantee twice the throughput for one flow?

## 4. IPv6 membership and evidence limits

Inspect [ipv6.json](fixtures/ipv6.json).

1. Which single supplied address lies inside `2001:db8:42::/64`? Explain the boundary separating it from `2001:db8:43::7`.
2. Categorize link-local, ULA, multicast, unspecified and loopback entries. Why does `other_unicast` not mean globally Internet-routable?
3. Does `advertisement_seen` prove fresh bidirectional reachability? What independent evidence would be required to support an application-success claim?
4. Why is a zone-suffixed address rejected instead of silently stripping its interface scope?
5. Variation: use prefix `2001:db8:42::7/128`. How many supplied addresses belong? Why would `2001:db8:42::7/64` be rejected?

## 5. Separate route selection from forwarding

Inspect [routing.json](fixtures/routing.json).

1. For the /24, select the available candidate with the lowest supplied AD. Why does primary not win in the fixture?
2. List the surviving matching prefixes. Perform longest-prefix lookup for the destination. Can default's smaller AD defeat the more-specific route?
3. Variation A: mark specific inactive. Variation B: also mark primary active. Predict the selected route for each, in order.
4. Variation C: duplicate specific under a new route ID while preserving its AD/prefix. What does the tie output mean, and what does it not prove about ECMP?
5. Why cannot an ordinary floating route alone detect a silent failure beyond an otherwise available next hop?

## 6. OSPF checks and graph costs are different evidence

Inspect [ospf.json](fixtures/ospf.json).

1. Which prerequisite differs between peerA and peerB? Does it affect the same protocol stage as an area or hello-timer mismatch?
2. Does peerB's complete check list establish Full adjacency? When can Two-Way be normal on a broadcast segment?
3. Compute A-to-B using direct and indirect paths. Then compute A-to-D using your least-cost route.
4. Why is island null? Why does peerA's failed check not automatically delete any graph edge?
5. Identify what would be needed to claim the graph is an actual current link-state database rather than supplied synthetic data.

## 7. ACL order and independent NAT interpretation

Inspect [services.json](fixtures/services.json).

1. The packet matches a host deny and a broader HTTPS permit. Which wins, and why?
2. Variation: reverse the rules. Explain the changed result without calling ACL order an unordered set of policies.
3. Variation: send the invented packet from `.10` to TCP port 80. Which explicit rule matches? What is the default decision?
4. Find the static mapping for the original source. Why can the model report this mapping while denying the packet?
5. Explain why the output does not assert an actual ACL/NAT processing order, a translated packet, or a working return path. Does NAT itself provide a security policy?

## 8. Wireless choices with missing RF evidence

Inspect [wireless.json](fixtures/wireless.json).

1. Which AP meets both client capabilities and the requested security floor? Distinguish client incompatibility from an AP falling below policy.
2. Predict all three pairwise channel relationships. Why is `separated_in_simplified_plan` not the same as measured interference-free service?
3. Variation: add WPA3-SAE client capability. Which AP eligibility changes? Does its overlap relationship change?
4. Why are band 5 GHz, width 40 MHz and channel 12 rejected rather than guessed?
5. List missing survey/regulatory/coverage evidence before recommending any real channel plan.

## 9. A typed diff is a proposal, not an API call

Inspect [automation.json](fixtures/automation.json).

1. Predict create, remove and update records. Which two desk fields change, and in what documented order are they listed?
2. Determine desired dependency order. Does that order claim to be a safe sequence for removing retired?
3. Variation: copy desired into actual. Which output becomes empty, and why does that still not prove a real device is compliant?
4. Explain why JSON integer `1` is not accepted for boolean enabled. Why does syntactically valid JSON not establish correct schema or intent?
5. Add a reverse dependency in memory. Explain the cycle error. Why must orphan references and duplicate IDs fail instead of being silently ignored?

## 10. Capstone: independent gaps

Inspect [capstone.json](fixtures/capstone.json).

1. Separate supporting assertions, contradictory assertions and missing/unknown evidence.
2. Does supporting route selection resolve contradictory ACL evidence? Does neighbor evidence imply an application response?
3. Why is an omitted topic treated like an unknown outcome rather than a pass?
4. Variation: make every topic supporting. What result stays false? Explain the difference between a synthetic evidence checklist and real execution proof.
5. Write a short handoff containing the observed contradiction, two evidence gaps, and a proposed **authorized** verification plan. Do not execute the plan, infer permission, or describe the exercise as equipment testing.

## Reflection

Choose one surprising result and explain the mistaken assumption behind your original prediction. Then identify a model limitation that would matter on real equipment. Completing this worksheet demonstrates practice with these bounded records, not certification mastery, operational approval, or live-network verification.
