# CCNA foundations: bounded offline reasoning workshop

These ten original exercises use invented records to expose reasoning mistakes. They do **not** contact equipment, run IOS, emulate switches or routers, capture or inject packets, perform RF measurements, or establish certification readiness. Every CLI success and error includes `real_network_executed: false` and `synthetic_model: true`.

## Run

Python 3.12, standard library only. From this directory:

```sh
python3 -B run_lab.py vlans
python3 -B run_lab.py loop-control
python3 -B run_lab.py bundles
python3 -B run_lab.py ipv6
python3 -B run_lab.py routing
python3 -B run_lab.py ospf
python3 -B run_lab.py services
python3 -B run_lab.py wireless
python3 -B run_lab.py automation
python3 -B run_lab.py capstone
python3 -B -m unittest discover -s ../../tests -p test_ccna_lab.py -v
```

There is no installation, login, equipment address, network permission, or third-party package. The CLI accepts exactly one name above, reads that package-owned fixture, and prints JSON. It does not accept a filename, stdin, URL, network target, or additional flags. `-B` and the modules' bytecode setting prevent `.pyc` writes. You may run from another working directory by giving the script's path.

Start with the [worksheet](WORKSHEET.md). Predict before running, compare against the [answer key](ANSWER-KEY.md), and consult the [precise contracts and limitations](CONTRACTS.md). Each command has its own readable [fixture](fixtures/). Exercises asking for variations mean editing an in-memory copy in a local Python test, not changing or configuring real equipment. The CLI continues to use only the packaged examples.

## Learning map

| Command | Reasoning exercise | Important limit |
|---|---|---|
| `vlans` | VLAN-scoped learning, unknown-unicast flooding, allowed-list intersection | No tagging/native VLAN, STP, aging, broadcast or multicast |
| `loop-control` | Lowest supplied bridge identifier, root costs, equal-cost uncertainty | One common VLAN; not full STP/RSTP port election |
| `bundles` | Compatibility against a reference member, active/passive pairs | No LACP negotiation, hashing or operational bundle |
| `ipv6` | Prefix membership, address category, limited neighbor observations | No ND exchange, DAD, SLAAC, scope-zone inference |
| `routing` | Same-prefix administrative distance then longest-prefix forwarding | Supplied availability only; no silent-failure detection |
| `ospf` | Prerequisite evidence and shortest costs on an invented graph | No neighbor state machine, DR/BDR or learned LSDB |
| `services` | First-match ACL and independent static NAT lookup | No ACL/NAT processing-order or reachability conclusion |
| `wireless` | Capability/security policy and simplified channel relationships | Only 2.4 GHz channels 1–11/20 MHz; no RF survey |
| `automation` | Typed desired-state diff and dependency ordering | No HTTP, controller, configuration, deletion or deployment |
| `capstone` | Independent observations, contradictions and gaps | A collection of assertions cannot prove end-to-end success |

## Evidence and boundaries

Success means only that a deterministic model completed. It does not prove a vendor command is correct, a live network works, an authorization exists, or a learner is ready for an exam. Costs, AD values, identifiers and observations are explicitly supplied synthetic inputs; they are not claimed device defaults. Read the workshop's [source register](../../research/ccna-sources.json) for official reference context and retrieval limitations.

Tests cover worked results, pure/repeatable behavior, type boundaries, duplicate and orphan records, dependency cycles, equal-cost paths, malformed/duplicate/nonfinite/deep/oversized JSON, fixed CLI restrictions and predictable error envelopes. Graph cycles are valid for SPF/STP cost analysis; dependency cycles are rejected. See [tests](../../tests/test_ccna_lab.py).
