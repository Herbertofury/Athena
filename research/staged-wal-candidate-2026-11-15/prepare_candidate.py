"""R&D only. Explicit stopped-source capture; never opens original through SQLite."""
import hashlib, importlib.util, json, os, pathlib, subprocess, tempfile
ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('production_prepare', ROOT / 'tools/foundry-recovery/sqlite/prepare.py')
helper = importlib.util.module_from_spec(spec); spec.loader.exec_module(helper)
def destination_clear(destination):
    if any(os.path.lexists(str(destination)+s) for s in helper.SUFFIXES):
        raise FileExistsError('Destination or sidecar already exists')
def prepare(source, destination, scratch, worker, quiescent=False):
    if not quiescent: raise ValueError('Stopped-source assertion required; active writers unsupported')
    source, destination, scratch = map(pathlib.Path, (source, destination, scratch))
    if destination.resolve() in {pathlib.Path(str(source.resolve()) + s) for s in helper.SUFFIXES}:
        raise ValueError('Source and output overlap')
    destination_clear(destination)
    first = helper.capture(source)
    if '-wal' not in first: raise ValueError('Candidate requires captured WAL; use existing standalone route')
    identity = helper.digest(first)
    if helper.digest(helper.capture(source)) != identity: raise ValueError('Source changed during capture')
    # Only a locally built, reviewed worker is accepted by the operator. No downloads or PATH lookup.
    worker = pathlib.Path(worker).resolve(strict=True)
    if not worker.is_file(): raise ValueError('Worker must be an explicit built binary')
    worker_hash = hashlib.sha256(worker.read_bytes()).hexdigest()
    with tempfile.TemporaryDirectory(prefix='athena-wal-candidate-', dir=scratch) as tmp:
        stage = pathlib.Path(tmp); src = stage/'source.sqlite'; target = stage/'prepared.sqlite'
        src.write_bytes(first['']); pathlib.Path(str(src)+'-wal').write_bytes(first['-wal'])
        # No source SHM copied; native SQLite reconstructs it only in disposable staging.
        result = subprocess.run([str(worker), str(src), str(target)], capture_output=True, text=True, timeout=12, check=True)
        receipt = json.loads(result.stdout)
        if receipt.get('sqlite_version_number',0) < 3054000: raise ValueError('Native runtime receipt invalid')
        if helper.digest(helper.capture(source)) != identity: raise ValueError('Source changed during native backup')
        if any(pathlib.Path(str(target)+suffix).exists() for suffix in ('-wal','-shm','-journal')): raise ValueError('Output sidecar remains')
        if not target.is_file() or target.is_symlink() or target.stat().st_size > helper.LIMIT: raise ValueError('Invalid output')
        with target.open('rb') as f: payload = f.read(helper.LIMIT+1)
        if len(payload) > helper.LIMIT or payload[:16] != b'SQLite format 3\0' or payload[18:20] != b'\x01\x01': raise ValueError('Standalone output invalid')
        # Publish complete bytes exclusively from a sibling temporary file, never overwrite.
        fd, name = tempfile.mkstemp(prefix='.athena-wal-', dir=destination.parent)
        try:
            with os.fdopen(fd,'wb') as f: f.write(payload); f.flush(); os.fsync(f.fileno())
            if helper.digest(helper.capture(source)) != identity: raise ValueError('Source changed before publication')
            destination_clear(destination)
            os.link(name, destination)
        finally:
            pathlib.Path(name).unlink()
    return dict(receipt, source_hashes=identity, source_unchanged_at_checks=True,
                destination_sha256=hashlib.sha256(payload).hexdigest(), worker_sha256=worker_hash,
                live_backup=False, production_guard_replaced=False)
