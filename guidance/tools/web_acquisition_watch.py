"""Read-only public upstream release and discovery observations.

Uses GitHub CLI; never downloads or executes candidate software.
Run from Athena root: python guidance/tools/web_acquisition_watch.py --output report.json
"""
import argparse
import datetime as dt
import json
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "guidance/registry/web-acquisition-watch.json"
QUERIES = {
    "crawl": "topic:web-crawler is:public archived:false",
    "browser": "topic:browser-automation is:public archived:false",
    "download": "topic:download-manager is:public archived:false",
}
REPO = re.compile(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+")
SEARCH_PAGE_SIZE = 100
# GitHub Search's documented retrieval boundary, not an application result cap.
SEARCH_WINDOW = 1000


def api(endpoint, fields=()):
    args = ["gh", "api", "--hostname", "github.com", "--method", "GET", endpoint]
    for field in fields:
        args.extend(["-f", field])
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=12)
        if result.returncode:
            return None, "request_failed"
        data = json.loads(result.stdout)
        if not isinstance(data, dict):
            return None, "unexpected_response"
        return data, None
    except (OSError, subprocess.TimeoutExpired, ValueError):
        return None, "unavailable_or_invalid_response"


def _fetch(fetch, endpoint, fields=()):
    """Keep one failed observation from discarding unrelated complete results."""
    try:
        data, error = fetch(endpoint, fields)
    except Exception:
        return None, "fetch_exception"
    if error:
        return None, error
    if not isinstance(data, dict):
        return None, "unexpected_response"
    return data, None


def _release(item, fetch):
    repo = item["repository"]
    data, error = _fetch(fetch, f"repos/{repo}/releases/latest")
    row = {"repository": repo, "source": f"https://api.github.com/repos/{repo}/releases/latest"}
    if error or not data or not data.get("tag_name") or data.get("draft") or data.get("prerelease"):
        row.update(status="unavailable", reason=error or "invalid_release")
    else:
        initial = item.get("initialRelease") or {}
        row.update(status="observed", tag=data["tag_name"],
                   publishedAt=data.get("published_at"),
                   releaseUrl=data.get("html_url"),
                   initialTag=initial.get("tag") if isinstance(initial, dict) else None)
        row["differsFromInitial"] = row["tag"] != row["initialTag"]
    return row


def _discovery(category, query, seen, fetch):
    row = {"category": category, "query": query, "status": "observed",
           "candidates": [], "pages": 0, "incompleteResults": False}
    page = 1
    received = 0
    candidates_seen = set(seen)
    response_seen = set()
    duplicate_count = 0
    while True:
        data, error = _fetch(fetch, "search/repositories", (
            f"q={query}", "sort=updated", "order=desc",
            f"per_page={SEARCH_PAGE_SIZE}", f"page={page}"))
        if error or not isinstance(data.get("items") if data else None, list):
            row.update(status="partial" if row["pages"] else "unavailable",
                       reason=error or "invalid_search_response", incompleteResults=True)
            break
        row["pages"] += 1
        items = data["items"]
        total = data.get("total_count")
        if isinstance(total, int) and not isinstance(total, bool) and total >= 0:
            row["totalCount"] = max(total, row.get("totalCount", 0))
        row["incompleteResults"] |= bool(data.get("incomplete_results"))
        received += len(items)
        for item in items:
            if not isinstance(item, dict):
                row["incompleteResults"] = True
                continue
            name = item.get("full_name", "")
            if not isinstance(name, str) or not REPO.fullmatch(name):
                row["incompleteResults"] = True
                continue
            if name.lower() in response_seen:
                duplicate_count += 1
                row["incompleteResults"] = True
            response_seen.add(name.lower())
            if not isinstance(item.get("private"), bool) or item.get("private"):
                row["incompleteResults"] = True
            if item.get("private") is False and name.lower() not in candidates_seen:
                license_info = item.get("license") or {}
                row["candidates"].append({"repository": name, "url": item.get("html_url"),
                                          "updatedAt": item.get("pushed_at"),
                                          "license": license_info.get("spdx_id")
                                          if isinstance(license_info, dict) else None})
                candidates_seen.add(name.lower())
        expected = row.get("totalCount")
        if len(items) < SEARCH_PAGE_SIZE or (expected is not None and received >= expected):
            if expected is not None and received < expected:
                row["incompleteResults"] = True
                row["reason"] = "search_ended_before_total"
            break
        if page * SEARCH_PAGE_SIZE >= SEARCH_WINDOW:
            row.update(incompleteResults=True, reason="github_search_window")
            break
        page += 1
    row["receivedCount"] = received
    row["uniqueReceivedCount"] = len(response_seen)
    row["duplicateCount"] = duplicate_count
    if "totalCount" in row:
        row["unresolvedCount"] = max(0, row["totalCount"] - len(response_seen))
    if row["incompleteResults"] and row["status"] == "observed":
        row["status"] = "partial"
    return row


def collect(catalog, fetch=api, *, workers=4):
    """Collect every configured upstream with bounded concurrent I/O.

    Injected fetch functions must be thread-safe, or callers can use workers=1.
    Result order follows the input catalog regardless of completion order.
    """
    if (not isinstance(catalog, dict) or catalog.get("schemaVersion") != 1
            or not isinstance(catalog.get("watch"), list)):
        raise ValueError("invalid catalog")
    if not isinstance(workers, int) or isinstance(workers, bool) or workers < 1:
        raise ValueError("workers must be a positive integer")
    watch = catalog["watch"]
    seen = set()
    for item in watch:
        repo = item.get("repository") if isinstance(item, dict) else None
        if not isinstance(repo, str) or not REPO.fullmatch(repo) or repo.lower() in seen:
            raise ValueError("invalid or duplicate repository")
        seen.add(repo.lower())
    # Validate the whole catalog before starting network work. Workers bound
    # resource use, never the number of repositories or returned candidates.
    with ThreadPoolExecutor(max_workers=workers, thread_name_prefix="upstream") as executor:
        releases_pending = [executor.submit(_release, item, fetch) for item in watch]
        discovery_pending = [executor.submit(_discovery, category, query, seen, fetch)
                             for category, query in QUERIES.items()]
        releases = [future.result() for future in releases_pending]
        leads = [future.result() for future in discovery_pending]
    return {"schemaVersion": 1, "observedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
            "purpose": "Discovery signals only; not package-channel freshness or benchmark proof.",
            "releases": releases, "discovery": leads}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--workers", type=int, default=4,
                        help="Concurrent metadata requests (default: 4; use 1 for serial execution)")
    args = parser.parse_args()
    report = collect(json.loads(CATALOG.read_text(encoding="utf-8")), workers=args.workers)
    with args.output.open("x", encoding="utf-8") as stream:
        json.dump(report, stream, indent=2)
        stream.write("\n")
    print("Public metadata report written; unavailable observations remain explicit.")


if __name__ == "__main__":
    main()
