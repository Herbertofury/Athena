# Troubleshoot like an investigator

Turn a vague symptom into a testable hypothesis and a verified repair.

## Learn

A symptom is an observation, not a diagnosis. “The internet is down” may mean one application, DNS, a wireless link, a default route, a proxy, or an upstream outage. Establish scope, onset, affected users and the last known good state before changing anything.

Collect evidence, propose the most likely causes, and choose a low-risk test that distinguishes them. Change one variable at a time. Preserve logs and configuration so a successful experiment can be explained and a failed one reversed.

After the repair, reproduce the original workflow, check adjacent functions and document the cause, action and validation. Escalation is a technical skill: include exact symptoms, timestamps, steps already tried and business impact.

## Worked example

A laptop reaches a service by IP but not by its name. This narrows the investigation toward name resolution, but an HTTPS failure by IP may also be a certificate-name mismatch. Compare a DNS query with a healthy device before changing DNS settings.

## Practice safely

1. On your own device, choose a harmless failed URL or disconnected test network.
2. Write three hypotheses and a non-destructive test for each.
3. Collect the error and a healthy comparison.
4. Record one repair hypothesis, rollback plan and validation checklist.

## Check your understanding

Which is the strongest first step for an intermittent issue?

- Collect scope, timing and reproducible evidence
- Reinstall the operating system
- Disable all security controls
- Replace every network component

<details><summary>Answer and explanation</summary>

Collect scope, timing and reproducible evidence. Evidence narrows the cause and avoids destructive guesswork.

</details>

## Further study

- https://www.comptia.org/en-us/certifications/a/

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

