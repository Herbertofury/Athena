# Separate route installation from forwarding lookup

Keep longest-prefix matching, administrative distance and floating-route assumptions in the correct order.

## Learning goals

- Select the most specific matching destination prefix.
- Compare administrative distance only in the appropriate route-selection context.
- Explain when a floating static route can become useful.

## Learn

A forwarding problem starts with the destination address and the available routes. Several prefixes may match that destination, including a default route and a more specific subnet. Longest-prefix matching chooses the most specific matching installed prefix for forwarding. A route with a shorter prefix does not win just because its administrative distance is lower. Write the matching prefixes in order of specificity before discussing route preference, or the explanation can accidentally exchange two different stages of routing behavior.

Administrative distance expresses local preference among route sources for the same destination prefix. It is not a measurement of latency, physical distance or path bandwidth. Different protocols also have their own metrics for selecting paths within their routing processes. Real routers build a routing information base using those processes and then populate forwarding structures. The fixed exercise simplifies these stages into explicit candidates, so its documented selection order is a teaching contract rather than a complete implementation of every Cisco routing process.

A static route points toward a next hop or outgoing interface according to its configuration and platform rules. A floating static route uses a less preferred administrative distance than the route it is intended to back up. Its usefulness depends on the preferred route no longer being installed and on the backup next hop remaining resolvable. A failed application alone does not necessarily withdraw a preferred route. Health detection, tracking and failure scope need separate attention before describing a static backup as automatic service recovery.

Consider a destination covered by both a /24 and a /16. The /24 is more specific, even if the /16 has a numerically lower administrative distance. Among candidates for the same /24, preference can matter. If the model finds equally preferred candidates and lacks an additional tie rule, it preserves ambiguity rather than choosing whichever appeared first in a file. That is a useful discipline: order in an input list is not evidence that a network device would choose that next hop.

A route-selection receipt is only one part of a packet journey. The next hop must be reachable through an appropriate interface, link-layer resolution must succeed and policy can still block delivery. Return traffic may follow a different path and require its own analysis. The workshop does not emit packets or reconstruct live forwarding tables. Keep a route-choice ledger separate from an end-to-end test plan, and use exact prefixes and addresses rather than an informal statement that traffic goes toward the internet.

Run the fixed routing exercise in two stages: select same-prefix candidates by preference, then perform longest-prefix lookup across those modeled installed routes. For a paper counterfactual, withdraw the preferred candidate rather than merely declaring its application unhealthy; recompute which backup becomes eligible. Preserve any unresolved tie and list the extra information required to resolve it. A later authorized equipment exercise would need actual installed-route, next-hop and failure-detection evidence. This command changes no routing table and does not demonstrate a floating route taking over on a real router.

## Worked example

First build the modeled installed candidates separately for each prefix. primary, the /24 candidate with AD 90, is inactive; floating therefore supplies the active /24 at AD 200. default supplies /0 at AD 1 and specific supplies 192.0.2.64/26 at AD 220. Next perform longest-prefix lookup for 192.0.2.77 across those candidates. The /26 wins, so selected is [specific], prefix_length is 26, admin_distance is 220 and decision is unique_route. Lower AD on the broader /24 or /0 does not defeat that more-specific match. On paper, withdraw specific; the floating /24 then wins while primary remains inactive. Reactivating primary would change same-prefix selection, not the longest-prefix rule. No failure detection or route installation is executed.

```sh
# Fixed offline reasoning model, not a router or emulator.
python3 -B labs/ccna-workshop/run_lab.py routing
```

Run from the workshop directory. Local Python only; no equipment, credentials, packets or real configuration.

## Practice safely

1. Read the routing fixture and the model contract; write an input-by-input prediction before executing.
2. Draw the decision sequence described in this lesson and mark the observations the model cannot supply.
3. From the workshop directory, run python3 -B labs/ccna-workshop/run_lab.py routing.
4. Compare every worked-example field with the receipt. Preserve mismatches and explain them rather than editing the receipt.
5. Work the named counterfactual on paper only. Record which input changes and which conclusion would need recomputing.
6. Keep the three evidence items, your actual receipt and an explicit list of unperformed equipment checks.

## Evidence to keep

- A destination-by-destination prefix and preference calculation.
- A paper preferred-route withdrawal and backup eligibility explanation.
- A ledger separating route choice, next-hop reachability and return-path evidence.

## Original check 1

A /24 and /16 both match. The /16 has lower administrative distance. Which forwarding principle applies?

A. The installed /24 is more specific
B. The /16 always wins
C. The first listed route wins
D. Administrative distance measures prefix length

<details><summary>Answer and reasoning</summary>

A. The installed /24 is more specific

Longest-prefix matching governs destination specificity; source preference does not make a shorter prefix more specific.

</details>

## Original check 2

What makes a static route floating relative to a preferred route?

A. A larger physical interface
B. A less preferred administrative distance for the intended backup prefix
C. A DNS alias
D. A requirement to use wireless

<details><summary>Answer and reasoning</summary>

B. A less preferred administrative distance for the intended backup prefix

The backup is configured to be less preferred while the primary route remains available.

</details>

## Original check 3

What should a model do with an unresolved equal preference?

A. Invent a successful failover
B. Choose randomly and call it IOS behavior
C. Preserve the tie and name missing decision information
D. Treat list order as measured performance

<details><summary>Answer and reasoning</summary>

C. Preserve the tie and name missing decision information

An explicit unresolved result is more defensible than an unsupported routing choice.

</details>

## Limits

No RIB/FIB access, next-hop resolution, dynamic protocol, tracking or forwarding occurs. Candidate ranking is deliberately simplified; unresolved ties are preserved rather than presented as device ECMP behavior.

## Official references

- https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/15986-admin-distance.html
- https://www.cisco.com/c/en/us/support/docs/ip/enhanced-interior-gateway-routing-protocol-eigrp/8651-21.html
- https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_pi/configuration/xe-16-11/iri-xe-16-11-book/ip6-route-static-xe.html
