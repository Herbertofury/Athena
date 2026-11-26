"""Read-only Athena consumer pin verifier. No Git, network or adoption commands."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path


SOURCE_URL = "https://github.com/Herbertofury/Athena"
MANIFEST = "registry/repository-governance.json"
LOCK = ".athena/governance-lock.json"
SNAPSHOT = ".agents/athena"
POLICY_FILES = (
    "PRODUCT_INVARIANTS.md", "MODERNIZATION_STANDARD.md", "DESIGN_QUALITY_STANDARD.md",
    "FAILURE_INTELLIGENCE_STANDARD.md", "CHALLENGER_INTEGRATION_STANDARD.md",
    "PERFORMANCE_ACCEPTANCE.md", "RUNTIME_PROOF.md", "DURABLE_EXECUTION_STANDARD.md",
    "EVALUATION_STANDARD.md", "OBSERVABILITY_STANDARD.md", "INTEROPERABILITY_STANDARD.md",
    "AUTHORIZATION_CONTROL_STANDARD.md", "THIRD_PARTY_SKILL_SECURITY.md",
    "SUPPLY_CHAIN_STANDARD.md", "DISTRIBUTION_STANDARD.md", "templates/AGENTS.repository.md",
)


def content(path: Path) -> bytes:
    # Markdown snapshots are portable across Git's Windows line-ending conversion.
    return read_review_text(path.parent, path.name).encode("utf-8")


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def release(repo: Path, version: str) -> dict:
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise ValueError("version must be major.minor.patch")
    ids = re.findall(r"^## (\d+)\. ", read_review_text(repo, POLICY_FILES[0]), re.M)
    return {"schemaVersion": 1, "version": version, "sourceRepository": SOURCE_URL,
            "digestFormat": "sha256-utf8-lf", "invariantIds": [int(x) for x in ids],
            "files": {name: digest(read_review_text(repo, name).encode("utf-8")) for name in POLICY_FILES}}


def checked_release(repo: Path) -> dict:
    manifest = json.loads(read_review_text(repo, MANIFEST))
    if not isinstance(manifest, dict) or manifest.get("schemaVersion") != 1:
        raise ValueError("missing/unsupported repository governance manifest")
    if manifest != release(repo, manifest["version"]):
        raise ValueError("canonical policy drift; publish a new manifest version before adoption")
    return manifest


def destination(name: str) -> str:
    filename = "AGENTS-adapter.md" if name.startswith("templates/") else name
    return f"{SNAPSHOT}/{filename}"


def safe_path(target: Path, relative: str) -> Path:
    # Never write through a symlink/junction into another project or user directory.
    path = target / relative
    for item in [path, *path.parents]:
        if item == target:
            break
        if item.is_symlink() or (hasattr(item, "is_junction") and item.is_junction()):
            raise ValueError(f"linked destination refused: {item}")
    if not path.resolve().is_relative_to(target.resolve()):
        raise ValueError(f"destination escapes target: {relative}")
    return path


LEGACY_LOCK = ".agent-foundry/governance-lock.json"
LEGACY_URL = "https://github.com/Herbertofury/Agent-Foundry"
PIN_ROUTE = re.compile(r"(?i)^Read[ \t]+`(\.agents/(?:athena|foundry)/AGENTS-adapter\.md)`")
FENCE = re.compile(r"^ {0,3}(`{3,}|~{3,})(.*)$")
VERIFY_FILE_LIMIT = 128 * 1024


def read_review_text(target: Path, relative: str) -> str:
    path = safe_path(target, relative)
    if not path.is_file():
        raise ValueError(f"expected ordinary file: {relative}")
    with path.open("rb") as file:
        data = file.read(VERIFY_FILE_LIMIT + 1)
    if len(data) > VERIFY_FILE_LIMIT:
        raise ValueError(f"governance review limit exceeded: {relative}")
    return data.decode("utf-8").replace("\r\n", "\n")


def verify_lock(target: Path, relative: str, source: str,
                expected_keys: set[str], canonical: dict | None = None) -> dict:
    lock = json.loads(read_review_text(target, relative))
    if (not isinstance(lock, dict) or type(lock.get("schemaVersion")) is not int
            or lock["schemaVersion"] != 1 or lock.get("digestFormat") != "sha256-utf8-lf"
            or lock.get("sourceRepository") != source or lock.get("sourceWorkingTreeDirty") is not False
            or not isinstance(lock.get("sourceCommit"), str)
            or not re.fullmatch(r"[a-f0-9]{40}", lock["sourceCommit"])
            or not isinstance(lock.get("version"), str) or not re.fullmatch(r"\d+\.\d+\.\d+", lock["version"])
            or not isinstance(lock.get("files"), dict) or set(lock["files"]) != expected_keys):
        raise ValueError(f"unsupported or incomplete governance lock: {relative}")
    if canonical and (
        lock["version"] != canonical["version"]
        or lock["files"] != {destination(k): v for k, v in canonical["files"].items()}
    ):
        raise ValueError("Athena lock does not match the selected canonical release")
    for filename, expected in sorted(lock["files"].items()):
        if not isinstance(expected, str) or not re.fullmatch(r"[a-f0-9]{64}", expected):
            raise ValueError(f"invalid digest: {filename}")
        if digest(read_review_text(target, filename).encode("utf-8")) != expected:
            raise ValueError(f"pinned file drift: {filename}")
    return {"version": lock["version"], "claimedSourceCommit": lock["sourceCommit"],
            "filesVerified": len(expected_keys),
            "verification": "canonical release and local bytes" if canonical else "local bytes against retained lock"}


def read_directives(markdown: str) -> list[str]:
    routes = []
    fence = None
    for line in re.sub(r"<!--.*?(?:-->|\Z)", "", markdown, flags=re.S).splitlines():
        mark = FENCE.match(line)
        if fence:
            if mark and mark[1][0] == fence[0] and len(mark[1]) >= len(fence) and not mark[2].strip():
                fence = None
            continue
        if mark:
            fence = mark[1]
        elif route := PIN_ROUTE.match(line):
            routes.append(route[1])
    return routes


def verify_consumer(repo: Path, target: Path) -> dict:
    """Check explicit routes and immutable snapshot bytes; no adoption or writes."""
    if not target.is_dir() or target == repo:
        raise ValueError("select a separate consumer directory")
    canonical = checked_release(repo)
    expected = {destination(name) for name in canonical["files"]}
    native = verify_lock(target, LOCK, SOURCE_URL, expected, canonical)
    expected_route = f"{SNAPSHOT}/AGENTS-adapter.md"
    for path in ("AGENTS.md", "AGENTS.override.md"):
        candidate = safe_path(target, path)
        if path != "AGENTS.md" and not candidate.exists():
            continue
        if read_directives(read_review_text(target, path)) != [expected_route]:
            raise ValueError(f"explicit Athena-only Read directive not verified: {path}")
    legacy = None
    if safe_path(target, LEGACY_LOCK).exists():
        retained = {name.replace(f"{SNAPSHOT}/", ".agents/foundry/", 1) for name in expected}
        legacy = verify_lock(target, LEGACY_LOCK, LEGACY_URL, retained)
    return {"schemaVersion": 1, "rootReadDirective": expected_route, "athena": native,
            "retainedLegacy": legacy,
            "scope": "Offline pinned bytes and root Read directives; no loaded-client, provenance, or retirement proof."}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", type=Path, required=True)
    args = parser.parse_args()
    try:
        target = args.target.expanduser().absolute()
        if target.is_symlink() or (hasattr(target, "is_junction") and target.is_junction()):
            raise ValueError("select the actual consumer directory rather than a linked path")
        print(json.dumps(verify_consumer(Path(__file__).resolve().parents[1], target.resolve()), indent=2))
        return 0
    except (ValueError, OSError, KeyError) as exc:
        print(f"consumer-verify: {exc}", file=sys.stderr)
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
