"""Replay the retained Feature Foundry history and release proof entirely offline."""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent
OMITTED_FROM_ORIGINAL_SOURCE_ZIP = {".gitattributes", "progress.md"}
HEX40 = re.compile(r"[0-9a-f]{40}\Z")
HEX64 = re.compile(r"[0-9a-f]{64}\Z")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def git(path, *args):
    env = {k: v for k, v in os.environ.items() if not k.startswith("GIT_")}
    env.update(GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL=os.devnull,
               GIT_OPTIONAL_LOCKS="0", GIT_TERMINAL_PROMPT="0",
               GIT_ALLOW_PROTOCOL="file")
    return subprocess.run(["git", "-C", str(path), *args], stdout=subprocess.PIPE,
                          stderr=subprocess.PIPE, timeout=30, env=env, check=True).stdout


def digest(data):
    return hashlib.sha256(data).hexdigest()


def read_pinned(path, size, expected):
    require(type(size) is int and 0 < size <= 32 * 1024 * 1024 and bool(HEX64.fullmatch(expected)),
            "Invalid size or checksum in the preservation ledger")
    require(path.is_file() and not path.is_symlink() and path.stat().st_size == size,
            "A retained file is missing, redirected or the wrong size")
    data = path.read_bytes()
    require(len(data) == size and digest(data) == expected, "A retained file has the wrong checksum")
    return data


def safe_member(path):
    return (bool(path) and not any(c in path for c in ("\\", ":", "\0"))
            and not path.startswith("/") and all(p not in {"", ".", ".."} for p in path.split("/"))
            and not PurePosixPath(path).is_absolute())


def verify_source_zip(data, manifest):
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        seen, files = set(), set()
        for member in archive.infolist():
            name = member.filename.rstrip("/") if member.is_dir() else member.filename
            require(safe_member(name) and name not in seen and not stat.S_ISLNK(member.external_attr >> 16),
                    "The original source ZIP contains an unexpected member")
            seen.add(name)
            if member.is_dir():
                require(member.file_size == 0 and any(f.startswith(name + "/") for f in manifest),
                        "The source ZIP contains an unexpected directory")
                continue
            require(name in manifest and member.file_size == manifest[name]["bytes"],
                    "The source ZIP has a file outside the retained source manifest")
            require(digest(archive.read(member)) == manifest[name]["sha256"],
                    "A source ZIP member changed")
            files.add(name)
    require(manifest.keys() - files == OMITTED_FROM_ORIGINAL_SOURCE_ZIP,
            "The source ZIP does not match its documented subset")
    return len(files)


def verify(root=ROOT, private_release_dir=None):
    repo = json.loads((root / "history-recovery.json").read_bytes())
    manifest = json.loads((root / "source-manifest.json").read_bytes())
    original = manifest["sourceHead"]
    require(HEX40.fullmatch(original), "The retained original source commit is invalid")
    by_path = {x["path"]: x for x in manifest["files"]}
    require(len(by_path) == len(manifest["files"]) == 100, "Invalid original source manifest")
    sample = repo["bundle"]
    bundle = root / "feature-foundry-history.bundle"
    require(sample["file"] == bundle.name, "Unexpected history bundle name")
    bundle_bytes = read_pinned(bundle, sample["bytes"], sample["sha256"])
    with tempfile.TemporaryDirectory(prefix="athena-foundry-offline-") as tmp:
        scratch = Path(tmp)
        copied, restored = scratch / "sealed.bundle", scratch / "replay.git"
        copied.write_bytes(bundle_bytes)
        git(scratch, "-c", "core.hooksPath=" + os.devnull, "clone", "--mirror", "--", str(copied), str(restored))
        git(restored, "bundle", "verify", str(copied))
        git(restored, "fsck", "--full", "--no-reflogs")
        refs = dict(row.split() for row in git(restored, "for-each-ref", "--format=%(refname) %(objectname)").decode().splitlines())
        require(refs == {x["ref"]: x["object"]["sha"] for x in repo["refs"]}, "Restored refs differ")
        commits = git(restored, "rev-list", "--all").decode().splitlines()
        require(len(commits) == len(repo["commits"]) and set(commits) == set(repo["commits"]), "Restored commits differ")
        rows = [line.split(b"\t", 1) for line in git(restored, "ls-tree", "-rz", original).split(b"\0") if line]
        require(len(rows) == len(by_path), "Restored source path count differs")
        for meta, raw_path in rows:
            name = raw_path.decode("utf-8")
            mode, kind, identity = meta.decode("ascii").split()
            require(name in by_path and kind == "blob", "Unexpected original source tree entry")
            item = by_path[name]
            require(mode == item["mode"] and identity == item["gitBlob"], "Original Git tree identity differs")
            data = git(restored, "cat-file", "blob", identity)
            require(len(data) == item["bytes"] and digest(data) == item["sha256"], "Original source bytes differ")

    (release,) = json.loads((root / "release-inventory.json").read_bytes())
    require(release["tag"] == "v24.0.0", "The inventory must describe the retained original release")
    assets = {asset["name"]: asset for asset in release["assets"]}
    require(len(assets) == len(release["assets"]) == 6 and all(safe_member(n) and "/" not in n for n in assets),
            "Invalid release asset inventory")
    release_dir = root / "releases/v24.0.0"
    preserved, outside_checkout = {}, []
    private_count = 0
    if private_release_dir is not None:
        require(private_release_dir.is_dir() and not private_release_dir.is_symlink(),
                "Private release input must be a local directory")
    for name, item in sorted(assets.items()):
        file = release_dir / name
        require(item["digest"].startswith("sha256:"), "A checksum type is unsupported")
        if item["preservationStatus"].startswith("preserved-private-hash-verified-"):
            outside_checkout.append(name)
            require(not file.exists() and not file.is_symlink(),
                    "A private original must remain out of the tracked checkout")
            if private_release_dir is None:
                continue
            file = private_release_dir / name
            private_count += 1
        preserved[name] = read_pinned(file, item["bytes"], item["digest"][7:])
    sums = {}
    for line in preserved["SHA256SUMS.txt"].decode("ascii").splitlines():
        parts = line.split(maxsplit=1)
        require(len(parts) == 2 and HEX64.fullmatch(parts[0]) and parts[1] not in sums,
                "The retained original checksum text is invalid")
        sums[parts[1]] = "sha256:" + parts[0]
    require(sums == {n: a["digest"] for n, a in assets.items() if n != "SHA256SUMS.txt"},
            "The retained original checksum text and release inventory disagree")
    zip_count = verify_source_zip(preserved["Feature-Foundry-v24.0.0-source.zip"], by_path)
    return {"status": "verified-original-release-bytes" if len(preserved) == len(assets) else "verified-partial-preservation", "offline": True, "restoredRefs": len(refs),
            "restoredCommits": len(commits), "sourcePathsVerified": len(by_path),
            "originalSourceZipFilesVerified": zip_count, "releaseAssetsVerified": len(preserved),
            "outsideCheckout": outside_checkout, "privateReleaseAssetsVerified": private_count,
            "missingReleaseAssets": sorted(set(assets) - set(preserved)), "retirementCertified": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--private-release-dir", type=Path,
                        help="Local untracked folder containing the two independently retained original ZIPs")
    options = parser.parse_args()
    try:
        result = verify(private_release_dir=options.private_release_dir)
    except (OSError, ValueError, KeyError, TypeError, subprocess.SubprocessError, zipfile.BadZipFile):
        print(json.dumps({"status": "refused", "retirementCertified": False}))
        raise SystemExit(2)
    print(json.dumps(result, indent=2, sort_keys=True))
