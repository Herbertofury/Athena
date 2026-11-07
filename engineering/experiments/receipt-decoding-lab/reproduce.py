"""No external executable: reproduce the baseline decoder's ambiguity locally."""
import importlib.util
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
LAB = HERE.parent / 'upstream-validation-lab'
spec = importlib.util.spec_from_file_location('gate', LAB / 'receipt_gate.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)
raw = (LAB / 'final/timing-hls-0.json').read_text()
data = json.loads(raw)
expected = {'length': data['input_bytes'], 'sha256': data['input_sha256']}
cases = {
    'duplicate_source': '{"source":"wrong",' + raw.lstrip()[1:],
    'duplicate_nested_parity': raw.replace('"complete_record_equal": true',
        '"complete_record_equal": false, "complete_record_equal": true', 1),
    'nonfinite_unknown': '{"unknown":NaN,' + raw.lstrip()[1:],
}
results = []
for name, wire in cases.items():
    gate.validate_receipt(json.loads(wire), 'timing', 'hls', expected)
    try:
        gate.decode_receipt(wire)
    except ValueError as error:
        results.append({'case': name, 'baseline_accepted': True,
                        'repaired_rejected': True, 'reason': str(error)})
    else:
        raise AssertionError('Invalid receipt accepted: ' + name)
print(json.dumps(results, indent=2))
