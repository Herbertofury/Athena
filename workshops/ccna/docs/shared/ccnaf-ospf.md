# Check adjacency prerequisites before trusting a path graph

Separate single-area OSPF neighbor compatibility from shortest-path arithmetic and an actually formed adjacency.

## Learning goals

- Compare relevant OSPF neighbor prerequisites.
- Compute cumulative path cost within a supplied graph.
- Distinguish a compatible peer from a verified Full adjacency.

## Learn

OSPF is a link-state routing protocol, so understanding its path choices requires more than spotting a neighbor address. Routers establish neighbor relationships, exchange appropriate link-state information and calculate paths using a view of the topology. A graph with neatly labeled costs skips several operational steps. Before using it as an explanation, identify which assumptions establish that the routers can exchange information and whether the graph represents a synchronized link-state database or merely a teaching fixture supplied by the exercise author.

For intended OSPF neighbors, relevant prerequisites include compatible area configuration, timers, authentication where configured and appropriate network relationships. Network type and addressing affect expectations, while mismatched MTU can interfere with adjacency progression. Router identifiers must be suitable and unique in the routing domain. A checklist that finds no modeled mismatch is not proof of Full state. Packets may still be blocked, an interface may be passive or a configuration detail outside the checklist may prevent the expected exchange.

On multiaccess networks, designated and backup designated routers reduce the number of adjacencies needed for database exchange. Neighbor state expectations depend on the network type and router role, so a neighbor that is not Full with every other router is not automatically broken. Point-to-point relationships have different expectations. The workshop does not simulate this election or state machine. Keep the distinction between neighbors and adjacencies visible instead of treating every discovered router as an identical participant in a complete mesh.

Once the supplied topology is accepted as an input, path calculation adds link costs along candidate routes and chooses the least total cost. A two-hop route can cost less than a direct edge. Costs are protocol values, not latency measurements, and their practical interpretation depends on configuration such as reference bandwidth. The local shortest-path result does not prove that a real router installed the corresponding route or that its database matches a peer. It demonstrates arithmetic over exactly the vertices and edges in the fixture.

Troubleshooting should follow the dependency order. First inspect interface and neighbor compatibility evidence, then neighbor state, database agreement and installed routes, and finally application traffic in both directions. Skipping directly to a shortest-path diagram can hide an adjacency failure that prevents the assumed topology from existing. Record an unreachable graph vertex as unreachable under the supplied graph, not as a diagnosis of a powered-off router. Several physical or configuration conditions could explain missing topology in an actual network and would require separate observations.

Run the fixed OSPF exercise and keep prerequisite findings separate from the distance map. In a paper counterfactual, align the mismatched MTU and state only that one modeled obstacle has been removed; do not upgrade that to a formed adjacency. Independently increase a link cost and recompute its downstream effect on shortest paths. List the neighbor-state and database evidence still needed for operational validation. The command exchanges no OSPF packets and establishes neither a real adjacency nor a converged routing domain.

## Worked example

peerA has failed_checks [mtu_match] and prerequisites_satisfied false. peerB has no failed checks and prerequisites_satisfied true. Both retain full_adjacency_proven false. Separately calculate the graph distances from A: A 0, C 3, B 5 and D 9, with island null. B is reached more cheaply through C than by its direct cost-10 edge; D follows that least-cost route through B. These numbers describe the supplied undirected positive-cost graph, not a learned LSDB. On paper, align peerA’s MTU flag and note that prerequisite checks can pass without observing Full state. Keep the neighbor worksheet independent of the graph worksheet rather than asserting the passed checklist produced the topology.

```sh
# Fixed offline reasoning model, not a router or emulator.
python3 -B labs/ccna-workshop/run_lab.py ospf
```

Run from the workshop directory. Local Python only; no equipment, credentials, packets or real configuration.

## Practice safely

1. Read the ospf fixture and the model contract; write an input-by-input prediction before executing.
2. Draw the decision sequence described in this lesson and mark the observations the model cannot supply.
3. From the workshop directory, run python3 -B labs/ccna-workshop/run_lab.py ospf.
4. Compare every worked-example field with the receipt. Preserve mismatches and explain them rather than editing the receipt.
5. Work the named counterfactual on paper only. Record which input changes and which conclusion would need recomputing.
6. Keep the three evidence items, your actual receipt and an explicit list of unperformed equipment checks.

## Evidence to keep

- A peer prerequisite matrix preserving each mismatch.
- An independently calculated shortest-path and unreachable-node map.
- A paper MTU correction distinguishing removed obstacles from observed adjacency.

## Original check 1

A peer passes all modeled prerequisite checks. What is justified?

A. Full adjacency is proven
B. Every database is synchronized
C. Application delivery is guaranteed
D. No checked mismatch was found; adjacency still needs observation

<details><summary>Answer and reasoning</summary>

D. No checked mismatch was found; adjacency still needs observation

A prerequisite checklist does not implement or observe the OSPF neighbor state machine.

</details>

## Original check 2

What does an OSPF cost sum represent here?

A. A path metric over supplied edges
B. Measured round-trip latency
C. An administrative-distance total
D. A certificate trust score

<details><summary>Answer and reasoning</summary>

A. A path metric over supplied edges

OSPF path costs are protocol metrics, not measured latency or administrative distance.

</details>

## Original check 3

After correcting a modeled MTU mismatch on paper, what remains unknown?

A. Whether the old input had a mismatch
B. Whether the real neighbors would reach the expected state
C. Whether integers can be added
D. Whether the paper change was a real packet capture

<details><summary>Answer and reasoning</summary>

B. Whether the real neighbors would reach the expected state

Removing one obstacle does not prove exchange, synchronization or operational convergence.

</details>

## Limits

No OSPF packets, DR/BDR election, neighbor state machine, LSDB exchange or installed routes are observed. Prerequisite checks and graph distances cannot establish adjacency or convergence.

## Official references

- https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13699-29.html
- https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_ospf/command/iro-cr-book/m_ospf-s1.html
- https://www.rfc-editor.org/rfc/rfc2328.html
