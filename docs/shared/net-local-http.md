# Run a loopback HTTP experiment

Observe real requests and status codes on a harmless local-only fixture.

## Learn

A local experiment gives stronger evidence than memorizing a diagram. The included Python fixture binds only to 127.0.0.1, uses an operating-system-selected port, and serves fixed synthetic responses. It does not expose your files, scan a network or request cloud resources.

GET /health returns a small JSON body. HEAD requests the corresponding metadata without the response body. GET /missing returns 404, and GET /busy returns a deliberately synthetic 503. A 503 in this fixture is a lesson case, not an outage detection system.

The fixture is plain HTTP on loopback. It does not teach TLS negotiation, DNS infrastructure, multi-host routing or production hardening. No private credentials, tokens or personal data belong in requests to it. Local users and software can still connect while it runs.

The automated lab starts a fresh listener, uses real loopback TCP requests with short timeouts, checks status/body/header contracts, then shuts it down. Record a PermissionError as an environment limit if sockets are prohibited; do not claim network execution merely because pure response tests pass.

Reproducibility requires the Python version, source revision, command, output and cleanup result. Read the code before running it. Stop the manually started server with Ctrl+C. Do not change the bind address or publish this teaching server to the internet.

## Worked example

For a successful GET /health the expected status is 200 and JSON includes status="ok". HEAD /health also returns 200 and a Content-Length describing the GET representation, but no body. For /missing, the expected 404 is a passing negative test when that is the planned behavior.

## Practice safely

1. Read labs/network/README.md and the fixture implementation.
2. Predict status and body behavior for /health, /missing and /busy.
3. Run the pure tests, then the optional loopback tests only on your authorized machine.
4. Compare predicted and actual results and retain the exact output.
5. Stop the server and verify the listener is closed; do not confuse this with a TLS or real-browser test.

## Check your understanding

Which evidence proves the strongest claim about this lab?

- Reading the fixture proves actual TCP requests succeeded
- A screenshot of the instructions proves cleanup
- Passing loopback tests proves these local HTTP cases, not internet/TLS behavior
- A 404 means the entire lab failed

<details><summary>Answer and explanation</summary>

Passing loopback tests proves these local HTTP cases, not internet/TLS behavior. The executed boundary and tested cases define the claim. Loopback HTTP does not establish DNS, TLS, internet routing, or graphical browser behavior.

</details>

## Further study

- https://docs.python.org/3/library/http.server.html
- https://docs.python.org/3/library/http.client.html
- https://docs.python.org/3/library/unittest.html

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

