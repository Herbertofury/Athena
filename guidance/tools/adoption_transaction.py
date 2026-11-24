"""Exception rollback for explicit guidance adoption, not crash-atomic storage."""
import os
import json
from pathlib import Path
import shutil
import tempfile


def write_set(target, payloads, safe_path):
    """Stage bytes before writes; retain backups if rollback cannot complete.

Caller must serialize writers. Not safe against hostile concurrent filesystem
mutation, process termination or power loss; no crash durability is claimed.
"""
    target = Path(target)
    if any(target.glob(".athena-adoption-*")):
        raise ValueError("Unresolved adoption recovery directory; preserve and inspect before retry.")
    original = {}
    for relative in payloads:
        path = safe_path(target, relative)
        if path.exists() and not path.is_file():
            raise ValueError('non-file adoption destination')
        original[relative] = path.read_bytes() if path.exists() else None
    if not payloads:
        return
    stage = Path(tempfile.mkdtemp(prefix='.athena-adoption-', dir=target))
    committed = []; created_dirs = []; retain = False
    try:
        (stage/'recovery-index.json').write_text(json.dumps({
            'scope': 'Local recovery only; may contain private project paths. Do not publish.',
            'entries': [{'index': i, 'path': path, 'originalPresent': original[path] is not None}
                        for i, path in enumerate(payloads)]}, indent=2), encoding='utf-8')
        for index, (relative, data) in enumerate(payloads.items()):
            (stage/f'new-{index}').write_bytes(data)
            if original[relative] is not None:
                (stage/f'old-{index}').write_bytes(original[relative])
        for index, (relative, data) in enumerate(payloads.items()):
            path = safe_path(target, relative)
            now = path.read_bytes() if path.is_file() else None
            if now != original[relative] or (path.exists() and not path.is_file()):
                raise ValueError('adoption destination changed after staging')
            missing = []
            parent = path.parent
            while not parent.exists():
                missing.append(parent); parent = parent.parent
            for directory in reversed(missing):
                directory.mkdir(); created_dirs.append(directory)
            os.replace(stage/f'new-{index}', path)
            committed.append((index, relative, data))
    except (Exception, KeyboardInterrupt):
        failed = False
        for index, relative, written in reversed(committed):
            try:
                path = safe_path(target, relative)
                if not path.is_file() or path.read_bytes() != written:
                    raise ValueError('concurrent destination change; preserve it')
                if original[relative] is None:
                    path.unlink()
                else:
                    os.replace(stage/f'old-{index}', path)
            except (Exception, KeyboardInterrupt):
                failed = True
        for directory in reversed(created_dirs):
            try: directory.rmdir()
            except OSError: pass  # never remove nonempty directories
        if failed:
            retain = True
            raise OSError('Rollback incomplete; preserve .athena-adoption-* recovery directory and inspect locally.') from None
        raise
    finally:
        if not retain:
            shutil.rmtree(stage)
