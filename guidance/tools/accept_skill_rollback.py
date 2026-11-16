#!/usr/bin/env python3
"""Exercise real selected payload bytes in a new disposable, non-client directory.

Copies and hashes only: never executes Skill code or installs into a client.
Retains all trial directories for inspection. Source content is not printed.
"""
import argparse
import json
from pathlib import Path
import shutil
import tempfile
from skill_sync import prepare, apply as install, tree, safe, MARKER, sha
from skill_rollback import plan, apply as rollback


def snapshot(root):
    return {p.relative_to(root).as_posix(): sha(p.read_bytes())
            for p in sorted(root.rglob('*')) if p.is_file()}


def run(sources, output_parent):
    sources = [safe(p) for p in sources]
    # Preflight every input before any copies. No source code is executed.
    before = {str(p): tree(p)[1] for p in sources}
    trial = Path(tempfile.mkdtemp(prefix='athena-rollback-trial-', dir=safe(output_parent)))
    source_root = trial / 'source-copies'
    target = trial / 'non-client-copy'
    source_root.mkdir(); target.mkdir()
    copies = []
    for source in sources:
        copy = source_root / source.name
        shutil.copytree(source, copy)
        copies.append(copy)
    initial, _ = prepare(copies, target)
    created = Path(install(copies, target, initial['reviewSha256'])['recoveryDirectory'])
    installed = {p.name: snapshot(target / p.name) for p in copies}
    # A controlled inert payload change exercises update restoration for every Skill.
    for copy in copies:
        path = copy / 'SKILL.md'
        path.write_bytes(path.read_bytes() + b'\n<!-- disposable rollback acceptance marker -->\n')
    changed, _ = prepare(copies, target)
    updated = Path(install(copies, target, changed['reviewSha256'])['recoveryDirectory'])
    review = plan(updated)
    rollback(updated, review['reviewSha256'])
    exact = all(snapshot(target / p.name) == installed[p.name] for p in copies)
    assert exact, 'previous installed bytes not restored'
    retained_updates = all((updated / ('reverted-new-' + p.name) / MARKER).is_file() for p in copies)
    rollback(created, plan(created)['reviewSha256'])
    inactive = all(not (target / p.name).exists() for p in copies)
    retained_originals = all((created / ('reverted-new-' + p.name) / MARKER).is_file() for p in copies)
    unchanged = before == {str(p): tree(p)[1] for p in sources}
    assert inactive and retained_originals and retained_updates and unchanged
    return {'schema': 1, 'skills': len(sources), 'sourceFiles': sum(len(v) for v in before.values()),
            'exactPreviousInstallRestored': exact, 'updatedCopiesRetained': retained_updates,
            'initialCopiesRetained': retained_originals, 'activeTrialCopiesRemoved': inactive,
            'sourcesUnchanged': unchanged, 'sourceCodeExecuted': False,
            'clientInstalled': False, 'windowsAcceptance': False, 'retirementReady': False,
            'trialDirectory': str(trial)}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, action='append', required=True)
    parser.add_argument('--output-parent', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(run(args.source, args.output_parent), indent=2))
