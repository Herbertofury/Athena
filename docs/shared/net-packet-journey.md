# Follow one request, end to end

Track names, routes, frames, transport, trust and the application without confusing their jobs.

## Learn

A useful mental model starts with one concrete request: a browser asks for a page. Its URL supplies a scheme, host and resource path. The browser may reuse cached information or an existing connection, so the full sequence is a reasoning model, not a promise that every request produces every exchange.

The client obtains an address for the host, selects a route, and sends data through an appropriate local interface. On ordinary IPv4 Ethernet, resolving a local next hop to a MAC address is separate from resolving a website name to an IP address. A switch and a DNS resolver answer different questions.

For an HTTP/1.1 or HTTP/2 HTTPS connection using TCP, transport establishment and TLS setup happen before an encrypted HTTP exchange. HTTP/3 uses QUIC instead; do not claim every HTTPS request follows a TCP handshake. Multiple application requests can share a connection.

At each boundary ask what success actually proves. A DNS answer proves that a resolver supplied a record. A completed transport handshake proves that endpoints exchanged transport messages. Neither proves that the user can log in or that an order was saved correctly.

Write a small evidence ladder: name answer, selected route, next-hop reachability, expected transport, valid endpoint identity, application response and user outcome. You can investigate from the most informative observation instead of blindly running every test in order.

## Worked example

In a synthetic incident, portal.example resolves to 192.0.2.20, a TCP connection succeeds, TLS validates the requested hostname, and HTTP returns 503. The evidence narrows the immediate failure toward the application or its dependencies. It does not establish that every network path is healthy. Replacing DNS is not supported by these observations.

## Practice safely

1. Draw seven boxes for the evidence ladder on paper.
2. For each box write one observation and one thing it cannot prove.
3. Use only the supplied synthetic records; do not send traffic to documentation addresses.
4. Explain why a 503 response differs from a connection timeout.
5. Write what evidence you would ask the application owner for next.

## Check your understanding

TLS succeeds and the requested application returns 503. Which conclusion is best supported?

- The application/dependency path needs investigation; basic connection and TLS worked for this request
- The DNS server must be broken
- Every network device is healthy
- The browser should ignore certificate checks

<details><summary>Answer and explanation</summary>

The application/dependency path needs investigation; basic connection and TLS worked for this request. The observed response is application-layer evidence. It narrows the investigation without proving every component healthy.

</details>

## Further study

- https://www.rfc-editor.org/rfc/rfc9110.html
- https://www.rfc-editor.org/rfc/rfc9293

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

