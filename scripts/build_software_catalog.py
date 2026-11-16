"""Build Athena's sourced PC software catalog, workspace assets and Wiki pages.

Original research snapshots are immutable inputs. This builder never downloads,
installs, benchmarks, changes source claims, or grants a product a quality score.
"""
import argparse
from collections import Counter, defaultdict
from datetime import date
import hashlib
import json
from pathlib import Path
import re
import unicodedata
from urllib.parse import urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
REVIEWED = "2026-11-15"
LEGACY = "research/windows-utilities-2026-11-14/catalog.json"
BASELINE = "research/software-expansion-2026-11-14/baseline.json"
REPORTS = "research/software-expansion-2026-11-15"
PARTITIONS = ("systems", "creative", "development")
FAMILIES = {
    "system": ("System & hardware", "Inspect, maintain and understand your computer."),
    "files": ("Files, backup & recovery", "Find, organize, transfer, protect and recover files."),
    "security": ("Security & privacy", "Protect identities and data; investigate suspicious behavior."),
    "networking": ("Networks & remote access", "Connect machines, inspect traffic and work remotely."),
    "productivity": ("Productivity & accessibility", "Read, write, organize knowledge and make computing accessible."),
    "creative": ("Creative & multimedia", "Make and manage images, sound, video and three-dimensional work."),
    "development": ("Development & automation", "Write, inspect, test and deliver software and workflows."),
    "ai": ("AI & local models", "Run and evaluate model-assisted workflows with explicit hardware and licensing limits."),
    "gaming": ("Gaming & modding", "Manage, modify, create, stream and preserve games."),
    "science": ("Science & specialized work", "Map, simulate, measure, design and analyze specialist data."),
}
PLATFORMS = {"Windows", "macOS", "Linux", "Web", "FreeBSD", "Bootable"}
LICENSES = {"open-source", "source-available", "proprietary", "mixed", "unknown"}
PRICING = {"free", "freemium", "paid", "subscription", "mixed", "unknown"}
MAINTENANCE = {"active", "archived", "discontinued", "unverified"}
SOURCE_CLAIMS = {"identity", "features", "license", "platforms", "pricing", "downloads", "maintenance"}


