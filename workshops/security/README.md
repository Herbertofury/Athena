# Athena Security Foundations

Original security foundations with a complete offline learner pack. This copy is included in the combined local Athena workshop build; publication is a separate step.

Start with [Security Foundations: Evidence Before Assumptions](docs/paths/security-foundations.md). The pack contains ten connected lessons, 30 original checks, six bounded offline commands, a worksheet, a cumulative tabletop and a reasoned answer key.

Read [coverage and limits](docs/SECURITY-COVERAGE.md), [safe lab instructions](labs/security-foundations/README.md). No real accounts, credentials, customer records, scanning, network connections or security-setting changes are required. No claim of complete Security+ readiness is made.

## Build and test the content pack

```sh
python3 scripts/render_security_pack.py
python3 -m unittest discover -s tests -p 'test_security_foundations.py' -v
```

The combined Athena workshop interface displays the complete lessons and all three original checks. The primary check uses Athena’s existing progress and review schedule; the two supplemental checks are session practice with no additional XP. This standalone pack also retains all checks and explanations.
