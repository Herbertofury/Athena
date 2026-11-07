"""Run original offline distribution suites separately to avoid module collisions."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
for key in ('security', 'systems', 'programming', 'cloud', 'data'):
    folder = ROOT / 'workshops' / key
    print('\n=== ' + key + ' offline distribution tests ===', flush=True)
    result = subprocess.run([sys.executable, '-m', 'unittest', 'discover', '-s', 'tests', '-v'],
                            cwd=folder, timeout=120)
    if result.returncode:
        raise SystemExit(result.returncode)
print('All five offline distribution suites passed. This is not learner mastery.')