def read(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def product_key(text):
    # MemTest86 and Memtest86+ are distinct maintained products. Preserve
    # meaningful punctuation and letters before comparing product identities.
    # In particular, µManager/μManager must not collapse to the accounting
    # product Manager. NFKC treats the two micro characters as equivalent.
    value = unicodedata.normalize("NFKC", text).casefold()
    value = value.replace("+", " plus ").replace("#", " sharp ")
    return re.sub(r"[\W_]+", "-", value).strip("-")


def identity(url):
    p = urlsplit(url)
    path = p.path.rstrip("/").removesuffix(".git")
    if p.hostname == "github.com" and len(path.strip("/").split("/")) >= 2:
        path = "/" + "/".join(path.strip("/").split("/")[:2])
    return (p.hostname or "").removeprefix("www.").lower() + path.lower()


def safe_url(url):
    if not isinstance(url, str):
        return False
    try:
        p = urlsplit(url)
        return p.scheme in {"http", "https"} and bool(p.hostname) and not p.username and not p.password
    except ValueError:
        return False


def valid_date(value):
    try:
        return isinstance(value, str) and date.fromisoformat(value).isoformat() == value
    except ValueError:
        return False


def legacy_family(category):
    if category.startswith("security"):
        return "security"
    if category in {"cleanup", "process", "display", "hardware-monitoring"}:
        return "system"
    if category in {"backup", "archive", "file-management"}:
        return "files"
    if category in {"productivity", "accessibility"}:
        return "productivity"
    if category == "networking":
        return "networking"
    if category == "developer":
        return "development"
    return "creative"


def legacy_license(text, app_id=None):
    curated = {
        "duplicati": "mixed", "wireshark": "mixed", "hayabusa": "mixed",
        "7-zip": "mixed", "tron": "mixed", "handbrake": "mixed",
        "armorpaint": "open-source", "blockbench": "open-source", "libresprite": "open-source",
        "everything": "proprietary", "digikam": "open-source", "wings3d": "open-source", "peazip": "open-source",
    }
    if app_id in curated:
        return curated[app_id]
    low = text.lower()
    if low.startswith("mixed") or "custom sandman" in low:
        return "mixed"
    if low.startswith("proprietary") or "closed-source" in low or "microsoft proprietary" in low or "sysinternals proprietary" in low:
        return "proprietary"
    if "source-available" in low:
        return "source-available"
    if any(s in low for s in ("gpl", "mit", "apache", "bsd", "mpl", "zlib", "open source", "open-source")):
        return "open-source"
    if "mixed" in low or "custom" in low:
        return "mixed"
    return "unknown"


def normalize_legacy(item, source):
    """Retain every original field; avoid inventing missing metadata."""
    repo = (item.get("github") or {}).get("url")
    if not repo and "github.com/" in item["official_url"]:
        repo = item["official_url"]
    return {
        "id": item["id"], "name": item["name"],
        "family": legacy_family(item["category"]), "category": slug(item["category"]),
        "summary": item["standout_features"], "official_url": item["official_url"],
        "download_url": None, "repository_url": repo, "platforms": ["Windows"],
        "platform_notes": item["windows_support"], "license": item["license"],
        "license_kind": legacy_license(item["license"], item["id"]), "pricing_model": "unknown",
        "features": [item["standout_features"]], "strengths": [item["standout_features"]],
        "aliases": item["name"].split(" / ") if " / " in item["name"] else [],
        "limitations": [item["risk"], item["reuse"]],
        "use_cases": [item["standout_features"]], "tags": [slug(item["category"])],
        "alternatives": [],
        "recommendation": {"pick_for": item["standout_features"], "compare_when": item["evaluation"]},
        "maintenance": {"status": "unverified", "checked_at": source["as_of"],
                        "note": "Retained research snapshot; current release activity was not established by this import.", "source_url": None},
        "sources": [{"url": u, "label": "Preserved original research source", "checked_at": source["as_of"],
                    "supports": ["identity", "features"]} for u in item["sources"]],
        "evidence_status": "legacy-research", "legacy_evidence_status": item["evidence_status"],
        "legacy": item, "origin": LEGACY,
    }


def capability_registry():
    definitions = read("data/software/capabilities.json")["capabilities"]
    ids = [d.get("id") for d in definitions]
    if len(set(ids)) != len(ids) or any(not isinstance(d.get(k), str) or not d[k].strip()
                                       for d in definitions for k in ("id", "label", "description")):
        raise ValueError("Capability definitions need unique identities, labels and descriptions")
    return definitions


def evaluation_registry(app_ids):
    evaluations = read("data/software/evaluations.json")["evaluations"]
    seen = set()
    for evaluation in evaluations:
        if not evaluation.get("id") or evaluation["id"] in seen:
            raise ValueError("Measurements need unique identities")
        seen.add(evaluation["id"])
        targets = evaluation.get("app_ids", [])
        if len(set(targets)) < 2 or not set(targets) <= app_ids:
            raise ValueError("Measurements need at least two known application targets")
        for field in ("title", "summary", "measured_at"):
            if not isinstance(evaluation.get(field), str) or not evaluation[field].strip():
                raise ValueError("Measurement missing " + field)
        if not evaluation.get("limitations"):
            raise ValueError("Measurements need explicit limitations")
        for field in ("report", "data", "script"):
            path = evaluation.get(field + "_path", "")
            resolved = (ROOT / path).resolve()
            if not path or not resolved.is_relative_to(ROOT) or not resolved.is_file():
                raise ValueError("Measurement evidence file is missing or outside repository")
            expected = evaluation.get(field + "_sha256")
            if field != "report" and hashlib.sha256(resolved.read_bytes()).hexdigest() != expected:
                raise ValueError("Measurement evidence hash mismatch: " + field)
            evaluation[field + "_url"] = "https://github.com/Herbertofury/Athena/blob/main/" + path
        result = read(evaluation["data_path"])
        bindings = evaluation.get("tool_app_ids", {})
        if set(bindings) != set(result.get("tools", {})) or set(bindings.values()) != set(targets):
            raise ValueError("Measurement tool versions must map to its application targets")
        if result.get("experiment_id") != evaluation["id"] or result.get("measured_at") != evaluation["measured_at"]:
            raise ValueError("Measurement identity or date disagrees with raw results")
        if not result.get("cases") or any(c.get("oracle_passed_every_run") is not True for c in result["cases"]):
            raise ValueError("Published search measurements require complete-output oracle checks")
    return evaluations


def validate(apps):
    errors, names, urls, ids = [], {}, {}, set()
    capability_ids = {d["id"] for d in capability_registry()}
    for a in apps:
        name = a.get("name", "<unnamed>")
        def require(ok, message):
            if not ok:
                errors.append(f"{name}: {message}")
        require(bool(re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", a.get("id", ""))) or a.get("origin") == LEGACY, "invalid id")
        require(a.get("id") not in ids, "duplicate id")
        ids.add(a.get("id"))
        key = product_key(name)
        require(key not in names, f"duplicate product name ({names.get(key)})")
        names[key] = a.get("id")
        require(a.get("family") in FAMILIES, "unknown family")
        require(bool(re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", a.get("category", ""))), "invalid category")
        for field in ("summary", "license"):
            require(isinstance(a.get(field), str) and len(a[field]) >= 3, f"missing {field}")
        require(a.get("license_kind") in LICENSES, "unknown license classification")
        require(a.get("pricing_model") in PRICING, "unknown pricing model")
        require(isinstance(a.get("platforms"), list) and bool(a["platforms"]) and set(a["platforms"]) <= PLATFORMS, "invalid platforms")
        for field in ("features", "strengths", "limitations", "use_cases", "tags"):
            require(isinstance(a.get(field), list) and bool(a[field]) and all(isinstance(x, str) and x.strip() for x in a[field]), f"empty {field}")
        for field in ("official_url", "download_url", "repository_url"):
            u = a.get(field)
            require((u is None and field != "official_url") or safe_url(u), f"invalid {field}")
        canonical = identity(a.get("repository_url") or a.get("official_url", ""))
        require(canonical not in urls, f"duplicate official identity with {urls.get(canonical)}")
        urls[canonical] = a.get("id")
        for field in ("pick_for", "compare_when"):
            require(len(a.get("recommendation", {}).get(field, "")) > 5, f"missing recommendation {field}")
        m = a.get("maintenance", {})
        require(m.get("status") in MAINTENANCE and bool(m.get("note")), "missing maintenance status and basis")
        require(valid_date(m.get("checked_at")), "maintenance review date missing or invalid")
        if m.get("status") != "unverified":
            require(safe_url(m.get("source_url")), "maintenance assertion needs a source")
        require(bool(a.get("sources")), "missing source provenance")
        for s in a.get("sources", []):
            require(safe_url(s.get("url")), "invalid source URL")
            require(valid_date(s.get("checked_at")), "source review date missing or invalid")
            require(bool(s.get("supports")) and set(s["supports"]) <= SOURCE_CLAIMS, "invalid source claims")
            require(bool(s.get("label")), "source label missing")
        capabilities = a.get("capabilities", [])
        require(isinstance(capabilities, list), "capabilities must be an array")
        seen_capabilities = set()
        feature_sources = {s["url"] for s in a.get("sources", []) if "features" in s.get("supports", [])}
        for capability in capabilities if isinstance(capabilities, list) else []:
            if not isinstance(capability, dict):
                require(False, "invalid capability assertion")
                continue
            cap_id = capability.get("id")
            require(isinstance(cap_id, str) and cap_id in capability_ids, "unknown capability")
            require(isinstance(cap_id, str) and cap_id not in seen_capabilities, "duplicate capability")
            if isinstance(cap_id, str): seen_capabilities.add(cap_id)
            for field in ("conditions", "limitations", "source_urls"):
                values = capability.get(field)
                require(isinstance(values, list) and bool(values) and all(isinstance(v, str) and v.strip() for v in values), "capability needs " + field)
            source_urls = capability.get("source_urls", [])
            require(isinstance(source_urls, list) and all(isinstance(u, str) and u in feature_sources for u in source_urls),
                    "capability sources must be cited feature evidence")
        if a.get("evidence_status") != "legacy-research":
            claims = {claim for s in a.get("sources", []) for claim in s.get("supports", [])}
            required_claims = {"identity", "features", "platforms"}
            if a.get("license_kind") != "unknown": required_claims.add("license")
            if a.get("pricing_model") != "unknown": required_claims.add("pricing")
            if a.get("download_url"): required_claims.add("downloads")
            if m.get("status") != "unverified": required_claims.add("maintenance")
            require(required_claims <= claims, "missing claim-specific sources: " + ", ".join(sorted(required_claims - claims)))
        for field in ("platform_notes", "pricing_notes"):
            if field in a:
                require(isinstance(a[field], str) and bool(a[field].strip()), f"invalid {field}")
    if errors:
        raise ValueError("\n".join(errors))


def load_catalog(require_partitions=True):
    baseline = read(BASELINE)
    for entry in baseline["catalogs"]:
        actual = hashlib.sha256((ROOT / entry["path"]).read_bytes()).hexdigest()
        if actual != entry["sha256"]:
            raise ValueError("Preserved research changed; explicitly review the baseline before proceeding: " + entry["path"])
    legacy = read(LEGACY)
    apps = [normalize_legacy(x, legacy) for x in legacy["tools"]]
    partition_paths = [f"data/software/{part}.json" for part in PARTITIONS]
    partition_paths.extend(p.relative_to(ROOT).as_posix() for p in sorted((ROOT / "data/software").glob("*-expanded.json")))
    for path in partition_paths:
        if not (ROOT / path).exists() and not require_partitions:
            continue
        d = read(path)
        if d.get("schema_version") != 1:
            raise ValueError("Unsupported software partition schema: " + path)
        apps.extend(dict(a, origin=path) for a in d["applications"])
    existing = {a["id"]: a for a in apps if a["origin"] == LEGACY}
    allowed_enrichment = {"official_url", "download_url", "repository_url", "platforms", "platform_notes", "license_kind", "license", "pricing_model", "pricing_notes", "aliases", "features", "strengths", "use_cases", "tags", "capabilities", "limitations", "recommendation", "maintenance"}
    for path in sorted((ROOT / "data/software").glob("legacy-*-enrichment.json")):
        for update in json.loads(path.read_text())["applications"]:
            app = existing.get(update["id"])
            if not app or set(update) - allowed_enrichment - {"id", "sources"}:
                raise ValueError("Invalid legacy enrichment target or fields in " + str(path))
            if not update.get("sources"):
                raise ValueError("Legacy enrichment needs current supporting sources")
            fields = sorted(set(update) & allowed_enrichment)
            for field in fields:
                app[field] = update[field]
            combined = {s["url"]: dict(s) for s in app["sources"]}
            for source in update["sources"]:
                previous = combined.get(source["url"], {})
                combined[source["url"]] = dict(source, supports=sorted(set(previous.get("supports", [])) | set(source["supports"])))
            app["sources"] = list(combined.values())
            app.setdefault("metadata_enrichments", []).append({"origin": path.relative_to(ROOT).as_posix(), "fields": fields,
                "reviewed_at": max(s["checked_at"] for s in update["sources"])})
    taxonomy_path = ROOT / "data/software/taxonomy.json"
    taxonomy = json.loads(taxonomy_path.read_text()) if taxonomy_path.exists() else {}
    category_aliases = taxonomy.get("category_aliases", {})
    application_categories = taxonomy.get("application_categories", {})
    if set(application_categories) - {a["id"] for a in apps}:
        raise ValueError("Taxonomy assigns an unknown application")
    for app in apps:
        original = app["family"] + "/" + app["category"]
        target = application_categories.get(app["id"], original)
        seen = set()
        while target in category_aliases:
            if target in seen:
                raise ValueError("Category alias cycle: " + target)
            seen.add(target); target = category_aliases[target]
        family, separator, category = target.partition("/")
        if not separator or family not in FAMILIES or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", category):
            raise ValueError("Invalid category target: " + target)
        if target != original:
            app["source_category"] = original
            app.update(family=family, category=category)
    validate(apps)
    by_id = {a["id"]: a for a in apps}
    evaluations = evaluation_registry(set(by_id))
    by_name = {}
    for a in apps:
        for value in [a["name"], a["id"], *a.get("aliases", [])]:
            key = product_key(value)
            if key in by_name and by_name[key] != a["id"]:
                raise ValueError(f"Ambiguous product alias {value}: {by_name[key]} and {a['id']}")
            by_name[key] = a["id"]
    for a in apps:
        a["evaluation_ids"] = [e["id"] for e in evaluations if a["id"] in e["app_ids"]]
        a["category_id"] = a["family"] + "/" + a["category"]
        candidates = [(n, by_name.get(product_key(n))) for n in a.get("alternatives", [])]
        a["alternative_ids"] = sorted({i for _, i in candidates if i and i != a["id"]})
        a["alternatives_outside_catalog"] = [n for n, i in candidates if not i]
    research_records = []
    cleanup_path = "research/developer-cleanup-2026-11-14/catalog.json"
    cleanup = read(cleanup_path)
    for position, item in enumerate(cleanup["tools"], 1):
        research_records.append({"id": f"cleanup-research-{position}", "name": item["name"],
            "kind": "Cleanup research snapshot", "category": item["category"],
            "summary": "Original cleanup research candidate; retain its platform and source context before evaluating it.",
            "platform_notes": item.get("platform", "Unverified"), "official_url": item["download"],
            "evidence_status": "Preserved research snapshot; inclusion is not a validated cleanup recommendation.",
            "origin": cleanup_path, "original": item})
    for classification in ("unranked", "excluded"):
        for position, item in enumerate(cleanup[classification], 1):
            research_records.append({"id": f"cleanup-{classification}-{position}", "name": item["name"],
                "kind": "Cleanup research · " + classification, "category": classification,
                "summary": item.get("reason", "Retained unranked candidate; no evaluated recommendation in the original snapshot."),
                "platform_notes": "Not established in this snapshot", "official_url": item["url"],
                "evidence_status": "Original " + classification + " record; not a recommended or newly verified application.",
                "origin": cleanup_path, "original": item})
    ai_path = "data/creative-ai-tools.json"
    for item in read(ai_path)["tools"]:
        research_records.append({"id": "creative-research-" + item["id"], "name": item["name"],
            "kind": "Creative AI research", "category": ", ".join(item.get("categories", [])),
            "summary": item["summary"], "platform_notes": item.get("setup", "Unverified"),
            "official_url": item["repository"], "evidence_status": item.get("verification", "Research snapshot"),
            "origin": ai_path, "original": item})
    categories = []
    for family, (title, description) in FAMILIES.items():
        for cat in sorted({a["category"] for a in apps if a["family"] == family}):
            members = [a for a in apps if a["family"] == family and a["category"] == cat]
            related = Counter(by_id[i]["category_id"] for a in members for i in a["alternative_ids"] if by_id[i]["category_id"] != family + "/" + cat)
            categories.append({"id": family + "/" + cat, "name": taxonomy.get("category_labels", {}).get(family + "/" + cat, cat.replace("-", " ").title()), "family": family,
                               "count": len(members), "application_ids": sorted(a["id"] for a in members), "related_category_ids": sorted(related),
                               "use_cases": list(dict.fromkeys(u for a in members for u in a["use_cases"]))[:8]})
    recipe_paths = sorted((ROOT / "data/software").glob("*-recipes.json"))
    recipes = [r for p in recipe_paths for r in json.loads(p.read_text())["recipes"]]
    if not require_partitions:
        recipes = [r for r in recipes if all(p["app_id"] in by_id for p in r["picks"])]
    if len({r["id"] for r in recipes}) != len(recipes):
        raise ValueError("Duplicate decision guide id")
    for recipe in recipes:
        if not all(isinstance(recipe.get(k), str) and recipe[k].strip() for k in ("id", "title", "description")):
            raise ValueError("Decision guides need a stable identity, title and task description")
        if len(recipe.get("picks", [])) < 2 or len({p["app_id"] for p in recipe["picks"]}) != len(recipe["picks"]):
            raise ValueError("Decision guides need at least two distinct application choices: " + recipe["id"])
        for pick in recipe["picks"]:
            if pick["app_id"] not in by_id:
                raise ValueError("Unknown recommendation target: " + pick["app_id"])
            if not pick.get("label") or not pick.get("reason") or not pick.get("tradeoff"):
                raise ValueError("Recommendations need a task-specific role, reason and tradeoff")
    counts = {
        "applications": len(apps), "new_applications": len(apps) - len(legacy["tools"]),
        "preserved_pc_records": len(legacy["tools"]), "preserved_cleanup_records": len(cleanup["tools"]),
        "baseline_categories": len({a["category"] for a in legacy["tools"]}),
        "categories": len(categories), "families": len({a["family"] for a in apps}),
        "source_urls": len({s["url"] for a in apps for s in a["sources"]}),
        "alternative_links": sum(len(a["alternative_ids"]) for a in apps),
        "unresolved_alternative_mentions": sum(len(a["alternatives_outside_catalog"]) for a in apps),
        "legacy_records_enriched": sum(bool(a.get("metadata_enrichments")) for a in apps),
        "use_cases": len({u.lower() for a in apps for u in a["use_cases"]}),
        "decision_guides": len(recipes),
        "capability_assertions": sum(len(a.get("capabilities", [])) for a in apps),
        "applications_with_documented_capabilities": sum(bool(a.get("capabilities")) for a in apps),
        "measured_comparisons": len(evaluations),
        "related_research_records": len(research_records),
        "preserved_cleanup_unranked": len(cleanup["unranked"]),
        "preserved_cleanup_excluded": len(cleanup["excluded"]),
        "by_family": dict(sorted(Counter(a["family"] for a in apps).items())),
        "by_platform": dict(sorted(Counter(p for a in apps for p in a["platforms"]).items())),
        "by_maintenance": dict(sorted(Counter(a["maintenance"]["status"] for a in apps).items())),
        "by_license": dict(sorted(Counter(a["license_kind"] for a in apps).items())),
        "by_pricing": dict(sorted(Counter(a["pricing_model"] for a in apps).items())),
    }
    return {"schema_version": 1, "reviewed_at": REVIEWED,
            "scope": "Sourced software discovery. Documentation review is not an installation, security audit, performance benchmark or universal best-product verdict.",
            "counts": counts,
            "families": [{"id": k, "name": v[0], "description": v[1]} for k, v in FAMILIES.items()],
            "categories": categories, "recipes": recipes, "capabilities": capability_registry(), "evaluations": evaluations,
            "category_aliases": category_aliases,
            "research_records": research_records,
            "applications": sorted(apps, key=lambda a: (a["name"].casefold(), a["id"]))}


def markdown(catalog):
    c = catalog["counts"]
    base = "https://github.com/Herbertofury/Athena"
    def clean(t):
        return str(t).replace("|", "\\|").replace("\n", " ")
    overview = f"""# Software discovery

[Open the integrated software workspace](https://herbertofury.github.io/Athena/#software).

Reviewed {REVIEWED}. **{c['applications']} applications**, **{c['categories']} task categories**, **{c['families']} families**, **{c['source_urls']} distinct cited source URLs**, **{c['alternative_links']} explicit alternative links**, and **{c['decision_guides']} task decision guides**.

The PC application catalog grew from {c['preserved_pc_records']} records and {c['baseline_categories']} categories. {c['new_applications']} researched records were added, and {c['legacy_records_enriched']} original records received dated metadata enrichments. The original cleanup snapshot (66 main candidates, three unranked and one excluded), 105-entry Windows research catalog, creative-AI research and engineering library are retained byte for byte. Their records are not counted again to inflate this expansion. The workspace separately exposes {c['related_research_records']} preserved cleanup and creative-AI research records.

## Find the right tool

Search a task, feature, product or alias in Athena's main search box while the Software workspace is open. Filter by family, task category, operating system, license and pricing model. Open a card for platform details, strengths, limitations, alternatives and claim-specific sources. Select up to four tools for side-by-side comparison. Use a task guide to compare recommendations under explicit criteria.

Recommendations are editorial matches to documented capabilities. A free tool, an open-source tool and a low-overhead tool are different concepts. Unknown pricing is displayed as unknown; source availability is separate from an open-source license. Download links lead to official installation or release pages; no binary is automatically installed. Separately linked measurements apply only to their documented versions, workloads and environment; editorial recommendations do not imply comparative speed, reliability or security.

The catalog currently carries **{c['capability_assertions']} documented task assertions** with required setup and limitations, plus **{c['measured_comparisons']} scoped measured comparison(s)**. Open a supported record to inspect the task evidence and reproducible measurement separately.

## Explore the catalog

| Family | Applications | Task categories |
| --- | ---: | ---: |
"""
    for f in catalog["families"]:
        overview += f"| [{f['name']}](Software-{f['id'].title()}) | {c['by_family'].get(f['id'], 0)} | {sum(x['family'] == f['id'] for x in catalog['categories'])} |\n"
    overview += f"""
## Evidence and maintenance

- [Selection methodology and contributor contract](Software-Methodology)
- [Task decision guides](Software-Decision-Guides)
- [Coverage gaps and refresh priorities](Software-Coverage)
- [Preserved cleanup research](Engineering-Developer-Cleanup-and-Agent-Hygiene)
- [Preserved Windows catalog](Engineering-Windows-Utilities-and-Creation-Tools)
- [Creative-AI research]({base}/blob/main/data/creative-ai-tools.json)
- [Engineering research](Engineering-Research-Explorer)
- [Structured source partitions]({base}/tree/main/data/software)
- [Expansion baseline and verification receipts]({base}/tree/main/research/software-expansion-2026-11-14)
- [Second expansion and current verification receipts]({base}/tree/main/research/software-expansion-2026-11-15)

The scheduled source audit records HTTP outcomes, redirects and dates. A reachable page is not a verification of its claims. An access block or timeout is not labelled a dead project. Maintenance is unverified unless an explicit source supports another status. Unknown fields remain visible so later research can address them.
"""
    files = {"wiki/Software-Catalog.md": overview}
    for family in catalog["families"]:
        apps = [a for a in catalog["applications"] if a["family"] == family["id"]]
        text = f"# {family['name']}\n\n{family['description']}\n\n[Browse in Athena](https://herbertofury.github.io/Athena/#software?family={family['id']}) · [Catalog](Software-Catalog) · [Method](Software-Methodology)\n\n{len(apps)} applications. Reviewed {REVIEWED}; individual records identify inherited research.\n"
        for cat in [x for x in catalog["categories"] if x["family"] == family["id"]]:
            text += f"\n## {cat['name']}\n\n"
            text += f"[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category={cat['id'].replace('/', '%2F')})\n\n"
            for a in [x for x in apps if x["category_id"] == cat["id"]]:
                text += f"### {a['name']}\n\n{a['summary']}\n\n"
                text += f"- **Platforms:** {', '.join(a['platforms'])}. **License:** {a['license']}. **Pricing model:** {a['pricing_model']}.\n"
                if a.get('platform_notes'):
                    text += f"- **Compatibility details:** {a['platform_notes']}\n"
                if a.get('pricing_notes'):
                    text += f"- **Pricing details:** {a['pricing_notes']}\n"
                text += f"- **Pick for:** {a['recommendation']['pick_for']}\n- **Compare when:** {a['recommendation']['compare_when']}\n"
                text += f"- **Strengths:** {'; '.join(a['strengths'])}\n- **Limitations:** {'; '.join(a['limitations'])}\n"
                text += f"- **Maintenance:** {a['maintenance']['status']} — {a['maintenance']['note']}"
                if a['maintenance'].get('source_url'):
                    text += f" ([evidence]({a['maintenance']['source_url']}))"
                text += "\n"
                text += f"- [Official project]({a['official_url']})"
                if a.get("download_url"):
                    text += f" · [Official installation / downloads]({a['download_url']})"
                if a.get("repository_url"):
                    text += f" · [Repository]({a['repository_url']})"
                text += "\n- **Sources:** " + "; ".join(f"[{s['label']}]({s['url']}) ({s['checked_at']}; {', '.join(s['supports'])})" for s in a["sources"]) + "\n"
                for capability in a.get("capabilities", []):
                    label = next(d["label"] for d in catalog["capabilities"] if d["id"] == capability["id"])
                    text += f"- **Documented task support — {label}:** {'; '.join(capability['conditions'])} **Limits:** {'; '.join(capability['limitations'])} "
                    text += " ".join(f"[Evidence {i}]({url})" for i, url in enumerate(capability["source_urls"], 1)) + "\n"
                for evaluation in catalog["evaluations"]:
                    if a["id"] in evaluation["app_ids"]:
                        text += f"- **Scoped measurement:** [{evaluation['title']}]({evaluation['report_url']}). {evaluation['summary']}\n"
        files[f"wiki/Software-{family['id'].title()}.md"] = text
    guide = "# Software decision guides\n\n[Open Athena](https://herbertofury.github.io/Athena/#software) · [Catalog](Software-Catalog)\n\nThese are conditional editorial recommendations based on cited product capabilities. They are not benchmark results. Ranking applies only to the stated task and constraints; prices and exact OS requirements need a final upstream check before purchase or installation.\n"
    by_id = {a["id"]: a for a in catalog["applications"]}
    for recipe in catalog["recipes"]:
        guide += f"\n## {recipe['title']}\n\n{recipe['description']}\n\n[Compare these choices in Athena](https://herbertofury.github.io/Athena/#software?task={recipe['id']})\n\n| Fit | Tool | Why choose it | Tradeoff |\n| --- | --- | --- | --- |\n"
        for p in recipe["picks"]:
            a = by_id[p["app_id"]]
            guide += f"| {clean(p['label'])} | [{clean(a['name'])}]({a['official_url']}) | {clean(p['reason'])} | {clean(p['tradeoff'])} |\n"
    files["wiki/Software-Decision-Guides.md"] = guide
    files["wiki/Software-Coverage.md"] = coverage_markdown(catalog)
    return files


def coverage_report(catalog, as_of=REVIEWED):
    """Produce a human review queue; missing evidence is not a product verdict."""
    today = date.fromisoformat(as_of)
    queue = []
    source_queue = defaultdict(list)
    for app in catalog["applications"]:
        reasons = []
        if app["license_kind"] == "unknown": reasons.append("license classification unresolved")
        if app["pricing_model"] == "unknown": reasons.append("distribution pricing unresolved")
        if app["maintenance"]["status"] == "unverified": reasons.append("dated maintenance evidence unresolved")
        latest = max(date.fromisoformat(s["checked_at"]) for s in app["sources"])
        age = (today - latest).days
        if age > 90: reasons.append("latest source review older than 90 days")
        overdue = [source for source in app["sources"]
                   if (today - date.fromisoformat(source["checked_at"])).days > 90]
        if overdue and age <= 90:
            reasons.append("some cited sources older than 90 days")
        for source in overdue:
            source_queue[source["url"]].append({"app_id": app["id"], "checked_at": source["checked_at"],
                "review_age_days": (today - date.fromisoformat(source["checked_at"])).days,
                "supports": source["supports"]})
        claims = {claim for source in app["sources"] for claim in source["supports"]}
        required = {"identity", "features", "platforms"}
        if app["license_kind"] != "unknown": required.add("license")
        if app["pricing_model"] != "unknown": required.add("pricing")
        if app.get("download_url"): required.add("downloads")
        missing = sorted(required - claims)
        if missing: reasons.append("preserved record needs field-specific source mapping: " + ", ".join(missing))
        if reasons:
            queue.append({"app_id": app["id"], "name": app["name"], "origin": app["origin"],
                          "latest_source_review": latest.isoformat(), "review_age_days": max(0, age), "reasons": reasons})
    thin = [{"category_id": c["id"], "name": c["name"], "application_ids": c["application_ids"]}
            for c in catalog["categories"] if c["count"] == 1]
    outside = defaultdict(list)
    for app in catalog["applications"]:
        for name in app["alternatives_outside_catalog"]:
            outside[name].append(app["id"])
    return {"schema_version": 1, "as_of": as_of, "review_interval_days": 90,
            "scope": "Research work queue. Unknown fields and review age do not establish inactivity, insecurity or inferior quality.",
            "counts": catalog["counts"], "records_needing_research": len(queue), "refresh_queue": queue,
            "source_urls_due_for_review": len(source_queue),
            "source_refresh_queue": [{"url": url, "references": references}
                                     for url, references in sorted(source_queue.items())],
            "alternatives_not_yet_researched": [{"name": name, "mentioned_by": sorted(ids)} for name, ids in sorted(outside.items())],
            "single_application_categories": thin, "coverage_priorities": read("data/software/coverage-priorities.json")["priorities"]}


def coverage_markdown(catalog):
    report = coverage_report(catalog)
    c = catalog["counts"]
    text = f"""# Software coverage and refresh priorities

[Catalog](Software-Catalog) · [Decision guides](Software-Decision-Guides) · [Method](Software-Methodology)

Reviewed {REVIEWED}. The integrated catalog contains **{c['applications']} applications in {c['categories']} categories**. It is a substantial expansion, not a claim of complete software coverage. {len(report['single_application_categories'])} categories currently contain one application and need stronger comparison sets.

## Evidence that remains open

| Field | Unresolved records |
| --- | ---: |
| Pricing model | {c['by_pricing'].get('unknown', 0)} |
| License classification | {c['by_license'].get('unknown', 0)} |
| Dated maintenance evidence | {c['by_maintenance'].get('unverified', 0)} |

The counts overlap. Unknown pricing can mean that free source code was verified but the distribution terms were not established. Unverified maintenance is not the same as an abandoned project. All nonlegacy records with known licensing, pricing, platform or download claims must include corresponding source annotations; the build rejects missing mappings. An annotation identifies the source's intended role and is not a substitute for reading it.

There are also {c['unresolved_alternative_mentions']} mentions of alternatives outside this catalog. The refresh queue records their names and referring records as research leads; they are not counted as verified applications or promoted to ranked choices.

The [machine-readable refresh queue](https://github.com/Herbertofury/Athena/blob/main/research/software-expansion-2026-11-15/refresh-queue.json) contains {report['records_needing_research']} records needing more research and {report['source_urls_due_for_review']} source URLs due for review. Every cited source has its own age: checking a homepage again does not refresh an older license or platform document. Run `python3 scripts/report_software_coverage.py --output software-refresh-report.json` to recompute the queue using today's date. Pull requests and the weekly source audit retain this report alongside HTTP outcomes and real-browser evidence. A 90-day review interval is a scheduling policy, not a factual expiration date.

## Next coverage areas

"""
    for priority in report["coverage_priorities"]:
        text += f"### {priority['area']}\n\n" + "; ".join(priority["tasks"]) + ".\n\n" + priority["next_evidence"] + "\n\n"
    text += "## Categories with one researched candidate\n\nThese are useful starting points but do not yet support a broad within-category comparison. Related tools can still appear in task guides and explicit alternative links.\n\n| Category | Current application |\n| --- | --- |\n"
    by_id = {a["id"]: a for a in catalog["applications"]}
    for cat in report["single_application_categories"]:
        app = by_id[cat["application_ids"][0]]
        text += f"| {cat['name']} | [{app['name']}]({app['official_url']}) |\n"
    return text


def expansion_progress(catalog):
    baseline = read(REPORTS + "/baseline.json")
    before_ids = set(baseline["application_ids"])
    current_ids = {a["id"] for a in catalog["applications"]}
    missing = before_ids - current_ids
    if missing:
        raise ValueError("Previously published applications disappeared: " + ", ".join(sorted(missing)))
    categories = {c["id"]: c for c in catalog["categories"]}
    improved, still_single = [], []
    for original in baseline["single_application_categories"]:
        target = original["id"]
        while target in catalog["category_aliases"]:
            target = catalog["category_aliases"][target]
        current = categories.get(target)
        if current and current["count"] > 1:
            improved.append({"before_category": original["id"], "current_category": target, "name": current["name"],
                "before_count": 1, "current_count": current["count"], "application_ids": current["application_ids"]})
        else:
            still_single.append(original["id"])
    return {"schema_version": 1, "reviewed_at": REVIEWED, "baseline_commit": baseline["baseline_commit"],
        "before": baseline["counts"], "after": catalog["counts"],
        "added_application_ids": sorted(current_ids - before_ids), "preserved_application_count": len(before_ids),
        "added_category_ids": sorted(set(categories) - set(baseline["category_ids"])),
        "original_singleton_categories": len(baseline["single_application_categories"]),
        "original_singletons_improved": len(improved), "improved_comparison_sets": improved,
        "original_singletons_still_thin": still_single,
        "current_singleton_categories": sum(c["count"] == 1 for c in categories.values())}


def build(check=False, partial=False):
    catalog = load_catalog(require_partitions=not partial)
    outputs = {"dist/workspaces/software/catalog.json": json.dumps(catalog, ensure_ascii=False, separators=(",", ":")) + "\n",
               REPORTS + "/coverage.json": json.dumps(catalog["counts"], indent=2) + "\n",
               REPORTS + "/refresh-queue.json": json.dumps(coverage_report(catalog), indent=2) + "\n",
               REPORTS + "/expansion-progress.json": json.dumps(expansion_progress(catalog), indent=2) + "\n",
               **markdown(catalog)}
    for name in ("index.mjs", "model.mjs", "style.css"):
        p = ROOT / "src/software" / name
        if p.exists():
            outputs["dist/workspaces/software/" + name] = p.read_text()
    stale = []
    for name, text in outputs.items():
        p = ROOT / name
        if check:
            if not p.exists() or p.read_text() != text:
                stale.append(name)
        else:
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(text, encoding="utf-8")
    if stale:
        raise ValueError("Generated software output is stale: " + ", ".join(stale))
    return catalog["counts"]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--partial", action="store_true", help="Development only; permit unfinished research partitions")
    args = parser.parse_args()
    print(json.dumps(build(args.check, args.partial), indent=2))
