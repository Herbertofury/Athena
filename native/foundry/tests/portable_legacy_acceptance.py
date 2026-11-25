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
        with closing(sqlite3.connect(source)) as db, db:
            assert db.execute('PRAGMA journal_mode=WAL').fetchone()[0] == 'wal'
            db.execute("UPDATE room_soundtracks SET label='Synthetïc 雨'")
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
        assert 'private_marker' not in json.dumps(reviewed)
        expected = reviewed['output_sha256']
        assert sha(snapshot) == expected and snapshot.read_bytes()[18:20] == b'\1\1'
        run(*prepare, '--source-quiescent', success=False)

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
            assert record == [('apple', 'https://music.apple.com/us/search?term=Calm',
                               'Synthetïc 雨', 'USER_SEARCH_ROUTE', 'route-1', 123456789)]
        run(*imported, expected, success=False)
        assert sha(destination) == result['output_sha256']
        assert sha(source) == before and sha(snapshot) == expected
        assert not pathlib.Path(str(source) + '-wal').exists()
        assert not list(root.glob('.athena-legacy-*'))
        print('Closed v24 WAL-header backup, review pin, exact soundtrack fields and all refusal cases passed.')


if __name__ == '__main__':
    main(sys.argv[1])
