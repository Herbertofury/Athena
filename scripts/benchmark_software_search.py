#!/usr/bin/env python3
"""Measure installed GNU grep and ripgrep on reproducible synthetic text.

No downloads, installation, user-data reads or performance pass/fail threshold.
Every timed output must match an independent Python byte-search oracle.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import platform
import random
import shutil
import statistics
import subprocess
import tempfile
import time

SEED = 20261115
NEEDLE = b"ATHENA_MATCH_271828"
MISSING = b"ATHENA_ABSENT_314159"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def corpus(root):
    rng = random.Random(SEED)
    # Plain UTF-8, LF line endings, regular files only. No real source tree or
    # confidential input is read. A hidden file and ignore file deliberately
    # check that both tools search the same universe.
    line = ("sample café record ".encode() + bytes(rng.choice(b"abcdef0123456789") for _ in range(100)))
    small = root / "many-small"; small.mkdir()
    for i in range(1600):
        folder = small / f"group-{i // 100:02d}"; folder.mkdir(exist_ok=True)
        rows = [line + f" file={i} line={j}".encode() + (b" " + NEEDLE if (i * 96 + j) % 997 == 0 else b"") + b"\n" for j in range(96)]
        (folder / f"sample-{i:04d}.txt").write_bytes(b"".join(rows))
    (small / ".hidden.txt").write_bytes(b"hidden " + NEEDLE + b"\n")
    (small / ".ignore").write_text("*.txt\n", encoding="utf-8")
    large = root / "large.txt"
    with large.open("wb") as stream:
        for i in range(240000):
            stream.write(line + f" line={i}".encode() + (b" " + NEEDLE if i % 997 == 0 else b"") + b"\n")
    dense = root / "dense.txt"
    with dense.open("wb") as stream:
        for i in range(50000): stream.write(line + b" " + NEEDLE + f" line={i}\n".encode())
    return [
        {"id": "many-small-selective", "path": "many-small", "needle": NEEDLE},
        {"id": "many-small-no-match", "path": "many-small", "needle": MISSING},
        {"id": "one-large-selective", "path": "large.txt", "needle": NEEDLE},
        {"id": "one-dense-output", "path": "dense.txt", "needle": NEEDLE},
    ]


def oracle(root, case):
    path = root / case["path"]
    files = sorted(path.rglob("*")) if path.is_dir() else [path]
    rows, total, hashed = [], 0, hashlib.sha256()
    files = [p for p in files if p.is_file()]
    for file in files:
        data = file.read_bytes(); total += len(data)
        name = file.relative_to(root).as_posix().encode()
        hashed.update(name + b"\0" + data)
        for number, line in enumerate(data.split(b"\n"), 1):
            if case["needle"] in line: rows.append(name + b":" + str(number).encode() + b":" + line)
    return {"canonical_output": b"\n".join(sorted(rows)), "matched_lines": len(rows),
            "file_count": len(files), "input_bytes": total, "corpus_sha256": hashed.hexdigest()}


def command(executable, name, case):
    if name == "gnu-grep":
        options = ["-r", "-F", "-n", "-H", "--binary-files=text", "--color=never"]
    else:
        options = ["--no-config", "--no-ignore", "--hidden", "--text", "--encoding", "none",
                   "--color", "never", "--no-heading", "--line-number", "--with-filename", "--fixed-strings"]
        if name == "ripgrep-one-thread": options += ["--threads", "1"]
    return [executable, *options, "--", case["needle"].decode(), case["path"]]


def execute(cmd, root, env, expected):
    start = time.perf_counter_ns()
    result = subprocess.run(cmd, cwd=root, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
    elapsed_ms = (time.perf_counter_ns() - start) / 1_000_000
    # Validation is outside the timing interval. Output collection is inside.
    canonical = b"\n".join(sorted(result.stdout.rstrip(b"\n").split(b"\n"))) if result.stdout else b""
    if result.returncode != (0 if expected["matched_lines"] else 1) or result.stderr or canonical != expected["canonical_output"]:
        raise RuntimeError("Output/exit-code oracle mismatch for " + " ".join(cmd) + ": " + result.stderr.decode(errors="replace")[:300])
    return elapsed_ms


def environment():
    result = {"os": platform.system(), "release": platform.release(), "architecture": platform.machine(),
              "python": platform.python_version(), "logical_cpus": os.cpu_count(),
              "cpu_affinity_count": len(os.sched_getaffinity(0)) if hasattr(os, "sched_getaffinity") else None,
              "load_average": list(os.getloadavg()) if hasattr(os, "getloadavg") else None}
    if Path("/proc/cpuinfo").exists():
        result["cpu_model"] = next((line.split(":", 1)[1].strip() for line in Path("/proc/cpuinfo").read_text().splitlines() if line.startswith("model name")), "unreported")
    for name in ("cpu.max", "memory.max"):
        path = Path("/sys/fs/cgroup") / name
        if path.exists(): result["cgroup_" + name.replace(".", "_")] = path.read_text().strip()
    return result


def benchmark(repeats=9):
    if repeats < 3: raise ValueError("Use at least three measured repetitions")
    executables = {"gnu-grep": shutil.which("grep"), "ripgrep-auto": shutil.which("rg"), "ripgrep-one-thread": shutil.which("rg")}
    if not all(executables.values()): raise RuntimeError("Install GNU grep and ripgrep separately before running this experiment")
    env = dict(os.environ, LC_ALL="C", LANG="C")
    for variable in ("RIPGREP_CONFIG_PATH", "GREP_OPTIONS", "GREP_COLORS"): env.pop(variable, None)
    versions = {}
    for name, executable in executables.items():
        version = subprocess.run([executable, "--version"], env=env, capture_output=True, text=True, check=True).stdout.strip()
        if name == "gnu-grep" and "GNU grep" not in version: raise RuntimeError("This experiment requires GNU grep, not another grep implementation")
        versions[name] = {"version_output": version, "executable_sha256": digest(Path(executable).read_bytes())}
    report = {"schema_version": 1, "experiment_id": "fixed-string-search-20261115", "measured_at": datetime.now(timezone.utc).isoformat(),
              "seed": SEED, "environment_start": environment(), "tools": versions, "repetitions": repeats, "warmup_runs_per_tool": 2,
              "method": "Warm filesystem cache; fixed-string, case-sensitive UTF-8 byte matching with C locale; all regular/hidden files searched; full filename:line:text output captured through a pipe; two warmups then interleaved measured subprocess runs. Startup and output transport are included. Sorting and correctness checks are excluded from timing.",
              "limitations": ["One shared Linux container; scheduler load, CPU quota, filesystem and caching can change results.",
                              "Synthetic plain-text workloads with no symlinks, binary data, regular expressions, encoding conversion or real repository ignore policy.",
                              "Exact installed versions and executable hashes are recorded; results do not compare every current release or platform.",
                              "No RAM, energy, security, accessibility, cold-cache or universal speed ranking is measured."], "cases": []}
    with tempfile.TemporaryDirectory(prefix="athena-search-experiment-") as directory:
        root = Path(directory)
        for case in corpus(root):
            expected = oracle(root, case)
            commands = {name: command(executable, name, case) for name, executable in executables.items()}
            timings = {name: [] for name in commands}
            for _ in range(2):
                for cmd in commands.values(): execute(cmd, root, env, expected)
            names = list(commands)
            run_order = []
            for repetition in range(repeats):
                ordered = names[repetition % len(names):] + names[:repetition % len(names)]
                run_order.append(ordered)
                for name in ordered: timings[name].append(execute(commands[name], root, env, expected))
            summary = {name: {"milliseconds": values, "median_ms": statistics.median(values), "min_ms": min(values), "max_ms": max(values)} for name, values in timings.items()}
            report["cases"].append({"id": case["id"], "file_count": expected["file_count"], "input_bytes": expected["input_bytes"],
                "corpus_sha256": expected["corpus_sha256"], "matched_lines": expected["matched_lines"],
                "expected_output_sha256": digest(expected["canonical_output"]), "oracle_passed_every_run": True,
                "commands": {name: [Path(cmd[0]).name, *cmd[1:]] for name, cmd in commands.items()}, "measured_order": run_order, "results": summary})
    report["environment_end"] = environment()
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--repeats", type=int, default=9)
    args = parser.parse_args()
    result = benchmark(args.repeats)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(args.output), "cases": [{"id": c["id"], "matched_lines": c["matched_lines"], "median_ms": {name: round(r["median_ms"], 3) for name, r in c["results"].items()}} for c in result["cases"]]}, indent=2))
