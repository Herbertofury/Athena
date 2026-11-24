# Build an address plan that fits

Move from memorized prefix tables to a checked, non-overlapping plan.

## Learn

For conventional IPv4 LAN planning through /30, a prefix p leaves 32−p host bits. The address count is 2^(32−p); subtract two for conventional network and broadcast reservations. This shortcut does not describe /31 point-to-point links, /32 host routes, IPv6, or provider-specific reserved addresses.

Start with required hosts including gateways and infrastructure, add explicit growth assumptions, then choose the smallest suitable block. A requirement of 50 addresses fits a /26 with 62 conventional usable addresses. A requirement of 70 does not. Document why you selected the margin instead of hiding it.

Allocate the largest blocks first inside an assigned parent range. Blocks must begin at their natural boundaries and must not overlap. A /26 in 10.20.30.0/24 can start at .0, .64, .128 or .192. A proposed 10.20.30.80/26 contains host bits and is not a network boundary.

Keep mathematical capacity separate from operational policy. A cloud provider can reserve more addresses. A private range can still overlap a VPN peer. Being private does not authorize you to configure it on someone else’s network.

Validate the plan two ways: calculate by hand, then compare with a trusted address library or the learning calculator. Store required hosts, prefix, network, broadcast, usable range, gateway and remaining capacity. Tests should include the first and last usable address and one address just outside the block.

## Worked example

A paper-only office needs 50 hosts in A and 20 in B, including gateways. Allocate A=10.20.30.0/26, usable .1–.62, broadcast .63; B=10.20.30.64/27, usable .65–.94, broadcast .95. A has 12 spare conventional slots and B has 10. The unused .96–.255 space is not one single CIDR block.

## Practice safely

1. Recalculate both ranges before opening the subnet tool.
2. Check that every B address lies outside A.
3. Add a third department needing 10 hosts and propose 10.20.30.96/28.
4. Verify its usable range .97–.110 and broadcast .111.
5. Explain how a cloud reservation rule or VPN overlap would change your deployment decision.

## Check your understanding

Which is the next aligned /28 block after 10.20.30.64/27?

- 10.20.30.80/28
- 10.20.30.96/28
- 10.20.30.95/28
- 10.20.30.65/28

<details><summary>Answer and explanation</summary>

10.20.30.96/28. The /27 occupies .64–.95. A /28 has 16 addresses, so the next aligned block begins at .96 and ends at .111.

</details>

## Further study

- https://www.rfc-editor.org/rfc/rfc4632
- https://docs.python.org/3/library/ipaddress.html
- https://www.rfc-editor.org/rfc/rfc1918

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

