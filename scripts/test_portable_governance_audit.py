"""Qualify the read-only governance component from an actually extracted package."""
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile


def observed(root):
    return {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in root.rglob('*') if p.is_file()}


def require(ok, message):
    if not ok:
        raise AssertionError(message)


def main(package):
    with tempfile.TemporaryDirectory(prefix='athena-governance-acceptance-') as t:
        scratch = Path(t).resolve()
        bundle = scratch / 'package'
        shutil.copytree(package, bundle)
        component = bundle / 'components/athena-governance-audit'
        manifest = json.loads((component/'registry/repository-governance.json').read_text(encoding='utf-8'))
        consumer = scratch / 'explicit-consumer'
        consumer.mkdir()
        for directory, identity in [('athena','Athena'),('foundry','Agent-Foundry')]:
            entries = {}
            for name, digest in manifest['files'].items():
                leaf = 'AGENTS-adapter.md' if name.startswith('templates/') else name
                relative = f'.agents/{directory}/{leaf}'
                path = consumer / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(component / name, path)
                entries[relative] = digest
            lockdir = consumer / ('.athena' if directory == 'athena' else '.agent-foundry')
            lockdir.mkdir()
            lock = {'schemaVersion': 1, 'version': manifest['version'],
                    'sourceRepository': 'https://github.com/Herbertofury/'+identity,
                    'sourceCommit': 'a'*40, 'digestFormat': 'sha256-utf8-lf',
                    'sourceWorkingTreeDirty': False, 'files': entries}
            (lockdir / 'governance-lock.json').write_text(json.dumps(lock), encoding='utf-8')
        (consumer/'AGENTS.md').write_text('Read `.agents/athena/AGENTS-adapter.md`.\n', encoding='utf-8')
        before = observed(consumer)
        bundle_before = observed(bundle)
        def launch(*args):
            return subprocess.run([sys.executable, '-B', str(bundle/'launch.py'), *args],
                                  cwd=scratch, capture_output=True, text=True, timeout=45)
        def audit(*extra):
            return launch('--review-governance', str(consumer), *extra)
        result = audit()
        require(result.returncode == 0, result.stderr)
        receipt = json.loads(result.stdout)
        require([receipt[key]['filesVerified'] for key in ('athena','retainedLegacy')] == [16,16], 'both pins')
        require(audit('--verify-only').returncode == 2, 'mixed operation')
        require(launch('--review-governance',str(bundle)).returncode == 2, 'consumer inside package')
        require(observed(consumer) == before and observed(bundle) == bundle_before, 'first run wrote')
        original = component/'tools/consumer_verify.py'
        original_bytes = original.read_bytes()
        original.write_bytes(b'raise RuntimeError("Must never run")\n')
        r = audit()
        require(r.returncode == 2 and 'integrity mismatch' in r.stderr and 'Must never run' not in r.stderr,
                'changed optional code unexpectedly ran')
        require(launch('--verify-only').returncode == 0, 'unrelated base fails on optional byte drift')
        original.write_bytes(original_bytes)
        moved = scratch/'removed-governance-audit'
        component.rename(moved)
        require(launch('--verify-only').returncode == 0, 'unrelated base fails after component removal')
        require(audit().returncode == 2, 'missing component reported verified')
        moved.rename(component)
        require(audit().returncode == 0, 'component restore did not work')
        require(observed(bundle) == bundle_before and observed(consumer) == before, 'package or consumer changed')
        adapter = consumer/'.agents/athena/AGENTS-adapter.md'
        adapter.write_text('manual drift fixture', encoding='utf-8')
        edited = observed(consumer)
        r = audit()
        require(r.returncode == 3 and 'pinned file drift' in r.stderr and observed(consumer) == edited,
                'consumer drift should fail without writing')
        print('Extracted portable governance: both pins + tampered code refusal + removal/restore + unchanged roots')


if __name__ == '__main__':
    main(Path(sys.argv[1]).resolve(strict=True))
