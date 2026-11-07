# Write an evidence-led incident report

Turn investigation into a reproducible explanation and validation plan.

## Learn

A useful incident record separates observation, hypothesis, action and result. Observation is what was measured. A hypothesis explains it and can be tested. An action changes something or collects evidence. A result records what happened, including a failed or inconclusive attempt.

Bound the claim by time, scope and environment. One successful request from one machine does not prove global recovery. A report should say what original user workflow was repeated, how many times, over what interval and which adjacent functions were checked.

Choose tests that discriminate between plausible causes. If one machine fails and another succeeds, compare relevant configuration rather than reinstalling both. Change one bounded variable when repair is justified, keep a rollback and avoid destroying the evidence needed to explain the fault.

Security and privacy remain part of quality. Redact secrets, personal data and unnecessary internal names. Keep a private original if authorized and needed, and publish only synthetic or appropriately sanitized examples. Do not turn a lesson into a ticket containing real customer records.

A responsible conclusion can be uncertain. “The resolver timed out twice; server-side logs were unavailable” communicates a limitation. Escalation should include the exact missing observation that would distinguish the remaining hypotheses, not a claim that every possible fix has been tried.

## Worked example

Synthetic report: 10:02, one client, GET /busy returned 503 from the loopback fixture; /health returned 200. Hypothesis: the deliberate busy route is working as designed. Test: inspect its fixed response and repeat both paths. Result: expected statuses repeat, with no configuration change. Conclusion: negative-case fixture verified, not a real service repaired.

## Practice safely

1. Complete the supplied evidence template using only synthetic or your own lab data.
2. Put every sentence under observation, hypothesis, action or result.
3. Ask whether your root-cause claim exceeds your measurements.
4. Add a rollback and cleanup statement even when no repair was needed.
5. Have another learner reproduce the steps without asking you what you meant.

## Check your understanding

Which report wording best preserves uncertainty?

- Everything is fixed everywhere
- The network is definitely broken because one request failed
- We tried absolutely everything
- Two resolver timeouts were observed; server logs are needed to distinguish the remaining causes

<details><summary>Answer and explanation</summary>

Two resolver timeouts were observed; server logs are needed to distinguish the remaining causes. The last statement describes measured evidence and the specific missing information rather than making an unsupported universal claim.

</details>

## Further study

- https://docs.python.org/3/library/unittest.html
- https://www.rfc-editor.org/rfc/rfc9110.html

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

