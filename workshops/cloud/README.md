# Athena Cloud Workshop

**Reason Locally, Verify Honestly** is an original cloud fundamentals module with eight lessons, 24 explained checks and eight safe local exercise commands. It teaches how to reason about a small fictional service before creating real resources.

Start with **START-HERE.html**, a self-contained reading guide that opens in a browser without a server or internet connection. It includes all lessons, checks, instructions, worksheet and answer key. Alternatively, use the [learning path](docs/paths/cloud-workshop.md) and [lab guide](labs/cloud-workshop/README.md).

## What you practice

- Classify cloud characteristics, service models and deployment models.
- Assign responsibilities and compare resource scopes.
- Separate network assumptions, application access and storage interfaces.
- Calculate scaling, failure-domain headroom, recovery gaps and fictional costs.
- Perform an actual copy/restore of synthetic files in an owned temporary directory.
- Review an invented desired-state change without applying anything.

**Real-cloud labs are unexecuted.** This pack creates no accounts, credentials, access grants, billable resources or deployments. Seven commands are explicitly local models. Only the restore command performs an actual local file exercise. None connects to a cloud service.

## Run locally

Use Python 3.10 or later with only the standard library. From the extracted pack directory:

```sh
python3 labs/cloud-workshop/run_lab.py scaling
python3 labs/cloud-workshop/run_lab.py restore
python3 -m unittest discover -s tests -v
```

The [lab guide](labs/cloud-workshop/README.md) lists all eight commands, expected outcomes and safe variations. If Python is unavailable, use the worksheet on paper and label your results as predictions rather than execution. No account signup, CLI installer, container runtime or administrative access is needed.

Tested on Python 3.12.14/Linux. Other operating systems and interpreter versions are not verified. The models do not emulate provider IAM, networking, autoscaling, billing or deployment. This is not a complete cloud course, exam-readiness score or production assessment. Read [coverage and gaps](docs/CLOUD-COVERAGE.md) before interpreting the results.

All examples and checks are original. [Official source records](research/cloud-sources.json) distinguish vendor documentation from the pack’s invented schema and scenarios. Provider references require internet only if you choose to open them.
