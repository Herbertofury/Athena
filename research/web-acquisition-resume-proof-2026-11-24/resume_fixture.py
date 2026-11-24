#!/usr/bin/env python3
"""Measure exact downloaded bytes on a synthetic loopback HTTP origin. No arguments or third-party access."""
import hashlib
import http.client
import json
import platform
import re
import shutil
import statistics
import subprocess
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

TOTAL = 8 * 1024 * 1024
PREFIX = 3 * 1024 * 1024
V1 = hashlib.shake_256(b"athena-transfer-fixture-original").digest(TOTAL)
V2 = hashlib.shake_256(b"athena-transfer-fixture-replacement").digest(TOTAL)
SHA = {"old": hashlib.sha256(V1).hexdigest(), "new": hashlib.sha256(V2).hexdigest()}
SCENARIOS = ("unchanged", "replaced", "no_ranges", "already_complete")


class Origin(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_GET(self):
        mode = self.path.removeprefix("/")
        if mode not in SCENARIOS:
            self.send_error(404)
            return
        body, tag = (V2, '"new"') if mode == "replaced" else (V1, '"old"')
        start = None
        header = self.headers.get("Range")
        match = re.fullmatch(r"bytes=(\d+)-", header or "")
        if match and mode != "no_ranges" and self.headers.get("If-Range") == tag:
            start = int(match[1])
        self.server.payloads.append((mode, header, self.headers.get("If-Range")))
        if start is not None and start >= len(body):
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{len(body)}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        payload = body[start:] if start is not None else body
        self.send_response(206 if start is not None else 200)
        self.send_header("ETag", tag)
        self.send_header("Content-Length", str(len(payload)))
        if start is not None:
            self.send_header("Content-Range", f"bytes {start}-{len(body)-1}/{len(body)}")
        self.end_headers()
        self.wfile.write(payload)


def transfer(backend, port, mode, headers, out):
    if backend == "python":
        c = http.client.HTTPConnection("127.0.0.1", port, timeout=4)
        try:
            c.request("GET", "/" + mode, headers=headers)
            r = c.getresponse()
            fields = dict((k.lower(), v) for k, v in r.getheaders())
            if len(r.getheaders()) != len(fields):
                raise AssertionError("duplicate header")
            with out.open("xb") as f:
                shutil.copyfileobj(r, f, length=256 * 1024)
            return r.status, fields
        finally:
            c.close()
    h = out.with_suffix(".headers")
    cmd = ["curl", "-q", "--noproxy", "*", "--max-time", "4", "--silent", "--show-error",
           "--dump-header", str(h), "--output", str(out),
           "--write-out", "%{http_code}", f"http://127.0.0.1:{port}/{mode}"]
    for k, v in headers.items():
        cmd.extend(["--header", f"{k}: {v}"])
    p = subprocess.run(cmd, check=True, text=True, capture_output=True, timeout=5)
    lines = h.read_text().strip().splitlines()
    fields = dict((k.lower(), v.strip()) for k, v in (line.split(":", 1) for line in lines[1:]))
    assert len(lines) - 1 == len(fields)
    return int(p.stdout), fields


def run_case(root, backend, port, mode):
    stage = root / "source.part"
    original = V1 if mode == "already_complete" else V1[:PREFIX]
    stage.write_bytes(original)
    chunk = root / "candidate.chunk"
    trial = root / "candidate.complete"
    saved = len(original)
    begin = time.perf_counter_ns()
    status, response = transfer(backend, port, mode, {"Range": f"bytes={saved}-",
                                                     "If-Range": '"old"', "Accept-Encoding": "identity"}, chunk)
    assert response.get("content-encoding", "identity") == "identity"
    size = chunk.stat().st_size
    assert int(response["content-length"]) == size
    if mode == "unchanged":
        assert status == 206 and response["etag"] == '"old"'
        assert response["content-range"] == f"bytes {saved}-{TOTAL-1}/{TOTAL}"
        assert size == TOTAL - saved
        with trial.open("xb") as dest:
            for source in (stage, chunk):
                with source.open("rb") as src:
                    shutil.copyfileobj(src, dest, length=256 * 1024)
        result, desired = trial, "old"
    elif mode in ("replaced", "no_ranges"):
        assert status == 200 and size == TOTAL and "content-range" not in response
        desired = "new" if mode == "replaced" else "old"
        assert response["etag"] == '"' + desired + '"'
        result = chunk  # Complete response is never appended to the old partial.
    else:
        assert status == 416 and response["content-range"] == f"bytes */{TOTAL}" and size == 0
        result, desired = stage, "old"  # The local content still has to be verified.
    with result.open("rb") as file:
        digest = hashlib.file_digest(file, "sha256").hexdigest()
    assert result.stat().st_size == TOTAL and digest == SHA[desired]
    elapsed = (time.perf_counter_ns() - begin) / 1e6
    assert stage.read_bytes() == original
    return {"status": status, "responseBytes": size, "resultSha256": digest,
            "preservedOriginal": True, "complete_verified_ms": elapsed}


def main():
    assert shutil.which("curl"), "installed curl required"
    version = subprocess.check_output(["curl", "--version"], text=True, timeout=4).splitlines()[0]
    out = {"scope": "synthetic_loopback_http11_exact_bytes_no_external_network", "python": platform.python_version(),
           "curl": version, "totalBytes": TOTAL, "prefixBytes": PREFIX, "rounds": 9, "results": {}}
    with ThreadingHTTPServer(("127.0.0.1", 0), Origin) as server, tempfile.TemporaryDirectory() as temp:
        server.payloads = []
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            for run in range(9):
                backends = ("curl", "python") if run % 2 == 0 else ("python", "curl")
                for mode in SCENARIOS:
                    for backend in backends:
                        folder = Path(temp) / f"{run}-{backend}-{mode}"
                        folder.mkdir()
                        evidence = run_case(folder, backend, server.server_port, mode)
                        k = backend + "/" + mode
                        info = out["results"].setdefault(k, {"samples_ms": [], **{a:b for a,b in evidence.items() if not a.endswith("_ms")}})
                        info["samples_ms"].append(round(evidence["complete_verified_ms"], 3))
                        shutil.rmtree(folder)
        finally:
            server.shutdown()
            thread.join(timeout=6)
        assert len(server.payloads) == 72
        assert all(x[2] == '"old"' for x in server.payloads)
        assert all(x[1] == f"bytes={TOTAL if x[0]=='already_complete' else PREFIX}-" for x in server.payloads)
    for rec in out["results"].values():
        vals = rec.pop("samples_ms")
        rec.update(median_ms=round(statistics.median(vals), 3), min_ms=min(vals), max_ms=max(vals), samples_ms=vals)
    print(json.dumps(out, sort_keys=True, indent=2))


if __name__ == "__main__":
    main()
