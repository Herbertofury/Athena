#!/usr/bin/env python3
"""Verify a selected Agent-Foundry release ZIP against its exact Git source. No install."""
import argparse
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import re
import stat
import subprocess
import zipfile

from history_bundle import git
from skill_sync import portable, safe

MAX_BYTES = 32 * 1024 * 1024
MAX_FILES = 2000
SOURCE = "https://github.com/Herbertofury/Agent-Foundry"


def sha(data):
    return hashlib.sha256(data).hexdigest()


def sha_like(value):
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{64}", value)


def name_parts(path):
    name = PurePosixPath(path)
    if (not name.parts or name.is_absolute() or path != name.as_posix() or
            not all(portable(part) for part in name.parts)):
        raise ValueError("Unsupported member name")
    return name.parts


def source_manifest(repo, revision, slug):
    prefix = f"skills/{slug}/"
    rows = git(repo, 'ls-tree', '-lr', '-z', revision, '--', prefix).split(b'\0')
    answer, total = {}, 0
    for row in filter(None, rows):
        meta, raw = row.split(b'\t', 1)
        path = raw.decode('utf-8')
        kind_mode, kind, oid, size = meta.decode('ascii').split()
        if not path.startswith(prefix) or kind != 'blob' or kind_mode not in ('100644', '100755'):
            raise ValueError("Source contains unsupported files")
        path = path[len(prefix):]
        parts = name_parts(path)
        if '__pycache__' in parts or path.lower().endswith(('.pyc', '.pyo')):
            continue
        total += int(size)
        if len(answer) >= MAX_FILES or total > MAX_BYTES:
            raise ValueError("Source size limit")
        answer[path] = sha(git(repo, 'cat-file', 'blob', oid))
    return answer


def file_at(path, limit):
    item = safe(path)
    if not item.is_file() or item.stat().st_size > limit:
        raise ValueError("Expected an explicitly selected, bounded regular file")
    return item


def unique(items):
    result = {}
    for key, val in items:
        if key in result:
            raise ValueError("Ambiguous receipt")
        result[key] = val
    return result


def verify(archive, receipt, repo, revision, expected):
    if not isinstance(revision, str) or not re.fullmatch(r'[0-9a-f]{40}', revision) or not sha_like(expected):
        raise ValueError("Supply independent exact commit and ZIP digest")
    repo = safe(repo)
    if not repo.is_dir() or git(repo, 'rev-parse','--verify',revision+'^{commit}').decode().strip() != revision:
        raise ValueError("Source commit missing")
    archive = file_at(archive, MAX_BYTES)
    with file_at(receipt, 64*1024).open('rb') as source:
        proof = json.loads(source.read(64*1024+1), object_pairs_hook=unique)
    ident = proof.get('artifact') if isinstance(proof, dict) else None
    if (not isinstance(ident,str) or not re.fullmatch(r'[a-z0-9-]+/skill[.]zip', ident) or
            type(proof.get('schemaVersion')) is not int or proof['schemaVersion'] != 1 or
            type(proof.get('sizeBytes')) is not int or proof.get('source') != SOURCE or
            proof.get('sourceRevision') != revision or proof.get('sha256') != expected or
            not sha_like(proof.get('sourceTreeDigest'))):
        raise ValueError("Receipt does not match explicit release identity")
    slug = ident.partition('/')[0]
    with archive.open('rb') as stream:
        body = stream.read(MAX_BYTES+1)
    if not body or len(body) > MAX_BYTES or sha(body) != expected or len(body) != proof.get('sizeBytes'):
        raise ValueError("ZIP bytes do not match independent digest and receipt")
    answer, case_names = {}, set()
    with zipfile.ZipFile(io.BytesIO(body)) as package:
        entries = package.infolist()
        if not 1 <= len(entries) <= MAX_FILES or sum(m.file_size for m in entries) > MAX_BYTES:
            raise ValueError("ZIP content limit")
        for member in entries:
            parts = name_parts(member.filename)
            mode = stat.S_IFMT(member.external_attr >> 16)
            alias = member.filename.casefold()
            if (len(parts) < 2 or parts[0] != slug or mode not in (0,stat.S_IFREG) or
                    member.flag_bits & 1 or alias in case_names or member.is_dir()):
                raise ValueError("Ambiguous or unsupported member")
            case_names.add(alias)
            answer['/'.join(parts[1:])] = sha(package.read(member))
    source = source_manifest(repo, revision, slug)
    if 'SKILL.md' not in source or len({p.casefold() for p in source}) != len(source):
        raise ValueError("No unambiguous original Skill source")
    calculated = sha(b''.join(path.encode()+b'\0'+digest.encode()+b'\n' for path,digest in sorted(source.items())))
    return dict(schema=1, skill=slug, sourceCommit=revision,
                exactTagFileBytes=source==answer,
                sourceTreeDigestMatches=calculated==proof['sourceTreeDigest'],
                sourceFiles=len(source), zipFiles=len(answer),
                onlyInZip=len(answer.keys()-source.keys()), onlyInSource=len(source.keys()-answer.keys()),
                changedBytes=sum(answer[p]!=source[p] for p in answer.keys()&source.keys()),
                verifiedAgainstSelectedGit=(source==answer and calculated==proof['sourceTreeDigest']),
                installed=False, signatureVerified=False)


def main():
    p=argparse.ArgumentParser(description=__doc__)
    for key in ('archive','receipt','source-repo'):
        p.add_argument('--'+key,required=True,type=Path)
    for key in ('source-commit','zip-sha256'):
        p.add_argument('--'+key,required=True)
    a=p.parse_args()
    try:
        result=verify(a.archive,a.receipt,a.source_repo,a.source_commit,a.zip_sha256)
        print(json.dumps(result,indent=2))
        return 0 if result['verifiedAgainstSelectedGit'] else 1
    except (OSError, ValueError, zipfile.BadZipFile, RuntimeError, subprocess.SubprocessError):
        print(json.dumps({'error':'Release source intake refused. Check independent pins, ordinary paths and retained bytes.', 'installed':False}))
        return 2


if __name__=='__main__':
    raise SystemExit(main())
