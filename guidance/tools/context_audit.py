"""Inspect committed repository instructions without editing, running, or printing them."""
import argparse
from collections import defaultdict
import json
import os
from pathlib import Path
import re
import subprocess

NAMES = {"AGENTS.md", "AGENTS.override.md", "CLAUDE.md", "CLAUDE.local.md"}
OBJECT = re.compile(rb"[0-9a-f]{40}|[0-9a-f]{64}")
MAX_TREE = 8 * 1024 * 1024
MAX_FILE = 256 * 1024
MAX_FILES = 256
MAX_TOTAL = 2 * 1024 * 1024


def git(repo, *args, bound):
    env = dict(os.environ, GIT_NO_LAZY_FETCH="1", GIT_NO_REPLACE_OBJECTS="1",
               GIT_OPTIONAL_LOCKS="0", GIT_TERMINAL_PROMPT="0")
    # A supplied checkout must be the target, not an inherited Git override.
    for key in list(env):
        if key in {"GIT_DIR", "GIT_WORK_TREE", "GIT_COMMON_DIR", "GIT_NAMESPACE",
                   "GIT_INDEX_FILE", "GIT_OBJECT_DIRECTORY",
                   "GIT_ALTERNATE_OBJECT_DIRECTORIES"} or key.startswith("GIT_CONFIG"):
            env.pop(key)
    with subprocess.Popen(
        ["git", "-c", "protocol.allow=never", "-C", str(repo), *args],
        env=env, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
    ) as process:
        data = process.stdout.read(bound + 1)
        if len(data) > bound:
            process.kill()
            process.wait()
            raise ValueError("Git result exceeds audit bound")
        if process.wait() != 0:
            raise ValueError("Required local Git object unavailable")
    return data


def audit(repo, source=None):
    repo = Path(repo).resolve(strict=True)
    root = git(repo, "rev-parse", "--show-toplevel", bound=8192).rstrip(b"\r\n")
    if Path(os.fsdecode(root)).resolve(strict=True) != repo:
        raise ValueError("Select the checkout root explicitly")
    if source is not None and not OBJECT.fullmatch(source.encode("ascii")):
        raise ValueError("Use a full Git commit ID")
    ref = source or "HEAD"
    pin = git(repo, "rev-parse", "--verify", ref + "^{commit}", bound=128).strip()
    if not OBJECT.fullmatch(pin) or (source is not None and pin.decode() != source):
        raise ValueError("Exact Git commit required")
    tree = git(repo, "ls-tree", "-r", "-l", "-z", pin.decode(), bound=MAX_TREE)
    files, candidates = [], defaultdict(list)
    total = 0
    for record in tree.split(b"\0"):
        if not record:
            continue
        meta, raw_path = record.split(b"\t", 1)
        if os.fsdecode(raw_path.rsplit(b"/", 1)[-1]) not in NAMES:
            continue
        if len(files) == MAX_FILES:
            raise ValueError("Instruction inventory exceeds audit bound")
        mode, kind, oid, size = meta.split()
        entry = {"path": os.fsdecode(raw_path)}
        if kind != b"blob" or mode not in {b"100644", b"100755"}:
            files.append(dict(entry, status="not_regular"))
            continue
        length = int(size)
        if length > MAX_FILE or total + length > MAX_TOTAL:
            raise ValueError("Instruction bytes exceed audit bound")
        if not OBJECT.fullmatch(oid):
            raise ValueError("Unexpected Git object identifier")
        obj = git(repo, "cat-file", "blob", oid.decode(), bound=length)
        if len(obj) != length:
            raise ValueError("Git blob length mismatch")
        total += length
        try:
            text = obj.decode("utf-8", errors="strict")
            if "\x00" in text:
                raise UnicodeError("NUL or nontext")
        except UnicodeError:
            files.append(dict(entry, status="not_utf8_text", bytes=length))
            continue
        lines = text.splitlines()
        files.append(dict(entry, status="counted", bytes=length,
                          lines=len(lines), words=len(text.split())))
        for line, content in enumerate(lines, 1):
            normalized = " ".join(content.split())
            if len(normalized) >= 24 and (normalized[0].isalnum() or normalized.startswith(("- ", "* "))):
                candidates[normalized].append([entry["path"], line])
    duplicate_locations = [locations for locations in candidates.values()
                           if len({path for path, _ in locations}) > 1]
    return {"schema": "athena.repository-context-audit.v1", "source_commit": pin.decode(),
            "instruction_bytes": total, "files": files, "repeat_groups": len(duplicate_locations),
            "sample_repeats": [rows[:12] for rows in duplicate_locations[:40]],
            "token_usage": None, "automatic_edits": False}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("repo", type=Path)
    p.add_argument("--commit")
    a = p.parse_args()
    try:
        print(json.dumps(audit(a.repo, a.commit), indent=2, ensure_ascii=True))
    except (OSError, ValueError, UnicodeError) as error:
        p.error(str(error))


if __name__ == "__main__":
    main()
