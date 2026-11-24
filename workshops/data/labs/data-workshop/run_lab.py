#!/usr/bin/env python3
"""Execute fixed synthetic SQL exercises locally; no external database or Power BI."""
import argparse
import json
import sqlite3
import lab
COMMANDS = ('profile', 'filters', 'metrics', 'groups', 'joins', 'dates', 'quality', 'export')

def run(name):
    if name not in COMMANDS:
        raise ValueError('fixed exercise required')
    conn = lab.load_database()
    try:
        if name == 'profile':
            result = dict(queues=conn.execute('SELECT COUNT(*) FROM queues').fetchone()[0], tickets=conn.execute('SELECT COUNT(*) FROM tickets').fetchone()[0], touches=conn.execute('SELECT COUNT(*) FROM touches').fetchone()[0], ticket_grain='one current-state ticket per identifier', touch_grain='one interaction per identifier', snapshot='synthetic 2026-11-05T00:00:00Z')
        elif name == 'joins':
            result = dict(naive=lab.query(conn, 'joins_naive')[0], preaggregated=lab.query(conn, 'joins_correct')[0])
        elif name == 'quality':
            result = lab.quality_demo(conn)
        elif name == 'export':
            result = lab.export_demo(conn)
        else:
            result = lab.query(conn, name, lab.DATE_WINDOW if name == 'dates' else lab.WINDOW)
        return dict(exercise=name, execution='actual local SQLite and synthetic fixtures', sqlite_version=sqlite3.sqlite_version, power_bi_executed=False, window=lab.DATE_WINDOW if name == 'dates' else lab.WINDOW, result=result)
    finally:
        conn.close()

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('exercise', choices=COMMANDS)
    a = p.parse_args()
    print(json.dumps(run(a.exercise), indent=2, ensure_ascii=False, sort_keys=True, allow_nan=False))
if __name__ == '__main__':
    main()
