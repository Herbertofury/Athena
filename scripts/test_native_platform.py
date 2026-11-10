"""Real native process/HTTP checks using disposable state; never launches a browser.

Windows termination is deliberately labelled forced process termination, not a
graceful shutdown or crash/power-loss guarantee. No provider requests are made.
"""
import argparse
import hashlib
import http.client
import json
import os
from pathlib import Path
import platform
import shutil
import signal
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time

HOST, PORT = "127.0.0.1", 41379
ORIGIN = f"http://{HOST}:{PORT}"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(binary, package, output, source_commit):
    binary, package, output = binary.resolve(), package.resolve(), output.resolve()
    if not binary.is_file() or not package.is_dir():
        raise ValueError("An existing native binary and verified package are required")
    output.mkdir(parents=True, exist_ok=False)
    state = Path(tempfile.mkdtemp(prefix="Athena native state "))
    runtime = state / "verified runtime with spaces"
    shutil.copytree(package, runtime)
    database = state / "synthetic journal.sqlite"
    report = {
        "schema": 1, "result": "running", "sourceCommit": source_commit,
        "platform": sys.platform, "machine": platform.machine(),
        "python": platform.python_version(), "binarySha256": digest(binary),
        "manifestSha256": digest(runtime / "athena-runtime-manifest.json"),
        "checks": [], "processes": [], "stateDirectory": str(state),
        "limitations": ["No browser or user-interface acceptance", "No original user data",
                        "No provider authorization/playback or external requests",
                        "No installer, ARM64, macOS, or power-loss acceptance",
                        "Windows Foundry snapshots remain unsupported"],
    }
    proc, log = None, None

    def check(name, condition):
        if not condition:
            raise AssertionError(name)
        report["checks"].append(name)

    def request(path, method="GET", body=None, headers=None, expected=200):
        h = {"Host": f"{HOST}:{PORT}"}
        if method == "POST":
            h.update({"Origin": ORIGIN, "X-Atlas-Request": "local-ui",
                      "Content-Type": "application/json"})
        h.update(headers or {})
        conn = http.client.HTTPConnection(HOST, PORT, timeout=10)
        try:
            conn.request(method, path, body=body, headers=h)
            response = conn.getresponse()
            data, response_headers = response.read(), dict(response.getheaders())
            if response.status != expected:
                raise AssertionError(f"{method} {path}: {response.status}, expected {expected}: {data[:200]!r}")
            return data, response_headers
        finally:
            conn.close()

    def stop():
        nonlocal proc, log
        owned, stream = proc, log
        proc, log = None, None
        try:
            if owned is None:
                return
            if owned.poll() is not None:
                report["processes"][-1]["exitCode"] = owned.returncode
                raise AssertionError(f"Owned server exited before controlled stop: {owned.returncode}")
            if os.name == "nt":
                owned.terminate()
                method = "forced Windows process termination after committed writes"
            else:
                owned.send_signal(signal.SIGINT)
                method = "SIGINT"
            try:
                owned.wait(timeout=20)
            except subprocess.TimeoutExpired:
                owned.kill()
                owned.wait(timeout=10)
                raise AssertionError("Owned server failed to stop within deadline")
            report["processes"][-1].update(stopMethod=method, exitCode=owned.returncode)
            if os.name != "nt":
                check("Owned server handles SIGINT cleanly", owned.returncode == 0)
        finally:
            if stream is not None:
                stream.close()

    def start():
        nonlocal proc, log
        # Never connect to or terminate an unknown process occupying the fixed port.
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            probe.bind((HOST, PORT))
        index = len(report["processes"]) + 1
        log = (output / f"server-{index}.log").open("wb")
        proc = subprocess.Popen([str(binary), "serve-athena", str(database), str(runtime)],
                                stdout=log, stderr=subprocess.STDOUT, cwd=state)
        report["processes"].append({"pid": proc.pid, "start": index})
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline:
            if proc.poll() is not None:
                raise AssertionError(f"Owned server exited before readiness: {proc.returncode}")
            try:
                data, _ = request("/api/runtime")
                if proc.poll() is not None:
                    raise AssertionError("Owned server exited while readiness was being checked")
                return json.loads(data)
            except (ConnectionRefusedError, ConnectionResetError, TimeoutError):
                time.sleep(0.05)
        raise AssertionError("Owned server readiness deadline exceeded")

    try:
        with sqlite3.connect(database) as conn:
            conn.execute("CREATE TABLE unrelated_fixture(id INTEGER PRIMARY KEY, value BLOB)")
            conn.execute("INSERT INTO unrelated_fixture VALUES(1, ?)", (b"untouched\x00fixture",))
        manifest = json.loads((runtime / "athena-runtime-manifest.json").read_text())
        meta = start()
        check("Runtime is loopback-only, same-origin and disables external media",
              meta["loopback_only"] and meta["same_origin_only"] and not meta["external_media"])
        check("Runtime manifest identity matches exact verified package",
              meta["runtime_manifest_sha256"] == report["manifestSha256"])
        served = []
        for entry in manifest["files"]:
            path = entry["path"]
            local = (runtime / path).read_bytes()
            check(f"Local manifest identity: {path}",
                  len(local) == entry["bytes"] and hashlib.sha256(local).hexdigest() == entry["sha256"])
            if path == ".nojekyll":
                request("/.nojekyll", expected=404)
                continue
            data, headers = request("/" + path)
            check(f"Exact immutable asset: {path}", data == local and
                  headers.get("x-athena-asset-sha256") == entry["sha256"])
            served.append(path)
        report["servedAssets"] = len(served)
        check("Root entry matches verified index", request("/")[0] == (runtime / "index.html").read_bytes())
        _, headers = request("/app.js")
        check("CSP, no-sniff and no-cache boundary retained",
              "connect-src 'self'" in headers.get("content-security-policy", "") and
              headers.get("x-content-type-options") == "nosniff" and headers.get("cache-control") == "no-store")
        request("/app.js", headers={"Host": "evil.example"}, expected=403)
        request("/api/foundry/history", "POST", b'{}', {"Origin": "https://evil.example"}, 403)
        request("/api/foundry/history", "POST", b'{}', {"X-Atlas-Request": "wrong"}, 403)
        request("/undeclared.sqlite", expected=404)
        check("Host, Origin, request marker and undeclared-file protections", True)
        capabilities = json.loads(request("/api/foundry/capabilities")[0])
        report["capabilities"] = capabilities
        expected_state = "not_configured" if sys.platform == "linux" else "unsupported_platform"
        check("Snapshot capability truthfully reports this platform",
              capabilities["snapshot"]["state"] == expected_state and
              capabilities["snapshot"]["supportedPlatform"] == "linux" and
              not capabilities["snapshot"]["available"])
        snapshot_status = 503 if sys.platform == "linux" else 501
        request("/api/foundry/snapshot", expected=snapshot_status)
        request("/api/foundry/snapshot", "POST", b'{}', expected=snapshot_status)
        check("Unavailable snapshots fail closed for read and write", True)
        catalog = json.loads(request("/api/foundry/catalog")[0])
        check("Original Foundry catalog is available", catalog["durableThemes"] > 0)
        report["catalog"] = catalog
        check("Original music route catalog is available", bool(json.loads(request("/api/foundry/music-routes")[0])))
        payload = '{ "synthetic": true, "label": "native restart" }'
        record = json.loads(request("/api/foundry/history", "POST", json.dumps({
            "eventType": "native-platform-smoke", "payloadJson": payload}).encode())[0])
        check("Synthetic history receipt preserves exact payload", record["payloadJson"] == payload)
        first = json.loads(request("/api/foundry/history")[0])
        check("Synthetic history is independently readable", first[0]["idText"] == record["idText"])
        stop()
        start()
        history = json.loads(request("/api/foundry/history")[0])
        check("Committed synthetic history survives controlled process restart",
              history[0]["idText"] == record["idText"] and history[0]["payloadJson"] == payload)
        stop()
        with sqlite3.connect(database) as conn:
            check("SQLite integrity after restart", conn.execute("PRAGMA integrity_check").fetchone() == ("ok",))
            check("Unrelated original fixture preserved", conn.execute("SELECT * FROM unrelated_fixture").fetchall() == [(1, b"untouched\x00fixture")])
        if sys.platform != "linux":
            snapshots = state / "unsupported snapshot directory"
            snapshots.mkdir()
            rejected_db = state / "rejected-start.sqlite"
            result = subprocess.run([str(binary), "serve-athena", str(rejected_db), str(runtime),
                                     "--foundry-snapshot-dir", str(snapshots)],
                                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=20)
            (output / "unsupported-snapshot-start.log").write_bytes(result.stdout)
            check("Explicit snapshot flag rejects unsupported platform at startup",
                  result.returncode != 0 and
                  (b"UnsupportedPlatform" in result.stdout or b"supported only on Linux" in result.stdout) and
                  not rejected_db.exists() and not any(snapshots.iterdir()))
        report["result"] = "pass"
    except Exception as error:
        report["result"] = "failed"
        report["failure"] = f"{type(error).__name__}: {error}"
    finally:
        try:
            stop()
        except Exception as error:
            report["result"] = "failed"
            report["cleanupFailure"] = f"{type(error).__name__}: {error}"
        (output / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    return report["result"] == "pass"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--binary", type=Path, required=True)
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--source-commit", required=True)
    args = parser.parse_args()
    sys.exit(0 if run(args.binary, args.package, args.output, args.source_commit) else 1)
