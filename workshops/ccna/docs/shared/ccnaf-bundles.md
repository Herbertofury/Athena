# Check bundle compatibility before promising bandwidth

Reason about LACP participation and member consistency without treating a port channel as unlimited per-flow capacity.

## Learning goals

- Distinguish active, passive and static channel modes.
- Check member compatibility before accepting a bundle.
- Separate aggregate capacity from per-flow behavior and failure evidence.

## Learn

A bundle groups compatible physical links into one logical interface, reducing the number of independent links that higher-level features must consider. EtherChannel is Cisco terminology for this family of capabilities; LACP is a standards-based negotiation protocol used to establish suitable aggregation. A bundle is not simply a drawing with several lines between the same switches. Each member must satisfy the relevant local and peer requirements, and the resulting logical interface must be operational before it can carry the intended traffic.

LACP active mode initiates negotiation and passive mode responds. Active with active or active with passive can negotiate, while two passive endpoints do not initiate the exchange needed to establish a channel. Static on mode does not use LACP negotiation and should not be described as another LACP participant. Mode compatibility alone is insufficient. Administrators must also examine the member attributes and platform rules, including appropriate speed, duplex and Layer 2 or Layer 3 configuration consistency for the particular bundle.

For a trunk bundle, allowed VLANs and related trunk settings deserve careful comparison. A mismatch can make a member unsuitable or produce an operational problem depending on the platform and exact configuration. The workshop deliberately uses an explicit compatibility contract instead of promising one universal device response. Read the returned rejection reasons as model findings. Do not turn them into fabricated switch log messages or assume that every Cisco software release reports the same state for every mismatched attribute.

Traffic distribution normally selects members using a hashing policy. A bundle of two links can offer more aggregate capacity across appropriate traffic patterns without doubling the speed available to one particular flow. Which packet fields feed the hash and how a platform handles failures are implementation details that must be checked. Counting cables is therefore not a performance test. Distinguish configured membership, negotiated membership, distribution behavior and measured application performance when explaining why a busy transfer may still be limited by one member link.

Use a compatibility matrix with one row per endpoint pair and columns for negotiation mode and compared member settings. Mark a failed prerequisite before making any capacity estimate. A candidate that fails the mode test does not become a valid channel because its speeds match; a candidate that negotiates is not automatically acceptable if required member settings conflict. Preserve all reported reasons rather than stopping at the first attractive explanation. This gives the eventual operator a clear investigation order without suggesting a live corrective command.

Run the fixed bundles exercise and compare its decisions with your matrix. For a paper counterfactual, replace one passive endpoint with active while leaving other mismatches untouched, then state which finding might change and which cannot. Do not claim a working bundle until every modeled requirement is satisfied, and even then label real negotiation unperformed. Future authorized validation would require actual port-channel state, peer details and failure observations. This exercise sends no LACP frames and measures neither bandwidth nor application continuity.

## Worked example

Use m1 as the reference member. It returns compatible true with no reasons. Member m2 is rejected with reasons [both_passive]; m3 is rejected with [speed_mismatch, vlan_mismatch]. Therefore all_compatible is false. Keep both m3 reasons in your matrix, since fixing speed alone cannot satisfy the supplied VLAN condition. In the paper alternative, change one of m2’s passive endpoints to active. That removes the both-passive obstacle under the model but does not repair m3 or prove that a real channel formed. Separately explain why two compatible physical links still would not guarantee twice the throughput for a single hashed flow. No speed or bandwidth value in this receipt is a measurement.

```sh
# Fixed offline reasoning model, not a router or emulator.
python3 -B labs/ccna-workshop/run_lab.py bundles
```

Run from the workshop directory. Local Python only; no equipment, credentials, packets or real configuration.

## Practice safely

1. Read the bundles fixture and the model contract; write an input-by-input prediction before executing.
2. Draw the decision sequence described in this lesson and mark the observations the model cannot supply.
3. From the workshop directory, run python3 -B labs/ccna-workshop/run_lab.py bundles.
4. Compare every worked-example field with the receipt. Preserve mismatches and explain them rather than editing the receipt.
5. Work the named counterfactual on paper only. Record which input changes and which conclusion would need recomputing.
6. Keep the three evidence items, your actual receipt and an explicit list of unperformed equipment checks.

## Evidence to keep

- A per-candidate LACP mode and member consistency matrix.
- An explanation of aggregate capacity versus one-flow limits.
- A paper mode-change analysis preserving remaining rejection reasons.

## Original check 1

Which mode pair can initiate LACP negotiation?

A. Passive and passive
B. Static on and passive as equivalent LACP peers
C. Active and passive
D. Two disabled interfaces

<details><summary>Answer and reasoning</summary>

C. Active and passive

An active endpoint initiates LACP; two passive endpoints do not initiate negotiation.

</details>

## Original check 2

What does two-member aggregation guarantee for one flow?

A. Exactly twice the link speed
B. Zero packet loss
C. Identical hashing on every platform
D. No automatic doubling of that flow’s throughput

<details><summary>Answer and reasoning</summary>

D. No automatic doubling of that flow’s throughput

Hash-based distribution can keep one flow on one member even when aggregate capacity increases.

</details>

## Original check 3

Changing passive to active removes one incompatibility. What next?

A. Recheck the remaining member settings and operational evidence
B. Assume all VLAN mismatches disappeared
C. Declare measured failover success
D. Treat static on as negotiated LACP

<details><summary>Answer and reasoning</summary>

A. Recheck the remaining member settings and operational evidence

Negotiation mode is only one prerequisite and cannot repair unrelated configuration differences.

</details>

## Limits

No LACP exchange, port-channel creation, hashing implementation or performance measurement occurs. Compatibility findings follow the explicit fixture contract, not every device or software release.

## Official references

- https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-9/configuration_guide/lyr2/b_179_lyr2_9300_cg/configuring_etherchannels.html
- https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/vlan/b_1718_vlan_9300_cg/configuring_vlan_trunks.html
