"""Strict verification receipt gate, independent of Python assertion settings."""
import importlib.util,pathlib,re
root=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('recovery_wire',root/'experiments/upstream-validation-lab/receipt_gate.py');wire=importlib.util.module_from_spec(spec);spec.loader.exec_module(wire)
FIELDS={'schema_version','lane','committed_generations','complete_payload_history_equal','attempt_atomicity','integrity_ok','sqlite','scope'}
def validate(raw,lane):
 v=wire.decode_receipt(raw)
 if not isinstance(v,dict) or set(v)!=FIELDS:raise ValueError('Unexpected recovery receipt fields')
 if type(v['schema_version']) is not int or v['schema_version']!=1 or v['lane']!=lane or lane not in ('baseline','addressed','compact'):raise ValueError('Recovery identity mismatch')
 if type(v['committed_generations']) is not int or not 1<=v['committed_generations']<=1001:raise ValueError('Invalid committed count')
 if any(v[k] is not True for k in ['complete_payload_history_equal','attempt_atomicity','integrity_ok']):raise ValueError('Incomplete recovery verification')
 if not isinstance(v['sqlite'],str) or not re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+',v['sqlite']):raise ValueError('Invalid SQLite identity')
 if v['scope']!='Process kill recovery only; not physical power-loss durability':raise ValueError('Recovery scope mismatch')
 return v
