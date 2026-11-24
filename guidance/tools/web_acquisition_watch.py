"""Read-only public upstream release and discovery observations.

Uses GitHub CLI; never downloads or executes candidate software.
Run from Athena root: python guidance/tools/web_acquisition_watch.py --output report.json
"""
import argparse
import datetime as dt
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "guidance/registry/web-acquisition-watch.json"
QUERIES = {
    "crawl": "topic:web-crawler is:public archived:false",
    "browser": "topic:browser-automation is:public archived:false",
    "download": "topic:download-manager is:public archived:false",
}
REPO = re.compile(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+")


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


def collect(catalog, fetch=api):
    if catalog.get("schemaVersion") != 1 or not isinstance(catalog.get("watch"), list):
        raise ValueError("invalid catalog")
    watch = catalog["watch"]
    if len(watch) > 40:
        raise ValueError("watch budget exceeded")
    releases = []
    seen = set()
    for item in watch:
        repo = item["repository"]
        if not isinstance(repo, str) or not REPO.fullmatch(repo) or repo.lower() in seen:
            raise ValueError("invalid or duplicate repository")
        seen.add(repo.lower())
        data, error = fetch(f"repos/{repo}/releases/latest")
        row = {"repository": repo, "source": f"https://api.github.com/repos/{repo}/releases/latest"}
        if error or not data or not data.get("tag_name") or data.get("draft") or data.get("prerelease"):
            row.update(status="unavailable", reason=error or "invalid_release")
        else:
            row.update(status="observed", tag=data["tag_name"],
                       publishedAt=data.get("published_at"),
                       releaseUrl=data.get("html_url"),
                       initialTag=item.get("initialRelease", {}).get("tag"))
            row["differsFromInitial"] = row["tag"] != row["initialTag"]
        releases.append(row)
    leads = []
    for category, query in QUERIES.items():
        data, error = fetch("search/repositories",
                            (f"q={query}", "sort=updated", "order=desc", "per_page=5"))
        row = {"category": category, "query": query, "status": "unavailable" if error else "observed",
               "candidates": []}
        if error:
            row["reason"] = error
        elif data:
            for item in data.get("items", [])[:5]:
                name = item.get("full_name", "")
                if item.get("private") is False and REPO.fullmatch(name) and name.lower() not in seen:
                    row["candidates"].append({"repository": name, "url": item.get("html_url"),
                                              "updatedAt": item.get("pushed_at"),
                                              "license": (item.get("license") or {}).get("spdx_id")})
            row["incompleteResults"] = bool(data.get("incomplete_results"))
        leads.append(row)
    return {"schemaVersion": 1, "observedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
            "purpose": "Discovery signals only; not package-channel freshness or benchmark proof.",
            "releases": releases, "discovery": leads}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = collect(json.loads(CATALOG.read_text(encoding="utf-8")))
    with args.output.open("x", encoding="utf-8") as stream:
        json.dump(report, stream, indent=2)
        stream.write("\n")
    print("Public metadata report written; unavailable observations remain explicit.")


if __name__ == "__main__":
    main()
