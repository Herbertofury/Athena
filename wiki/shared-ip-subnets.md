# IPv4 addressing and subnetting

Calculate network ranges and understand when a router is needed.

## Learn

An IPv4 address is 32 bits. A CIDR prefix says how many leading bits identify the network. In common multi-access subnets with prefixes through /30, two addresses are conventionally reserved for the network and broadcast; /31 point-to-point and /32 host routes are special cases.

Hosts compare the destination against their local subnet. Off-subnet traffic goes to a next-hop router, usually the default gateway. A valid address alone is not enough: the prefix, gateway and route table must agree.

Private address space is not globally routed. NAT translates addresses but is not equivalent to a complete security policy. IPv6 uses a different address structure and does not use IPv4 broadcast.

## Worked example

192.168.10.77/26 has a block size of 64 in the final octet. Its network is 192.168.10.64, broadcast .127, and conventional usable hosts .65–.126: 62 addresses.

## Practice safely

1. Use the built-in subnet lab for /24, /26 and /30.
2. Calculate a range manually before revealing the answer.
3. Explain whether 192.168.10.130 shares a /26 with .77.
4. Compare a host route and a default route in a sample routing table.

## Check your understanding

How many conventional usable host addresses are in an IPv4 /27 subnet?

- 16
- 30
- 32
- 62

<details><summary>Answer and explanation</summary>

30. There are 2^(32−27)=32 addresses; conventional network and broadcast reservations leave 30.

</details>

## Further study

- https://www.rfc-editor.org/rfc/rfc4632

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

