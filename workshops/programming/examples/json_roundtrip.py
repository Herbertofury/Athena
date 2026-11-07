"""One actual file round-trip, confined to a new temporary directory."""
import json
from pathlib import Path
import tempfile

def demo():
    report = {'label': 'café repair', 'completed': 3, 'durations_ms': [100, 200, 300]}
    with tempfile.TemporaryDirectory(prefix='athena-programming-json-') as name:
        root = Path(name)
        target = root / 'synthetic-report.json'
        target.write_text(json.dumps(report, ensure_ascii=False, sort_keys=True) + '\n', encoding='utf-8', newline='\n')
        readback = json.loads(target.read_text(encoding='utf-8'))
        result = {'roundtrip_equal': readback == report, 'utf8_bytes': target.stat().st_size, 'scope': 'Actual temporary synthetic JSON write/read; not crash durability or a user-file backup.'}
    result['temporary_directory_removed'] = not root.exists()
    return result
if __name__ == '__main__':
    print(json.dumps(demo(), indent=2))
