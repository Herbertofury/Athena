# DNS, DHCP and name resolution

Separate naming, addressing and connectivity failures.

## Learn

DNS maps names to records such as A, AAAA, CNAME, MX and TXT. Recursive resolvers cache answers according to TTL and other rules. Authoritative servers hold a zone’s records; a recursive resolver is not necessarily authoritative.

DHCP leases configuration such as an address, prefix and gateway. A host may obtain an address yet fail DNS, or resolve names while a firewall blocks the application. Test these layers separately.

When diagnosing, inspect the actual resolver, query type, answer and TTL. Split DNS can deliberately return different answers inside and outside an organization. Do not publish internal records or logs containing sensitive names.

## Worked example

A new public record resolves correctly from an authoritative server but not from a cached resolver. Compare the previous TTL and cached answer before assuming the zone update failed.

## Practice safely

1. Query a public example domain with nslookup or dig.
2. Identify record type, answer and TTL.
3. Explain a CNAME versus an A record.
4. Sketch how DHCP and DNS differ in a new-device connection.

## Check your understanding

Which component is responsible for a zone’s authoritative records?

- The DHCP lease pool
- Any web browser cache
- An authoritative DNS server
- A default gateway by definition

<details><summary>Answer and explanation</summary>

An authoritative DNS server. Recursive caches may serve answers, but authoritative servers publish the zone data.

</details>

## Further study

- https://www.rfc-editor.org/rfc/rfc1034

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

