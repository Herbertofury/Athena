# Ports, transport and TLS

Connect application behavior to TCP, UDP and encryption.

## Learn

TCP provides an ordered byte stream with retransmission and congestion control. UDP provides datagrams without those delivery guarantees. Applications may build reliability on UDP; QUIC is an example. “UDP is always faster” ignores application and network conditions.

A port identifies a transport endpoint, not a guarantee of service identity. HTTPS usually uses port 443, but software can listen elsewhere. Test the expected protocol rather than only whether a port is reachable.

TLS authenticates endpoints using certificates and protects traffic confidentiality/integrity. Validate the hostname, trust chain and validity period. Bypassing certificate warnings removes protection and is not a routine troubleshooting fix.

## Worked example

A TCP connection to port 443 succeeds but HTTPS fails because the certificate name differs from the requested host. Network reachability and application trust are separate tests.

## Practice safely

1. Use a browser’s certificate viewer for a trusted public site.
2. Record hostname, issuer and expiration without changing trust settings.
3. Draw TCP connection establishment and TLS negotiation as separate layers.
4. Explain why an open port does not prove application health.

## Check your understanding

What should you do with an unexpected certificate-name mismatch?

- Investigate endpoint/name configuration and trust
- Disable verification
- Assume encryption makes identity irrelevant
- Change every firewall rule

<details><summary>Answer and explanation</summary>

Investigate endpoint/name configuration and trust. TLS identity validation must remain meaningful.

</details>

## Further study

- https://www.rfc-editor.org/rfc/rfc9846

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

