# Packet Trail: a local HTTP experiment

Use Python 3.10 or later on an authorized machine. No packages, credentials, cloud resources, administrator privileges or real customer data are needed. The code binds only IPv4 loopback (`127.0.0.1`) and serves fixed JSON. It does not serve files, change network settings or scan anything. It is **not a production server**, TLS lab, browser automation or multi-host network test.

## Predict first

Write the expected HTTP status and whether a body should be present:

| Request | Status | Body |
| --- | --- | --- |
| GET /health | 200 | JSON with status `ok` |
| HEAD /health | 200 | None; Content-Length describes the GET representation |
| GET /missing | 404 | Fixed error JSON |
| GET /busy | 503 | Fixed synthetic busy error |
| POST /health | 405 | Fixed method-not-allowed error |

Other recognized unsupported methods receive fixed JSON with 405; an unknown method receives fixed JSON with 501. Parser errors also use generic JSON without reflecting request text.

A deliberately expected 404/503 is a passing negative case. It is not evidence of a real incident.

## Pure response checks, no network

From the repository root:

```sh
python3 tests/network_fixture_test.py
```

On Windows, use `py -3` instead of `python3` if that is your installed Python launcher. Passing these checks alone does not prove a listener or TCP request worked.

## Optional actual loopback checks

Read the implementation, then run:

```sh
python3 tests/network_loopback_test.py
```

This starts a fresh local listener for each test, sends real loopback TCP requests with two-second client timeouts, and checks shutdown/socket closure. If the environment prohibits sockets, retain that failure and do not change security settings to force the test. CI or another **authorized** execution environment may have a different capability; its result must be labeled separately.

## Manual observation

```sh
python3 labs/network/http_fixture.py
```

Open the printed `http://127.0.0.1:<port>/health` address in your own browser. Inspect status/headers in developer tools if you know how. Replace only the path with `/missing` or `/busy`. No external address is needed. Stop the server using Ctrl+C. Do not change its bind address or expose it to the internet. The random port avoids overwriting a fixed service; local processes/users can still connect while it runs.

## Evidence and limits

Copy [the evidence template](evidence-template.md) and record the version, exact source revision, commands and actual results. Keep real identities, cookies, secrets and private topology out of public notes. No automatic pass claim is made for the learner. Automated loopback results do not establish browser rendering, DNS, TLS, physical network routing or official exam readiness.

## Official references

- [Python HTTP server library and production warning](https://docs.python.org/3/library/http.server.html)
- [Python HTTP client library](https://docs.python.org/3/library/http.client.html)
- [HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
