"""Deterministic synthetic faults; retains created fixture directories."""
from contextlib import closing
import hashlib
import importlib.util
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

MODULE = Path(__file__).resolve().parents[1]/'experiments/sqlite-recovery-drill/recovery_drill.py'
spec = importlib.util.spec_from_file_location('recovery_drill', MODULE)
r = importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)


class RecoveryDrillTests(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp(prefix='athena-synthetic-recovery-'))
        self.path = self.root/'source.sqlite'
        self.conn = r.create_fixture(self.path)
        self.addCleanup(self.conn.close)

    def backup(self, name='copy.sqlite', **kwargs):
        return r.backup_new(self.path, self.root/name,
                            deadline=time.monotonic()+10, **kwargs)

    def test_wal_only_committed_rows_need_database_backup(self):
        self.conn.execute('PRAGMA wal_checkpoint(TRUNCATE)')
        self.conn.execute("INSERT INTO items VALUES(999,1,'{\"id\":999}')")
        # Intentionally unsafe control: copy only main while committed data is in WAL.
        (self.root/'naive.sqlite').write_bytes(self.path.read_bytes())
        with closing(r.connect(self.root/'naive.sqlite', readonly=True)) as naive:
            self.assertEqual(r.validate(naive)['rows'], 256)
            self.assertEqual(naive.execute('PRAGMA integrity_check').fetchall(), [('ok',)])
        self.assertEqual(self.backup()['validation']['rows'], 257)

    def test_backup_excludes_uncommitted_transaction(self):
        self.conn.execute('BEGIN IMMEDIATE')
        self.conn.execute("INSERT INTO items VALUES(999,1,'{\"id\":999}')")
        result = self.backup()
        self.assertEqual(result['validation']['rows'], 256)
        self.conn.execute('ROLLBACK')

    def test_mid_backup_committed_mutation_restarts_complete_copy(self):
        changed = []
        def mutate(status, remaining, total):
            if remaining and not changed:
                self.conn.execute("INSERT INTO items VALUES(999,1,'{\"id\":999}')")
                changed.append(True)
        result = self.backup(progress_hook=mutate)
        self.assertTrue(changed)
        self.assertEqual(result['validation'], r.validate(self.conn))
        self.assertGreater(len(result['steps']), 1)

    def test_existing_destination_is_never_overwritten(self):
        p = self.root/'existing.sqlite'
        p.write_bytes(b'last good fixture bytes')
        with self.assertRaises(FileExistsError):
            self.backup('existing.sqlite')
        self.assertEqual(p.read_bytes(), b'last good fixture bytes')

    def test_cancelled_copy_does_not_touch_last_good(self):
        self.backup('last-good.sqlite')
        p = self.root/'last-good.sqlite'
        before = hashlib.sha256(p.read_bytes()).hexdigest()
        def cancel(*args):
            raise InterruptedError('injected cancellation')
        with self.assertRaises(InterruptedError):
            self.backup('interrupted-stage.sqlite', progress_hook=cancel)
        self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(), before)
        with closing(r.connect(p, readonly=True)) as c:
            self.assertEqual(r.validate(c)['rows'], 256)

    def test_expired_deadline_refuses_copy(self):
        with self.assertRaises(TimeoutError):
            r.backup_new(self.path, self.root/'expired.sqlite', deadline=time.monotonic()-1)
        self.assertEqual(r.validate(self.conn)['rows'], 256)

    def test_migration_rolls_back_at_each_precommit_boundary(self):
        before = r.validate(self.conn)
        for stage in ('after_ddl', 'after_data', 'before_commit'):
            with self.subTest(stage=stage):
                def fail(phase):
                    if phase == stage:
                        raise RuntimeError('injected migration failure')
                with self.assertRaises(RuntimeError):
                    r.migrate_v1_to_v2(self.conn, fail)
                self.assertFalse(self.conn.in_transaction)
                self.assertEqual(r.validate(self.conn), before)
                self.assertEqual([x[1] for x in self.conn.execute('PRAGMA table_info(items)')],
                                 ['id', 'owner_id', 'payload'])

    def test_migration_commits_version_and_complete_payload(self):
        before = r.validate(self.conn)
        r.migrate_v1_to_v2(self.conn)
        after = r.validate(self.conn)
        self.assertEqual(after['schema_version'], 2)
        self.assertEqual(after['payload_sha256'], before['payload_sha256'])
        self.assertEqual(after['owners_sha256'], before['owners_sha256'])
        self.assertEqual(self.conn.execute("SELECT count(*) FROM items WHERE label='imported'").fetchone(), (256,))

    def test_repeated_migration_rejected(self):
        r.migrate_v1_to_v2(self.conn)
        before = r.validate(self.conn)
        with self.assertRaises(r.Rejected):
            r.migrate_v1_to_v2(self.conn)
        self.assertEqual(before, r.validate(self.conn))

    def test_future_version_rejected_without_schema_change(self):
        self.conn.execute('PRAGMA user_version=99')
        before = list(self.conn.iterdump())
        with self.assertRaises(r.Rejected):
            r.migrate_v1_to_v2(self.conn)
        self.assertEqual(list(self.conn.iterdump()), before)
        self.assertEqual(self.conn.execute('PRAGMA user_version').fetchone(), (99,))

    def test_wrong_application_rejected(self):
        self.conn.execute('PRAGMA application_id=42')
        with self.assertRaises(r.Rejected):
            r.validate(self.conn)

    def test_integrity_ok_does_not_imply_foreign_keys_ok(self):
        self.conn.execute('PRAGMA foreign_keys=OFF')
        self.conn.execute("INSERT INTO items VALUES(999,700,'{\"id\":999}')")
        self.assertEqual(self.conn.execute('PRAGMA integrity_check').fetchall(), [('ok',)])
        with self.assertRaisesRegex(r.Rejected, 'foreign-key'):
            r.validate(self.conn)

    def test_integrity_ok_does_not_imply_payload_identity_ok(self):
        self.conn.execute("UPDATE items SET payload='{\"id\":999}' WHERE id=0")
        self.assertEqual(self.conn.execute('PRAGMA integrity_check').fetchall(), [('ok',)])
        with self.assertRaisesRegex(r.Rejected, 'identity mismatch'):
            r.validate(self.conn)

    def test_unexpected_schema_rejected(self):
        self.conn.execute('CREATE TABLE extra(data TEXT)')
        with self.assertRaisesRegex(r.Rejected, 'table set'):
            r.validate(self.conn)

    def test_process_exit_before_commit_preserves_v1(self):
        before = r.validate(self.conn)
        p = subprocess.run([sys.executable, str(MODULE), '--fixture-child', str(self.path),
                            'before_commit'], timeout=10, capture_output=True)
        self.assertEqual(p.returncode, 23, p.stderr.decode())
        self.assertEqual(r.validate(self.conn), before)

    def test_process_exit_after_commit_retains_v2(self):
        before = r.validate(self.conn)
        p = subprocess.run([sys.executable, str(MODULE), '--fixture-child', str(self.path),
                            'after_commit'], timeout=10, capture_output=True)
        self.assertEqual(p.returncode, 23, p.stderr.decode())
        after = r.validate(self.conn)
        self.assertEqual(after['schema_version'], 2)
        self.assertEqual(after['payload_sha256'], before['payload_sha256'])
        self.assertEqual(after['owners_sha256'], before['owners_sha256'])

    def test_owner_content_is_part_of_complete_comparison(self):
        before = r.validate(self.conn)
        self.conn.execute("UPDATE owners SET name='changed fixture owner' WHERE id=1")
        after = r.validate(self.conn)
        self.assertEqual(before['payload_sha256'], after['payload_sha256'])
        self.assertNotEqual(before['owners_sha256'], after['owners_sha256'])
        self.assertNotEqual(before['logical_sha256'], after['logical_sha256'])

    def test_corrupt_migrated_labels_fail_validation(self):
        r.migrate_v1_to_v2(self.conn)
        self.conn.execute("UPDATE items SET label='wrong'")
        with self.assertRaisesRegex(r.Rejected, 'label invariant'):
            r.validate(self.conn)

    def test_deadline_expiring_between_backup_steps_retains_failed_stage(self):
        candidate = self.root/'expired-mid-copy.sqlite'
        with patch.object(r.time, 'monotonic', side_effect=[0, 2]):
            with self.assertRaises(TimeoutError):
                r.backup_new(self.path, candidate, deadline=1)
        self.assertTrue(candidate.exists())
        self.assertFalse((self.root/'receipt.json').exists())
        self.assertEqual(r.validate(self.conn)['rows'], 256)

    def test_complete_backup_restore_drill_into_new_database(self):
        before = r.validate(self.conn)
        self.backup('backup.sqlite')
        r.migrate_v1_to_v2(self.conn)
        restored = r.backup_new(self.root/'backup.sqlite', self.root/'restored.sqlite',
                                deadline=time.monotonic()+10)
        self.assertEqual(restored['validation'], before)
        self.assertEqual(r.validate(self.conn)['schema_version'], 2)


if __name__ == '__main__':
    unittest.main()
