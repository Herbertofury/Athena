"""Audit public software URLs without downloading installers or changing records.

HTTP reachability is not a factual verification. 401/403/429, network errors and
server errors are distinct from HTTP 404/410. The report is an observation for
human review, not automatic delisting. Uses only Python's standard library.
"""
import argparse
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import ipaddress
import json
from pathlib import Path
import socket
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener, getproxies

ROOT = Path(__file__).resolve().parents[1]
AGENT = "AthenaSoftwareSourceAudit/1.0 (+https://github.com/Herbertofury/Athena)"
_locks = defaultdict(lambda: threading.BoundedSemaphore(2))


def public_url(url, resolve=True):
    p = urlsplit(url)
    if p.scheme not in {"https", "http"} or not p.hostname or p.username or p.password:
        raise ValueError("Expected a public HTTP(S) URL without credentials")
    if p.hostname.lower() in {"localhost", "localhost.localdomain"} or p.hostname.lower().endswith((".local", ".internal")):
        raise ValueError("Local destinations are not audited")
    try:
        literal = ipaddress.ip_address(p.hostname)
    except ValueError:
        literal = None
    if literal is not None and not literal.is_global:
        raise ValueError("Non-public address is not audited")
    if resolve:
        # Managed environments can resolve destinations only through their
        # configured HTTP proxy. Use that normal transport, never a direct
        # connection or a replacement resolver to evade its network policy.
        if not getproxies().get(p.scheme):
            infos = socket.getaddrinfo(p.hostname, p.port or (443 if p.scheme == "https" else 80), type=socket.SOCK_STREAM)
            if not infos or any(not ipaddress.ip_address(x[4][0]).is_global for x in infos):
                raise ValueError("Non-public destination is not audited")
    return urlunsplit((p.scheme, p.netloc, p.path or "/", p.query, ""))


class PublicRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        public_url(newurl)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def classify(status):
    if 200 <= status < 300:
        return "reachable"
    if status in {404, 410}:
        return "not_found"
    if status in {401, 403}:
        return "access_blocked"
    if status == 429:
        return "rate_limited"
    if status >= 500:
        return "server_error"
    if 300 <= status < 400:
        return "redirect_unresolved"
    return "http_error"


def check_url(url, timeout=15):
    started = time.monotonic()
    entry = {"url": url, "checked_at": datetime.now(timezone.utc).isoformat(), "status": None,
             "outcome": "unverified", "final_url": None, "method": "HEAD"}
    try:
        target = public_url(url)
        with _locks[urlsplit(target).hostname]:
            opener = build_opener(PublicRedirect())
            # HEAD first avoids fetching large binaries. A bounded GET retries
            # common HEAD refusals and soft CDN behavior, including 410 responses
            # that disagree with GET; confirmed GET 404/410 still fail strict audit.
            for method in ("HEAD", "GET"):
                entry["method"] = method
                try:
                    headers = {"User-Agent": AGENT, "Accept": "text/html,application/json;q=0.8,*/*;q=0.1"}
                    if method == "GET":
                        headers["Range"] = "bytes=0-16383"
                    with opener.open(Request(target, method=method, headers=headers), timeout=timeout) as response:
                        entry.update(status=response.status, final_url=response.geturl(), content_type=response.headers.get("Content-Type", ""))
                        if method == "GET":
                            sample = response.read(16384)
                            entry["sample_sha256"] = hashlib.sha256(sample).hexdigest()
                        break
                except HTTPError as e:
                    entry.update(status=e.code, final_url=e.geturl())
                    if method == "HEAD" and e.code in {400, 403, 404, 405, 406, 410, 501}:
                        entry["head_status"] = e.code
                        continue
                    break
            entry["outcome"] = classify(entry["status"])
    except ValueError as e:
        entry.update(outcome="invalid_or_nonpublic", error=str(e))
    except (URLError, OSError, TimeoutError) as e:
        entry.update(outcome="network_error", error=str(e)[:400])
    except Exception as e:
        entry.update(outcome="check_error", error=type(e).__name__ + ": " + str(e)[:300])
    entry["elapsed_ms"] = round((time.monotonic() - started) * 1000)
    return entry


