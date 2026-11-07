# Read DNS evidence without guessing

Interpret records, negative answers, caches and resolver differences.

## Learn

A DNS question includes a name, record type and class. An A answer supplies an IPv4 address; AAAA supplies IPv6. CNAME aliases a name. An application can ask several questions, and the machine or browser may use a different resolver path than a command-line diagnostic.

Distinguish failure kinds. NXDOMAIN says the queried name does not exist according to the response. A successful response with no requested record can mean the name exists but lacks that type. SERVFAIL signals that the resolver could not complete the resolution successfully; a timeout means no usable answer arrived before the client’s deadline.

Cached records have time limits, and negative results can also be cached. A changed authoritative answer does not instantly replace every cached answer. DNS TTL is not the same thing as IP TTL, and neither is a promise about application processing time.

Compare like with like: exact name, type, resolver, network, time and response. Split DNS may intentionally differ. A public resolver is not a universal replacement for an organization’s internal resolver. Changing it can break internal names and leak query information.

Preserve the name when testing HTTPS. Substituting an IP in a URL can change hostname verification and virtual-host selection. An IP connection that fails TLS is not enough to conclude DNS was the only problem. Use approved tools and documented test methods rather than bypassing verification.

## Worked example

Synthetic records: at 09:00 a resolver caches app.example A=192.0.2.10 with TTL 300. At 09:01 the authoritative value changes to 192.0.2.20. Under a simple ordinary cache model, the original positive answer can remain until around 09:05. Real resolvers may apply additional cache policies; record what was actually returned.

## Practice safely

1. Write the query name, type and resolver beside each sample answer.
2. Classify NXDOMAIN, SERVFAIL, timeout and NOERROR-with-no-A-record as distinct observations.
3. Compute the simple expiry time in the example.
4. Explain why an authoritative comparison is useful but does not prove a client’s actual resolver behavior.
5. Keep internal names and account data out of public tickets or lab notes.

## Check your understanding

What does a DNS timeout establish by itself?

- The authoritative zone was deleted
- The hostname definitely does not exist
- The user is unauthorized
- The client did not receive a usable answer before its deadline

<details><summary>Answer and explanation</summary>

The client did not receive a usable answer before its deadline. A timeout is an observation about the exchange and deadline, not a definitive statement about the name’s existence or the root cause.

</details>

## Further study

- https://www.rfc-editor.org/rfc/rfc1034
- https://www.rfc-editor.org/rfc/rfc2308

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

