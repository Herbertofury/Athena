# The Packet Trail

A focused networking foundation: predict a request, plan addresses, inspect evidence, diagnose synthetic incidents and prove a local HTTP contract.

An applied beginner foundation, not full Network+ or CCNA coverage. IPv6, wireless, dynamic routing, packet capture and production operations need deeper separate work.

## Before you start

- [Troubleshoot like an investigator](shared-troubleshooting)
- [IPv4 addressing and subnetting](shared-ip-subnets)
- [DNS, DHCP and name resolution](shared-dns-dhcp)
- [Ports, transport and TLS](shared-transport-tls)

## Eight applied lessons

1. [Follow one request, end to end](shared-net-packet-journey)
2. [Build an address plan that fits](shared-net-subnet-planning)
3. [Choose the next hop, then the frame](shared-net-route-arp)
4. [Read DNS evidence without guessing](shared-net-dns-evidence)
5. [Diagnose configuration and lease failures](shared-net-dhcp-evidence)
6. [Distinguish transport, TLS and HTTP failures](shared-net-transport-trust)
7. [Run a loopback HTTP experiment](shared-net-local-http)
8. [Write an evidence-led incident report](shared-net-incident-proof)

## Practice and evidence

The app includes three synthetic diagnosis cases and a fixed-table route detective. They do not access your network or grant practical mastery.

Run the [loopback HTTP lab](https://github.com/Herbertofury/Athena/blob/main/labs/network/README.md) on an authorized machine and retain actual test results. Complete the evidence template, explain what each test proves, and preserve unrun or failed checks.

## Case: The missing name

A synthetic workstation can use another internal application but portal.example fails before a web connection is established. All names and addresses here are invented teaching data.

- Link and expected local address/prefix are present.
- The selected configured resolver returns SERVFAIL for portal.example A at 10:02.
- A comparison workstation on the same intended segment gets the expected A answer at 10:02.
- No certificate or HTTP response has been observed for the failing request.

Which investigation is best supported next?

- Replace the laptop immediately
- Compare the actual resolver path and response details between clients
- Disable TLS validation
- Conclude that the public internet is down

<details><summary>Reasoning and validation</summary>

Compare the actual resolver path and response details between clients. The differing name-resolution observations justify comparing resolver selection and response details. They do not yet prove one server, cache, policy or client is the root cause.

After an authorized repair, repeat the exact name/type query through the actual client resolver, then repeat the original HTTPS workflow with normal verification. Retain both results.

</details>

## Case: The route that swallowed a subnet

A synthetic host should use 10.20.30.10/24 and gateway 10.20.30.1, but its current interface has /16. The target 10.20.40.20 belongs to a different routed subnet.

- Current connected route is 10.20.0.0/16.
- A default route through 10.20.30.1 also exists.
- The host attempts local neighbor resolution for 10.20.40.20.
- The approved address plan states 10.20.30.0/24 for this interface.

Which explanation fits the supplied evidence?

- The more specific connected /16 makes the destination appear on-link
- The default route always overrides connected routes
- DNS changes the Ethernet prefix
- Every /16 network is invalid

<details><summary>Reasoning and validation</summary>

The more specific connected /16 makes the destination appear on-link. 10.20.40.20 matches the current connected /16, which is more specific than /0. The approved /24 plan would put it off-link. Confirm configuration ownership and plan rollback before any real change.

In an authorized disposable reproduction, validate the corrected route selection, next-hop resolution and original application path. Do not alter your real adapter for this synthetic case.

</details>

## Case: The convincing wrong endpoint

A synthetic browser reaches a TCP listener for an HTTPS URL but rejects the certificate because its names do not match the requested hostname.

- A TCP connection to the intended service port completes.
- The certificate is presented for another hostname.
- Normal certificate verification stops the request.
- No successful protected HTTP response has been observed.

Which next step preserves the security property being tested?

- Treat port reachability as proof of a safe website
- Use an insecure flag and call it repaired
- Investigate endpoint/name/certificate configuration without bypassing validation
- Publish the user’s session cookie for debugging

<details><summary>Reasoning and validation</summary>

Investigate endpoint/name/certificate configuration without bypassing validation. A reachable listener is not proof of the requested identity. Endpoint, proxy or certificate configuration must be explained while validation remains intact.

Repeat the original hostname with normal verification after an authorized fix, then validate the application response. Do not install an unexpected root certificate as a shortcut.

</details>

