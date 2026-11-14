# Defend a network review with explicit evidence gaps

Combine switching, routing, policy and automation reasoning without converting local receipts into deployment approval.

## Learning goals

- Trace a proposed service across multiple decision boundaries.
- Retain contradictions and distinguish them from missing observations.
- Prioritize unperformed validation without claiming full CCNA coverage.

## Learn

A network review needs a chain of defensible claims, not a folder containing ten successful command exits. A local receipt can establish that a fixed algorithm returned a result for a fixed input. It cannot establish that a campus network is configured, secure or ready for service. The capstone combines selected findings from this workshop so that you can practice deciding what each item supports, which conclusions conflict and what evidence would still be needed before an operational decision could be made.

Begin with one intended service flow: an endpoint in a particular VLAN needs an application through a routed and filtered path. Record the endpoint assumptions, VLAN membership, trunk path, loop-control considerations, next hop, relevant policy and destination service. Put return traffic on the same worksheet as a separate direction rather than assuming symmetry. Wireless access, if involved, adds security and RF dependencies. The drawing is a reasoning aid whose edges remain hypotheses until suitable observations establish the corresponding operational facts.

Classify evidence as a supplied configuration fact, a calculated model result or an actual observation from the authorized environment. This workshop produces only the first two categories for its synthetic network. If a route calculation selects a next hop, it supports a bounded routing conclusion; it does not prove neighbor resolution. If a NAT mapping exists, it supports an address association, not an ACL permit. A favorable finding in one category cannot erase an unfavorable or missing finding in another simply because both concern the same host.

Contradictions and missing evidence call for different responses. An explicit deny that matches the intended service contradicts a claim that the modeled policy permits it. Missing neighbor and application observations leave other claims unknown. Preserve the contradiction as an actionable design or policy question, while requesting evidence for the unknowns. Do not smooth both into a vague warning or manufacture successful tests to make the review look complete. A recommendation can reasonably remain conditional when a necessary claim is unsupported or directly contradicted.

Prioritize follow-up by dependency and consequence. Clarify whether the service should be permitted before planning a configuration change; then define the authorized validation needed for the route, neighbors, policy and application. A proposed change should name its intended effect, scope, rollback considerations and reviewer without claiming that the proposal has been applied. Automation plans add their own validation and uncertain-outcome concerns. The capstone runs no device commands and grants no new authority to test traffic, modify policies or publish internal network information.

Finish with a concise evidence-led review and an objective gap map. The workshop extends earlier packet-journey learning into VLAN, loop-control, bundle, IPv6, route, OSPF, service, wireless and automation reasoning, but remains partial CCNA coverage. Actual configuration, protocol state inspection and timed troubleshooting are unperformed. Run the fixed capstone and preserve its missing-evidence list and cautious conclusion. Your final artifact should let another learner reproduce the same local findings while seeing exactly why those findings do not establish exam readiness, operational competence or production approval.

## Worked example

The capstone retains supporting [route_selection, vlan_membership], contradictions [acl_order] and gaps [application_response, neighbor_exchange]. end_to_end_success_proven remains false. Its next_step is “Resolve contradictions and collect missing independent evidence in an authorized environment.” Build a ledger assigning the positive route and membership findings to their bounded claims, then explain why neither overrides the ACL contradiction. Missing neighbor exchange and application response remain unknown rather than implicit failures or passes. On paper, propose resolving the intended policy before arranging authorized neighbor and application observations. Keep the proposal unexecuted. The final memo should preserve the exact two gaps and one contradiction, then link to the coverage map instead of claiming full exam or practical readiness.

```sh
# Fixed offline reasoning model, not a router or emulator.
python3 -B labs/ccna-workshop/run_lab.py capstone
```

Run from the workshop directory. Local Python only; no equipment, credentials, packets or real configuration.

## Practice safely

1. Read the capstone fixture and the model contract; write an input-by-input prediction before executing.
2. Draw the decision sequence described in this lesson and mark the observations the model cannot supply.
3. From the workshop directory, run python3 -B labs/ccna-workshop/run_lab.py capstone.
4. Compare every worked-example field with the receipt. Preserve mismatches and explain them rather than editing the receipt.
5. Work the named counterfactual on paper only. Record which input changes and which conclusion would need recomputing.
6. Keep the three evidence items, your actual receipt and an explicit list of unperformed equipment checks.

## Evidence to keep

- A service-flow evidence ledger linking claims to individual receipts.
- A prioritized review retaining the ACL contradiction and missing observations.
- A coverage-gap map and unexecuted validation plan without readiness claims.

## Original check 1

A route exists but the relevant ACL denies the service. What should the review say?

A. The route automatically overrides the ACL
B. NAT guarantees success
C. The application must be running
D. Routing evidence does not erase the modeled policy contradiction

<details><summary>Answer and reasoning</summary>

D. Routing evidence does not erase the modeled policy contradiction

Independent mechanisms answer different questions; a route does not authorize denied traffic.

</details>

## Original check 2

How should absent neighbor evidence be represented?

A. As an unresolved claim requiring an appropriate observation
B. As a successful ping
C. As proof the router is broken
D. As an irrelevant detail

<details><summary>Answer and reasoning</summary>

A. As an unresolved claim requiring an appropriate observation

Missing evidence is uncertainty, not success or a specific failure diagnosis.

</details>

## Original check 3

What does completing this workshop establish?

A. Complete CCNA coverage
B. Practice with selected local models and explicit gaps
C. Production network approval
D. Real Cisco configuration proficiency

<details><summary>Answer and reasoning</summary>

B. Practice with selected local models and explicit gaps

Bounded offline work cannot substitute for the omitted objectives and equipment-based validation.

</details>

## Limits

No operational acceptance, exam readiness, full CCNA coverage or live network validation is established. The capstone aggregates selected synthetic findings and does not discover an actual network.

## Official references

- https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst2960/software/release/15-0_2_se/configuration/guide/scg2960/swadmin.html
- https://www.cisco.com/c/en/us/td/docs/switches/lan/catalyst9300/software/release/17-18/configuration_guide/vlan/b_1718_vlan_9300_cg/configuring_vlan_trunks.html
- https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/15986-admin-distance.html
- https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/ipaddr_dhcp/configuration/15-s/dhcp-15-s-book/dhcp-relay-agent.html
- https://www.cisco.com/c/en/us/support/docs/security/ios-firewall/23602-confaccesslists.html
