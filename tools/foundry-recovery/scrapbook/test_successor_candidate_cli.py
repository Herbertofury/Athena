import copy
import errno
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import unittest
from unittest.mock import patch

import successor_candidate as candidate
import test_successor_review_cli as fixtures

CAT = fixtures.CAT
PATH = Path(candidate.__file__)
ROOT = fixtures.ROOT
BINARY = Path(os.environ.get('ATHENA_FOUNDRY_STORE_BINARY',
                             ROOT/'crates/athena-foundry-store/target/debug/athena-foundry-store'))


@unittest.skipUnless(os.name == 'posix', 'Private candidate write requires POSIX mode 0600')
class SuccessorCandidateCLI(unittest.TestCase):
    setUp = fixtures.SuccessorReviewCLI.setUp

    def snapshot(self):
        return {f.relative_to(self.root): f.read_bytes() for f in self.root.rglob('*') if f.is_file()}

    def input_files(self):
        self.receipt.write_text(json.dumps(self.form))
        return self.prior, self.incoming, self.current, self.receipt, CAT

    def cli(self, destination, result_code=0, pin=None):
        if not BINARY.is_file():
            self.skipTest('Native Foundry executable not provided')
        self.input_files()
        args = [sys.executable, '-B', str(PATH), '--prior-bundle', str(self.prior),
                '--incoming-bundle', str(self.incoming), '--current-workspace', str(self.current),
                '--receipt', str(self.receipt), '--catalog', str(CAT), '--native-binary', str(BINARY),
                '--native-binary-sha256', pin or candidate.digest(BINARY.read_bytes()),
                '--new-candidate', str(destination)]
        before = self.snapshot()
        r = subprocess.run(args, cwd=self.root, capture_output=True, timeout=20)
        self.assertEqual(r.returncode, result_code, r.stdout + r.stderr)
        self.assertEqual(r.stderr, b'')
        self.assertNotIn(str(self.root).encode(), r.stdout)
        self.assertNotIn(self.old_id.encode(), r.stdout)
        after = self.snapshot()
        if result_code == 0:
            after.pop(destination.relative_to(self.root))
        self.assertEqual(before, after)
        return json.loads(r.stdout)

    def test_exclusive_candidate_round_trips_preserving_unrelated_workspace(self):
        source = copy.deepcopy(self.prior_layout)
        current_room = source['active']['roomId']
        catalog = json.loads(CAT.read_bytes())
        theme = next(t for t in catalog['themes'] if t['id'] == source['active']['themeId'])
        other_room = next(item['id'] for item in theme['rooms'] if item['id'] != current_room)
        other = {**source['active'], 'roomId': other_room, 'placements': {}, 'time': 'night'}
        source['active'] = other
        source['layouts'][other_room] = other
        source['view'] = {'inspectorDock': 'left', 'inspectorWidth': 280}
        source['savedLayouts'] = [{'name': 'Do not change · synthetic', 'layout': copy.deepcopy(other)}]
        self.current.write_text(json.dumps(source))
        self.form['currentWorkspaceSha256'] = candidate.digest(self.current.read_bytes())
        output = self.root/'new-candidate.json'
        result = self.cli(output)
        self.assertTrue(result['nativeRoundTrip'] and result['stagingCleaned'])
        self.assertFalse(result['applied'] or result['sourceRetirementSafe'])
        self.assertEqual(result['candidateSha256'], candidate.digest(output.read_bytes()))
        self.assertEqual(stat.S_IMODE(output.stat().st_mode), 0o600)
        observed = json.loads(output.read_bytes())
        room = observed['layouts'][current_room]['placements']
        self.assertEqual(len(room), 2)
        self.assertEqual(room[self.old_id]['zIndex'], 11)
        self.assertEqual(room[self.form['rows'][1]['incomingId']]['zIndex'], 12)
        for key in ['active', 'view', 'savedLayouts']:
            self.assertEqual(observed[key], source[key])
        self.assertEqual(observed['layouts'][other_room], other)
        self.assertIn('error', self.cli(output, result_code=2))

    def test_wrong_binary_pin_and_source_overlap_create_nothing(self):
        output = self.root/'no-candidate.json'
        self.assertIn('error', self.cli(output, result_code=2, pin='0'*64))
        self.assertFalse(output.exists())
        self.assertIn('error', self.cli(self.prior/'unexpected-candidate.json', result_code=2))
        self.assertFalse((self.prior/'unexpected-candidate.json').exists())
        self.assertIn('error', self.cli(self.current, result_code=2))

    def test_changed_input_after_validation_refuses_publication(self):
        destination = self.root/'no-candidate.json'
        args = self.input_files()

        def mutate(binary, sha, payload):
            self.receipt.write_bytes(self.receipt.read_bytes()+b' ')
            return json.loads(payload)
        with patch.object(candidate, 'checked_binary', return_value=PATH), patch.object(
                candidate, 'staged_readback', side_effect=mutate):
            with self.assertRaisesRegex(ValueError, 'changed during review'):
                candidate.prepare(*args, PATH, '0'*64, destination)
        self.assertFalse(destination.exists())

    def test_lossy_native_reopen_cannot_create_candidate(self):
        destination = self.root/'no-candidate.json'
        args = self.input_files()

        def dropped(binary, sha, payload):
            return {**json.loads(payload), 'savedLayouts': ['discarded']}
        with patch.object(candidate, 'checked_binary', return_value=PATH), patch.object(
                candidate, 'staged_readback', side_effect=dropped):
            with self.assertRaisesRegex(ValueError, 'would normalize'):
                candidate.prepare(*args, PATH, '0'*64, destination)
        self.assertFalse(destination.exists())


    def test_native_stdout_has_hard_byte_bound(self):
        before = self.snapshot()
        command = [sys.executable, '-B', '-c',
                   'import sys; sys.stdout.buffer.write(b"x" * ' + str(candidate.LIMIT + 1) + ')']
        with self.assertRaisesRegex(ValueError, 'output exceeds'):
            candidate.read_native_command(command, self.root)
        self.assertEqual(self.snapshot(), before)

    def publish(self, output):
        return candidate.publish_atomic(output.parent, candidate.identity(output.parent.lstat()),
                                        output.name, b'complete synthetic reviewed payload')

    def test_partial_stage_write_fsync_and_unsupported_link_leave_no_output(self):
        destination = self.root/'no-candidate.json'
        before = self.snapshot()

        def short_then_fail(fd, payload):
            os.write(fd, payload[:5])
            raise OSError(errno.ENOSPC, 'injected disk write failure')

        for function, defect in ((candidate, 'write_payload'), (os, 'fsync'), (os, 'link')):
            with self.subTest(defect=defect):
                error = {'write_payload': short_then_fail, 'fsync': OSError(errno.ENOSPC, 'injected flush failure'),
                         'link': OSError(errno.EOPNOTSUPP, 'injected unsupported links')}[defect]
                with patch.object(function, defect, side_effect=error):
                    with self.assertRaises(OSError):
                        self.publish(destination)
                self.assertFalse(destination.exists())
                self.assertFalse(list(self.root.glob('.athena-successor-*')))
                self.assertEqual(self.snapshot(), before)

    def test_concurrent_creator_is_retained_and_staging_is_cleaned(self):
        destination = self.root/'competing-candidate.json'
        real_link = os.link

        def competing(_old, _new, **kwargs):
            with destination.open('xb') as file:
                file.write(b'other writer owns these bytes')
            return real_link(_old, _new, **kwargs)

        with patch.object(os, 'link', side_effect=competing):
            with self.assertRaises(FileExistsError):
                self.publish(destination)
        self.assertEqual(destination.read_bytes(), b'other writer owns these bytes')
        self.assertFalse(list(self.root.glob('.athena-successor-*')))

    def test_replaced_parent_refused_without_publishing_to_either_directory(self):
        original = self.root/'original parent'
        original.mkdir()
        moved = self.root/'renamed parent'
        real_write = candidate.write_payload

        def swap(fd, payload):
            real_write(fd, payload)
            original.rename(moved)
            original.mkdir()

        with patch.object(candidate, 'write_payload', side_effect=swap):
            with self.assertRaisesRegex(ValueError, 'path changed'):
                self.publish(original/'candidate.json')
        self.assertEqual(list(original.iterdir()), [])
        self.assertEqual(list(moved.iterdir()), [])

    def test_failure_cleaning_stage_does_not_misreport_complete_publication(self):
        destination = self.root/'published-candidate.json'
        real_unlink = os.unlink

        def fail_owned_unlink(path, *args, **kwargs):
            if path == 'payload':
                raise OSError(errno.EPERM, 'simulated cleanup problem')
            return real_unlink(path, *args, **kwargs)

        with patch.object(os, 'unlink', side_effect=fail_owned_unlink):
            self.assertFalse(self.publish(destination))
        self.assertEqual(destination.read_bytes(), b'complete synthetic reviewed payload')
        self.assertEqual(stat.S_IMODE(destination.stat().st_mode), 0o600)
        self.assertEqual(len(list(self.root.glob('.athena-successor-*'))), 1)


if __name__ == '__main__':
    unittest.main()
