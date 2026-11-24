# Ranked recommendations

### Choose the strongest fit. Reject the wrong tradeoff.

**Reviewed October 26, 2026.** Rankings are project-neutral and scoped by workload. “Fastest in this test” is different from “best default.” A correctness or compatibility failure overrides a timing win.

## Read the evidence

| Decision desk | What is inside |
|---|---|
| [Best choices and avoid guidance](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/ranked-recommendations.md) | Ten ranked use cases, disqualifiers and adoption rules |
| [Measured JSON lab](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/json-lab/README.md) | Three libraries, nine measured cases, raw samples and twelve semantic probes |
| [2026 papers and Codeberg-linked methods](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/paper-watchlist-2026.md) | Practical readiness ranking, source claims and unreproduced limits |
| [Worker-sweep tool](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/worker-sweep-tool.md) | Full 4/8/16/32/64 comparison with correctness and resource/UX gates |

## Current measured shortlist

| Scope | First | Next | Avoid |
|---|---|---|---|
| Tested Python JSON speed, shared supported values | orjson 3.13.0 | ujson 6.0.0, then standard json | Extrapolating to untested inputs or platforms |
| Exact Python integers above 64 bits | Standard json in this comparison | A separately validated alternative | The tested orjson decode path, which rounded a large integer |
| New parser adoption | Contract-compatible implementation with maintained support | Existing correct baseline | Treating a marketing superlative as a migration decision |
| Worker count | Smallest near-fastest setting that passes every gate | Keep known-good default if none qualify | Automatically choosing 64 |

The measured lab uses generated data on one Linux x86_64 environment. It is not a Windows, embedded-runtime or application benchmark. All three default decoders collapsed duplicate keys in the probe; speed does not supply a duplicate-key policy.

## Simulation and spatial methods

[Current Bevy/Jolt constraints and method rankings](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/simulation-and-spatial-methods.md) · [Measured spatial lab](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/spatial-lab/README.md)

The original integer-lattice test preserves exact overlap results while exposing opposite outcomes: a grid wins on sparse objects but loses on dense and mixed-size inputs. No game-engine or GPU benchmark is implied.

## Best coding and release evidence

[Ranked verification methods and 2026 coding research](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/code-quality-and-evidence.md): independent behavior contracts, security gates, reviewer precision/recall and artifact provenance. External coding-agent benchmarks are reviewed, not claimed as locally reproduced.

## Worker transport and ownership

[Ownership-safe transport guidance](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/worker-transport-and-ownership.md) · [Measured Node roundtrips](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/worker-transport-lab/README.md)

The experiment keeps complete payloads and distinguishes retaining the sender’s original from transferring exclusive ownership. Node worker results are not assumed to apply to Electron utilityProcess or native-service IPC.

## Database index tradeoffs

[Query-shaped SQLite decisions](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/sqlite-index-decisions.md) · [Measured read/write/footprint lab](https://github.com/Herbertofury/Engineering-Atlas/blob/main/experiments/sqlite-index-lab/README.md)

A targeted index improved selective reads but increased update cost and allocated database pages. Full-table reads did not establish a meaningful win. Complete results and rollback state were checked; this is an in-memory experiment, not a durability or application benchmark.

## Evidence badges

- **Measured locally:** executable harness and retained raw observations.
- **Primary documented:** upstream behavior/release statement, not a local win.
- **Research candidate:** paper or prototype worth testing; not reproduced or accepted here.
- **Avoid for this scope:** a specific disqualifier, not a claim that a project is universally bad.

## Always keep

Complete results · Exact identifiers · Visible errors · Security checks · Reproducible revisions · Honest uncertainty

[Home](https://github.com/Herbertofury/Engineering-Atlas/wiki) · [Research method](https://github.com/Herbertofury/Engineering-Atlas/wiki/Research-Method) · [Primary sources](https://github.com/Herbertofury/Engineering-Atlas/wiki/Research-Library)
