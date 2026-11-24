# Choose the next hop, then the frame

Separate the final destination from the local Ethernet recipient.

## Learn

An IP packet has a destination address. A routing lookup chooses the next hop or connected interface. For ordinary IPv4 forwarding, the most specific matching prefix wins before comparisons among routes to the same prefix; this lesson does not model policy routing, VRFs or multipath selection.

On IPv4 Ethernet, ARP can resolve the selected on-link next hop to a MAC address. If the final destination is off-link and the selected route uses a gateway, the first frame normally targets the gateway’s MAC address, while the packet still targets the remote IP address. The router replaces link-layer framing on its next link.

A connected route can direct the host to resolve the destination itself. A bad local prefix can therefore make the host try to find a supposedly local destination that is actually beyond a router. A default route does not override a more specific connected route simply because it would work better.

Inspect actual interface, prefix, route and neighbor evidence before editing configuration. ARP cache entries are temporary observations, not proof of device identity or end-to-end application health. IPv6 uses Neighbor Discovery rather than ARP.

When two equally specific matching routes exist, preference, metric and implementation-specific rules matter. Our route detective intentionally avoids equal-prefix ties so the exercise teaches longest-prefix matching without inventing universal metric behavior.

## Worked example

A host 10.20.30.10/24 has default gateway 10.20.30.1. To reach 203.0.113.9 it sends an Ethernet frame to the gateway’s MAC, containing an IP packet for 203.0.113.9. With routes 0.0.0.0/0, 10.0.0.0/8 and 10.20.0.0/16, destination 10.20.8.2 selects /16, not the default.

## Practice safely

1. Label packet destination and frame destination separately on a drawing.
2. Use the route detective with 10.20.8.2, 10.9.8.2 and 203.0.113.9.
3. Predict the selected prefix before revealing the answer.
4. Write why a wrong /16 on a host intended for /24 can change neighbor resolution.
5. Do not change your real adapter prefix, routes or ARP cache for this exercise.

## Check your understanding

With a normal off-link IPv4 destination and an on-link gateway, whose MAC is in the first outgoing Ethernet frame?

- The remote web server’s MAC across the internet
- A MAC derived from the DNS name
- The selected local gateway’s MAC
- Every router’s MAC at once

<details><summary>Answer and explanation</summary>

The selected local gateway’s MAC. The frame reaches the local next hop; the IP packet continues to name the ultimate destination. Layer 2 addresses are not an end-to-end internet route.

</details>

## Further study

- https://www.rfc-editor.org/rfc/rfc826
- https://www.rfc-editor.org/rfc/rfc4632

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

