"""Compare the previous collector and this candidate over complete loopback HTTP.

No external services, credentials, or candidate software are used. Run from the
repository root with --output PATH. The baseline is an immutable source commit.
"""
import argparse
import hashlib
import importlib.util
import json
import platform
import statistics
import subprocess
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
BASE = "7d335a740ea92a66674bf4412c48f5e03faf6e9f"
SOURCE = "guidance/tools/web_acquisition_watch.py"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    old_source = subprocess.check_output(["git", "show", f"{BASE}:{SOURCE}"], cwd=ROOT, text=True)
    baseline = {"__file__": str(ROOT / SOURCE), "__name__": "baseline"}
    exec(compile(old_source, SOURCE, "exec"), baseline)
    spec = importlib.util.spec_from_file_location("candidate", ROOT / SOURCE)
    candidate = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(candidate)
    state = {"requests": 0, "bytes": 0, "active": 0, "peak": 0}
    lock = threading.Lock()

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def do_GET(self):
            with lock:
                state["requests"] += 1
                state["active"] += 1
                state["peak"] = max(state["peak"], state["active"])
            try:
                time.sleep(0.015)  # Fixed server latency, identical complete work.
                if self.path.startswith("/repos/"):
                    payload = {"tag_name": "v2", "draft": False, "prerelease": False,
                               "published_at": "2026-11-25T00:00:00Z", "html_url": "https://example.test/v2"}
                else:
                    payload = {"total_count": 3, "incomplete_results": False, "items": [
                        {"full_name": f"discovered/item{i}", "private": False,
                         "html_url": f"https://example.test/{i}", "pushed_at": "2026-11-25",
                         "license": {"spdx_id": "MIT"}} for i in range(3)]}
                body = json.dumps(payload).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                with lock:
                    state["bytes"] += len(body)
            finally:
                with lock:
                    state["active"] -= 1

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()

    def fetch(endpoint, fields=()):
        url = f"http://127.0.0.1:{server.server_port}/{endpoint}"
        if fields:
            url += "?" + urlencode([tuple(field.split("=", 1)) for field in fields])
        with urlopen(url, timeout=5) as response:
            return json.load(response), None

    catalog = {"schemaVersion": 1, "watch": [
        {"repository": f"fixture/item{i}", "initialRelease": {"tag": "v1"}} for i in range(32)]}
    observations = []
    expected = None
    try:
        for repeat in range(5):
            order = ["baseline", "candidate"] if repeat % 2 == 0 else ["candidate", "baseline"]
            for name in order:
                with lock:
                    state.update(requests=0, bytes=0, active=0, peak=0)
                start, cpu = time.perf_counter(), time.process_time()
                result = (baseline["collect"](catalog, fetch) if name == "baseline"
                          else candidate.collect(catalog, fetch, workers=4))
                elapsed, cpu = time.perf_counter() - start, time.process_time() - cpu
                comparable = {"releases": result["releases"], "discovery": [
                    {key: row[key] for key in ["category", "query", "status", "candidates", "incompleteResults"]}
                    for row in result["discovery"]]}
                if expected is None:
                    expected = comparable
                assert comparable == expected, "Complete output changed"
                assert state["requests"] == 35 and state["active"] == 0
                observations.append({"mode": name, "repeat": repeat, "seconds": elapsed,
                                     "cpuSeconds": cpu, **state})
    finally:
        server.shutdown()
        server.server_close()
        thread.join()
    summary = {}
    for mode in ["baseline", "candidate"]:
        rows = [row for row in observations if row["mode"] == mode]
        summary[mode] = {"medianSeconds": statistics.median(row["seconds"] for row in rows),
                         "medianCpuSeconds": statistics.median(row["cpuSeconds"] for row in rows),
                         "requests": sorted({row["requests"] for row in rows}),
                         "bodyBytes": sorted({row["bytes"] for row in rows}),
                         "peakConcurrentRequests": max(row["peak"] for row in rows)}
    report = {"baselineCommit": BASE, "candidateSourceSha256": hashlib.sha256((ROOT / SOURCE).read_bytes()).hexdigest(),
              "python": sys.version, "platform": platform.platform(), "transport": "real loopback HTTP",
              "fixtureDelayMs": 15, "releaseRows": 32, "discoveryCandidatesPerCategory": 3,
              "completeOutputEquivalent": True, "summary": summary, "runs": observations,
              "limitations": "Local fixed-latency fixture, not live GitHub throughput or a whole-app benchmark. CPU includes fixture server; peak RSS not isolated."}
    report["latencySpeedup"] = summary["baseline"]["medianSeconds"] / summary["candidate"]["medianSeconds"]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("x") as stream:
        json.dump(report, stream, indent=2)
        stream.write("\n")
    print(json.dumps({"summary": summary, "latencySpeedup": report["latencySpeedup"], "completeOutputEquivalent": True}))


if __name__ == "__main__":
    main()
