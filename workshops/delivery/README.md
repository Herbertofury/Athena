# Athena Version Control & Reproducible Delivery Workshop

Eight connected original lessons, 24 explained checks and eight **actual local Git** exercises turn a short Git/testing overview into inspectable practice. This is an additive review candidate. These lessons and exercises are not yet registered in Athena's main catalog, navigation, progress system or built-in downloads. Open the local study reference directly; catalog integration remains pending.

Start with [the learning path](docs/paths/delivery-workshop.md), or the script-free [local study reference](START-HERE.html). Then read the [lab guide](labs/delivery-workshop/README.md), complete the [worksheet](labs/delivery-workshop/WORKSHEET.md), and compare the [answer key](labs/delivery-workshop/ANSWER-KEY.md).

## What you will practice

1. Compare immutable snapshots and distinguish working tree, index and HEAD.
2. Inspect the staged diff separately from later working changes.
3. Integrate two divergent branches and verify both changes.
4. Observe and explicitly resolve a deliberate same-line merge conflict.
5. Revert a mistaken commit additively while preserving its history.
6. Tie fixed local tests to an exact clean revision and reject stale evidence.
7. Build an in-memory deterministic source archive and explain hash limits.
8. Reconcile a local candidate's source, tests and artifact into a defensible handoff.

## Execution boundary

Verified here on **Linux, Python 3.12.14 and Git 2.52.0**. Only Python's standard library is used. The trusted runner chooses Git from fixed system locations rather than inherited PATH; see [CONTRACTS.md](labs/delivery-workshop/CONTRACTS.md). Other platforms and versions remain unverified. Missing tools fail closed. Use the paper worksheet rather than connecting a real repository as a workaround.

From this workshop directory:

```sh
python3 labs/delivery-workshop/run_lab.py snapshots
python3 labs/delivery-workshop/run_lab.py staging
python3 labs/delivery-workshop/run_lab.py branches
python3 labs/delivery-workshop/run_lab.py conflict
python3 labs/delivery-workshop/run_lab.py recovery
python3 labs/delivery-workshop/run_lab.py revision-tests
python3 labs/delivery-workshop/run_lab.py provenance
python3 labs/delivery-workshop/run_lab.py capstone
python3 -m unittest discover -s tests -v
```

Every run creates a fresh owned temporary repository with synthetic identity and fixed files. Inherited Git settings are excluded; templates, hooks, signing, credential helpers and network protocols are disabled. The CLI accepts only fixed exercise names, never a repository path or arbitrary command. Ordinary cleanup removes only the owned temporary directory. This is a trusted fixed runner, **not** a sandbox for arbitrary hostile code or an independent OS network audit.

A temporary local commit is not remote publication. No user repository, remote, password, signing key, hosted CI workflow or production system is used. Test and artifact evidence applies only to the bounded scenario and recorded environment. The source archive demonstration remains in memory and is not a saved release.

## Content and sources

- `scripts/delivery_content.py` exposes `LESSONS` and `PATH` for the app. Importing it performs no Git or filesystem operations.
- `scripts/render_delivery_content.py` regenerates local JSON/reference documents only when run explicitly.
- `research/delivery-sources.json` records official Git, Python and GitHub Actions pages reviewed November 7, 2026, with the exact facts they support.
- [Coverage and limits](docs/DELIVERY-COVERAGE.md) separates executed exercises, taught concepts and unexecuted capabilities.

All narratives, fixtures, checks, worksheets and teaching contracts are original. This workshop claims neither certification coverage nor production or supply-chain assurance.
