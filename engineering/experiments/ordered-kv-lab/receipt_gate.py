"""Fail-closed fixed KV receipt contract, independent of Python optimization.

This checks shape and caller-supplied bindings, not executable trust or physical
power-loss survival. Reuse the Atlas duplicate/non-finite JSON decoder.
"""
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location(
    'atlas_kv_wire_decoder', ROOT / 'experiments/upstream-validation-lab/receipt_gate.py')
decoder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(decoder)
FIELDS = frozenset(('schema_version', 'lane', 'workload', 'rows', 'payload_bytes',
                    'write_commit_ns', 'commit_ns', 'read_materialize_ns',
                    'database_bytes', 'complete_output_equal', 'rollback_preserved',
                    'integrity', 'sqlite_version', 'redb_version'))
LANES = ('sqlite', 'sqlite-extra', 'redb-insert', 'redb-cursor')


def validate(raw, lane, workload, payload_bytes, file_budget_bytes):
    if lane not in LANES or workload not in ('public', 'generated'):
        raise ValueError('Unknown caller workload or lane')
    for value in (payload_bytes, file_budget_bytes):
        if type(value) is not int or value <= 0:
            raise ValueError('Invalid caller budget')
    if len(raw) > 65536:
        raise ValueError('Receipt output budget exceeded')
    data = decoder.decode_receipt(raw)
    if not isinstance(data, dict) or set(data) != FIELDS:
        raise ValueError('Missing or unexpected receipt fields')
    if type(data['schema_version']) is not int or data['schema_version'] != 1:
        raise ValueError('Unknown schema')
    if data['lane'] != lane or data['workload'] != workload:
        raise ValueError('Wrong sample identity')
    if type(data['rows']) is not int or data['rows'] != 256:
        raise ValueError('Wrong complete row count')
    for key in ('write_commit_ns', 'commit_ns', 'read_materialize_ns',
                'database_bytes', 'payload_bytes'):
        if type(data[key]) is not int or data[key] <= 0:
            raise ValueError('Invalid measurement')
    if data['commit_ns'] > data['write_commit_ns']:
        raise ValueError('Commit exceeds enclosing transaction interval')
    if data['payload_bytes'] != payload_bytes:
        raise ValueError('Complete payload length mismatch')
    if data['database_bytes'] > file_budget_bytes:
        raise ValueError('Final file exceeds budget')
    if any(data[key] is not True for key in
           ('complete_output_equal', 'rollback_preserved', 'integrity')):
        raise ValueError('Required correctness evidence failed')
    if data['sqlite_version'] != '3.54.1' or data['redb_version'] != '4.4.0':
        raise ValueError('Pinned engine version mismatch')
    return data
