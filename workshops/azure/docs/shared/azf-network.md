# Trace routes, filters and private names independently

Avoid declaring connectivity from a route or private endpoint alone.

## Learning goals

- Separate route selection from NSG permission.
- Explain why private endpoints need suitable DNS resolution.
- Preserve route ambiguity and incomplete flow evidence.

## Learn

An application reaching a database needs more than an address. Its name must resolve to the intended endpoint, traffic must follow a suitable path, filtering must permit the flow and the service must accept the application request. Azure virtual networks provide private network boundaries, but their existence does not prove that every resource can communicate. Build a path explanation from source workload to destination service and identify the evidence needed at each step rather than treating connectivity as one configuration switch.

Routing chooses a next hop based on applicable routes. More specific destination prefixes matter, and Azure has additional route-source selection rules that a simple longest-prefix classroom exercise does not reproduce. If two equally specific teaching routes remain tied, report ambiguity instead of inventing a winner. Real diagnosis would inspect effective routes and route origin for the relevant interface. A route toward a firewall, gateway or virtual appliance also leaves that next hop's health and forwarding behavior to be checked separately.

Network security groups filter traffic through ordered rules with priorities and matching conditions. When NSGs apply at both subnet and network interface, both applicable layers need to allow the new flow. A subnet allow cannot cancel a NIC denial. NSGs are stateful, so observations about existing connections may differ from expectations for a newly initiated connection after rule changes. The local model deliberately uses synthetic match flags and new-flow decisions; it does not generate packets or demonstrate connection tracking behavior.

A private endpoint provides a private network interface for a supported service connection. Applications usually continue using the service hostname, making DNS resolution central to the design. Private DNS zones, links and forwarding paths must suit where clients run, including hybrid clients. Merely creating a private endpoint does not prove the client resolves the intended private address. Public endpoint exposure and service authentication must also be reviewed explicitly. Private addressing is a connectivity choice, not a replacement for data authorization.

For the fictional reporting client, keep a ledger of destination name, resolved address, selected route, subnet filtering, NIC filtering and application result. The fixed exercise covers only some of those columns. Its first route case deliberately has two equally specific candidates, and its new-flow NSG case is denied at the NIC after passing the subnet layer. These are independent findings. Resolving the route ambiguity would not by itself change the NIC result, and changing a filter would not establish correct DNS.

Run the network command and retain both the unresolved route selection and the denied flow. On paper, propose a DNS validation plan for a private endpoint without querying real infrastructure. Identify where the client would obtain its resolver and which hostname should be inspected. This is broader administration enrichment, not a complete AZ-900 requirement. No network changes, private endpoint approvals, packet tests or live effective-route checks occur, so the outcome must remain a bounded explanation rather than a claim of working Azure connectivity.

## Worked example

The first route result retains selected_route_ids private-a and private-b with ambiguous true. Explain that the teaching engine intentionally does not resolve Azure route-source precedence. The web-new-flow case reports subnet permission but NIC denial, giving allowed false overall. On paper, imagine correcting only the route tie: the NSG denial remains. Next list the DNS evidence missing from both results, especially whether the service hostname resolves privately for the actual client. None of those alternatives is executed by the command.

```sh
# Offline synthetic model only; no Azure operations.
python3 labs/azure-workshop/run_lab.py network
```

Run from the workshop directory. Local Python only; no Azure credentials, calls, network or real configuration.

## Practice safely

1. Read the fixed network fixture and write your prediction before running anything.
2. Draw the decision boundary and list the Azure conditions this local model omits.
3. From the workshop directory run python3 labs/azure-workshop/run_lab.py network.
4. Compare the receipt with your prediction and retain disagreements rather than editing evidence.
5. Work the alternative in the example on paper only; label it unexecuted.
6. Save the receipt and the three evidence items, with a list of unperformed real Azure validations.

## Evidence to keep

- A path ledger marking DNS, routing, filtering and application checks separately.
- A receipt preserving the route tie and the NIC-denied new flow.
- An unexecuted private-DNS validation plan for the fictional client.

## Original check 1

The subnet allows a new flow but the NIC NSG denies it. What follows?

A. The flow is not allowed through both layers
B. The subnet always wins
C. The lower-level rule is ignored
D. DNS converts the denial to an allow

<details><summary>Answer and reasoning</summary>

A. The flow is not allowed through both layers

All applicable filtering layers must permit the flow.

</details>

## Original check 2

A private endpoint exists. What still needs checking?

A. Whether private IPs bypass authentication
B. The client hostname resolves through the intended DNS path
C. Whether NSGs become irrelevant
D. Whether all public access is necessarily disabled

<details><summary>Answer and reasoning</summary>

B. The client hostname resolves through the intended DNS path

A private endpoint does not alone prove client DNS behavior or public endpoint restrictions.

</details>

## Original check 3

Why retain a route tie in this model?

A. Azure never chooses routes
B. Both routes necessarily carry each packet
C. It omits Azure route-source precedence and cannot justify a winner
D. The shorter route name always wins

<details><summary>Answer and reasoning</summary>

C. It omits Azure route-source precedence and cannot justify a winner

Explicit ambiguity is more accurate than an unsupported tie-breaker.

</details>

## Limits

No packets, DNS queries, effective routes, private endpoints or NSG changes are executed. Route-source precedence and stateful flow behavior are not simulated; match flags and fallback denial are teaching simplifications.

## Official references

- https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview
- https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview
- https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview
- https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns
