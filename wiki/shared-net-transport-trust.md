# Distinguish transport, TLS and HTTP failures

Use the failure stage to choose a narrow, safe next investigation.

## Learn

A TCP connection uses endpoint addresses and ports. Establishment, data transfer and closure have distinct states. Connection refused and connection timeout are different observations, but middleboxes and implementations can affect them; neither alone identifies the responsible program or device with certainty.

TLS adds authenticated protection for an application exchange. Normal HTTPS validation includes the requested identity and certificate trust/validity checks. A trust failure should lead to investigation of endpoint, certificate chain, name, clock or authorized proxy behavior, not a routine instruction to ignore the warning.

After a protected connection is established, HTTP status and response content carry application meaning. A 404 concerns resource handling; a 403 concerns refusal to fulfill the request; a 503 suggests temporary service unavailability. Applications and intermediaries can use status codes imperfectly, so correlate server evidence.

A service can have a healthy TCP listener while its database is unavailable. Conversely, a failed ping need not mean HTTPS is unavailable because ICMP policy differs from TCP/UDP policy. Test the user’s actual workflow and expected protocol, not a convenient proxy for it.

Keep your conclusion proportional. “This request reached an HTTP responder and got 503 at 10:02” is stronger evidence than “the server is broken.” Record exact origin, request method/path without secrets, timestamp, response and comparison. Never log passwords or authorization headers.

## Worked example

Three synthetic observations lead to different next steps: timeout before connection → inspect path/listener evidence; hostname mismatch → investigate identity/endpoint configuration without bypassing trust; valid TLS plus 503 → inspect application/dependency health. The same user-facing phrase, “site does not work,” can describe all three.

## Practice safely

1. Classify each of the three observations by the highest evidenced layer.
2. For each, write one safe next observation and one unsupported conclusion.
3. Explain why broadly disabling a firewall is risky and less informative than a targeted, authorized check.
4. Explain why a successful ping is not an end-to-end web application test.
5. Keep all examples synthetic or limited to a service you own.

## Check your understanding

What should follow an unexpected HTTPS hostname mismatch?

- Disable certificate verification permanently
- Investigate the requested name and endpoint certificate without bypassing validation
- Increase every timeout
- Treat a successful ping as proof of security

<details><summary>Answer and explanation</summary>

Investigate the requested name and endpoint certificate without bypassing validation. The name mismatch is an identity-validation issue that must be explained and corrected; ignoring it destroys the check you are investigating.

</details>

## Further study

- https://www.rfc-editor.org/rfc/rfc9846
- https://www.rfc-editor.org/rfc/rfc9110.html
- https://www.rfc-editor.org/rfc/rfc9293

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

