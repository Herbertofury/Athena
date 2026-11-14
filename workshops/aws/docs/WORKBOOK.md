# AWS foundations workbook

## Before starting

Complete the generic cloud model-contract and responsibility-scope foundations and the AWS design introduction. Allow roughly 50 minutes per lesson, adjusting for prior experience. This is a substantial conceptual workbook, not a replacement for authorized hands-on AWS training or an exam preparation guarantee.

Open [START-HERE](../START-HERE.html) for all ten complete lessons and native expandable answers. Each lesson has three goals, six explanatory paragraphs, a worked example, one fixed local command, six practice steps, three evidence requirements and three original checks with reasoning. The first check supports the app's ordinary review; supplemental checks provide extra practice rather than additional XP or separate scheduling.

## Evidence workflow

1. Read the workload requirement and declare the units, failure boundary and assumptions.
2. Predict the fixture result on paper. Do not change a prediction after seeing the output without noting the correction.
3. Run the exact lesson command from the workshop directory. The wrapper accepts only its fixed command names.
4. Copy or save the observed JSON locally, excluding real identifiers or secrets. Separate receipt fields from your interpretation.
5. Compare the result with the [answer key](../labs/aws-workshop/ANSWER-KEY.md), then explain disagreements.
6. Answer all three conceptual checks before opening their reasoning. For each missed check, state the distinction you overlooked.
7. Fill the [worksheet](../labs/aws-workshop/WORKSHEET.md) and attach the evidence required by the lesson.
8. Write the real AWS work that remains unexecuted and identify a useful next validation step.

If Python is unavailable, do the predictions and conceptual checks without claiming executed evidence. A locally successful command only establishes the supplied model's behavior for the fixture. It does not establish production performance, permissions, costs or recovery.

## Ten outcomes to preserve

- Identity: a matching read rule does not satisfy the separate missing-owner teaching approval gate.
- Network: the route exists while the missing app-to-db policy edge blocks a permitted graph path.
- Storage: only the S3-shaped record matches the declared object requirements.
- Compute: two candidates remain feasible and the ambiguity deserves more requirements.
- Queues: duplicate delivery does not add a second business effect; failed work reaches a dead-letter outcome.
- Database: two candidates remain and real read/failover distinctions require closer investigation.
- Resilience: restoration time meets, recoverable-data age misses and survivor capacity is insufficient.
- Operations: three evidence categories are recognized and one record stays unknown.
- Cost: the synthetic total exceeds the threshold; it is not a hard cap.
- Capstone: preserve all gaps; deployment remains unapproved and real AWS execution remains false.

## Final review artifact

Write a short architecture decision record for a fictional upload-processing service. For each of the six Well-Architected pillars, provide a requirement, decision, rejected alternative, local evidence, unexecuted AWS check and residual risk. Add an owner and next step for unresolved approval, network policy, capacity, recovery and cost questions. Review [coverage and gaps](AWS-COVERAGE.md) and do not translate completion into an exam-readiness percentage.
