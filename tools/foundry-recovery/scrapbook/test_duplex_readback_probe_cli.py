import hashlib
import json
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

import _duplex_readback_probe as runner


ROOT = Path(__file__).resolve().parents[3]
DEFAULT_REL = Path('crates/athena-foundry-store/target/debug') / (
    'athena-foundry-store.exe' if os.name == 'nt' else 'athena-foundry-store')


def digest_file(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def native_binding(root, environ):
    """Hosted run trusts only the exact checked-out source's prior build step."""
    root = Path(root)
    default = root / DEFAULT_REL
    explicit = environ.get('ATHENA_FOUNDRY_STORE_BINARY')
    if environ.get('GITHUB_ACTIONS', '').lower() == 'true':
        job_root = environ.get('GITHUB_WORKSPACE')
        if not job_root or Path(job_root).resolve() != root.resolve():
            raise ValueError('Hosted workspace was not bound to the source checkout.')
        if explicit and Path(explicit).absolute() != default.absolute():
            raise ValueError('Hosted binary override differs from the existing workflow build.')
        binary = default
        pin = None
    else:
        binary = Path(explicit) if explicit else default
        pin = environ.get('ATHENA_PIPE_PROBE_EXPECTED_SHA256')
        if explicit and (not pin or re.fullmatch('[a-f0-9]{64}', pin) is None):
            raise ValueError('Local explicit binary requires an independently reviewed digest.')
    if (not binary.is_absolute() or binary.is_symlink() or not binary.is_file()
            or not stat.S_ISREG(binary.stat().st_mode) or not 0 < binary.stat().st_size <= 256*1024*1024):
        raise ValueError('Native probe binary not bound. Build the selected checkout first.')
    observed = digest_file(binary)
    if pin and pin != observed:
        raise ValueError('Native probe binary digest mismatch.')
    return binary, observed


def child_environment(folder):
    result = {'HOME': str(folder), 'TMP': str(folder), 'TEMP': str(folder), 'TMPDIR': str(folder)}
    if os.name == 'nt':
        system_root = os.environ.get('SystemRoot')
        if not system_root or not Path(system_root).is_absolute() or not Path(system_root).is_dir():
            raise ValueError('Windows child environment must bind a valid local SystemRoot.')
        result['SystemRoot'] = system_root
    return result


class Bounds(unittest.TestCase):
    def setUp(self):
        stage = tempfile.TemporaryDirectory()
        self.addCleanup(stage.cleanup)
        self.folder = Path(stage.name)
        self.env = child_environment(self.folder)

    def run_code(self, source, **kwargs):
        popen = subprocess.Popen
        processes = []
        names = lambda: {t.ident for t in threading.enumerate()
                         if t.name.startswith('athena-prototype-')}
        before = names()

        def remember(*args, **kw):
            process = popen(*args, **kw)
            processes.append(process)
            return process

        with patch.object(runner.subprocess, 'Popen', side_effect=remember):
            try:
                return runner.collect([sys.executable, '-B', '-c', source],
                                      cwd=self.folder, env=self.env, **kwargs)
            finally:
                self.assertEqual(names(), before, 'dangling reader/writer')
                for process in processes:
                    self.assertIsNotNone(process.returncode, 'direct child not reaped')
                    self.assertTrue(process.stdin.closed and process.stdout.closed, 'pipe leaked')

    def test_duplex_pipe_backpressure_and_binary_identity(self):
        data = bytes(range(256))*4096
        # Both directions exceed ordinary pipe buffer capacity before EOF.
        prefix = b'\xff'*196608
        source = 'import sys;o=sys.stdout.buffer;o.write(bytes([255])*196608);o.flush();o.write(sys.stdin.buffer.read())'
        result = self.run_code(source, payload=data, stdout_limit=len(data)+len(prefix))
        self.assertEqual(result, prefix+data)
        self.assertEqual(list(self.folder.iterdir()), [])

    def test_zero_limit_and_exact_limit(self):
        self.assertEqual(self.run_code('pass', stdout_limit=0), b'')
        self.assertEqual(self.run_code('import sys;sys.stdout.buffer.write(bytes(range(256)))',
                                       stdout_limit=256), bytes(range(256)))

    def test_output_limit_fails_even_while_input_is_blocked(self):
        source = 'import sys,time;sys.stdout.buffer.write(b"x"*120000);sys.stdout.flush();time.sleep(20)'
        with self.assertRaisesRegex(runner.Refused, '^stdout-limit$'):
            self.run_code(source, payload=b'z'*512000, stdout_limit=9000)

    def test_deadline_covers_both_blocked_pipes(self):
        start = time.monotonic()
        with self.assertRaisesRegex(runner.Refused, '^deadline$'):
            self.run_code('from pathlib import Path; import time; Path("both-pipes-ready").touch(); time.sleep(20)',
                          payload=b'z'*512000, stdout_limit=9999, seconds=1.5)
        self.assertTrue((self.folder/'both-pipes-ready').is_file(), 'child did not reach blocked I/O')
        self.assertLess(time.monotonic()-start, 5.0)

    def test_pipe_eof_does_not_substitute_for_process_exit(self):
        source = 'from pathlib import Path; import os,time; os.close(1); Path("stdout-closed").touch(); time.sleep(20)'
        with self.assertRaisesRegex(runner.Refused, '^deadline$'):
            self.run_code(source, stdout_limit=1, seconds=1.5)
        self.assertTrue((self.folder/'stdout-closed').is_file(), 'child did not reach EOF test')

    def test_short_input_and_nonzero_exit_not_returned_as_success(self):
        with self.assertRaisesRegex(runner.Refused, '^stdin-io$'):
            self.run_code('import os,time;os.close(0);time.sleep(2)', payload=b'z'*512000)
        with self.assertRaisesRegex(runner.Refused, '^nonzero-exit$'):
            self.run_code('import sys;sys.stdout.write("deceptive success");sys.exit(3)')

    def test_invalid_bound_never_spawns(self):
        with patch.object(runner.subprocess, 'Popen') as spawn:
            with self.assertRaisesRegex(runner.Refused, '^invalid-limit-or-payload$'):
                runner.collect([sys.executable], cwd=self.folder, env=self.env, stdout_limit=True)
            spawn.assert_not_called()

class ActualNativeReadback(unittest.TestCase):
    def test_missing_default_and_unpinned_local_override_fail_closed(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            with self.assertRaisesRegex(ValueError, 'not bound'):
                native_binding(folder, {})
            with self.assertRaisesRegex(ValueError, 'requires an independently reviewed digest'):
                native_binding(folder, {'ATHENA_FOUNDRY_STORE_BINARY': sys.executable})
            with self.assertRaisesRegex(ValueError, 'Hosted workspace'):
                native_binding(folder, {'GITHUB_ACTIONS': 'true'})

    def test_actual_schema15_duplex_save_and_exact_reopen(self):
        binary, binary_digest = native_binding(ROOT, os.environ)
        catalog = json.loads((ROOT/'dist/workspaces/foundry/catalog.json').read_bytes())
        theme = catalog['themes'][0]
        room = theme['rooms'][0]['id']
        objects = [entry['id'] for entry in theme['objects'][:2]]
        layout = {'version': 1, 'themeId': theme['id'], 'roomId': room, 'time': 'night',
                  'placements': {key: {'x': .25+.25*i, 'y': .5, 'pinned': bool(i)}
                                 for i, key in enumerate(objects)}}
        owned = {'version': 1, 'active': layout, 'layouts': {room: layout},
                 'view': {'inspectorDock': 'left', 'inspectorWidth': 280},
                 'savedLayouts': [{'name': 'Owned duplex fixture', 'layout': layout}]}
        payload = json.dumps(owned, separators=(',', ':')).encode() + b' '*(128*1024)
        with tempfile.TemporaryDirectory(prefix='athena-duplex-owned-') as temporary:
            folder = Path(temporary)
            db = folder/'disposable.sqlite'
            env = child_environment(folder)

            def native(command, body=b'', cap=1_000_000):
                return runner.collect([str(binary), command, str(db)], cwd=folder, env=env,
                                      payload=body, stdout_limit=cap)

            native('init')
            for upgrade in ('history', 'soundtracks', 'transforms', 'scopes', 'environment', 'targets',
                            'instances', 'appearance', 'filters', 'origins', 'environments',
                            'blend-modes', 'music-precision'):
                native('upgrade-'+upgrade)
            native('save-backup', payload)
            before = db.read_bytes()
            result = native('load-backup')
            self.assertEqual(int.from_bytes(before[60:64], 'big'), 15)
            self.assertEqual(json.loads(result), owned)
            self.assertEqual(native('load-backup', cap=len(result)), result)
            with self.assertRaisesRegex(runner.Refused, '^stdout-limit$'):
                native('load-backup', cap=len(result)-1)
            self.assertEqual(db.read_bytes(), before)
        self.assertEqual(digest_file(binary), binary_digest)
        print(json.dumps({'duplexNativeReadback': True, 'platform': sys.platform,
                          'compiledBinarySha256': binary_digest, 'sqliteSchema': 15,
                          'inputBytes': len(payload), 'exactStdoutBytes': len(result)}))


if __name__ == '__main__':
    unittest.main()
