# Fixed-string text search: a bounded measurement

This experiment measures **GNU grep 3.11** and **ripgrep 15.2.0 (e89fff89ac)** on four reproducible synthetic workloads. It establishes the results below for this run; it does not establish a universal fastest search tool. The current GNU manual describes 3.12, which was not the installed version tested here.

The two tools produced the same complete filename, line-number and matched-text output as an independent Python byte-search oracle on every warmup and timed run. The no-match case also returned the correct exit status. Hidden-file and ignore-file fixtures confirm that the search universe was aligned. There were 132 successful tool invocations: four cases, three configurations, two warmups and nine measured repetitions.

## Measured results

All values are milliseconds. Each cell is **median [minimum–maximum]** across nine interleaved repetitions. The full timings, exact commands, executable hashes, corpus hashes and output hashes are in [search-benchmark.json](search-benchmark.json).

| Workload | Input | Matched lines | GNU grep | ripgrep automatic threads | ripgrep one thread |
| --- | ---: | ---: | ---: | ---: | ---: |
| many-small-selective | 21,230,973 bytes / 1,602 files | 156 | 12.746 [10.953–34.459] | 9.430 [6.706–13.720] | 9.904 [8.559–17.069] |
| many-small-no-match | 21,230,973 bytes / 1,602 files | 0 | 12.597 [10.782–15.168] | 7.205 [6.654–9.186] | 9.903 [8.207–11.102] |
| one-large-selective | 31,813,710 bytes / 1 files | 241 | 11.831 [11.493–12.837] | 5.455 [4.724–6.913] | 4.912 [4.398–10.238] |
| one-dense-output | 7,588,890 bytes / 1 files | 50,000 | 17.988 [15.726–21.631] | 19.407 [15.558–28.828] | 17.787 [16.018–24.182] |

The selective and no-match workloads favor ripgrep in the observed medians. The dense-output case spends substantial time producing and transporting 50,000 matching lines, and the observed ranges overlap. A change in thread setting is not consistently beneficial across these workloads. These are descriptive measurements, without a statistical-significance or generalized performance claim.

## Method and limits

- Seed: `20261115`. Synthetic UTF-8 regular files with LF endings; no user documents or real repositories.
- Environment: Linux x86-64, kernel 6.18.57, AMD EPYC 9V74, nine logical CPUs visible to this process, Python 3.12.14. This is a shared container. CPU quota and physical-core allocation were not established.
- Both tools search all regular and hidden files without repository-ignore filtering. Matching is case-sensitive fixed-string search with the C locale; full filename/line/text output is collected through a pipe.
- Timings include process startup, search and output transport. The independent oracle, output canonicalization and correctness comparisons run outside the measured interval.
- Two warmups per tool and case precede nine measurements. A rotating order balances which configuration runs first. Filesystem cache is warm; no cache flushing or system configuration changes occur.
- Binary data, symlinks, regex workloads, encoding conversion, cold storage, memory, battery use, security and accessibility are outside the experiment.

## Reproduce

Install the two tools through your usual trusted package route, then run:

```sh
python3 scripts/benchmark_software_search.py --output search-benchmark-local.json --repeats 9
```

The script uses already installed executables, creates only temporary synthetic inputs, checks every complete output and deletes the corpus afterward. It records actual versions and executable hashes and refuses a non-GNU grep implementation. It does not install or update software and has no performance threshold. Different environments or tool versions can legitimately produce different timings; compare correctness and methodology before timing ratios.

## Primary documentation

- [GNU grep manual](https://www.gnu.org/software/grep/manual/grep.html): matching, file selection, output and locale semantics.
- [ripgrep official guide](https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md): recursive search and default filtering.
- [GNU grep 3.12 release announcement](https://lists.gnu.org/archive/html/info-gnu/2025-04/msg00008.html): distinguishes the documented stable release from tested 3.11.

The catalog links this experiment separately from documentation-reviewed product records. Its measured scope does not upgrade unrelated capabilities or maintenance claims.
