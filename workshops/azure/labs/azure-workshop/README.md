# Azure foundations: local reasoning workshop

Ten original Python standard-library exercises make administrative reasoning inspectable without a subscription, account, credential, SDK, CLI, browser, emulator, network request, or resource creation. These exercises produce JSON on stdout, read only their fixed bundled fixtures, and never modify an Azure environment. `real_azure_executed` is always `false`, including errors.

## Run

From this directory, run Python 3.10 or newer:

```sh
python run_lab.py hierarchy
python run_lab.py access
python run_lab.py governance
python run_lab.py storage
python run_lab.py network
python run_lab.py compute
python run_lab.py monitoring
python run_lab.py recovery
python run_lab.py cost
python run_lab.py capstone
```

From `workshops/azure`, run `python -m unittest discover -s tests -p test_azure_lab.py`.

There are no dependency installations. The command accepts exactly one of the ten names, not a path, URL, shell command, subscription identifier, or credential. All fixture identifiers and costs are synthetic. No background job, provisioning script, or cloud action exists.

## Learning sequence

1. Trace a resource's inherited scope chain.
2. Explain exact-action grants without equating this simplified model to Azure effective access.
3. Separate policy findings from protective management locks.
4. Compare redundancy and secondary-read requirements without declaring one universal best option.
5. Identify longest-prefix candidates and reason about two synthetic NSG layers.
6. Calculate capacity at a utilization target and identify a configured ceiling.
7. Distinguish an observed threshold breach from incomplete telemetry.
8. Order dependency-safe restore steps and compare recovery-point age to RPO.
9. Allocate decimal costs while exposing missing tags and budget overspend.
10. Assemble a review brief that includes risks and missing evidence, never approval.

Read [CONTRACTS.md](CONTRACTS.md) before changing fixture data. Work through [WORKSHEET.md](WORKSHEET.md), then check [ANSWER-KEY.md](ANSWER-KEY.md). Fixture edits are optional local practice with synthetic values only; the checked-in fixtures are the baseline used by the answer key and tests.

## What success means

A successful run demonstrates the local model's reasoning for supplied synthetic inputs. A passing test suite verifies these functions and CLI contracts. Neither verifies real Azure permissions, policy compliance, region/SKU availability, networking, backup integrity, service performance, invoice totals, or certification readiness. Any real Azure exercise is separate work requiring an appropriate environment, authorization, current official instructions, and real evidence.

These are Azure-specific foundations, not an exam simulator or a complete AZ-104 blueprint. Product capability details must be checked against the source register in [research/azure-sources.json](../../research/azure-sources.json) where supplied with the pack. Current exam task-date verification is separate from these stable concepts.
