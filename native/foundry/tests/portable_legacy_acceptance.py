"""Drive the extracted launcher and independently check the resulting SQLite data."""
import hashlib
import json
import pathlib
import sqlite3
import subprocess
import sys
import tempfile
from contextlib import closing

from legacy_fixture import create


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main(package):
    package = pathlib.Path(package).resolve()
    binary = package / json.loads((package / 'native-package.json').read_text())['binary']
    with tempfile.TemporaryDirectory(prefix='athena-legacy-acceptance-') as directory:
        root = pathlib.Path(directory)
        source, snapshot, destination = (root / name for name in
                                        ('closed v24.sqlite3', 'reviewed copy.sqlite3', 'new foundry.sqlite3'))
        create(source)
        original_payload = ' { "emoji" : "雨 🌟", "nested": [1, true] }  '
        original_type = 'room checkpoint ū'

        with closing(sqlite3.connect(source)) as db, db:
            assert db.execute('PRAGMA journal_mode=WAL').fetchone()[0] == 'wal'
            db.execute("UPDATE room_soundtracks SET label='Synthetïc 雨'")
            db.execute('UPDATE history SET event_type=?, payload_json=?', (original_type, original_payload))
        before = sha(source)
        assert source.read_bytes()[18:20] == b'\2\2'
        assert not pathlib.Path(str(source) + '-wal').exists()

        def run(*args, success=True):
            result = subprocess.run([sys.executable, '-B', str(package / 'launch.py'), *map(str, args)],
                                    cwd=root, capture_output=True, encoding='utf-8', timeout=90)
            assert result.returncode == (0 if success else 2), (result.stdout, result.stderr)
            if success:
                return json.loads(result.stdout)

        prepare = ('--prepare-legacy', source, '--legacy-destination', snapshot)
        run(*prepare, success=False)
        assert not snapshot.exists()
        reviewed = run(*prepare, '--source-quiescent')
        assert reviewed['prepared_review_copy'] and not reviewed['lossless_migration']
        assert reviewed['report']['soundtracks'] == 1
        assert reviewed['report']['source_table_rows']['history'] == 1
        comparison = reviewed['report']['catalog_comparison']
        assert comparison['theme_names']['matching_ids'] == 1
        assert comparison['theme_names']['exact_selected_fields'] == 0
        assert comparison['theme_names']['changed_selected_fields'] == 1
        assert comparison['room_names']['only_in_athena'] == 33
        assert comparison['ecology_name_shape_role']['only_in_source'] == 1
        assert comparison['ecology_name_shape_role']['exact_selected_fields'] == 0
        assert 'private_marker' not in json.dumps(reviewed)
        expected = reviewed['output_sha256']
        assert sha(snapshot) == expected and snapshot.read_bytes()[18:20] == b'\1\1'
        run(*prepare, '--source-quiescent', success=False)

        archive = root / 'original events.json'
        archive_args = ('--archive-reviewed-legacy-history', snapshot, '--legacy-destination', archive,
                        '--reviewed-sha256')
        run(*archive_args, '0' * 64, success=False)
        assert not archive.exists()
        archive_receipt = run(*archive_args, expected)
        assert archive_receipt == {'archived_history': True, 'events': 1,
                                   'reviewed_source_sha256': expected, 'output_sha256': sha(archive),
                                   'imported_new_athena_profile': False}
        event_archive = json.loads(archive.read_text(encoding='utf-8'))
        assert event_archive['reviewed_source_sha256'] == expected
        assert event_archive['events'] == [{'id': 1, 'created_at': 1, 'event_type': original_type,
                                           'payload_json': original_payload, 'payload_sha256':
                                           hashlib.sha256(original_payload.encode('utf-8')).hexdigest()}]
        run(*archive_args, expected, success=False)
        assert sha(archive) == archive_receipt['output_sha256']
        malformed = root / 'malformed history.sqlite3'
        create(malformed)  # existing fixture contains deliberately invalid untrusted history JSON
        no_partial = root / 'must-not-exist.json'
        run('--archive-reviewed-legacy-history', malformed, '--legacy-destination', no_partial,
            '--reviewed-sha256', sha(malformed), success=False)
        assert not no_partial.exists()
        with closing(sqlite3.connect(malformed)) as db, db:
            db.execute('UPDATE history SET payload_json=?', ('"'+'x'*(256*1024)+'"',))
        run('--archive-reviewed-legacy-history', malformed, '--legacy-destination', no_partial,
            '--reviewed-sha256', sha(malformed), success=False)
        assert not no_partial.exists()
        imported = ('--import-reviewed-legacy', snapshot, '--legacy-destination', destination, '--reviewed-sha256')
        run(*imported, '0' * 64, success=False)
        alias = pathlib.Path(str(snapshot) + '-wal')
        alias.touch()
        run(*imported, expected, success=False)
        alias.unlink()
        stale = pathlib.Path(str(destination) + '-journal')
        stale.touch()
        run(*imported, expected, success=False)
        assert stale.is_file() and not destination.exists()
        stale.unlink()
        result = run(*imported, expected)
        assert result['imported_new_athena_profile'] and not result['lossless_migration']
        assert result['report'] == reviewed['report'] and result['output_sha256'] == sha(destination)
        status = json.loads(subprocess.check_output([str(binary), 'status', str(destination)], encoding='utf-8'))
        assert status['schema'] == 15 and status['integrity'] == 'ok' and status['soundtracks'] == 1
        with closing(sqlite3.connect(destination.as_uri() + '?mode=ro', uri=True)) as db:
            record = db.execute('SELECT provider,url,label,status,source_id,updated_at FROM soundtracks').fetchall()
            assert db.execute('SELECT count(*) FROM workspace_revisions').fetchone() == (0,)
            assert record == [('apple', 'https://music.apple.com/us/search?term=Calm',
                               'Synthetïc 雨', 'USER_SEARCH_ROUTE', 'route-1', 123456789)]
        run(*imported, expected, success=False)
        assert sha(destination) == result['output_sha256']
        assert sha(source) == before and sha(snapshot) == expected
        assert not pathlib.Path(str(source) + '-wal').exists()
        assert not list(root.glob('.athena-legacy-*'))
        print('Closed v24 WAL-header backup, review pin, exact soundtrack fields, exact UTF-8 history archive and all refusal cases passed.')


if __name__ == '__main__':
    main(sys.argv[1])
