# Explain a loop-free tree without inventing convergence

Rank a root and least-cost paths while keeping real STP roles, states and timing outside the simplified model.

## Learning goals

- Explain why redundant Layer 2 paths need loop control.
- Compare bridge identity and cumulative root path cost.
- List tie-break and convergence evidence missing from a graph model.

## Learn

Redundant links improve the options available after a failure, but Ethernet forwarding cannot safely use every Layer 2 cycle without a loop-control mechanism. Broadcast and unknown-unicast frames can circulate and multiply when bridges keep flooding through a cycle. A frame has no IP-style hop limit that solves this bridging problem. Spanning Tree Protocol organizes a loop-free forwarding topology while retaining physical alternatives. The resulting logical tree should not be confused with removing redundant cables or proving that recovery will be fast enough.

Root election uses bridge identifiers, with the lowest identifier winning the comparison. In relevant VLAN-aware implementations the identifier includes priority information and an extended system identifier as well as the bridge MAC address. A lower numeric priority is more preferred. The root is not selected because an administrator thinks its model number looks fastest. Record the compared identifiers and the scope of the instance before describing the result, since separate instances can make different forwarding decisions over the same physical topology.

Nonroot bridges compare paths toward the root using accumulated path cost. A lower-cost indirect path can be preferable to an expensive direct link. Equal-cost cases need protocol tie-break rules involving bridge and port information rather than a convenient arbitrary choice. The workshop graph calculation intentionally stops short of reproducing every BPDU comparison. If the fixture does not provide the necessary tie-break inputs, do not claim it has calculated all operational root, designated and alternate ports on a real switch network.

Traditional STP and rapid variants differ in state transitions and convergence mechanisms. Rapid PVST+ applies rapid spanning-tree behavior per VLAN in Cisco environments. An edge-port assumption can allow faster forwarding for an endpoint connection, while BPDU Guard addresses unexpected bridge participation on appropriately configured edge ports. These are not interchangeable settings and should not be enabled indiscriminately on links between switches. Their correct use depends on the intended topology, device behavior and an approved configuration, none of which this local graph establishes.

Build a drawing with the root candidate identifiers beside nodes and costs beside links. Sum each candidate route to the root before choosing the least-cost path. Then draw the remaining physical links differently from the selected logical paths. This distinction keeps a redundancy discussion honest: an unused forwarding path can still be physically available. A graph result cannot tell you how many frames were lost during a failure, whether inconsistent configuration suspended a port, or whether a protection mechanism placed an interface into an error state.

Run the fixed loop-control exercise and retain the root and cost evidence exactly as returned. In the paper counterfactual, increase the cost of one selected link and recompute the affected route rather than asserting an immediate switchover. List the BPDU, port-state and timing observations that a later authorized equipment exercise would need. The current output is a topology reasoning receipt, not an STP capture. It supplies no convergence measurement and no guarantee that the physical network is free of loops.

## Worked example

The selected root is named root. Both left and right have root_cost 4 with candidate_neighbors [root]. The edge switch has root_cost 8 and candidate_neighbors [left, right], so its status is equal_cost_not_fully_tiebroken. Do not choose left just because it sorts first: the model deliberately lacks complete protocol tie-break evidence. island has root_cost null and status unreachable. On paper, increase the edge-to-left cost from 4 to 7 while leaving edge-to-right at 4. The right-hand cost remains 8 while the left-hand alternative becomes 11; identify the unique least-cost candidate without inventing port roles or a convergence time. The model root is an identifier result, not a captured root-bridge announcement.

```sh
# Fixed offline reasoning model, not a router or emulator.
python3 -B labs/ccna-workshop/run_lab.py loop-control
```

Run from the workshop directory. Local Python only; no equipment, credentials, packets or real configuration.

## Practice safely

1. Read the loop-control fixture and the model contract; write an input-by-input prediction before executing.
2. Draw the decision sequence described in this lesson and mark the observations the model cannot supply.
3. From the workshop directory, run python3 -B labs/ccna-workshop/run_lab.py loop-control.
4. Compare every worked-example field with the receipt. Preserve mismatches and explain them rather than editing the receipt.
5. Work the named counterfactual on paper only. Record which input changes and which conclusion would need recomputing.
6. Keep the three evidence items, your actual receipt and an explicit list of unperformed equipment checks.

## Evidence to keep

- An annotated root election and cumulative-cost calculation.
- A drawing separating physical redundancy from selected paths.
- A paper cost-change analysis plus missing BPDU and convergence evidence.

## Original check 1

Why can flooding through a Layer 2 cycle be dangerous?

A. Every switch becomes a DNS server
B. IP routes always disappear
C. All links automatically shut down
D. Frames can circulate and multiply without an IP-style hop limit

<details><summary>Answer and reasoning</summary>

D. Frames can circulate and multiply without an IP-style hop limit

Loop control is needed because ordinary bridging does not decrement an IP TTL on each bridge hop.

</details>

## Original check 2

An indirect root path costs less than a direct link. Which principle applies?

A. Compare cumulative root path cost, not cable count alone
B. Always choose the direct cable
C. Choose the highest bridge priority
D. Ignore all costs on redundant links

<details><summary>Answer and reasoning</summary>

A. Compare cumulative root path cost, not cable count alone

The preferred root path is based on protocol comparisons, including accumulated cost.

</details>

## Original check 3

What does this graph exercise not measure?

A. The supplied link costs
B. Actual spanning-tree convergence and packet loss
C. The identifiers in its fixture
D. The arithmetic sum of a modeled path

<details><summary>Answer and reasoning</summary>

B. Actual spanning-tree convergence and packet loss

Graph calculations do not generate BPDUs or observe timed equipment behavior.

</details>

## Limits

No BPDUs, STP state machine, port configuration or failover timing are produced. Shortest paths are not a complete port-role calculation and omit full protocol tie-break and protection behavior.

## Official references

- https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/lan-wan/b-lan-wan/m_lsw-span-tree-prot.html
- https://www.cisco.com/c/dam/en/us/td/docs/switches/lan/catalyst9300/software/release/17-1/configuration_guide/lyr2/configuring_optional_spanning_tree_features.html
- https://www.cisco.com/c/en/us/support/docs/lan-switching/spanning-tree-protocol-stp-8021d/218321-configure-stp-with-loop-guard-and-bpdu-s.html
