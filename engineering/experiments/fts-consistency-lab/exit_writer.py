"""Abruptly exit an owned finite fixture process before/after COMMIT."""
import json
import os
from pathlib import Path
import sys
from catalog import connect, search

if __name__ == '__main__':
    path, stage = sys.argv[1:]
    if stage not in ('before_commit', 'after_commit') or not Path(path).is_file():
        raise ValueError('existing owned fixture and declared stage required')
    con = connect(path)
    con.execute('BEGIN IMMEDIATE')
    con.execute("UPDATE documents SET title='newtoken', metadata_json=? WHERE external_key='fixture:1'",
                ('{"warning":"retained","phase":"new"}',))
    own_view = search(con, 'newtoken')
    if stage == 'after_commit':
        con.execute('COMMIT')
    print(json.dumps({'stage': stage, 'child_view': own_view, 'in_transaction': con.in_transaction}), flush=True)
    os._exit(71)  # No Python connection finalizers; not a machine/power-loss test.
