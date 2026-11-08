# How to use this workbook

## Prerequisites and sequence

Review Packet Trail's packet journey, subnet planning, route/ARP, DNS, DHCP and incident-proof lessons. Know how to read an IPv4 prefix and distinguish a frame from an IP packet. This workshop does not count prerequisite material as new CCNA coverage. Follow the [ten-lesson path](paths/ccna-workshop.md) in order; allow about an hour per lesson, with additional time for reviewing mistakes.

## Predict, run, explain

For every lesson, read the six explanation paragraphs and the corresponding fixed JSON fixture. Make a prediction independently of the worked answer. Run the literal Python command from the workshop directory, with no credentials or network target. Record the command and actual output. All results have `real_network_executed: false` and `synthetic_model: true`; those fields are central evidence boundaries, not decorative disclaimers.

Compare the result with the worked example field by field. If it differs, preserve both records and investigate the input, script version and reasoning. Do not rewrite a receipt to match a prediction. Counterfactuals in lesson prose are paper exercises: describe the changed input and calculate the expected consequence without configuring equipment. The CLI deliberately accepts only a named fixed exercise, not arbitrary paths or network destinations.

## Evidence packet

Keep the three requested evidence items for every lesson. Use this ledger structure:

- Claim and exact fixture input it depends on.
- Predicted result and reasoning steps.
- Actual command, returned fields and interpretation.
- Model omissions and unperformed operational checks.
- Paper alternative, labeled unexecuted, with changed inputs and expected effect.

A useful packet preserves a negative finding, a tie and an unknown rather than presenting every exercise as a pass. Explain `equal_cost_not_fully_tiebroken`, `full_adjacency_proven: false` and the capstone's contradictions in their own contexts. Do not turn an invented neighbor observation into a real capture or a desired-state diff into a completed change.

## Checks and feedback

Answer the three original multiple-choice checks per lesson before expanding the explanations in the static workbook. Each has one intended answer under its stated scope. Compare the explanation to your reasoning, not just the selected letter. The first check is compatible with Athena's lesson format; two supplemental checks provide practice, not extra completion credit or a readiness score. Thirty correct selections would still leave the operational and objective gaps below.

## Working without Python

Read the fixture and do the calculations on paper. Compare them with the worked example or [answer key](../labs/ccna-workshop/ANSWER-KEY.md), but label execution unperformed. No online simulator or equipment login is required. Do not represent an answer-key copy as your own observed output.

## Final review

The capstone memo should separate supported model claims, contradictions and missing evidence, then prioritize an unexecuted validation plan. Review the [coverage map](CCNA-COVERAGE.md). Full device configuration, CLI verification, RF measurements, packet observations, recovery and independent timed assessment remain outside this workbook. Completing local exercises does not award a Cisco credential or establish professional readiness.