def collect_urls(catalog, official_only=False):
    urls = defaultdict(list)
    for a in catalog["applications"]:
        for key in ("official_url", "download_url", "repository_url"):
            if a.get(key):
                urls[a[key]].append({"app_id": a["id"], "field": key})
        if not official_only:
            for s in a["sources"]:
                urls[s["url"]].append({"app_id": a["id"], "field": "source", "supports": s["supports"]})
            if a["maintenance"].get("source_url"):
                urls[a["maintenance"]["source_url"]].append({"app_id": a["id"], "field": "maintenance"})
    for record in catalog.get("research_records", []):
        state = "excluded" if record["id"].startswith("cleanup-excluded-") else "research"
        if state == "research" and record.get("availability", {}).get("status") == "unavailable":
            state = "unavailable-history"
        urls[record["official_url"]].append({"research_id": record["id"], "field": "preserved_research_source", "record_state": state,
                                            "availability_status": record.get("availability", {}).get("status")})
    return urls


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=ROOT / "dist/workspaces/software/catalog.json")
    parser.add_argument("--output", type=Path, default=ROOT / "software-link-report.json")
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument("--timeout", type=float, default=15)
    parser.add_argument("--official-only", action="store_true")
    parser.add_argument("--strict", action="store_true", help="Fail only for observed 404/410 or invalid public URL; blocks/timeouts remain unknown")
    parser.add_argument("--resume", action="store_true", help="Reuse successful observations from the last 24 hours; retry all unresolved URLs")
    args = parser.parse_args()
    if not 1 <= args.workers <= 32 or not 1 <= args.timeout <= 60:
        parser.error("Use 1–32 workers and a 1–60 second timeout")
    raw = args.catalog.read_bytes()
    catalog = json.loads(raw)
    urls = collect_urls(catalog, args.official_only)
    previous = {}
    if args.resume and args.output.exists():
        old = json.loads(args.output.read_text())
        for item in old.get("results", []):
            try:
                age = (datetime.now(timezone.utc) - datetime.fromisoformat(item["checked_at"])).total_seconds()
                if item["outcome"] == "reachable" and 0 <= age < 86400:
                    previous[item["url"]] = item
            except (ValueError, KeyError):
                pass
    report = {"schema_version": 1, "catalog_sha256": hashlib.sha256(raw).hexdigest(),
              "started_at": datetime.now(timezone.utc).isoformat(), "completed": False,
              "scope": "HTTP reachability only; not content verification, malware analysis or maintenance certification.",
              "results": [dict(previous[u], references=urls[u]) for u in urls if u in previous]}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    def save():
        for item in report["results"]:
            item["excluded_history_only"] = all(r.get("record_state") == "excluded" for r in item["references"])
            item["retained_history_only"] = all(r.get("record_state") in {"excluded", "unavailable-history"} for r in item["references"])
        report["results"].sort(key=lambda x: x["url"])
        report["summary"] = dict(sorted(Counter(x["outcome"] for x in report["results"]).items()))
        report["actionable_not_found"] = sum(x["outcome"] == "not_found" and not x["retained_history_only"] for x in report["results"])
        report["historical_not_found"] = sum(x["outcome"] == "not_found" and x["retained_history_only"] for x in report["results"])
        report["unavailable_history_now_reachable"] = sum(x["outcome"] == "reachable" and any(r.get("availability_status") == "unavailable" for r in x["references"]) for x in report["results"])
        temporary = args.output.with_suffix(args.output.suffix + ".tmp")
        temporary.write_text(json.dumps(report, indent=2) + "\n")
        temporary.replace(args.output)
    save()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(check_url, u, args.timeout): u for u in urls if u not in previous}
        for f in as_completed(futures):
            result = f.result(); result["references"] = urls[futures[f]]; report["results"].append(result)
            if len(report["results"]) % 25 == 0:
                save()
                print(f"Audited {len(report['results'])}/{len(urls)}: {report['summary']}", flush=True)
    report.update(completed=True, finished_at=datetime.now(timezone.utc).isoformat(), url_count=len(urls))
    save()
    print(json.dumps({"urls": len(urls), "summary": report["summary"], "report": str(args.output)}, indent=2))
    return 1 if args.strict and any(x["outcome"] == "invalid_or_nonpublic" or (x["outcome"] == "not_found" and not x["retained_history_only"]) for x in report["results"]) else 0


if __name__ == "__main__":
    raise SystemExit(main())
